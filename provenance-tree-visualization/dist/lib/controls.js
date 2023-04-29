"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.provGraphControls = void 0;
function provGraphControls(provenanceTreeVisualization) {
    var graph = provenanceTreeVisualization.traverser.graph;
    var traverser = provenanceTreeVisualization.traverser;
    window.onkeydown = keyPress;
    function keyPress(e) {
        var evtobj = window.event ? event : e;
        // ctrl + Z  / undo
        if (evtobj.ctrlKey && evtobj.key === 'z' && graph.current.parent) {
            var real_traverser = provenanceTreeVisualization.real_traverser;
            var parent_id = '';
            real_traverser
                .filter((d) => {
                const ref = d.data.wrappedNodes.includes(graph.current);
                if (ref) {
                    parent_id = d.parent.data.wrappedNodes[0].id;
                }
            });
            if (provenanceTreeVisualization.groupnumber == 0)
                traverser.toStateNode(parent_id, 250);
            else
                traverser.toStateNode(parent_id, 0);
            provenanceTreeVisualization.getFullsizeview();
            provenanceTreeVisualization.update();
        }
        // ctrl + X  / go to the root
        else if (evtobj.ctrlKey && evtobj.key === 'x') {
            traverser.toStateNode(graph.root.id, 0);
        }
        // ctrl + y  / redo
        else if (evtobj.ctrlKey && evtobj.key === 'y' && graph.current.children[0]) {
            var real_traverser = provenanceTreeVisualization.real_traverser;
            var child_id = '';
            real_traverser
                .filter((d) => {
                const ref = d.data.wrappedNodes.includes(graph.current);
                if (ref) {
                    for (const child of d.children) {
                        if (child.data.wrappedNodes[0].metadata.mainbranch)
                            child_id = child.data.wrappedNodes[0].id;
                    }
                }
            });
            if (provenanceTreeVisualization.groupnumber == 0)
                traverser.toStateNode(child_id, 250);
            else
                traverser.toStateNode(child_id, 0);
            provenanceTreeVisualization.getFullsizeview();
            provenanceTreeVisualization.update();
        }
        // ctrl + Q  / add the current node to the story
        else if (evtobj.keyCode === 81 && evtobj.altKey) {
            graph.current.metadata.story = true;
            window.slideDeck.onAdd(graph.current);
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
        blockContextMenu = function (evt) {
            evt.preventDefault();
        };
        window.addEventListener('contextmenu', blockContextMenu);
    })();
}
exports.provGraphControls = provGraphControls;
//# sourceMappingURL=controls.js.map