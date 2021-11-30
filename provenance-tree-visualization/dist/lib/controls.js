"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.provGraphControls = void 0;
function provGraphControls(provenanceTreeVisualization) {
    var graph = provenanceTreeVisualization.traverser.graph;
    var traverser = provenanceTreeVisualization.traverser;
    document.onkeydown = keyPress;
    function keyPress(e) {
        var evtobj = window.event ? event : e;
        // ctrl + Z  / undo
        if (evtobj.keyCode === 38 && evtobj.altKey && graph.current.parent) {
            traverser.toStateNode(graph.current.parent.id, 250);
            provenanceTreeVisualization.update();
        }
        // ctrl + X  / go to the root
        else if (evtobj.keyCode === 88 && evtobj.altKey) {
            traverser.toStateNode(graph.root.id, 250);
        }
        // ctrl + A  / redo
        else if (evtobj.keyCode === 40 && evtobj.altKey && graph.current.children[0]) {
            for (var _i = 0, _a = graph.current.children; _i < _a.length; _i++) {
                var child = _a[_i];
                if (child.metadata.mainbranch) {
                    traverser.toStateNode(graph.current.children[0].id, 250);
                    provenanceTreeVisualization.update();
                }
            }
        }
        // ctrl + Q  / add the current node to the story
        else if (evtobj.keyCode === 81 && evtobj.altKey) {
            graph.current.metadata.story = true;
            window.slideDeck.onAdd(graph.current);
        }
        // ctrl + 1  / all neighbour nodes are added to the slide deck (by creation order)
        else if (evtobj.keyCode === 49 && evtobj.altKey) {
            var nodes = graph.getNodes();
            var arrayNodes = [];
            for (var _b = 0, _c = Object.keys(nodes); _b < _c.length; _b++) {
                var nodeId = _c[_b];
                var node = nodes[nodeId];
                arrayNodes.push(node);
            }
            for (var _d = 0, arrayNodes_1 = arrayNodes; _d < arrayNodes_1.length; _d++) {
                var node = arrayNodes_1[_d];
                if (((node.metadata.creationOrder > graph.current.metadata.creationOrder - 2) == true) && // the range can be adjusted
                    ((node.metadata.creationOrder < graph.current.metadata.creationOrder + 2) == true)) {
                    node.metadata.story = true;
                    window.slideDeck.onAdd(node);
                }
            }
        }
        // ctrl + W  / derivation and annotation (by creation order)
        else if (evtobj.keyCode === 87 && evtobj.altKey) {
            var nodes = graph.getNodes();
            var arrayNodes = [];
            for (var _e = 0, _f = Object.keys(nodes); _e < _f.length; _e++) {
                var nodeId = _f[_e];
                var node = nodes[nodeId];
                arrayNodes.push(node);
            }
            arrayNodes.shift();
            for (var _g = 0, _h = arrayNodes.filter(function (node) { return node.action.metadata.userIntent == 'derivation' || 'annotation'; }); _g < _h.length; _g++) {
                var node = _h[_g];
                node.metadata.story = true;
                window.slideDeck.onAdd(node);
            }
        }
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