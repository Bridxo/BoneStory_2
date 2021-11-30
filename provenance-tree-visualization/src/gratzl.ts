import { HierarchyNode, HierarchyPointNode } from "d3-hierarchy";

function depthSort(
  a: IHierarchyPointNodeWithMaxDepth<any>,
  b: IHierarchyPointNodeWithMaxDepth<any>
) {
  if (a.maxDescendantDepth > b.maxDescendantDepth) {
    return -1;
  } else if (a.maxDescendantDepth < b.maxDescendantDepth) {
    return 1;
  }
  return 0;
}

export interface IGratzlLayout<Datum> {
  (
    root: HierarchyNode<Datum>,
    activeNode: HierarchyNode<Datum>
  ): IHierarchyPointNodeWithMaxDepth<Datum>;
  size(): [number, number];
  size(size: [number, number]): this;
}

export interface IHierarchyPointNodeWithMaxDepth<T>
  extends HierarchyPointNode<T> {
  maxDescendantDepth: number;
  // xOffset: number;
  // x, y, links()
}

export default function GratzlLayout<T>(
  _root: HierarchyNode<T>,
  _current: HierarchyNode<T>
): IHierarchyPointNodeWithMaxDepth<T> {
  const root = _root as IHierarchyPointNodeWithMaxDepth<T>;
  const current = _current as IHierarchyPointNodeWithMaxDepth<T>;
  const widths: number[] = [];
  // const maxY = Math.max.apply(null, root.leaves().map((leaf) => leaf.depth));

  function setTreeX(node: IHierarchyPointNodeWithMaxDepth<T>, val: number) {
    node.x = val;
    node.y = node.depth;
    widths[node.depth] = val;
    if (node.children) {
      node
        .leaves()
        .sort(depthSort)
        .forEach(leaf => {
          if (typeof leaf.x === "undefined") {
            const width = Math.max.apply(
              null,
              widths.slice(node.depth, leaf.depth + 1)
            );
            setTreeX(leaf, val > width ? val : width + 1);
          }
        });
    }

    if (node.parent && typeof node.parent.x === "undefined") {
      setTreeX(node.parent, val);
    }
  }

  root.leaves().forEach(leaf => {
    leaf.ancestors().forEach(leafAncestor => {
      if (
        !leafAncestor.maxDescendantDepth ||
        leaf.depth > leafAncestor.maxDescendantDepth
      ) {
        leafAncestor.maxDescendantDepth = leaf.depth;
      }
    });
  });

  /* start at the deepest leaf of activeNode. */
  let deepestLeaf = current;
  deepestLeaf.leaves().forEach(leaf => {
    if (deepestLeaf.depth < leaf.depth) {
      deepestLeaf = leaf;
    }
  });

  setTreeX(deepestLeaf, 0);

  //
  // const maxX = Math.max.apply(null, widths);
  // const maxY = Math.max.apply(null, root.leaves().map((leaf) => leaf.depth));
  // root.each((node) => {
  //   sizeNode(node, maxX, maxY);
  // });

  return root;

  //
  // const tree: IGratzlLayout<Datum> = Object.assign(
  //   (_root: HierarchyNode<Datum>, _activeNode: HierarchyNode<Datum>) => {
  //     /*
  //   * set maxDescendantDepth on each node,
  //   * which is the depth of its deepest child
  //   *
  //   * */
  //
  //     const root = _root as IHierarchyPointNodeWithMaxDepth<Datum>;
  //     const activeNode = _activeNode as IHierarchyPointNodeWithMaxDepth<Datum>;
  //
  //     root.leaves().forEach((leaf) => {
  //       leaf.ancestors().forEach((leafAncestor) => {
  //         if (
  //           !leafAncestor.maxDescendantDepth ||
  //           leaf.depth > leafAncestor.maxDescendantDepth
  //         ) {
  //           leafAncestor.maxDescendantDepth = leaf.depth;
  //         }
  //       });
  //     });
  //
  //     /* rendering should start at the deepest leaf of activeNode. */
  //     let deepestLeaf = activeNode;
  //     activeNode.leaves().forEach((leaf) => {
  //       if (deepestLeaf.depth < leaf.depth) {
  //         deepestLeaf = leaf;
  //       }
  //     });
  //
  //     setTreeX(deepestLeaf, 0);
  //
  //     const maxX = Math.max.apply(null, widths);
  //     const maxY = Math.max.apply(null, root.leaves().map((leaf) => leaf.depth));
  //     root.each((node) => {
  //       sizeNode(node, maxX, maxY);
  //     });
  //
  //     return root;
  //   },
  //   {
  //     size: ((x: [number, number] | undefined) => {
  //       return x ? ((dx = +x[0]), (dy = +x[1]), tree) : [dx, dy];
  //     }) as any,
  //   },
  // );
  //
  // function sizeNode(
  //   node: IHierarchyPointNodeWithMaxDepth<any>,
  //   maxX: number,
  //   maxY: number,
  // ): void {
  //   node.x = maxX === 0 ? dx : dx - (dx / maxX) * node.xOffset;
  //   node.y = maxY === 0 ? dy : (dy / maxY) * node.depth;
  // }

  // return tree;
}
