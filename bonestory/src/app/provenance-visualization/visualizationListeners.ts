import {restoreProvenanceGraph, ActionFunctionRegistry, ProvenanceTracker, ProvenanceGraphTraverser, ProvenanceSlidedeck} from '@visualstorytelling/provenance-core';
import {ProvenanceTreeVisualization} from '@visualstorytelling/provenance-tree-visualization';
import { kebabCase } from 'lodash';
import {ProvenanceService} from '../provenance.service';
import { SlideDeckVisualization } from '@visualstorytelling/slide-deck-visualization';
import { addListenersSlides } from '../provenance-slides/slidesListeners';

/** These are the listeners I used for the importing and exporting of the graph. They mostly come down to two `click` listeners I created for
 * two imput buttons.
 */



export const addVisualizationListeners = (tree: ProvenanceTreeVisualization, service: ProvenanceService) => {

    let exportButton = document.getElementById('saveprov_btn_1');
    exportButton.addEventListener("click", (e: Event) => downloadJson(e, service.tracker.getGraph()));

    let importButton = document.getElementById('saveprov_btn_2');
    importButton.addEventListener('click', async (e: Event) => {
      await getFileWithConfirm('Load provenance graph Json file (1/2)', '.json', importJson);
      await getFileWithConfirm("Load story-slide Json file (2/2)", ".json", (e) => (window as any).listenerslide.importJson(e));});

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
            restoreGraph(e, data).then(() => {
                resolve();
            });
        };
        reader.readAsText(f);
    });
}
function restoreGraph(e: Event, input: string) : Promise<void>{
  return new Promise((resolve, reject) => {
      const w = window as any;
      let data_in = JSON.parse(input);
      console.log("We're here");
      w.graph.setNodes(data_in.nodes);
      let graph = restoreProvenanceGraph(data_in);
      console.log("Hello");  
      let registry = new ActionFunctionRegistry();
      let tracker = new ProvenanceTracker(registry, graph, "Unknown");
      let traverser = new ProvenanceGraphTraverser(registry, graph, tracker);
      service.updateProvenanceObjects(graph, registry, tracker,traverser);
      tree.setTraverser(traverser);



      w.graph = service.graph;
      w.tracker = service.tracker;
      w.traverser = service.traverser; 
      w.registry = service.registry;
      tree.update();
      let elem = document.getElementById('fake');
      
      // let _deck = new ProvenanceSlidedeck(graph.application, traverser);
      // let _deckViz = new SlideDeckVisualization(_deck, this.elementRef.nativeElement.children[0]);
      // (window as any).listenerslide = addListenersSlides(_deckViz, _deck, this.provenance);
      // (window as any).slideDeck = this._deck;
      // (window as any).slideDeckViz = this._deckViz;

      elem.click();
      resolve();
  });
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