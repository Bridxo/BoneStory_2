"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plotTrimmerFuncC = exports.plotTrimmerFuncG = exports.trimmerAssignValues = exports.plotTrimmerFunc = exports.prune = exports.compress = exports.group = exports.doNothing = exports.connectivity = exports.subrootDist = exports.maxDepth = exports.minDepth = exports.distanceToMainBranch = exports.areNeighbours = exports.isIntervalNode = exports.isLeafNode = exports.shouldConstrain = exports.transferAll = void 0;
var provenance_core_1 = require("@visualstorytelling/provenance-core");
/**
 * @description Child removed, child's children go to the parent.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Parent node
 * @param child {IGroupedTreeNode<ProvenanceNode>} - Child node
 */
function transferToParent(node, child) {
    var _a, _b;
    node.children.splice(node.children.indexOf(child), 1);
    (_a = node.children).push.apply(_a, child.children);
    (_b = node.wrappedNodes).push.apply(_b, child.wrappedNodes);
}
/**
 * @description Child removed, child's children go to grandChild. GrandChild becomes node's child.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Parent node
 * @param child {IGroupedTreeNode<ProvenanceNode>} - Child node
 * @param grandChild {IGroupedTreeNode<ProvenanceNode>} - Child of the child node
 */
function transferChildren(node, child, grandChild) {
    var _a, _b;
    node.children.splice(node.children.indexOf(child), 1);
    child.children.splice(child.children.indexOf(grandChild), 1);
    (_a = grandChild.wrappedNodes).push.apply(_a, child.wrappedNodes);
    (_b = grandChild.children).push.apply(_b, child.children);
    node.children.push(grandChild);
}
/**
 * @description Pointed node wraps ALL children recursively
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Selected node
 */
function transferAll(node) {
    var done;
    do {
        done = false;
        if (node.children) {
            for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                var child = _a[_i];
                transferToParent(node, child);
                done = true;
            }
        }
    } while (done);
}
exports.transferAll = transferAll;
/**
 * @description Test whether a node should be constrained based on the currently selected node.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - The node to test.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Currently selected node.
 */
function shouldConstrain(node, selectedNode) {
    var result = false;
    var rawNode = node.wrappedNodes[0];
    if (node === selectedNode || rawNode.metadata.bookmarked) {
        result = true;
    }
    else if (node.children.includes(selectedNode)) {
        result = true;
    }
    else if (selectedNode.children.includes(node)) {
        result = true;
    }
    return result;
}
exports.shouldConstrain = shouldConstrain;
/**
 * @description Test whether a node is a leaf node.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - The node to test.
 */
function isLeafNode(node) {
    var result = false;
    if (node.children.length === 0) {
        result = true;
    }
    return result;
}
exports.isLeafNode = isLeafNode;
/**
 * @description Test whether a node is an interval node.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - The node to test.
 */
function isIntervalNode(node) {
    var result = false;
    if (node.children.length === 1) {
        result = true;
    }
    return result;
}
exports.isIntervalNode = isIntervalNode;
/**
 * @description Test whether two nodes are neighbours.
 * @param  a  {IGroupedTreeNode<ProvenanceNode>} - The first node to test.
 * @param  b  {IGroupedTreeNode<ProvenanceNode>} - The second node to test.
 */
function areNeighbours(a, b) {
    var result = false;
    if (b.children.includes(a)) {
        result = true;
    }
    else if (a.children.includes(b)) {
        result = true;
    }
    return result;
}
exports.areNeighbours = areNeighbours;
/**
 * @description Calculate the distance of this node to any node in the main (selected) branch.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - The node to test.
 * @param  mainBranch  {Array<string>} - List of node ids which belong to the master branch.
 */
function distanceToMainBranch(node, mainBranch) {
    var result = 0;
    if (mainBranch === undefined) {
        result = 0;
    }
    else if (provenance_core_1.isStateNode(node) && mainBranch.includes(node.id)) {
        result = 0;
    }
    else {
        if (provenance_core_1.isStateNode(node)) {
            result = 1 + distanceToMainBranch(node.parent, mainBranch);
        }
    }
    return result;
}
exports.distanceToMainBranch = distanceToMainBranch;
/**
 * @description Returns the minimum depth possible from the node selected.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Selected node
 * @returns Number of nodes you have to cross to go to the deepest leaf from the node selected.
 */
exports.minDepth = function (node) {
    if (node.children.length === 0) {
        return 0;
    }
    return Math.min.apply(Math, node.children.map(exports.minDepth)) + 1;
};
/**
 * @description Returns the maximum depth possible from the node selected.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Selected node
 * @returns Number of nodes you have to cross to go to the deepest leaf from the node selected.
 */
exports.maxDepth = function (node) {
    if (node.children.length === 0) {
        return 1;
    }
    return Math.max.apply(Math, node.children.map(exports.maxDepth)) + 1;
};
/**
 * @description Returns the distance to the subroot from the node selected.
 * @param provNode {ProvenanceNode} - Selected node
 * @returns Number of nodes you have to cross to go to the subroot up from the node selected.
 */
exports.subrootDist = function (provNode) {
    var value = 0;
    if (!provenance_core_1.isStateNode(provNode)) {
        value = 0;
    }
    else if (provenance_core_1.isStateNode(provNode)) {
        if (provNode.parent.children.length > 1) {
            value = 1;
        }
        else {
            value = 1 + exports.subrootDist(provNode.parent);
        }
    }
    return value;
};
/**
 * @description Returns the number of conexions with the node selected.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Selected node
 * @returns Number of nodes you have to cross to go to the deepest leaf from the node selected.
 */
exports.connectivity = function (node) {
    return 1 + node.children.length;
};
/**
 * @description Return the first node found in nodes that also belongs to the main branch of the tree.
 * @param  mainBranch  {Array<string>} - List of node ids which belong to the master branch.
 * @param  nodes  {Array<IGroupedTreeNode<ProvenanceNode>>} - List of nodes to test.
 */
var mainNode = function (mainBranch, nodes) {
    var mNode;
    for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
        var node = nodes_1[_i];
        if (mainBranch.includes(node.wrappedNodes[0].id)) {
            mNode = node;
            break;
        }
    }
    return mNode;
};
/**
 * @description Compare the depth of two selected nodes.
 * @param  node1  {IGroupedTreeNode<ProvenanceNode>} - Selected node #1
 * @param  node2  {IGroupedTreeNode<ProvenanceNode>} - Selected node #2
 */
var nodeDepthComparison = function (node1, node2) {
    if (exports.maxDepth(node1) > exports.maxDepth(node2)) {
        return 1;
    }
    else if (exports.maxDepth(node1) < exports.maxDepth(node2)) {
        return -1;
    }
    return 0;
};
/**
 * @description Test everything.
 * @param tests {Array<NodeGroupTest<ProvenanceNode>>} - The tests to run
 * @param  node1  {IGroupedTreeNode<ProvenanceNode>} - Selected node #1
 * @param  node2  {IGroupedTreeNode<ProvenanceNode>} - Selected node #2
 * @returns true only if all tests return true
 */
var testAll = function (tests, node1, node2) {
    var result = true;
    for (var _i = 0, tests_1 = tests; _i < tests_1.length; _i++) {
        var test_1 = tests_1[_i];
        result = test_1(node1, node2);
        if (!result) {
            break;
        }
    }
    return result;
};
// /**
//  * @description Constrain neighbours
//  * @param node {IGroupedTreeNode<ProvenanceNode>} - Node
//  * @param selectedNode {IGroupedTreeNode<ProvenanceNode>} - Selected node
//  */
// export const neighbours = (node: IGroupedTreeNode<ProvenanceNode>, selectedNode: IGroupedTreeNode<ProvenanceNode>) => {
//   let neighbour = false;
//   if (node === selectedNode || selectedNode.children.includes(node) || node.children.includes(selectedNode)) {
//     neighbour = true;
//   }
//   node.neighbour = neighbour;
//   for (const child of node.children) {
//     neighbours(child, selectedNode);
//   }
// };
/////////////////// DIFFERENT DATA AGGREGATION ALGORITHM ///////////
/**
 * @description No algorithm is applied. Created for a better understanding.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Test to be checked during execution.
 * @param  currentNode  {IGroupedTreeNode<ProvenanceNode>} -
 */
exports.doNothing = function (currentNode, node, tests) { };
/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Tests to be checked during execution.
 */
exports.group = function (currentNode, node, tests) {
    var merged = false;
    do {
        merged = false;
        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (!shouldConstrain(child, currentNode)) {
                for (var _b = 0, _c = child.children; _b < _c.length; _b++) {
                    var grandChild = _c[_b];
                    if (testAll(tests, child, grandChild)) {
                        transferChildren(node, child, grandChild);
                        merged = true;
                        break;
                    }
                }
                if (merged) {
                    break;
                }
            }
        }
    } while (merged);
    node.children.map(function (child) { return exports.group(currentNode, child, tests); });
};
/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Tests to be checked during execution.
 */
exports.compress = function (currentNode, node, tests) {
    var merged = false;
    do {
        merged = false;
        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (!shouldConstrain(child, currentNode)) {
                if (testAll(tests, node, child)) {
                    transferToParent(node, child);
                    merged = true;
                    break;
                }
            }
        }
    } while (merged);
    node.children.map(function (child) { return exports.compress(currentNode, child, tests); });
};
/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Tests to be checked during execution.
 * @param mainBranch {Array<string>} - List of node's id which belong to the master branch.
 * @param arg {any} - Optinal parameter
 */
exports.prune = function (currentNode, node, tests, mainBranch, arg) {
    var parameter = +arg;
    var merged = false;
    do {
        merged = false;
        var p = arg;
        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (!shouldConstrain(child, currentNode)) {
                var dist = distanceToMainBranch(child.wrappedNodes[0], mainBranch);
                if (isLeafNode(child)) {
                    if (dist <= p) {
                        transferToParent(node, child);
                        merged = true;
                    }
                }
                else {
                    for (var _b = 0, _c = child.children; _b < _c.length; _b++) {
                        var grandChild = _c[_b];
                        if (!shouldConstrain(grandChild, currentNode) &&
                            distanceToMainBranch(child.wrappedNodes[0], mainBranch) > 0) {
                            var childDepth = exports.maxDepth(child);
                            if (dist + childDepth <= p) {
                                transferChildren(node, child, grandChild);
                                merged = true;
                            }
                        }
                    }
                }
            }
        }
    } while (merged);
    node.children.map(function (child) {
        return exports.prune(currentNode, child, tests, mainBranch, parameter);
    });
};
/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Test to be checked during execution.
 * @param arg {any} - Optinal parameter
 */
exports.plotTrimmerFunc = function (currentNode, node, tests, mainBranch, arg) {
    trimmer(currentNode, node, tests, mainBranch, arg);
};
exports.trimmerAssignValues = function (node) {
    // Leaf value = subroot distance * 2
    // Interval nodes value = 1
    // Subroots value = Minimum subroot distance of children * 2 + 1
    var value = 0;
    if (!provenance_core_1.isStateNode(node.wrappedNodes[0]) === null) {
        value = Number.MAX_VALUE;
    }
    else if (exports.connectivity(node) === 1) {
        // Leaf node
        value = exports.subrootDist(node.wrappedNodes[0]) * 2;
    }
    else if (exports.connectivity(node) === 2) {
        // Interval node
        value = 1;
    }
    else {
        // Subroot
        value = exports.minDepth(node) * 2 + 1;
    }
    node.plotTrimmerValue = value;
    for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
        var child = _a[_i];
        exports.trimmerAssignValues(child);
    }
};
/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Test to be checked during execution.
 * @param arg {any} - Optinal parameter
 */
var trimmer = function (currentNode, node, tests, mainBranch, arg) {
    var parameter = +arg;
    var merged;
    exports.trimmerAssignValues(node);
    do {
        merged = false;
        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (!shouldConstrain(child, currentNode)) {
                if (parameter >= child.plotTrimmerValue) {
                    transferToParent(node, child);
                    merged = true;
                }
            }
        }
    } while (merged);
    node.children.map(function (child) {
        return trimmer(currentNode, child, tests, mainBranch, parameter);
    });
};
/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  test  {IGroupedTreeNode<ProvenanceNode>} - Test to be checked during execution.
 * @param arg {any} - Optinal parameter
 */
exports.plotTrimmerFuncG = function (currentNode, node, tests, mainBranch, arg) {
    var parameter = +arg;
    var prunePar = 0;
    for (var i = 0; i <= parameter; i++) {
        if (i % 2 === 0 && i !== 0) {
            prunePar = prunePar + 1;
            exports.prune(currentNode, node, tests, mainBranch, prunePar);
        }
        else {
            exports.group(currentNode, node, tests);
        }
    }
};
/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  test  {IGroupedTreeNode<ProvenanceNode>} - Test to be checked during execution.
 * @param arg {any} - Optinal parameter
 */
exports.plotTrimmerFuncC = function (currentNode, node, tests, mainBranch, arg) {
    var parameter = +arg;
    var prunePar = 0;
    for (var i = 0; i <= parameter; i++) {
        if (i % 2 === 0 && i !== 0) {
            prunePar = prunePar + 1;
            exports.prune(currentNode, node, tests, mainBranch, prunePar);
        }
        else {
            exports.compress(currentNode, node, tests);
        }
    }
};
//# sourceMappingURL=aggregation-implementations.js.map