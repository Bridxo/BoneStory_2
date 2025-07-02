import { IGroupedTreeNode } from "../utils";
import {
  ProvenanceNode,
  isStateNode
} from "@visualstorytelling/provenance-core";

/**
 * @description Type for the tests for aggregating data.
 * @param a {IGroupedTreeNode<ProvenanceNode>} -
 * @param b {IGroupedTreeNode<ProvenanceNode>} -
 * @returns Returns true if the nodes has passed the test.
 */
export type NodeGroupTest<T> = (
  a: IGroupedTreeNode<T>,
  b: IGroupedTreeNode<T>
) => boolean;

/**
 * @description Type for the data aggregation algorithms
 * @param currentNode {IGroupedTreeNode<ProvenanceNode>} - Selected node.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Root of the tree.
 * @param test {NodeGroupTest<ProvenanceNode>} - Test to be executed.
 * @param mainBranch {Array<String>} - List of node's id which belong to the master branch.
 * @param par {any} - Optional parameter required for the algorithm
 */
export type NodeAggregationAlgorithm = (
  currentNode: IGroupedTreeNode<ProvenanceNode>,
  node: IGroupedTreeNode<ProvenanceNode>,
  tests: NodeGroupTest<ProvenanceNode>[],
  mainBranch?: Array<string>,
  par?: any
) => void;

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
export function transferToParent(
  node: IGroupedTreeNode<ProvenanceNode>,
  child: IGroupedTreeNode<ProvenanceNode>
) {
  const index = node.children.indexOf(child);
  node.children.splice(index, 1);
  node.children.push(...child.children);
  node.wrappedNodes.unshift(...child.wrappedNodes);
}

/**
 * @description Child removed, child's children go to grandChild. GrandChild becomes node's child.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Parent node
 * @param child {IGroupedTreeNode<ProvenanceNode>} - Child node
 * @param grandChild {IGroupedTreeNode<ProvenanceNode>} - Child of the child node
 */
export function transferChildren(
  node: any,
  child: any,
  grandChild: any
) {
  //data part
  node.data.children.splice(node.data.children.indexOf(child.data), 1);
  grandChild.data.wrappedNodes.push(...child.data.wrappedNodes);
  child.data.children.splice(child.data.children.indexOf(grandChild.data), 1);
  node.data.children.push(grandChild.data);
}
export function transferChildren_2(
  Startparentnode: any,
  Startnode: any,
  Endnode: any
) {
  //data part
  let tempNode = Endnode.parent;
  let superParent = Startparentnode.parent;
  do{
    tempNode.data.children.splice(tempNode.data.children.indexOf(Endnode.data),1);
    Endnode.data.wrappedNodes.push(...tempNode.data.wrappedNodes);
    tempNode = tempNode.parent;
  }while(tempNode.data != Startparentnode.data)
  Startparentnode.data.children.splice(Startparentnode.data.children.indexOf(Startnode.data), 1);
  Endnode.data.wrappedNodes.push(...Startparentnode.data.wrappedNodes);
  superParent.data.children.splice(superParent.data.children.indexOf(Startparentnode.data), 1);
  superParent.data.children.push(Endnode.data);
}

/**
 * @description Pointed node wraps ALL children recursively
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Selected node
 */
export function transferAll(node: IGroupedTreeNode<ProvenanceNode>) {
  let done: boolean;
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

/**
 * @description Test whether a node should be constrained based on the currently selected node.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - The node to test.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Currently selected node.
 */
export function shouldConstrain(
  node: IGroupedTreeNode<ProvenanceNode>,
  selectedNode: IGroupedTreeNode<ProvenanceNode>
): boolean {
  let result = false;
  const rawNode = node.wrappedNodes[0];

  if (node === selectedNode || rawNode.metadata.bookmarked) {
    result = true;
  } else if (node.children.includes(selectedNode)) {
    result = true;
  } else if (selectedNode.children.includes(node)) {
    result = true;
  }

  return result;
}

/**
 * @description Test whether a node is a leaf node.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - The node to test.
 */
export function isLeafNode(node: IGroupedTreeNode<ProvenanceNode>): boolean {
  let result = false;

  if (node.children.length === 0) {
    result = true;
  }

  return result;
}

/**
 * @description Test whether a node is an interval node.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - The node to test.
 */
export function isIntervalNode(
  node: IGroupedTreeNode<ProvenanceNode>
): boolean {
  let result = false;

  if (node.children.length === 1) {
    result = true;
  }

  return result;
}

/**
 * @description Test whether two nodes are neighbours.
 * @param  a  {IGroupedTreeNode<ProvenanceNode>} - The first node to test.
 * @param  b  {IGroupedTreeNode<ProvenanceNode>} - The second node to test.
 */
export function areNeighbours(
  a: IGroupedTreeNode<ProvenanceNode>,
  b: IGroupedTreeNode<ProvenanceNode>
): boolean {
  let result = false;

  if (b.children.includes(a)) {
    result = true;
  } else if (a.children.includes(b)) {
    result = true;
  }

  return result;
}

/**
 * @description Calculate the distance of this node to any node in the main (selected) branch.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - The node to test.
 * @param  mainBranch  {Array<string>} - List of node ids which belong to the master branch.
 */
export function distanceToMainBranch(
  node: ProvenanceNode,
  mainBranch: Array<string> | undefined
): number {
  let result = 0;

  if (mainBranch === undefined) {
    result = 0;
  } else if (isStateNode(node) && mainBranch.includes(node.id)) {
    result = 0;
  } else {
    if (isStateNode(node)) {
      result = 1 + distanceToMainBranch(node.parent, mainBranch);
    }
  }

  return result;
}

/**
 * @description Returns the minimum depth possible from the node selected.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Selected node
 * @returns Number of nodes you have to cross to go to the deepest leaf from the node selected.
 */
export const minDepth = <T>(node: IGroupedTreeNode<T>): number => {
  if (node.children.length === 0) {
    return 0;
  }
  return Math.min(...node.children.map(minDepth)) + 1;
};

/**
 * @description Returns the maximum depth possible from the node selected.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Selected node
 * @returns Number of nodes you have to cross to go to the deepest leaf from the node selected.
 */
export const maxDepth = <T>(node: IGroupedTreeNode<T>): number => {
  if (node.children.length === 0) {
    return 1;
  }
  return Math.max(...node.children.map(maxDepth)) + 1;
};

/**
 * @description Returns the distance to the subroot from the node selected.
 * @param provNode {ProvenanceNode} - Selected node
 * @returns Number of nodes you have to cross to go to the subroot up from the node selected.
 */
export const subrootDist = (provNode: ProvenanceNode): number => {
  let value = 0;

  if (!isStateNode(provNode)) {
    value = 0;
  } else if (isStateNode(provNode)) {
    if (provNode.parent.children.length > 1) {
      value = 1;
    } else {
      value = 1 + subrootDist(provNode.parent);
    }
  }
  return value;
};

/**
 * @description Returns the number of conexions with the node selected.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Selected node
 * @returns Number of nodes you have to cross to go to the deepest leaf from the node selected.
 */
export const connectivity = (node: IGroupedTreeNode<ProvenanceNode>) => {
  return 1 + node.children.length;
};

/**
 * @description Return the first node found in nodes that also belongs to the main branch of the tree.
 * @param  mainBranch  {Array<string>} - List of node ids which belong to the master branch.
 * @param  nodes  {Array<IGroupedTreeNode<ProvenanceNode>>} - List of nodes to test.
 */
const mainNode = (
  mainBranch: Array<string>,
  nodes: Array<IGroupedTreeNode<ProvenanceNode>>
): IGroupedTreeNode<ProvenanceNode> | undefined => {
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
const nodeDepthComparison = <T>(
  node1: IGroupedTreeNode<T>,
  node2: IGroupedTreeNode<T>
): number => {
  if (maxDepth(node1) > maxDepth(node2)) {
    return 1;
  } else if (maxDepth(node1) < maxDepth(node2)) {
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
const testAll = (
  tests: Array<NodeGroupTest<ProvenanceNode>>,
  node1: IGroupedTreeNode<ProvenanceNode>,
  node2: IGroupedTreeNode<ProvenanceNode>
): boolean => {
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
export const doNothing: NodeAggregationAlgorithm = (
  currentNode: IGroupedTreeNode<ProvenanceNode>,
  node: IGroupedTreeNode<ProvenanceNode>,
  tests: NodeGroupTest<ProvenanceNode>[]
) => { };

/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Tests to be checked during execution.
 */
export const group: NodeAggregationAlgorithm = (
  currentNode: IGroupedTreeNode<ProvenanceNode>,
  node: IGroupedTreeNode<ProvenanceNode>,
  tests: NodeGroupTest<ProvenanceNode>[]
) => {
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
  node.children.map(child => group(currentNode, child, tests));
};

/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Tests to be checked during execution.
 */
export const compress: NodeAggregationAlgorithm = (
  currentNode: IGroupedTreeNode<ProvenanceNode>,
  node: IGroupedTreeNode<ProvenanceNode>,
  tests: NodeGroupTest<ProvenanceNode>[]
) => {
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
  node.children.map(child => compress(currentNode, child, tests));
};

/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Tests to be checked during execution.
 * @param mainBranch {Array<string>} - List of node's id which belong to the master branch.
 * @param arg {any} - Optinal parameter
 */
export const prune: NodeAggregationAlgorithm = (
  currentNode: IGroupedTreeNode<ProvenanceNode>,
  node: IGroupedTreeNode<ProvenanceNode>,
  tests: NodeGroupTest<ProvenanceNode>[],
  mainBranch: Array<string> | undefined,
  arg: any
) => {
  const parameter: number = +arg;
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
        } else {
          for (const grandChild of child.children) {
            if (
              !shouldConstrain(grandChild, currentNode) &&
              distanceToMainBranch(child.wrappedNodes[0], mainBranch) > 0
            ) {
              const childDepth = maxDepth(child);
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
  node.children.map(child =>
    prune(currentNode, child, tests, mainBranch, parameter)
  );
};

/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Test to be checked during execution.
 * @param arg {any} - Optinal parameter
 */
export const plotTrimmerFunc: NodeAggregationAlgorithm = (
  currentNode: IGroupedTreeNode<ProvenanceNode>,
  node: IGroupedTreeNode<ProvenanceNode>,
  tests: NodeGroupTest<ProvenanceNode>[],
  mainBranch: Array<string> | undefined,
  arg: any
) => {
  trimmer(currentNode, node, tests, mainBranch, arg);
};
export const trimmerAssignValues = (node: IGroupedTreeNode<ProvenanceNode>) => {
  // Leaf value = subroot distance * 2
  // Interval nodes value = 1
  // Subroots value = Minimum subroot distance of children * 2 + 1
  let value = 0;

  if (!isStateNode(node.wrappedNodes[0]) === null) {
    value = Number.MAX_VALUE;
  } else if (connectivity(node) === 1) {
    // Leaf node
    value = subrootDist(node.wrappedNodes[0]) * 2;
  } else if (connectivity(node) === 2) {
    // Interval node
    value = 1;
  } else {
    // Subroot
    value = minDepth(node) * 2 + 1;
  }

  node.plotTrimmerValue = value;

  for (const child of node.children) {
    trimmerAssignValues(child);
  }
};

/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Test to be checked during execution.
 * @param arg {any} - Optinal parameter
 */
const trimmer: NodeAggregationAlgorithm = (
  currentNode: IGroupedTreeNode<ProvenanceNode>,
  node: IGroupedTreeNode<ProvenanceNode>,
  tests: NodeGroupTest<ProvenanceNode>[],
  mainBranch: Array<string> | undefined,
  arg: any
) => {
  const parameter: number = +arg;
  let merged: boolean;

  trimmerAssignValues(node);

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
  node.children.map(child =>
    trimmer(currentNode, child, tests, mainBranch, parameter)
  );
};

/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  test  {IGroupedTreeNode<ProvenanceNode>} - Test to be checked during execution.
 * @param arg {any} - Optinal parameter
 */
export const plotTrimmerFuncG: NodeAggregationAlgorithm = (
  currentNode: IGroupedTreeNode<ProvenanceNode>,
  node: IGroupedTreeNode<ProvenanceNode>,
  tests: NodeGroupTest<ProvenanceNode>[],
  mainBranch: Array<string> | undefined,
  arg: any
) => {
  const parameter = +arg;
  let prunePar = 0;

  for (let i = 0; i <= parameter; i++) {
    if (i % 2 === 0 && i !== 0) {
      prunePar = prunePar + 1;
      prune(currentNode, node, tests, mainBranch, prunePar);
    } else {
      group(currentNode, node, tests);
    }
  }
};

/**
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  test  {IGroupedTreeNode<ProvenanceNode>} - Test to be checked during execution.
 * @param arg {any} - Optinal parameter
 */
export const plotTrimmerFuncC: NodeAggregationAlgorithm = (
  currentNode: IGroupedTreeNode<ProvenanceNode>,
  node: IGroupedTreeNode<ProvenanceNode>,
  tests: NodeGroupTest<ProvenanceNode>[],
  mainBranch: Array<string> | undefined,
  arg: any
) => {
  const parameter = +arg;
  let prunePar = 0;

  for (let i = 0; i <= parameter; i++) {
    if (i % 2 === 0 && i !== 0) {
      prunePar = prunePar + 1;
      prune(currentNode, node, tests, mainBranch, prunePar);
    } else {
      compress(currentNode, node, tests);
    }
  }
};
