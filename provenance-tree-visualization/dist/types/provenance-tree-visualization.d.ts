import * as d3 from 'd3';
import { HierarchyPointNode } from 'd3';
import { ProvenanceGraphTraverser, ProvenanceNode } from '@visualstorytelling/provenance-core';
import { IGroupedTreeNode } from './utils';
import { NodeAggregator } from './aggregation/aggregation-implementations';
export declare type D3SVGSelection = d3.Selection<SVGSVGElement, any, null, undefined>;
export declare type D3SVGGSelection = d3.Selection<SVGGElement, any, null, undefined>;
export interface IAggregation {
    aggregator: NodeAggregator<ProvenanceNode>;
    arg: any;
}
/**
 * @description Class used to create and manage a provenance tree visualization.
 * @param traverser {ProvenanceGraphTraverser} - To manage the data structure of the graph.
 * @param svg {D3SVGSelection} - To manage the graphics of the tree.
 * @param _dataAggregation {aggregator<ProvenanceNode>} - Data aggregation in use.
 * @param caterpillarActivated {boolean} - True if this feature is enable.
 */
export declare class ProvenanceTreeVisualization {
    traverser: ProvenanceGraphTraverser;
    camera_show: boolean;
    colorScheme: any;
    numberofnodes: number;
    numberofnodeswocam: number;
    numberofnodeswcam: number;
    numberOfUniqueValues: number;
    groupnumber: number;
    real_traverser: any;
    g: D3SVGGSelection;
    svg: D3SVGSelection;
    container: any;
    aggregation: IAggregation;
    caterpillarActivated: boolean;
    alt: boolean;
    private hierarchyRoot;
    private zoomer;
    private currentHierarchyNodelength;
    private currentHierarchyMaxlength;
    private keynode;
    private TreeLength;
    private TreeWidth;
    private sizeX;
    private sizeY;
    mergingEnabled: boolean;
    transferringEnabled: boolean;
    copyingEnabled: boolean;
    activeleave: any;
    constructor(traverser: ProvenanceGraphTraverser, elm: HTMLDivElement);
    setZoomExtent(): void;
    scaleToFit(): void;
    linkPath({ source, target }: {
        source: HierarchyPointNode<IGroupedTreeNode<ProvenanceNode>>;
        target: HierarchyPointNode<IGroupedTreeNode<ProvenanceNode>>;
    }): string;
    /**
     * @descriptionWrap text labels
     */
    wrap(text: any, width: any): void;
    camerahide(): void;
    getFullsizeview(): void;
    setTraverser(traverser: ProvenanceGraphTraverser): void;
    removeNodesAndLinkChildren<T>(tree: IGroupedTreeNode<T>, condition: (node: IGroupedTreeNode<T>) => boolean): IGroupedTreeNode<T>;
    deleteNode(): Promise<void>;
    Grouping_hierarchy<T>(wraproot: IGroupedTreeNode<ProvenanceNode>): d3.HierarchyNode<IGroupedTreeNode<ProvenanceNode>>;
    /**
     * @description Update the tree layout.
     */
    update: () => void;
    getTraverser(): ProvenanceGraphTraverser;
}
