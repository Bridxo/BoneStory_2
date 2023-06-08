"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.provGraphControls = void 0;
function provGraphControls(provenanceTreeVisualization) {
    var graph = provenanceTreeVisualization.traverser.graph;
    var traverser = provenanceTreeVisualization.traverser;
    window.onkeydown = keyPress;
    let isProcessingKey = false; // Lock
    function keyPress(e) {
        return __awaiter(this, void 0, void 0, function* () {
            var evtobj = window.event ? event : e;
            if (isProcessingKey)
                return;
            // ctrl + Z  / undo
            if (evtobj.ctrlKey && evtobj.key === 'z' && graph.current.parent) {
                isProcessingKey = true;
                var real_traverser = provenanceTreeVisualization.real_traverser;
                var parent_id = '';
                real_traverser
                    .filter((d) => {
                    const ref = d.data.wrappedNodes.includes(graph.current);
                    if (ref) {
                        const index = d.data.wrappedNodes.indexOf(graph.current);
                        if (index != d.data.wrappedNodes.length - 1)
                            parent_id = d.data.wrappedNodes[index + 1].id;
                        else
                            parent_id = d.parent.data.wrappedNodes[0].id;
                    }
                });
                yield traverser.toStateNode(parent_id, 250);
                yield provenanceTreeVisualization.getFullsizeview();
                yield provenanceTreeVisualization.update();
                setTimeout(() => {
                    isProcessingKey = false;
                }, 300);
            }
            // ctrl + X  / go to the root
            else if (evtobj.ctrlKey && evtobj.key === 'x') {
                isProcessingKey = true;
                yield traverser.toStateNode(graph.root.id, 0);
                setTimeout(() => {
                    isProcessingKey = false;
                }, 250);
            }
            // ctrl + y  / redo
            else if (evtobj.ctrlKey && evtobj.key === 'y' && graph.current.children[0]) {
                isProcessingKey = true;
                var real_traverser = provenanceTreeVisualization.real_traverser;
                var child_id = '';
                real_traverser
                    .filter((d) => {
                    const ref = d.data.wrappedNodes.includes(graph.current);
                    if (ref) {
                        const index = d.data.wrappedNodes.indexOf(graph.current);
                        if (index != 0)
                            child_id = d.data.wrappedNodes[index - 1].id;
                        else {
                            if (d.children) {
                                d.children.forEach((child) => {
                                    if (child.data.wrappedNodes[0].metadata.mainbranch) {
                                        const ind = child.data.wrappedNodes.length - 1;
                                        child_id = child.data.wrappedNodes[ind].id;
                                    }
                                    else {
                                        isProcessingKey = false;
                                        return;
                                    }
                                });
                            }
                            else
                                return;
                        }
                    }
                });
                yield traverser.toStateNode(child_id, 250);
                yield provenanceTreeVisualization.getFullsizeview();
                yield provenanceTreeVisualization.update();
                setTimeout(() => {
                    isProcessingKey = false;
                }, 300);
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
        });
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