import * as d3 from 'd3';
import { ProvenanceTreeVisualization } from './provenance-tree-visualization';
/**
 * @description Show the title of the data aggregation algorithm used.
 */
export type HTMLDivSelection = d3.Selection<HTMLDivElement, unknown, null, undefined>;
export declare function setTitle(elm: HTMLDivSelection, onClick: () => any): void;
/**
 * @description Show the buttons of the user interface.
 */
export declare function addAggregationButtons(elm: HTMLDivSelection, provenanceTreeVisualization: ProvenanceTreeVisualization): void;
