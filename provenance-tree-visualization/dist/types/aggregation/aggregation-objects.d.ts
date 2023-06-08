import { NodeAggregator, NodeGroupTest } from "./aggregation-implementations";
import { ProvenanceNode } from "@visualstorytelling/provenance-core";
import { IGroupedTreeNode } from "../utils";
/**
 * @description Getter for the user intent of the node selected.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Node selected.
 * @returns Returns the Intent of the user for the node selected.
 */
export declare function getNodeIntent(node: ProvenanceNode): string;
export declare function getNodeRenderer(node: ProvenanceNode): string;
/**
 * @description Test whether a node is a key node or not.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Node selected.
 */
export declare function isKeyNode(node: ProvenanceNode): boolean;
/**
 * @description Returns a label for grouped nodes.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Node selected.
 */
export declare const groupNodeLabel: (node: IGroupedTreeNode<ProvenanceNode>) => string;
/**
 * @description Wraps a node and its children recursively
 * in an extra IGroupedTreeNode; which can be manipulated for grouping etc,
 * without modifying the (provenance) node.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Node selected.
 */
export declare const wrapNode: (node: ProvenanceNode) => IGroupedTreeNode<ProvenanceNode>;
/**
 * @description Test placeholder.
 * @param a {IGroupedTreeNode<ProvenanceNode>} - Node #1 to be tested.
 * @param b {IGroupedTreeNode<ProvenanceNode>} - Node #2 to be tested.
 */
export declare const testNothing: NodeGroupTest<ProvenanceNode>;
/**
 * @description Test if two nodes share the same userIntent.
 * @param a {IGroupedTreeNode<ProvenanceNode>} - Node #1 to be tested.
 * @param b {IGroupedTreeNode<ProvenanceNode>} - Node #2 to be tested.
 */
export declare const testUserIntent: NodeGroupTest<ProvenanceNode>;
/**
 * @description Test if b is an interval node.
 * @param a {IGroupedTreeNode<ProvenanceNode>} - Not used.
 * @param b {IGroupedTreeNode<ProvenanceNode>} - Node to be tested.
 */
export declare const testIsIntervalNode: NodeGroupTest<ProvenanceNode>;
/**
 * @description Test if a and b are neighbours.
 * @param a {IGroupedTreeNode<ProvenanceNode>} - Node #1 to be tested.
 * @param b {IGroupedTreeNode<ProvenanceNode>} - Node #2 to be tested.
 */
export declare const testNeighbours: NodeGroupTest<ProvenanceNode>;
/**Default Option as Raw Data */
export declare const defaultData: NodeAggregator<ProvenanceNode>;
/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
export declare const rawData: NodeAggregator<ProvenanceNode>;
/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
export declare const grouping: NodeAggregator<ProvenanceNode>;
/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
export declare const compression: NodeAggregator<ProvenanceNode>;
/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
export declare const pruning: NodeAggregator<ProvenanceNode>;
/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
export declare const plotTrimmer: NodeAggregator<ProvenanceNode>;
/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
export declare const plotTrimmerC: NodeAggregator<ProvenanceNode>;
/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
export declare const plotTrimmerG: NodeAggregator<ProvenanceNode>;
/**
 * @description List of the data aggregation objects. Whenever you want to add a
 * new data aggregation algorithm: create object and add it to this list.
 */
export declare const aggregationObjects: NodeAggregator<ProvenanceNode>[];
export declare const aggregationObjectsUI1: NodeAggregator<ProvenanceNode>[];
export declare const aggregationObjectsUI2: NodeAggregator<ProvenanceNode>[];
