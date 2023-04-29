import { IGroupedTreeNode } from "../utils";
import { ProvenanceNode } from "@visualstorytelling/provenance-core";
/**
 * @description Type for the tests for aggregating data.
 * @param a {IGroupedTreeNode<ProvenanceNode>} -
 * @param b {IGroupedTreeNode<ProvenanceNode>} -
 * @returns Returns true if the nodes has passed the test.
 */
export declare type NodeGroupTest<T> = (a: IGroupedTreeNode<T>, b: IGroupedTreeNode<T>) => boolean;
/**
 * @description Type for the data aggregation algorithms
 * @param currentNode {IGroupedTreeNode<ProvenanceNode>} - Selected node.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Root of the tree.
 * @param test {NodeGroupTest<ProvenanceNode>} - Test to be executed.
 * @param mainBranch {Array<String>} - List of node's id which belong to the master branch.
 * @param par {any} - Optional parameter required for the algorithm
 */
export declare type NodeAggregationAlgorithm = (currentNode: IGroupedTreeNode<ProvenanceNode>, node: IGroupedTreeNode<ProvenanceNode>, tests: NodeGroupTest<ProvenanceNode>[], mainBranch?: Array<string>, par?: any) => void;
/**
 * @description Interface defines aggregation strategy.
 * @param name {string} - Name of the procedure
 * @param test {NodeGroupTest<ProvenanceNode>} - Test to be executed;
 * @param algorithm {NodeAggregationAlgorithm} - Algorithm to be performed;
 * @param arg {any} - Optional parameter if needed.
 * @param description {String} - Description of the procedure.
 */
export interface NodeAggregator<T> {
    name: string;
    tests: NodeGroupTest<T>[];
    algorithm: NodeAggregationAlgorithm;
    arg?: any;
    description?: String;
}
/**
 * @description Child removed, child's children go to the parent.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Parent node
 * @param child {IGroupedTreeNode<ProvenanceNode>} - Child node
 */
export declare function transferToParent(node: IGroupedTreeNode<ProvenanceNode>, child: IGroupedTreeNode<ProvenanceNode>): void;
/**
 * @description Child removed, child's children go to grandChild. GrandChild becomes node's child.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Parent node
 * @param child {IGroupedTreeNode<ProvenanceNode>} - Child node
 * @param grandChild {IGroupedTreeNode<ProvenanceNode>} - Child of the child node
 */
export declare function transferChildren(node: any, child: any, grandChild: any): void;
export declare function transferChildren_2(Startparentnode: any, Startnode: any, Endnode: any): void;
/**
 * @description Pointed node wraps ALL children recursively
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Selected node
 */
export declare function transferAll(node: IGroupedTreeNode<ProvenanceNode>): void;
/**
 * @description Test whether a node should be constrained based on the currently selected node.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - The node to test.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Currently selected node.
 */
export declare function shouldConstrain(node: IGroupedTreeNode<ProvenanceNode>, selectedNode: IGroupedTreeNode<ProvenanceNode>): boolean;
/**
 * @description Test whether a node is a leaf node.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - The node to test.
 */
export declare function isLeafNode(node: IGroupedTreeNode<ProvenanceNode>): boolean;
/**
 * @description Test whether a node is an interval node.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - The node to test.
 */
export declare function isIntervalNode(node: IGroupedTreeNode<ProvenanceNode>): boolean;
/**
 * @description Test whether two nodes are neighbours.
 * @param  a  {IGroupedTreeNode<ProvenanceNode>} - The first node to test.
 * @param  b  {IGroupedTreeNode<ProvenanceNode>} - The second node to test.
 */
export declare function areNeighbours(a: IGroupedTreeNode<ProvenanceNode>, b: IGroupedTreeNode<ProvenanceNode>): boolean;
/**
 * @description Calculate the distance of this node to any node in the main (selected) branch.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - The node to test.
 * @param  mainBranch  {Array<string>} - List of node ids which belong to the master branch.
 */
export declare function distanceToMainBranch(node: ProvenanceNode, mainBranch: Array<string> | undefined): number;
/**
 * @description Returns the minimum depth possible from the node selected.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Selected node
 * @returns Number of nodes you have to cross to go to the deepest leaf from the node selected.
 */
export declare const minDepth: <T>(node: IGroupedTreeNode<T>) => number;
/**
 * @description Returns the maximum depth possible from the node selected.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Selected node
 * @returns Number of nodes you have to cross to go to the deepest leaf from the node selected.
 */
export declare const maxDepth: <T>(node: IGroupedTreeNode<T>) => number;
/**
 * @description Returns the distance to the subroot from the node selected.
 * @param provNode {ProvenanceNode} - Selected node
 * @returns Number of nodes you have to cross to go to the subroot up from the node selected.
 */
export declare const subrootDist: (provNode: ProvenanceNode) => number;
/**
 * @description Returns the number of conexions with the node selected.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Selected node
 * @returns Number of nodes you have to cross to go to the deepest leaf from the node selected.
 */
export declare const connectivity: (node: IGroupedTreeNode<ProvenanceNode>) => number;
/**
 * @description No algorithm is applied. Created for a better understanding.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Test to be checked during execution.
 * @param  currentNode  {IGroupedTreeNode<ProvenanceNode>} -
 */
export declare const doNothing: NodeAggregationAlgorithm;
/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Tests to be checked during execution.
 */
export declare const group: NodeAggregationAlgorithm;
/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Tests to be checked during execution.
 */
export declare const compress: NodeAggregationAlgorithm;
/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Tests to be checked during execution.
 * @param mainBranch {Array<string>} - List of node's id which belong to the master branch.
 * @param arg {any} - Optinal parameter
 */
export declare const prune: NodeAggregationAlgorithm;
/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Test to be checked during execution.
 * @param arg {any} - Optinal parameter
 */
export declare const plotTrimmerFunc: NodeAggregationAlgorithm;
export declare const trimmerAssignValues: (node: IGroupedTreeNode<ProvenanceNode>) => void;
/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  test  {IGroupedTreeNode<ProvenanceNode>} - Test to be checked during execution.
 * @param arg {any} - Optinal parameter
 */
export declare const plotTrimmerFuncG: NodeAggregationAlgorithm;
/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  test  {IGroupedTreeNode<ProvenanceNode>} - Test to be checked during execution.
 * @param arg {any} - Optinal parameter
 */
export declare const plotTrimmerFuncC: NodeAggregationAlgorithm;
