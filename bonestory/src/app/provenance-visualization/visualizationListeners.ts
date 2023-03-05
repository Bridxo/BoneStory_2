import {restoreProvenanceGraph, ActionFunctionRegistry, ProvenanceTracker, ProvenanceGraphTraverser} from '@visualstorytelling/provenance-core';
import {ProvenanceTreeVisualization} from '@visualstorytelling/provenance-tree-visualization';
import { kebabCase } from 'lodash';
import {ProvenanceService} from '../provenance.service';

/** These are the listeners I used for the importing and exporting of the graph. They mostly come down to two `click` listeners I created for
 * two imput buttons.
 */

export const addVisualizationListeners = (tree: ProvenanceTreeVisualization, service: ProvenanceService) => {

    let exportButton = document.getElementById('exportButton');
    // exportButton.addEventListener("click", (e: Event) => downloadJson(e, service.tracker.getGraph()));

    let importButton = document.getElementById('importButton');
    // importButton.addEventListener('click', (e: Event) => importJson(e));
  
/** The next 3 functions are used for importing a graph. The first one (importJson) loads the file, the second one (getFile) reads the data in it
 * and the last one (restoreGraph) converts it to a graph object. 
 */

    function importJson(e: Event) : void{
        let element = document.createElement('input');
        element.setAttribute('type', 'file');
        element.setAttribute('id', 'input-file');
        element.setAttribute('accept', '.json');
        element.style.display = 'none';
        document.body.appendChild(element);
        document.getElementById('input-file').addEventListener('change', (e: Event) => getFile(e))
        element.click(); // simulate click
        document.body.removeChild(element);
    }

    function getFile(e: Event){
        let input = <HTMLInputElement>e.target;
        let files = input.files;
        var f:File = files[0];
        var reader = new FileReader();
        var name = f.name;
        reader.onload = function (e) {
            var target: any = e.target;
            var data = target.result;
            restoreGraph(e, data);
        };
        reader.readAsText(f);
    }

    function restoreGraph(e: Event, input: string) : void{
        let data_in = JSON.parse(input);
        console.log("We're here");
        let graph = restoreProvenanceGraph(data_in);
        console.log("Hello");  
        service.graph = graph;
        service.registry = new ActionFunctionRegistry();
        // service.tracker = new ProvenanceTracker(service.registry, service.graph, "Unknown", graph.current);
        service.traverser = new ProvenanceGraphTraverser(service.registry, service.graph, service.tracker);
        // tree.setTraverser(service.traverser);
        tree.update();
        let elem = document.getElementById('fake');
        elem.click();
        
    }
  
/** The following function takes a graph object, serialize it into JSON form and downloads it on the host machine */

    function downloadJson(e: Event, myJson: any){
      var sJson = JSON.stringify(myJson, null, 2);
      var element = document.createElement('a');
      element.setAttribute('href', "data:text/json;charset=UTF-8," + encodeURIComponent(sJson));
      element.setAttribute('download', "tree-template.json");
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click(); // simulate click
      document.body.removeChild(element);
  }
}