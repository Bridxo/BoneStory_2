"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateNodes = exports.findHierarchyNodeFromProvenanceNode = void 0;
var d3 = require("d3");
/**
 * @description Return the HierarchyNode corresponding to the ProvenanceNode.
 */
function findHierarchyNodeFromProvenanceNode(hierarchyNode, currentNode) {
    var currentHierarchyNode;
    hierarchyNode.each(function (node) {
        if (node.data.wrappedNodes.includes(currentNode)) {
            currentHierarchyNode = node;
        }
    });
    if (currentHierarchyNode === undefined) {
        throw new Error("Cannot find current selected node in tree.");
    }
    return currentHierarchyNode;
}
exports.findHierarchyNodeFromProvenanceNode = findHierarchyNodeFromProvenanceNode;
function aggregateNodes(aggregation, rootNode, currentNode) {
    // d3.hierarchy wraps nodes recursively and adds some helpers
    // See https://github.com/d3/d3-hierarchy#hierarchy
    var hierarchyRoot = d3.hierarchy(rootNode);
    // the HierarchyNode containing the active ProvenanceTree node
    var currentHierarchyNode = findHierarchyNodeFromProvenanceNode(hierarchyRoot, currentNode);
    var mainBranch = hierarchyRoot
        .path(currentHierarchyNode)
        .map(function (d) { return d.data.wrappedNodes[0].id; });
    // if (this.dataAggregation.arg) {
    aggregation.aggregator.algorithm(currentHierarchyNode.data, rootNode, aggregation.aggregator.tests, mainBranch, aggregation.arg);
    // } else {
    //   this.dataAggregation.algorithm(currentHierarchyNode.data, rootNode, this.dataAggregation.test);
    // }
}
exports.aggregateNodes = aggregateNodes;
//# sourceMappingURL=aggregation.js.map