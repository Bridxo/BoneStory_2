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
function GratzlLayout(_root, _current) {
    const root = _root;
    const current = _current;
    const widths = [];
    // const maxY = Math.max.apply(null, root.leaves().map((leaf) => leaf.depth));
    function setTreeX(node, val) {
        node.x = val;
        node.y = node.depth;
        widths[node.depth] = val;
        if (node.children) {
            node
                .leaves()
                .forEach(leaf => {
                if (typeof leaf.x === "undefined") {
                    const width = Math.max.apply(null, widths.slice(node.depth, leaf.depth + 1));
                    setTreeX(leaf, val > width ? val : width + 1);
                }
            });
        }
        if (node.parent && typeof node.parent.x === "undefined") {
            setTreeX(node.parent, val);
        }
    }
    root.leaves().forEach(leaf => {
        leaf.ancestors().forEach(leafAncestor => {
            if (!leafAncestor.maxDescendantDepth ||
                leaf.depth > leafAncestor.maxDescendantDepth) {
                leafAncestor.maxDescendantDepth = leaf.depth;
            }
        });
    });
    /* start at the deepest (active) leaf of activeNode. */
    let deepestLeaf = current;
    deepestLeaf.leaves().forEach(leaf => {
        if (leaf.data.wrappedNodes[0].metadata.mainbranch) {
            deepestLeaf = leaf;
        }
        else if (leaf.depth > deepestLeaf.depth && !deepestLeaf.data.wrappedNodes[0].metadata.mainbranch) {
            deepestLeaf = leaf;
        }
    });
    setTreeX(deepestLeaf, 0);
    return root;
}
exports.default = GratzlLayout;
//# sourceMappingURL=gratzl.js.map