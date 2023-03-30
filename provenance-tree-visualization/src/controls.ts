import { ProvenanceTreeVisualization } from './provenance-tree-visualization';
import { StateNode } from '@visualstorytelling/provenance-core';


export function provGraphControls(provenanceTreeVisualization: ProvenanceTreeVisualization) {
    var graph = provenanceTreeVisualization.traverser.graph;
    var traverser = provenanceTreeVisualization.traverser;

    window.onkeydown = keyPress;


    function keyPress(e: any) {
        var evtobj = window.event ? event : e;

        // ctrl + Z  / undo
        if (evtobj.ctrlKey && evtobj.key === 'z' && (graph.current as StateNode).parent) {
            traverser.toStateNode((graph.current as StateNode).parent.id, 250);
            provenanceTreeVisualization.getFullsizeview();
            provenanceTreeVisualization.update();
        }
        // ctrl + X  / go to the root
        else if (evtobj.ctrlKey && evtobj.key === 'x') {
            traverser.toStateNode(graph.root.id, 250);
        }
        // ctrl + y  / redo
        else if (evtobj.ctrlKey && evtobj.key === 'y' && graph.current.children[0]) {
            for (const child of graph.current.children) {
                if (child.metadata.mainbranch) {
                    traverser.toStateNode(child.id, 250);
                    provenanceTreeVisualization.getFullsizeview();
                    provenanceTreeVisualization.update();
                }
            }
        }
        // ctrl + Q  / add the current node to the story
        else if (evtobj.keyCode === 81 && evtobj.altKey) {
            graph.current.metadata.story = true;
            (window as any).slideDeck.onAdd(graph.current);
        }
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
        provenanceTreeVisualization.update();
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
