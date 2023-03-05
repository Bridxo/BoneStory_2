import * as d3 from 'd3';
import { ProvenanceTreeVisualization } from './provenance-tree-visualization';
// import { addLegend, addCommandsList, addTasksList } from './legend';
import { StateNode } from '@visualstorytelling/provenance-core';

/**
 * @description Show the title of the data aggregation algorithm used.
 */
export type HTMLDivSelection = d3.Selection<
  HTMLDivElement,
  unknown,
  null,
  undefined
>;
export function setTitle(elm: HTMLDivSelection, onClick: () => any) {
  elm
    .append('div')
    .attr('id', 'DataAggregationTitle')
    .attr('style', 'text-align: center;')
    .append('text')
    .attr('class', 'titleAggregation')
    .attr('id', 'DataAggregation')
    .text('Raw Data')
    .on('click', onClick)
    .attr('style', 'cursor:pointer');
}

/**
 * @description Show the buttons of the user interface.
 */
export function addAggregationButtons(
  elm: HTMLDivSelection,
  provenanceTreeVisualization: ProvenanceTreeVisualization
) {
  const container = elm.append('div').attr('class', 'container');

  const holder = provenanceTreeVisualization.container
    .append("div")
    .attr("class", "holder")
    .attr("id", "groupingContainer")
    .attr("style", "position: absolute; bottom: 25%; display:none;");

  // const holder = container.append('div');
  // addLegend(container);
  // addCommandsList(container);
  // addTasksList(container);

  // legendButton

  // const legendButton = provenanceTreeVisualization.container
  //   .append('button')
  //   .attr('id', 'minimap-trigger')
  //   .attr('class', 'mat-icon-button mat-button-base mat-primary')
  //   .attr('color', 'primary')
  //   .attr('style', 'position: absolute; color: orange; z-index: 1; bottom: 1%; left: 1%;')
  //   .attr('ng-reflect-color', 'primary')
  //   .on('mousedown', () => {
  //     const visible = d3.select("#legendContainer").style('display') === 'block';
  //     if (visible) {
  //       taskListButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
  //       commandsListButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
  //       legendButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
  //       d3.select("#legendContainer").style('display', 'none');
  //       d3.select("#commandsContainer").style('display', 'none');
  //       d3.select("#tasksContainer").style('display', 'none');
  //       provenanceTreeVisualization.update();
  //       // provenanceTreeVisualization.scaleToFit();
  //     } else {
  //       taskListButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
  //       commandsListButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
  //       legendButton.attr('class', 'mat-icon-button mat-button-base mat-primary checked')
  //       d3.select("#legendContainer").style('display', 'block');
  //       d3.select("#commandsContainer").style('display', 'none');
  //       d3.select("#tasksContainer").style('display', 'none');
  //       provenanceTreeVisualization.update();
  //       // provenanceTreeVisualization.scaleToFit();
  //     }
  //   });

  // legendButton
  //   .append('span')
  //   .attr('class', 'mat-button-wrapper')
  //   .append('mat-icon')
  //   .attr('class', 'mat-icon notranslate material-icons mat-icon-no-color')
  //   .attr('role', 'img')
  //   .attr('aria-hidden', 'true')
  //   .text('color_lens');

  // legendButton
  //   .append('div')
  //   .attr('class', 'mat-button-ripple mat-ripple mat-button-ripple-round')
  //   .attr('ng-reflect-centered', 'true')
  //   .attr('ng-reflect-disabled', 'false')
  //   .attr('ng-reflect-trigger', '[object HTMLButtonElement]');

  // legendButton
  //   .append('div')
  //   .attr('class', 'mat-button-focus-overlay');



  // const commandsListButton = provenanceTreeVisualization.container
  //   .append('button')
  //   .attr('id', 'minimap-trigger')
  //   .attr('class', 'mat-icon-button mat-button-base mat-primary')
  //   .attr('color', 'primary')
  //   .attr('style', 'position: absolute; color: orange; z-index: 1; bottom: 1%; left: 8%; ')
  //   .attr('ng-reflect-color', 'primary')
  //   .on('mousedown', () => {
  //     const visible = d3.select("#commandsContainer").style('display') === 'block';
  //     if (visible) {
  //       taskListButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
  //       commandsListButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
  //       legendButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
  //       d3.select("#legendContainer").style('display', 'none');
  //       d3.select("#commandsContainer").style('display', 'none');
  //       d3.select("#tasksContainer").style('display', 'none');
  //       provenanceTreeVisualization.update();
  //       // provenanceTreeVisualization.scaleToFit();
  //     } else {
  //       taskListButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
  //       commandsListButton.attr('class', 'mat-icon-button mat-button-base mat-primary checked')
  //       legendButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
  //       d3.select("#legendContainer").style('display', 'none');
  //       d3.select("#commandsContainer").style('display', 'block');
  //       d3.select("#tasksContainer").style('display', 'none');
  //       provenanceTreeVisualization.update();
  //       // provenanceTreeVisualization.scaleToFit();
  //     }
  //   });

  // commandsListButton
  //   .append('span')
  //   .attr('class', 'mat-button-wrapper')
  //   .append('mat-icon')
  //   .attr('class', 'mat-icon notranslate material-icons mat-icon-no-color')
  //   .attr('role', 'img')
  //   .attr('aria-hidden', 'true')
  //   .text('list');

  // commandsListButton
  //   .append('div')
  //   .attr('class', 'mat-button-ripple mat-ripple mat-button-ripple-round')
  //   .attr('ng-reflect-centered', 'true')
  //   .attr('ng-reflect-disabled', 'false')
  //   .attr('ng-reflect-trigger', '[object HTMLButtonElement]');

  // commandsListButton
  //   .append('div')
  //   .attr('class', 'mat-button-focus-overlay');





  // const taskListButton = provenanceTreeVisualization.container
  //   .append('button')
  //   .attr('id', 'minimap-trigger')
  //   .attr('class', 'mat-icon-button mat-button-base mat-primary')
  //   .attr('color', 'primary')
  //   .attr('style', 'position: absolute; color: orange; z-index: 1; bottom: 1%; left: 15%;')
  //   .attr('ng-reflect-color', 'primary')
  //   .on('mousedown', () => {
  //     const visible = d3.select("#tasksContainer").style('display') === 'block';
  //     if (visible) {
  //       taskListButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
  //       commandsListButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
  //       legendButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
  //       d3.select("#legendContainer").style('display', 'none');
  //       d3.select("#commandsContainer").style('display', 'none');
  //       d3.select("#tasksContainer").style('display', 'none');
  //       provenanceTreeVisualization.update();
  //       // provenanceTreeVisualization.scaleToFit();
  //     } else {
  //       taskListButton.attr('class', 'mat-icon-button mat-button-base mat-primary checked')
  //       commandsListButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
  //       legendButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
  //       d3.select("#legendContainer").style('display', 'none');
  //       d3.select("#commandsContainer").style('display', 'none');
  //       d3.select("#tasksContainer").style('display', 'block');
  //       provenanceTreeVisualization.update();
  //       // provenanceTreeVisualization.scaleToFit();
  //     }
  //   });

  // taskListButton
  //   .append('span')
  //   .attr('class', 'mat-button-wrapper')
  //   .append('mat-icon')
  //   .attr('class', 'mat-icon notranslate material-icons mat-icon-no-color')
  //   .attr('role', 'img')
  //   .attr('aria-hidden', 'true')
  //   .text('done');

  // taskListButton
  //   .append('div')
  //   .attr('class', 'mat-button-ripple mat-ripple mat-button-ripple-round')
  //   .attr('ng-reflect-centered', 'true')
  //   .attr('ng-reflect-disabled', 'false')
  //   .attr('ng-reflect-trigger', '[object HTMLButtonElement]');

  // taskListButton
  //   .append('div')
  //   .attr('class', 'mat-button-focus-overlay');

  const HidecameraButton = provenanceTreeVisualization.container
  .append('button')
  .attr('id', 'camera-trigger')
  .attr('class', 'mat-icon-button mat-button-base mat-primary')
  .attr('color', 'primary')
  .attr('style', 'position: absolute; z-index: 1; top: 17%;')
  .attr('ng-reflect-color', 'primary')
  .on('mousedown', () => {
    if (provenanceTreeVisualization.traverser.graph.root) {
      provenanceTreeVisualization.camerahide();
    }
  });

  HidecameraButton
    .append('span')
    .attr('class', 'mat-button-wrapper')
    .append('mat-icon')
    .attr('class', 'mat-icon notranslate material-icons mat-icon-no-color')
    .attr('role', 'img')
    .attr('aria-hidden', 'true')
    .text('camera_alt');

  HidecameraButton
    .append('div')
    .attr('class', 'mat-button-ripple mat-ripple mat-button-ripple-round')
    .attr('ng-reflect-centered', 'true')
    .attr('ng-reflect-disabled', 'false')
    .attr('ng-reflect-trigger', '[object HTMLButtonElement]');

  HidecameraButton
    .append('div')
    .attr('class', 'mat-button-focus-overlay');

  
  const goToTheRootButton = provenanceTreeVisualization.container
    .append('button')
    .attr('id', 'root-trigger')
    .attr('class', 'mat-icon-button mat-button-base mat-primary')
    .attr('color', 'primary')
    .attr('style', 'position: absolute; z-index: 1; top: 2%;')
    .attr('ng-reflect-color', 'primary')
    .on('mousedown', () => {
      if (provenanceTreeVisualization.traverser.graph.root) {
        provenanceTreeVisualization.getFullsizeview();
      }
    });

  goToTheRootButton
    .append('span')
    .attr('class', 'mat-button-wrapper')
    .append('mat-icon')
    .attr('class', 'mat-icon notranslate material-icons mat-icon-no-color')
    .attr('role', 'img')
    .attr('aria-hidden', 'true')
    .text('radio_button_unchecked');

  goToTheRootButton
    .append('div')
    .attr('class', 'mat-button-ripple mat-ripple mat-button-ripple-round')
    .attr('ng-reflect-centered', 'true')
    .attr('ng-reflect-disabled', 'false')
    .attr('ng-reflect-trigger', '[object HTMLButtonElement]');

  goToTheRootButton
    .append('div')
    .attr('class', 'mat-button-focus-overlay');



const upwardButton = provenanceTreeVisualization.container
  .append('button')
  .attr('id', 'upward-trigger')
  .attr('class', 'mat-icon-button mat-button-base mat-primary')
  .attr('color', 'primary')
  .attr('style', 'position: absolute; z-index: 1; top: 7%;')
  .attr('ng-reflect-color', 'primary')
  .on('mousedown', () => {
    if (provenanceTreeVisualization.traverser.graph.current.label !== 'Root') {
      provenanceTreeVisualization.traverser.toStateNode((provenanceTreeVisualization.traverser.graph.current as StateNode).parent.id, 250);
      provenanceTreeVisualization.update();
    }
  });

upwardButton
  .append('span')
  .attr('class', 'mat-button-wrapper')
  .append('mat-icon')
  .attr('class', 'mat-icon notranslate material-icons mat-icon-no-color')
  .attr('role', 'img')
  .attr('aria-hidden', 'true')
  .text('arrow_upward');

upwardButton
  .append('div')
  .attr('class', 'mat-button-ripple mat-ripple mat-button-ripple-round')
  .attr('ng-reflect-centered', 'true')
  .attr('ng-reflect-disabled', 'false')
  .attr('ng-reflect-trigger', '[object HTMLButtonElement]');

upwardButton
  .append('div')
  .attr('class', 'mat-button-focus-overlay');









const downwardButton = provenanceTreeVisualization.container
  .append('button')
  .attr('id', 'downward-trigger')
  .attr('class', 'mat-icon-button mat-button-base mat-primary')
  .attr('color', 'primary')
  .attr('style', 'position: absolute; z-index: 1; top: 12%;')
  .attr('ng-reflect-color', 'primary')
  .on('mousedown', () => {
    if (provenanceTreeVisualization.traverser.graph.current.children[0]) {
      for (const child of provenanceTreeVisualization.traverser.graph.current.children) {
        if (child.metadata.mainbranch) {
          provenanceTreeVisualization.traverser.toStateNode(provenanceTreeVisualization.traverser.graph.current.children[0].id, 250);
          provenanceTreeVisualization.update();
        }
      }
    }
  });

downwardButton
  .append('span')
  .attr('class', 'mat-button-wrapper')
  .append('mat-icon')
  .attr('class', 'mat-icon notranslate material-icons mat-icon-no-color')
  .attr('role', 'img')
  .attr('aria-hidden', 'true')
  .text('arrow_downward');

downwardButton
  .append('div')
  .attr('class', 'mat-button-ripple mat-ripple mat-button-ripple-round')
  .attr('ng-reflect-centered', 'true')
  .attr('ng-reflect-disabled', 'false')
  .attr('ng-reflect-trigger', '[object HTMLButtonElement]');

downwardButton
  .append('div')
  .attr('class', 'mat-button-focus-overlay');


}


/**
 * @description Slider for Arguments in simple HTML
 */
export function addSlider<T extends HTMLElement>(
  elem: d3.Selection<T, any, any, any>,
  onChange: (val: number) => any
): void {
  const container = elem.append('div');

  container.attr('class', 'sliderContainer');
  container.attr('style', 'visibility: show');

  const slider = container
    .append('input')
    .attr('id', 'arg')
    .attr('type', 'range')
    .attr('min', 0)
    .attr('max', 10)
    .attr('value', '0')
    .attr('class', 'slider');
  const currentValue = container.append('span').text(0);

  slider.on('change', () => {
    const val = parseInt(slider.node()!.value, 10);
    currentValue.text(val);
    onChange(val);
  });
}
function showSlider(value: string) {
  const slider = d3.select('.sliderContainer');
  switch (value) {
    case 'Pruning':
    case 'PlotTrimmer':
    case 'PlotTrimmer C':
    case 'PlotTrimmer G':
      slider.attr('style', 'display:block');
      break;
    default:
      slider.attr('style', 'display: none');
  }
}
