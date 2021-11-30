import * as d3 from "d3";
import {
  ProvenanceNode,
  NodeIdentifier
} from "@visualstorytelling/provenance-core";

import { IGroupedTreeNode } from "../utils";
import { IAggregation } from "../provenance-tree-visualization";

/**
 * @description Return the HierarchyNode corresponding to the ProvenanceNode.
 */
export function findHierarchyNodeFromProvenanceNode(
  hierarchyNode: d3.HierarchyNode<IGroupedTreeNode<ProvenanceNode>>,
  currentNode: ProvenanceNode
) {
  let currentHierarchyNode: typeof hierarchyNode | undefined;
  hierarchyNode.each(node => {
    if (node.data.wrappedNodes.includes(currentNode)) {
      currentHierarchyNode = node;
    }
  });

  if (currentHierarchyNode === undefined) {
    throw new Error("Cannot find current selected node in tree.");
  }

  return currentHierarchyNode;
}

export function aggregateNodes(
  aggregation: IAggregation,
  rootNode: IGroupedTreeNode<ProvenanceNode>,
  currentNode: ProvenanceNode
): void {
  // d3.hierarchy wraps nodes recursively and adds some helpers
  // See https://github.com/d3/d3-hierarchy#hierarchy
  const hierarchyRoot: d3.HierarchyNode<
    IGroupedTreeNode<ProvenanceNode>
  > = d3.hierarchy(rootNode);

  // the HierarchyNode containing the active ProvenanceTree node
  const currentHierarchyNode = findHierarchyNodeFromProvenanceNode(
    hierarchyRoot,
    currentNode
  );

  const mainBranch: NodeIdentifier[] = hierarchyRoot
    .path(currentHierarchyNode)
    .map(d => d.data.wrappedNodes[0].id);

  // if (this.dataAggregation.arg) {
  aggregation.aggregator.algorithm(
    currentHierarchyNode.data,
    rootNode,
    aggregation.aggregator.tests,
    mainBranch,
    aggregation.arg
  );
  // } else {
  //   this.dataAggregation.algorithm(currentHierarchyNode.data, rootNode, this.dataAggregation.test);
  // }
}
