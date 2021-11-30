import { IHierarchyPointNodeWithMaxDepth } from "./gratzl";
import { IGroupedTreeNode } from "./utils";
import { ProvenanceNode } from "@visualstorytelling/provenance-core";
import { HierarchyPointLink } from "d3-hierarchy";
import { ProvenanceTreeVisualization } from "./provenance-tree-visualization";
import * as d3 from "d3";
export declare function caterpillar(updateNodes: d3.Selection<any, IHierarchyPointNodeWithMaxDepth<IGroupedTreeNode<ProvenanceNode>>, any, any>, treeNodes: IHierarchyPointNodeWithMaxDepth<IGroupedTreeNode<ProvenanceNode>>[], updatedLinks: d3.Selection<any, HierarchyPointLink<IGroupedTreeNode<ProvenanceNode>>, any, any>, provenanceTreeVisualization: ProvenanceTreeVisualization): void;
