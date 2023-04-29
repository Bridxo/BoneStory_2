"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function depthSort(a, b) {
    if (a.maxDescendantDepth > b.maxDescendantDepth) {
        return -1;
    }
    else if (a.maxDescendantDepth < b.maxDescendantDepth) {
        return 1;
    }
    return 0;
}
function GratzlLayoutOld() {
    let dx = 5;
    let dy = 50;
    const widths = [];
    function setTreeX(node, val) {
        node.xOffset = val;
        widths[node.depth] = val;
        if (node.children) {
            node
                .leaves()
                .sort(depthSort)
                .forEach(leaf => {
                if (typeof leaf.xOffset === "undefined") {
                    const width = Math.max.apply(null, widths.slice(node.depth, leaf.depth + 1));
                    setTreeX(leaf, val > width ? val : width + 1);
                }
            });
        }
        if (node.parent && typeof node.parent.xOffset === "undefined") {
            setTreeX(node.parent, val);
        }
    }
    const tree = Object.assign((_root, _activeNode) => {
        /*
         * set maxDescendantDepth on each node,
         * which is the depth of its deepest child
         *
         * */
        const root = _root;
        const activeNode = _activeNode;
        root.leaves().forEach(leaf => {
            leaf.ancestors().forEach(leafAncestor => {
                if (!leafAncestor.maxDescendantDepth ||
                    leaf.depth > leafAncestor.maxDescendantDepth) {
                    leafAncestor.maxDescendantDepth = leaf.depth;
                }
            });
        });
        /* rendering should start at the deepest leaf of activeNode. */
        let deepestLeaf = activeNode;
        activeNode.leaves().forEach(leaf => {
            if (deepestLeaf.depth < leaf.depth) {
                deepestLeaf = leaf;
            }
        });
        setTreeX(deepestLeaf, 0);
        const maxX = Math.max.apply(null, widths);
        const maxY = Math.max.apply(null, root.leaves().map(leaf => leaf.depth));
        root.each(node => {
            sizeNode(node, maxX, maxY);
        });
        return root;
    }, {
        size: ((x) => {
            return x ? ((dx = +x[0]), (dy = +x[1]), tree) : [dx, dy];
        })
    });
    function sizeNode(node, maxX, maxY) {
        node.x = maxX === 0 ? dx : dx - (dx / maxX) * node.xOffset;
        node.y = maxY === 0 ? dy : (dy / maxY) * node.depth;
    }
    return tree;
}
exports.default = GratzlLayoutOld;
//# sourceMappingURL=gratzl_old.js.map