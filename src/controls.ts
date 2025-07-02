import { ProvenanceTreeVisualization } from './provenance-tree-visualization';
import { StateNode } from '@visualstorytelling/provenance-core';



export function provGraphControls(provenanceTreeVisualization: ProvenanceTreeVisualization) {
    var graph = provenanceTreeVisualization.traverser.graph;
    var traverser = provenanceTreeVisualization.traverser;


    window.onkeydown = keyPress;

    let isProcessingKey = false; // Lock
    const handleControlZ = debounce(async () => {
        var real_traverser = provenanceTreeVisualization.real_traverser;
        var parent_id = '';
        await real_traverser
        .filter((d: any) => {
          const ref = d.data.wrappedNodes.includes(graph.current);
          if(ref){
            const index = d.data.wrappedNodes.indexOf(graph.current);
            if(index!=d.data.wrappedNodes.length-1)
                parent_id = d.data.wrappedNodes[index+1].id;
            else
                parent_id = d.parent.data.wrappedNodes[0].id;
          }
        });
        await traverser.toStateNode(parent_id, 250);
        await provenanceTreeVisualization.getFullsizeview();
        await provenanceTreeVisualization.update();
    }, 260);
    const handleControlY = debounce(async () => {
        var real_traverser = provenanceTreeVisualization.real_traverser;
        var child_id = '';
        await real_traverser
        .filter((d: any) => {
          const ref = d.data.wrappedNodes.includes(graph.current);
          if(ref){
            const index = d.data.wrappedNodes.indexOf(graph.current);
            if(index!=0)
                child_id = d.data.wrappedNodes[index-1].id;
            else{
                if(d.children){
                    d.children.forEach((child: any) => {
                        if(child.data.wrappedNodes[0].metadata.mainbranch){
                            const ind = child.data.wrappedNodes.length-1;
                            child_id = child.data.wrappedNodes[ind].id;
                        }
                        else{
                            return;
                        }
                    });
                }
                else
                    return;
            }
          }
        });
        await traverser.toStateNode(child_id, 250);
        await provenanceTreeVisualization.getFullsizeview();
        await provenanceTreeVisualization.update();
    }, 260);
    function debounce(func :any, delay: any) {
        let timer:any;
        return function() {
          clearTimeout(timer);
          timer = setTimeout(func, delay);
        };
      }

    async function keyPress(e: any) {
        var evtobj = window.event ? event : e;
        // ctrl + Z  / undo
        if (evtobj.ctrlKey && evtobj.key.toLowerCase() === 'z' && (graph.current as StateNode).parent) {
        handleControlZ();
        }
        // ctrl + X  / go to the root
        else if (evtobj.ctrlKey && evtobj.key.toLowerCase() === 'x') {
            isProcessingKey = true;
            await traverser.toStateNode(graph.root.id, 0);
            setTimeout(() => {
                isProcessingKey = false;
            }, 250);
        }
        // ctrl + y  / redo
        else if (evtobj.ctrlKey && evtobj.key.toLowerCase() === 'y' && graph.current.children[0]) {
            handleControlY();
            setTimeout(() => {
              isProcessingKey = false;
            }, 250);
          }
        // ctrl + Q  / add the current node to the story
        // else if (evtobj.keyCode === 81 && evtobj.altKey) {
        //     graph.current.metadata.story = true;
        //     (window as any).slideDeck.onAdd(graph.current);
        // }
        // // ctrl + 1  / all neighbour nodes are added to the slide deck (by creation order)
        // else if (evtobj.keyCode === 49 && evtobj.altKey) {
        //     let nodes = graph.getNodes();
        //     var arrayNodes = [];

        //     for (const nodeId of Object.keys(nodes)) {
        //         let node = nodes[nodeId];
        //         arrayNodes.push(node);
        //     }

        //     for (const node of arrayNodes) {
        //         if (((node.metadata.creationOrder > graph.current.metadata.creationOrder - 2) == true) &&     // the range can be adjusted
        //             ((node.metadata.creationOrder < graph.current.metadata.creationOrder + 2) == true)) {
        //             node.metadata.story = true;
        //             (window as any).slideDeck.onAdd(node);
        //         }
        //     }
        // }

        // // ctrl + W  / derivation and annotation (by creation order)
        // else if (evtobj.keyCode === 87 && evtobj.altKey) {
        //     let nodes = graph.getNodes();
        //     var arrayNodes: any[] = [];

        //     for (const nodeId of Object.keys(nodes)) {
        //         let node = nodes[nodeId];
        //         arrayNodes.push(node);
        //     }

        //     arrayNodes.shift();

        //     for (const node of (arrayNodes as any).filter((node: any) => node.action.metadata.userIntent == 'derivation' || 'annotation')) {
        //         node.metadata.story = true;
        //         (window as any).slideDeck.onAdd(node);
        //     }
        // }
    }

    // ngAfterViewChecked() {
    //   this._viz.setZoomExtent();
    // }

    (function () {
        var blockContextMenu;

        blockContextMenu = function (evt: any) {
            evt.preventDefault();
        };

        window.addEventListener('contextmenu', blockContextMenu);
    })();

}
