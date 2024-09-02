import {restoreProvenanceGraph, ActionFunctionRegistry, ProvenanceTracker, ProvenanceGraphTraverser, ProvenanceSlidedeck} from '@visualstorytelling/provenance-core';
import {ProvenanceTreeVisualization} from '@visualstorytelling/provenance-tree-visualization';
import { kebabCase } from 'lodash';
import {ProvenanceService} from '../provenance.service';
import { SlideDeckVisualization } from '@visualstorytelling/slide-deck-visualization';
import { addListenersSlides } from '../provenance-slides/slidesListeners';
import { ProvenanceStateService } from '../provenance-state.service';


/** These are the listeners I used for the importing and exporting of the graph. They mostly come down to two `click` listeners I created for
 * two imput buttons.
 */



export const addVisualizationListeners = (tree: ProvenanceTreeVisualization, service: ProvenanceService) => {

    let exportButton = document.getElementById('saveprov_btn_1');
    // exportButton.addEventListener("click", (e: Event) => downloadJson(e, service.tracker.getGraph()));
    exportButton.addEventListener("click", async (e: Event) => {
      const graphJson = service.tracker.getGraph(); // Method to get graph JSON
      const slideDeckJson = (window as any).slideDeck._slides; // Method to get slide deck JSON
      downloadCombinedJson(graphJson, slideDeckJson);
  });

    let importButton = document.getElementById('saveprov_btn_2');
    importButton.addEventListener('click', async (e: Event) => {
      await getFileWithConfirm('Load Json file', '.json', importJson);// load the file with the importJson function - provenance graph and slide deck
      // await getFileWithConfirm("Load story-slide Json file (2/2)", ".json", (e) => (window as any).listenerslide.importJson(e));
    });

    // let importButton = document.getElementById('importButton');
    // importButton.addEventListener('click', (e: Event) => importJson(e));
  
/** The next 3 functions are used for importing a graph. The first one (importJson) loads the file, the second one (getFile) reads the data in it
 * and the last one (restoreGraph) converts it to a graph object. 
 */
async function getFileWithConfirm(message: string, acceptType: string, listener: (e: Event) => Promise<void>): Promise<void> {
    let confirmDialog = confirm(message);
    if (confirmDialog) {
      return new Promise((resolve, reject) => {
        let element = document.createElement('input');
        element.setAttribute('type', 'file');
        element.setAttribute('id', 'input-file');
        element.setAttribute('accept', acceptType);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.addEventListener('change', (e: Event) => {
          listener(e).then(() => {
              document.body.removeChild(element);
              resolve();
          });
      });
        element.click(); // simulate click
      });
    } 
  }

  async function importJson(e: Event): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        getFile(e).then(() => {
          resolve();
        });
      } finally {
        (window as any).isRunning = false;
      }
    });
  }
  function getFile(e: Event){
    return new Promise<void>((resolve, reject) => {
        let input = <HTMLInputElement>e.target;
        let files = input.files;
        var f:File = files[0];
        var reader = new FileReader();
        var name = f.name;
        reader.onload = function (e) {
            var target: any = e.target;
            var data = target.result;
            restoreGraphandSlide(e, data).then(() => {
                resolve();
            });
        };
        reader.readAsText(f);
    });
}
async function restoreGraphandSlide(e: Event, input: string): Promise<void> {
  return new Promise((resolve, reject) => {
      try {
          const w = window as any;
          let data_in = JSON.parse(input);

          // Extract graph and slide deck data
          const graphData = data_in.graphData;
          const slideDeckData = data_in.slideDeckData;

          // Restore provenance graph
          w.graph.setNodes(graphData.nodes);
          let graph = restoreProvenanceGraph(graphData);

          // Initialize registry, tracker, and traverser
          let registry = service.registry;
          let tracker = new ProvenanceTracker(registry, graph, "Unknown");
          let traverser = new ProvenanceGraphTraverser(registry, graph, tracker);

          // Update provenance objects in the service
          service.updateProvenanceObjects(graph, registry, tracker, traverser);
          tree.setTraverser(traverser);
          tree.update();

          // Update global state references
          w.graph = service.graph;
          w.tracker = service.tracker;
          w.traverser = service.traverser;
          w.registry = service.registry;

          // Update the tree visualization
          tree.update();

          // Restore slide deck
          let _deck = new ProvenanceSlidedeck(graph.application, traverser);
          let _deckViz = new SlideDeckVisualization(_deck, this.elementRef.nativeElement.children[0]);

          // Attach listeners and update global state references for slide deck
          w.listenerslide = addListenersSlides(_deckViz, _deck, service);
          w.slideDeck = _deck;
          w.slideDeckViz = _deckViz;

          // Ensure UI elements are correctly initialized
          let elem = document.getElementById('fake');
          elem.click();

          resolve();
      } catch (error) {
          console.error("Error restoring graph and slide deck: ", error);
          reject(error);
      }
  });
}
  // Assuming both pieces of JSON data are available as `graphJson` and `slideDeckJson`
function downloadCombinedJson(graphJson: any, slideDeckJson: any) {
  const combinedData = {
      graphData: graphJson, // Assuming this comes from your provenance graph
      slideDeckData: slideDeckJson // Assuming this comes from your slide deck data
  };

  const jsonString = JSON.stringify(combinedData, null, 2);
  const blob = new Blob([jsonString], {type: "application/json"});
  const url = URL.createObjectURL(blob);

  const element = document.createElement('a');
  element.setAttribute('href', url);
  element.setAttribute('download', "combined-data.json");
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click(); // simulate click
  document.body.removeChild(element);
}
/** The following function takes a graph object, serialize it into JSON form and downloads it on the host machine */

function downloadJson(e: Event, myJson: any) {
    service.traverser.toStateNode(myJson.root);
    var sJson = JSON.stringify(myJson, null, 1);
    var blob = new Blob([sJson], {type: "application/json"});
    var url = URL.createObjectURL(blob);

    var element = document.createElement('a');
    element.setAttribute('href', url);
    element.setAttribute('download', "tree-template.json");
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click(); // simulate click
    document.body.removeChild(element);
}

  function removeParent(obj: any) {
    delete obj.parent;
    if (obj.children) {
      obj.children.forEach(removeParent);
    }
  }
  
}