export interface IGroupedTreeNode<T> {
    children: Array<IGroupedTreeNode<T>>;
    wrappedNodes: T[];
    plotTrimmerValue: number;
    camera: boolean;
    neighbour: boolean;
    bookmarked: boolean;
}
export declare const copyTree: <T>(node: IGroupedTreeNode<T>) => IGroupedTreeNode<T>;
export declare const preOrderTraversal: <T>(node: IGroupedTreeNode<T>, cb: (n: IGroupedTreeNode<T>) => any) => void;
export declare type NodeGroupTest<T> = (a: IGroupedTreeNode<T>, b: IGroupedTreeNode<T>) => boolean;
export declare const group: <T>(node: IGroupedTreeNode<T>, test: NodeGroupTest<T>) => void;
export declare const cam_test: <T>(label: any) => boolean;
