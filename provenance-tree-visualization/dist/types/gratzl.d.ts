import { HierarchyNode, HierarchyPointNode } from "d3-hierarchy";
export interface IGratzlLayout<Datum> {
    (root: HierarchyNode<Datum>, activeNode: HierarchyNode<Datum>): IHierarchyPointNodeWithMaxDepth<Datum>;
    size(): [number, number];
    size(size: [number, number]): this;
}
export interface IHierarchyPointNodeWithMaxDepth<T> extends HierarchyPointNode<T> {
    maxDescendantDepth: number;
    data: any;
}
export default function GratzlLayout<T>(_root: HierarchyNode<T>, _current: HierarchyNode<T>): IHierarchyPointNodeWithMaxDepth<T>;
