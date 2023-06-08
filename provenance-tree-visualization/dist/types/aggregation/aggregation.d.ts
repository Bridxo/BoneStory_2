import * as d3 from "d3";
import { ProvenanceNode } from "@visualstorytelling/provenance-core";
import { IGroupedTreeNode } from "../utils";
import { IAggregation } from "../provenance-tree-visualization";
/**
 * @description Return the HierarchyNode corresponding to the ProvenanceNode.
 */
export declare function findHierarchyNodeFromProvenanceNode(hierarchyNode: d3.HierarchyNode<IGroupedTreeNode<ProvenanceNode>>, currentNode: ProvenanceNode): d3.HierarchyNode<IGroupedTreeNode<ProvenanceNode>>;
export declare function aggregateNodes(aggregation: IAggregation, rootNode: IGroupedTreeNode<ProvenanceNode>, currentNode: ProvenanceNode): void;
