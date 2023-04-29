"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAggregationButtons = exports.setTitle = void 0;
function setTitle(elm, onClick) {
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
exports.setTitle = setTitle;
/**
 * @description Show the buttons of the user interface.
 */
function addAggregationButtons(elm, provenanceTreeVisualization) {
    const container = elm.append('div').attr('class', 'container');
    // const holder = provenanceTreeVisualization.container
    //   .append("div")
    //   .attr("class", "holder")
    //   .attr("id", "groupingContainer")
    //   .attr("style", "position: absolute; bottom: 25%; display:none;");
    const goToTheRootButton = provenanceTreeVisualization.container
        .append('button')
        .attr('id', 'root-trigger')
        .attr('class', 'mat-icon-button mat-button-base mat-primary')
        .attr('color', 'primary')
        .attr('title', 'Show the full provenance tree')
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
        .attr('title', 'Move Up One Node')
        .attr('class', 'mat-icon-button mat-button-base mat-primary')
        .attr('color', 'primary')
        .attr('style', 'position: absolute; z-index: 1; top: 7%;')
        .attr('ng-reflect-color', 'primary')
        .on('mousedown', () => {
        var real_traverser = provenanceTreeVisualization.real_traverser;
        var parent_id = '';
        real_traverser
            .filter((d) => {
            const ref = d.data.wrappedNodes.includes(provenanceTreeVisualization.traverser.graph.current);
            if (ref) {
                parent_id = d.parent.data.wrappedNodes[0].id;
            }
        });
        if (provenanceTreeVisualization.groupnumber == 0)
            provenanceTreeVisualization.traverser.toStateNode(parent_id, 250);
        else
            provenanceTreeVisualization.traverser.toStateNode(parent_id, 0);
        provenanceTreeVisualization.getFullsizeview();
        provenanceTreeVisualization.update();
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
        .attr('title', 'Move Down One Node')
        .attr('class', 'mat-icon-button mat-button-base mat-primary')
        .attr('color', 'primary')
        .attr('style', 'position: absolute; z-index: 1; top: 12%;')
        .attr('ng-reflect-color', 'primary')
        .on('mousedown', () => {
        var real_traverser = provenanceTreeVisualization.real_traverser;
        var child_id = '';
        real_traverser
            .filter((d) => {
            const ref = d.data.wrappedNodes.includes(provenanceTreeVisualization.traverser.graph.current);
            if (ref) {
                for (const child of d.children) {
                    if (child.data.wrappedNodes[0].metadata.mainbranch)
                        child_id = child.data.wrappedNodes[0].id;
                }
            }
        });
        if (provenanceTreeVisualization.groupnumber == 0)
            provenanceTreeVisualization.traverser.toStateNode(child_id, 250);
        else
            provenanceTreeVisualization.traverser.toStateNode(child_id, 0);
        provenanceTreeVisualization.getFullsizeview();
        provenanceTreeVisualization.update();
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
    const slider = provenanceTreeVisualization.container
        .append('mat-slider')
        .attr('id', 'group_slider')
        .attr('max', provenanceTreeVisualization.numberofnodes)
        .attr('min', 0)
        .attr('step', 1)
        .attr('thumbLabel', true)
        .attr('style', 'position: absolute; z-index: 1; top: 22%;left: 10%;')
        .attr('tickInterval', 5)
        .attr('vertical', true)
        .style('height', '300px')
        .attr('matTooltip', 'Provenance-Grouping Slider');
    slider.append('mat-slider-thumb');
    slider.append('mat-slider-track-fill');
    slider.append('mat-slider-track-background');
    const HidecameraButton = provenanceTreeVisualization.container
        .append('button')
        .attr('id', 'camera-trigger')
        .attr('class', 'mat-icon-button mat-button-base mat-primary')
        .attr('color', 'primary')
        .attr('style', 'position: absolute; z-index: 1; top: 17%;')
        .attr('ng-reflect-color', 'primary')
        .attr('title', 'Hide/Show Camera Actions')
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
}
exports.addAggregationButtons = addAggregationButtons;
// /**
//  * @description Slider for Arguments in simple HTML
//  */
// export function addSlider<T extends HTMLElement>(
//   elem: d3.Selection<T, any, any, any>,
//   onChange: (val: number) => any
// ): void {
//   const container = elem.append('div');
//   container.attr('class', 'sliderContainer');
//   container.attr('style', 'visibility: show');
//   const slider = container
//     .append('input')
//     .attr('id', 'arg')
//     .attr('type', 'range')
//     .attr('min', 0)
//     .attr('max', 10)
//     .attr('value', '0')
//     .attr('class', 'slider');
//   const currentValue = container.append('span').text(0);
//   slider.on('change', () => {
//     const val = parseInt(slider.node()!.value, 10);
//     currentValue.text(val);
//     onChange(val);
//   });
// }
// function showSlider(value: string) {
//   const slider = d3.select('.sliderContainer');
//   switch (value) {
//     case 'Pruning':
//     case 'PlotTrimmer':
//     case 'PlotTrimmer C':
//     case 'PlotTrimmer G':
//       slider.attr('style', 'display:block');
//       break;
//     default:
//       slider.attr('style', 'display: none');
//   }
// }
//# sourceMappingURL=components.js.map