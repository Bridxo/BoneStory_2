export interface IGroupedTreeNode<T> {
  children: Array<IGroupedTreeNode<T>>;
  wrappedNodes: T[];
  plotTrimmerValue: number;
  camera: boolean;
  neighbour: boolean;
  bookmarked: boolean;
}

export const copyTree = <T>(node: IGroupedTreeNode<T>): typeof node => {
  return {
    ...node,
    children: node.children.map(copyTree)
  };
};

export const preOrderTraversal = <T>(
  node: IGroupedTreeNode<T>,
  cb: (n: typeof node) => any
) => {
  cb(node);
  node.children.map(child => preOrderTraversal(child, cb));
};

export type NodeGroupTest<T> = (
  a: IGroupedTreeNode<T>,
  b: IGroupedTreeNode<T>
) => boolean;

export const group = <T>(node: IGroupedTreeNode<T>, test: NodeGroupTest<T>) => {
  let merged = false;
  do {
    merged = false;
    for (const child of node.children) {
      if (test(node, child)) {
        node.children.splice(node.children.indexOf(child), 1);
        node.children.push(...child.children);
        node.wrappedNodes.push(...child.wrappedNodes);
        merged = true;
        break;
      }
    }
  } while (merged);
  node.children.map(child => group(child, test));
};
