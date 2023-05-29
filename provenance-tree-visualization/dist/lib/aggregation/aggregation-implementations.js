"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plotTrimmerFuncC = exports.plotTrimmerFuncG = exports.trimmerAssignValues = exports.plotTrimmerFunc = exports.prune = exports.compress = exports.group = exports.doNothing = exports.connectivity = exports.subrootDist = exports.maxDepth = exports.minDepth = exports.distanceToMainBranch = exports.areNeighbours = exports.isIntervalNode = exports.isLeafNode = exports.shouldConstrain = exports.transferAll = exports.transferChildren_2 = exports.transferChildren = exports.transferToParent = void 0;
const provenance_core_1 = require("@visualstorytelling/provenance-core");
/**
 * @description Child removed, child's children go to the parent.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Parent node
 * @param child {IGroupedTreeNode<ProvenanceNode>} - Child node
 */
function transferToParent(node, child) {
    const index = node.children.indexOf(child);
    node.children.splice(index, 1);
    node.children.push(...child.children);
    node.wrappedNodes.unshift(...child.wrappedNodes);
}
exports.transferToParent = transferToParent;
/**
 * @description Child removed, child's children go to grandChild. GrandChild becomes node's child.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Parent node
 * @param child {IGroupedTreeNode<ProvenanceNode>} - Child node
 * @param grandChild {IGroupedTreeNode<ProvenanceNode>} - Child of the child node
 */
function transferChildren(node, child, grandChild) {
    //data part
    node.data.children.splice(node.data.children.indexOf(child.data), 1);
    grandChild.data.wrappedNodes.push(...child.data.wrappedNodes);
    child.data.children.splice(child.data.children.indexOf(grandChild.data), 1);
    node.data.children.push(grandChild.data);
}
exports.transferChildren = transferChildren;
function transferChildren_2(Startparentnode, Startnode, Endnode) {
    //data part
    let tempNode = Endnode.parent;
    let superParent = Startparentnode.parent;
    do {
        tempNode.data.children.splice(tempNode.data.children.indexOf(Endnode.data), 1);
        Endnode.data.wrappedNodes.push(...tempNode.data.wrappedNodes);
        tempNode = tempNode.parent;
    } while (tempNode.data != Startparentnode.data);
    Startparentnode.data.children.splice(Startparentnode.data.children.indexOf(Startnode.data), 1);
    Endnode.data.wrappedNodes.push(...Startparentnode.data.wrappedNodes);
    superParent.data.children.splice(superParent.data.children.indexOf(Startparentnode.data), 1);
    superParent.data.children.push(Endnode.data);
}
exports.transferChildren_2 = transferChildren_2;
/**
 * @description Pointed node wraps ALL children recursively
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Selected node
 */
function transferAll(node) {
    let done;
    do {
        done = false;
        if (node.children) {
            for (const child of node.children) {
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
    let result = false;
    const rawNode = node.wrappedNodes[0];
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
    let result = false;
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
    let result = false;
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
    let result = false;
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
    let result = 0;
    if (mainBranch === undefined) {
        result = 0;
    }
    else if ((0, provenance_core_1.isStateNode)(node) && mainBranch.includes(node.id)) {
        result = 0;
    }
    else {
        if ((0, provenance_core_1.isStateNode)(node)) {
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
const minDepth = (node) => {
    if (node.children.length === 0) {
        return 0;
    }
    return Math.min(...node.children.map(exports.minDepth)) + 1;
};
exports.minDepth = minDepth;
/**
 * @description Returns the maximum depth possible from the node selected.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Selected node
 * @returns Number of nodes you have to cross to go to the deepest leaf from the node selected.
 */
const maxDepth = (node) => {
    if (node.children.length === 0) {
        return 1;
    }
    return Math.max(...node.children.map(exports.maxDepth)) + 1;
};
exports.maxDepth = maxDepth;
/**
 * @description Returns the distance to the subroot from the node selected.
 * @param provNode {ProvenanceNode} - Selected node
 * @returns Number of nodes you have to cross to go to the subroot up from the node selected.
 */
const subrootDist = (provNode) => {
    let value = 0;
    if (!(0, provenance_core_1.isStateNode)(provNode)) {
        value = 0;
    }
    else if ((0, provenance_core_1.isStateNode)(provNode)) {
        if (provNode.parent.children.length > 1) {
            value = 1;
        }
        else {
            value = 1 + (0, exports.subrootDist)(provNode.parent);
        }
    }
    return value;
};
exports.subrootDist = subrootDist;
/**
 * @description Returns the number of conexions with the node selected.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Selected node
 * @returns Number of nodes you have to cross to go to the deepest leaf from the node selected.
 */
const connectivity = (node) => {
    return 1 + node.children.length;
};
exports.connectivity = connectivity;
/**
 * @description Return the first node found in nodes that also belongs to the main branch of the tree.
 * @param  mainBranch  {Array<string>} - List of node ids which belong to the master branch.
 * @param  nodes  {Array<IGroupedTreeNode<ProvenanceNode>>} - List of nodes to test.
 */
const mainNode = (mainBranch, nodes) => {
    let mNode;
    for (const node of nodes) {
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
const nodeDepthComparison = (node1, node2) => {
    if ((0, exports.maxDepth)(node1) > (0, exports.maxDepth)(node2)) {
        return 1;
    }
    else if ((0, exports.maxDepth)(node1) < (0, exports.maxDepth)(node2)) {
        return -1;
    }
    return 0;
};
const mergemarking = () => {
};
/**
 * @description Test everything.
 * @param tests {Array<NodeGroupTest<ProvenanceNode>>} - The tests to run
 * @param  node1  {IGroupedTreeNode<ProvenanceNode>} - Selected node #1
 * @param  node2  {IGroupedTreeNode<ProvenanceNode>} - Selected node #2
 * @returns true only if all tests return true
 */
const testAll = (tests, node1, node2) => {
    let result = true;
    for (const test of tests) {
        result = test(node1, node2);
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
const doNothing = (currentNode, node, tests) => { };
exports.doNothing = doNothing;
/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Tests to be checked during execution.
 */
const group = (currentNode, node, tests) => {
    let merged = false;
    do {
        merged = false;
        for (const child of node.children) {
            if (!shouldConstrain(child, currentNode)) {
                for (const grandChild of child.children) {
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
    node.children.map(child => (0, exports.group)(currentNode, child, tests));
};
exports.group = group;
/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Tests to be checked during execution.
 */
const compress = (currentNode, node, tests) => {
    let merged = false;
    do {
        merged = false;
        for (const child of node.children) {
            if (!shouldConstrain(child, currentNode)) {
                if (testAll(tests, node, child)) {
                    transferToParent(node, child);
                    merged = true;
                    break;
                }
            }
        }
    } while (merged);
    node.children.map(child => (0, exports.compress)(currentNode, child, tests));
};
exports.compress = compress;
/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Tests to be checked during execution.
 * @param mainBranch {Array<string>} - List of node's id which belong to the master branch.
 * @param arg {any} - Optinal parameter
 */
const prune = (currentNode, node, tests, mainBranch, arg) => {
    const parameter = +arg;
    let merged = false;
    do {
        merged = false;
        const p = arg;
        for (const child of node.children) {
            if (!shouldConstrain(child, currentNode)) {
                const dist = distanceToMainBranch(child.wrappedNodes[0], mainBranch);
                if (isLeafNode(child)) {
                    if (dist <= p) {
                        transferToParent(node, child);
                        merged = true;
                    }
                }
                else {
                    for (const grandChild of child.children) {
                        if (!shouldConstrain(grandChild, currentNode) &&
                            distanceToMainBranch(child.wrappedNodes[0], mainBranch) > 0) {
                            const childDepth = (0, exports.maxDepth)(child);
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
    node.children.map(child => (0, exports.prune)(currentNode, child, tests, mainBranch, parameter));
};
exports.prune = prune;
/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Test to be checked during execution.
 * @param arg {any} - Optinal parameter
 */
const plotTrimmerFunc = (currentNode, node, tests, mainBranch, arg) => {
    trimmer(currentNode, node, tests, mainBranch, arg);
};
exports.plotTrimmerFunc = plotTrimmerFunc;
const trimmerAssignValues = (node) => {
    // Leaf value = subroot distance * 2
    // Interval nodes value = 1
    // Subroots value = Minimum subroot distance of children * 2 + 1
    let value = 0;
    if (!(0, provenance_core_1.isStateNode)(node.wrappedNodes[0]) === null) {
        value = Number.MAX_VALUE;
    }
    else if ((0, exports.connectivity)(node) === 1) {
        // Leaf node
        value = (0, exports.subrootDist)(node.wrappedNodes[0]) * 2;
    }
    else if ((0, exports.connectivity)(node) === 2) {
        // Interval node
        value = 1;
    }
    else {
        // Subroot
        value = (0, exports.minDepth)(node) * 2 + 1;
    }
    node.plotTrimmerValue = value;
    for (const child of node.children) {
        (0, exports.trimmerAssignValues)(child);
    }
};
exports.trimmerAssignValues = trimmerAssignValues;
/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Test to be checked during execution.
 * @param arg {any} - Optinal parameter
 */
const trimmer = (currentNode, node, tests, mainBranch, arg) => {
    const parameter = +arg;
    let merged;
    (0, exports.trimmerAssignValues)(node);
    do {
        merged = false;
        for (const child of node.children) {
            if (!shouldConstrain(child, currentNode)) {
                if (parameter >= child.plotTrimmerValue) {
                    transferToParent(node, child);
                    merged = true;
                }
            }
        }
    } while (merged);
    node.children.map(child => trimmer(currentNode, child, tests, mainBranch, parameter));
};
/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  test  {IGroupedTreeNode<ProvenanceNode>} - Test to be checked during execution.
 * @param arg {any} - Optinal parameter
 */
const plotTrimmerFuncG = (currentNode, node, tests, mainBranch, arg) => {
    const parameter = +arg;
    let prunePar = 0;
    for (let i = 0; i <= parameter; i++) {
        if (i % 2 === 0 && i !== 0) {
            prunePar = prunePar + 1;
            (0, exports.prune)(currentNode, node, tests, mainBranch, prunePar);
        }
        else {
            (0, exports.group)(currentNode, node, tests);
        }
    }
};
exports.plotTrimmerFuncG = plotTrimmerFuncG;
/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  test  {IGroupedTreeNode<ProvenanceNode>} - Test to be checked during execution.
 * @param arg {any} - Optinal parameter
 */
const plotTrimmerFuncC = (currentNode, node, tests, mainBranch, arg) => {
    const parameter = +arg;
    let prunePar = 0;
    for (let i = 0; i <= parameter; i++) {
        if (i % 2 === 0 && i !== 0) {
            prunePar = prunePar + 1;
            (0, exports.prune)(currentNode, node, tests, mainBranch, prunePar);
        }
        else {
            (0, exports.compress)(currentNode, node, tests);
        }
    }
};
exports.plotTrimmerFuncC = plotTrimmerFuncC;
//# sourceMappingURL=aggregation-implementations.js.map