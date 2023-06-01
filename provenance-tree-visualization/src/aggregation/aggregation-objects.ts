import {
  compress,
  NodeAggregator,
  doNothing,
  group,
  NodeGroupTest,
  plotTrimmerFunc,
  prune,
  areNeighbours,
  plotTrimmerFuncC,
  plotTrimmerFuncG
} from "./aggregation-implementations";
import {
  ProvenanceNode,
  isStateNode
} from "@visualstorytelling/provenance-core";
import { IGroupedTreeNode } from "../utils";

/**
 * @description Getter for the user intent of the node selected.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Node selected.
 * @returns Returns the Intent of the user for the node selected.
 */
export function getNodeIntent(node: ProvenanceNode): string {
  if (
    isStateNode(node) &&
    node.action &&
    node.action.metadata &&
    node.action.metadata.userIntent
  ) {
    return node.action.metadata.userIntent;
  }
  return "none";
}

export function getNodeRenderer(node: ProvenanceNode): string {
  if (
    isStateNode(node) &&
    node.action &&
    node.action.metadata &&
    node.action.metadata.renderer
  ) {
    return node.action.metadata.renderer;
  }
  return "none";
}

/**
 * @description Test whether a node is a key node or not.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Node selected.
 */
export function isKeyNode(node: ProvenanceNode): boolean {
  if (
    !isStateNode(node) ||
    node.children.length === 0 ||
    node.children.length > 1 ||
    node.parent.children.length > 1 ||
    (node.children.length === 1 &&
      getNodeIntent(node) !== getNodeIntent(node.children[0]))
  ) {
    return true;
  }
  return false;
}

/**
 * @description Returns a label for grouped nodes.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Node selected.
 */
export const groupNodeLabel = (node: IGroupedTreeNode<ProvenanceNode>) => {
  if (node.wrappedNodes.length === 1) {
    return node.wrappedNodes[0].label;
  } 
  else {
    const label_arr =node.wrappedNodes.map(n => n.label);
    const unique_label_arr = new Set(label_arr);
    if(unique_label_arr.size === 1)//all labels are the same
      if(node.wrappedNodes.length >= 2)
        return node.wrappedNodes[0].label + "(" + node.wrappedNodes[0].metadata.O_group + ")";
      else
        return node.wrappedNodes[0].label;
    else{ // labels are different
      let label = "";
      const searchpattern = /Camera|View/;
      const searchpattern_2 = /Object/;
      const searchpattern_3 = /Annotation/;
      const searchpattern_4 = /Measure/;
      for (let u_label of unique_label_arr.values()) {
        if(searchpattern.test(u_label) && label.search('Camera') === -1)
          label = label + "Camera,";
        else if(searchpattern_2.test(u_label) && label.search('Object') === -1)
          label = label + "Object,";
        else if(searchpattern_3.test(u_label) && label.search('Annotation') === -1)
          label = label + "Annotation,";
        else if(searchpattern_4.test(u_label) && label.search('Measure') === -1)
          label = label + "Measure,";
      }
      label = label.slice(0, -1);
      if(label.includes('Camera') && label.includes('Object') && node.wrappedNodes.length >= 2)
        label = node.wrappedNodes[0].metadata.O_group;
      else if(label == 'Object')
        label = label + "(" + node.wrappedNodes[0].metadata.O_group + ")";
      else if(label == 'SelectObject')
        label = label.slice(0,-6) + "(" + node.wrappedNodes[0].metadata.O_group + ")";
      else if(label == 'Camera')
        label = label + "(" + node.wrappedNodes[0].metadata.O_group + ")";
      else if(node.wrappedNodes.length >= 2){
        label = label + "(" + node.wrappedNodes[0].metadata.O_group + ")";
      }
      return label;

    }
  }
};

/**
 * @description Wraps a node and its children recursively
 * in an extra IGroupedTreeNode; which can be manipulated for grouping etc,
 * without modifying the (provenance) node.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Node selected.
 */
export const wrapNode = (
  node: ProvenanceNode
): IGroupedTreeNode<ProvenanceNode> => {
  const searchpattern = /Camera|View/;
  if(searchpattern.test(node.label))
    return {
      wrappedNodes: [node],
      children: node.children.map(wrapNode),
      plotTrimmerValue: -1,
      neighbour: false,
      bookmarked: false,
      camera: true
    };
  else
    return {
      wrappedNodes: [node],
      children: node.children.map(wrapNode),
      plotTrimmerValue: -1,
      neighbour: false,
      bookmarked: false,
      camera: false
    };
};

/**
 * @description Test placeholder.
 * @param a {IGroupedTreeNode<ProvenanceNode>} - Node #1 to be tested.
 * @param b {IGroupedTreeNode<ProvenanceNode>} - Node #2 to be tested.
 */
export const testNothing: NodeGroupTest<ProvenanceNode> = (
  a: IGroupedTreeNode<ProvenanceNode>,
  b: IGroupedTreeNode<ProvenanceNode>
) => false;

/**
 * @description Test if two nodes share the same userIntent.
 * @param a {IGroupedTreeNode<ProvenanceNode>} - Node #1 to be tested.
 * @param b {IGroupedTreeNode<ProvenanceNode>} - Node #2 to be tested.
 */
export const testUserIntent: NodeGroupTest<ProvenanceNode> = (
  a: IGroupedTreeNode<ProvenanceNode>,
  b: IGroupedTreeNode<ProvenanceNode>
) => getNodeIntent(a.wrappedNodes[0]) === getNodeIntent(b.wrappedNodes[0]);

/**
 * @description Test if b is an interval node.
 * @param a {IGroupedTreeNode<ProvenanceNode>} - Not used.
 * @param b {IGroupedTreeNode<ProvenanceNode>} - Node to be tested.
 */
export const testIsIntervalNode: NodeGroupTest<ProvenanceNode> = (
  a: IGroupedTreeNode<ProvenanceNode>,
  b: IGroupedTreeNode<ProvenanceNode>
) => b.children.length === 1;

/**
 * @description Test if a and b are neighbours.
 * @param a {IGroupedTreeNode<ProvenanceNode>} - Node #1 to be tested.
 * @param b {IGroupedTreeNode<ProvenanceNode>} - Node #2 to be tested.
 */
export const testNeighbours: NodeGroupTest<ProvenanceNode> = (
  a: IGroupedTreeNode<ProvenanceNode>,
  b: IGroupedTreeNode<ProvenanceNode>
) => areNeighbours(a, b);

//////// Objects that represent the different data aggregation algorithms///////////

/**Default Option as Raw Data */
export const defaultData: NodeAggregator<ProvenanceNode> = {
  name: "Select Aggregation",
  tests: [testNothing],
  algorithm: doNothing,
  arg: false,
  description: "No algorithm is applied. The full provenance data is shown."
};
/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
export const rawData: NodeAggregator<ProvenanceNode> = {
  name: "Raw data",
  tests: [testNothing],
  algorithm: doNothing,
  arg: false,
  description: "No algorithm is applied. The full provenance data is shown."
};

/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
export const grouping: NodeAggregator<ProvenanceNode> = {
  name: "Grouping",
  tests: [testUserIntent, testIsIntervalNode],
  algorithm: group,
  arg: false,
  description: `This algorithm groups nodes of the same category (color).
The remaining nodes represent the last interactions of category groups.
The grouped nodes must have connectivity equal to two or less (interval nodes or leaves) and must belong to the same category group.`
};

/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
export const compression: NodeAggregator<ProvenanceNode> = {
  name: "Compression",
  tests: [testIsIntervalNode, testIsIntervalNode],
  algorithm: compress,
  arg: false,
  description: `This algorithm groups nodes with connectivity equals to two (interval nodes). However,
the node which 'absorbs' the grouped nodes and which is still visualized can be of any connectivity
The remaining nodes are nodes with connectivity different to two (leaves or subroots).
The nodes are grouped regardless their category.`
};

/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
export const pruning: NodeAggregator<ProvenanceNode> = {
  name: "Pruning",
  tests: [testIsIntervalNode],
  algorithm: prune,
  arg: true,
  description: `This algorithm groups nodes with connectivity equals to two (interval nodes), regardless their category.
A chosen parameter indicates the minimum height that a subtree must have to be shown.
E.g., if the chosen parameter is two, the subtrees with height two or less than two will be grouped.
The grouped subtrees are represented by their subroot.
The main tree is not considered as a subtree.`
};

/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
export const plotTrimmer: NodeAggregator<ProvenanceNode> = {
  name: "PlotTrimmer",
  tests: [testIsIntervalNode],
  algorithm: plotTrimmerFunc,
  arg: true,
  description: "Lorem Ipsum"
};

/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
export const plotTrimmerC: NodeAggregator<ProvenanceNode> = {
  name: "PlotTrimmer C",
  tests: [testIsIntervalNode],
  algorithm: plotTrimmerFuncC,
  arg: true,
  description: "Lorem Ipsum"
};

/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
export const plotTrimmerG: NodeAggregator<ProvenanceNode> = {
  name: "PlotTrimmer G",
  tests: [testIsIntervalNode],
  algorithm: plotTrimmerFuncG,
  arg: true,
  description: "Lorem Ipsum"
};

/**
 * @description List of the data aggregation objects. Whenever you want to add a
 * new data aggregation algorithm: create object and add it to this list.
 */

export const aggregationObjects = [
  defaultData,
  rawData,
  grouping,
  compression,
  pruning,
  plotTrimmer,
  plotTrimmerC,
  plotTrimmerG
];

export const aggregationObjectsUI1 = [
  defaultData,
  rawData,
  plotTrimmerG
];
export const aggregationObjectsUI2 = [
  defaultData,
  rawData,
  plotTrimmerC
];