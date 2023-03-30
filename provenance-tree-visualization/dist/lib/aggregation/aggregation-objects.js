"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregationObjectsUI2 = exports.aggregationObjectsUI1 = exports.aggregationObjects = exports.plotTrimmerG = exports.plotTrimmerC = exports.plotTrimmer = exports.pruning = exports.compression = exports.grouping = exports.rawData = exports.defaultData = exports.testNeighbours = exports.testIsIntervalNode = exports.testUserIntent = exports.testNothing = exports.wrapNode = exports.groupNodeLabel = exports.isKeyNode = exports.getNodeRenderer = exports.getNodeIntent = void 0;
var aggregation_implementations_1 = require("./aggregation-implementations");
var provenance_core_1 = require("@visualstorytelling/provenance-core");
/**
 * @description Getter for the user intent of the node selected.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Node selected.
 * @returns Returns the Intent of the user for the node selected.
 */
function getNodeIntent(node) {
    if ((0, provenance_core_1.isStateNode)(node) &&
        node.action &&
        node.action.metadata &&
        node.action.metadata.userIntent) {
        return node.action.metadata.userIntent;
    }
    return "none";
}
exports.getNodeIntent = getNodeIntent;
function getNodeRenderer(node) {
    if ((0, provenance_core_1.isStateNode)(node) &&
        node.action &&
        node.action.metadata &&
        node.action.metadata.renderer) {
        return node.action.metadata.renderer;
    }
    return "none";
}
exports.getNodeRenderer = getNodeRenderer;
/**
 * @description Test whether a node is a key node or not.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Node selected.
 */
function isKeyNode(node) {
    if (!(0, provenance_core_1.isStateNode)(node) ||
        node.children.length === 0 ||
        node.children.length > 1 ||
        node.parent.children.length > 1 ||
        (node.children.length === 1 &&
            getNodeIntent(node) !== getNodeIntent(node.children[0]))) {
        return true;
    }
    return false;
}
exports.isKeyNode = isKeyNode;
/**
 * @description Returns a label for grouped nodes.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Node selected.
 */
var groupNodeLabel = function (node) {
    if (node.wrappedNodes.length === 1) {
        return node.wrappedNodes[0].label;
    }
    else {
        return node.wrappedNodes[0].label;
    }
};
exports.groupNodeLabel = groupNodeLabel;
/**
 * @description Wraps a node and its children recursively
 * in an extra IGroupedTreeNode; which can be manipulated for grouping etc,
 * without modifying the (provenance) node.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Node selected.
 */
var wrapNode = function (node) {
    var searchpattern = /Camera|View/;
    if (searchpattern.test(node.label))
        return {
            wrappedNodes: [node],
            children: node.children.map(exports.wrapNode),
            plotTrimmerValue: -1,
            neighbour: false,
            bookmarked: false,
            camera: true
        };
    else
        return {
            wrappedNodes: [node],
            children: node.children.map(exports.wrapNode),
            plotTrimmerValue: -1,
            neighbour: false,
            bookmarked: false,
            camera: false
        };
};
exports.wrapNode = wrapNode;
/**
 * @description Test placeholder.
 * @param a {IGroupedTreeNode<ProvenanceNode>} - Node #1 to be tested.
 * @param b {IGroupedTreeNode<ProvenanceNode>} - Node #2 to be tested.
 */
var testNothing = function (a, b) { return false; };
exports.testNothing = testNothing;
/**
 * @description Test if two nodes share the same userIntent.
 * @param a {IGroupedTreeNode<ProvenanceNode>} - Node #1 to be tested.
 * @param b {IGroupedTreeNode<ProvenanceNode>} - Node #2 to be tested.
 */
var testUserIntent = function (a, b) { return getNodeIntent(a.wrappedNodes[0]) === getNodeIntent(b.wrappedNodes[0]); };
exports.testUserIntent = testUserIntent;
/**
 * @description Test if b is an interval node.
 * @param a {IGroupedTreeNode<ProvenanceNode>} - Not used.
 * @param b {IGroupedTreeNode<ProvenanceNode>} - Node to be tested.
 */
var testIsIntervalNode = function (a, b) { return b.children.length === 1; };
exports.testIsIntervalNode = testIsIntervalNode;
/**
 * @description Test if a and b are neighbours.
 * @param a {IGroupedTreeNode<ProvenanceNode>} - Node #1 to be tested.
 * @param b {IGroupedTreeNode<ProvenanceNode>} - Node #2 to be tested.
 */
var testNeighbours = function (a, b) { return (0, aggregation_implementations_1.areNeighbours)(a, b); };
exports.testNeighbours = testNeighbours;
//////// Objects that represent the different data aggregation algorithms///////////
/**Default Option as Raw Data */
exports.defaultData = {
    name: "Select Aggregation",
    tests: [exports.testNothing],
    algorithm: aggregation_implementations_1.doNothing,
    arg: false,
    description: "No algorithm is applied. The full provenance data is shown."
};
/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
exports.rawData = {
    name: "Raw data",
    tests: [exports.testNothing],
    algorithm: aggregation_implementations_1.doNothing,
    arg: false,
    description: "No algorithm is applied. The full provenance data is shown."
};
/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
exports.grouping = {
    name: "Grouping",
    tests: [exports.testUserIntent, exports.testIsIntervalNode],
    algorithm: aggregation_implementations_1.group,
    arg: false,
    description: "This algorithm groups nodes of the same category (color).\nThe remaining nodes represent the last interactions of category groups.\nThe grouped nodes must have connectivity equal to two or less (interval nodes or leaves) and must belong to the same category group."
};
/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
exports.compression = {
    name: "Compression",
    tests: [exports.testIsIntervalNode, exports.testIsIntervalNode],
    algorithm: aggregation_implementations_1.compress,
    arg: false,
    description: "This algorithm groups nodes with connectivity equals to two (interval nodes). However,\nthe node which 'absorbs' the grouped nodes and which is still visualized can be of any connectivity\nThe remaining nodes are nodes with connectivity different to two (leaves or subroots).\nThe nodes are grouped regardless their category."
};
/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
exports.pruning = {
    name: "Pruning",
    tests: [exports.testIsIntervalNode],
    algorithm: aggregation_implementations_1.prune,
    arg: true,
    description: "This algorithm groups nodes with connectivity equals to two (interval nodes), regardless their category.\nA chosen parameter indicates the minimum height that a subtree must have to be shown.\nE.g., if the chosen parameter is two, the subtrees with height two or less than two will be grouped.\nThe grouped subtrees are represented by their subroot.\nThe main tree is not considered as a subtree."
};
/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
exports.plotTrimmer = {
    name: "PlotTrimmer",
    tests: [exports.testIsIntervalNode],
    algorithm: aggregation_implementations_1.plotTrimmerFunc,
    arg: true,
    description: "Lorem Ipsum"
};
/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
exports.plotTrimmerC = {
    name: "PlotTrimmer C",
    tests: [exports.testIsIntervalNode],
    algorithm: aggregation_implementations_1.plotTrimmerFuncC,
    arg: true,
    description: "Lorem Ipsum"
};
/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
exports.plotTrimmerG = {
    name: "PlotTrimmer G",
    tests: [exports.testIsIntervalNode],
    algorithm: aggregation_implementations_1.plotTrimmerFuncG,
    arg: true,
    description: "Lorem Ipsum"
};
/**
 * @description List of the data aggregation objects. Whenever you want to add a
 * new data aggregation algorithm: create object and add it to this list.
 */
exports.aggregationObjects = [
    exports.defaultData,
    exports.rawData,
    exports.grouping,
    exports.compression,
    exports.pruning,
    exports.plotTrimmer,
    exports.plotTrimmerC,
    exports.plotTrimmerG
];
exports.aggregationObjectsUI1 = [
    exports.defaultData,
    exports.rawData,
    exports.plotTrimmerG
];
exports.aggregationObjectsUI2 = [
    exports.defaultData,
    exports.rawData,
    exports.plotTrimmerC
];
//# sourceMappingURL=aggregation-objects.js.map