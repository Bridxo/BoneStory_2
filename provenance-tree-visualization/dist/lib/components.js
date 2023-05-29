"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAggregationButtons = exports.setTitle = void 0;
const d3 = require("d3");
const legend_1 = require("./legend");
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
    let processing = false; // Lock
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
        processing = true;
        real_traverser
            .filter((d) => {
            const ref = d.data.wrappedNodes.includes(provenanceTreeVisualization.traverser.graph.current);
            if (ref) {
                parent_id = d.parent.data.wrappedNodes[0].id;
            }
        });
        if (provenanceTreeVisualization.groupnumber == 0) {
            setTimeout(() => {
                provenanceTreeVisualization.traverser.toStateNode(parent_id, 250);
                processing = false;
            }, 300);
        }
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
        processing = true;
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
        if (provenanceTreeVisualization.groupnumber == 0) {
            provenanceTreeVisualization.traverser.toStateNode(child_id, 250);
            setTimeout(() => {
                processing = false;
            }, 300);
        }
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
        .attr('style', 'position: absolute; z-index: 1; top: 27%;left: 5%;')
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
    const DeleteNodeButton = provenanceTreeVisualization.container
        .append('button')
        .attr('id', 'delete-trigger')
        .attr('class', 'mat-icon-button mat-button-base mat-primary')
        .attr('color', 'primary')
        .attr('style', 'position: absolute; z-index: 1; top: 22%;')
        .attr('ng-reflect-color', 'primary')
        .attr('title', 'Delete Node(s)')
        .attr('disabled', provenanceTreeVisualization.groupnumber >= 1 ? 'disabled' : null) // Add the disabled attribute conditionally
        .on('mousedown', () => {
        var real_traverser = provenanceTreeVisualization.real_traverser;
        real_traverser
            .filter((d) => {
            const ref = d.data.wrappedNodes.includes(provenanceTreeVisualization.traverser.graph.current);
            if (ref) {
                if (d.data.wrappedNodes.length == 1)
                    provenanceTreeVisualization.deleteNode();
            }
        });
    });
    const buttonWrapper = DeleteNodeButton
        .append('span')
        .attr('class', 'mat-button-wrapper');
    buttonWrapper
        .append('mat-icon')
        .attr('class', 'mat-icon notranslate material-icons mat-icon-no-color')
        .attr('role', 'img')
        .attr('aria-hidden', 'true')
        .text('delete_forever');
    buttonWrapper
        .append('div')
        .attr('class', 'mat-button-ripple mat-ripple mat-button-ripple-round')
        .attr('ng-reflect-centered', 'true')
        .attr('ng-reflect-disabled', 'false')
        .attr('ng-reflect-trigger', '[object HTMLButtonElement]');
    buttonWrapper
        .append('div')
        .attr('class', 'mat-button-focus-overlay');
    // Add CSS class to the button and icon when disabled
    DeleteNodeButton.classed('disabled', provenanceTreeVisualization.groupnumber >= 1);
    DeleteNodeButton.select('.mat-icon').classed('disabled', provenanceTreeVisualization.groupnumber >= 1);
    // Add a window resize event listener
    window.addEventListener('resize', () => {
        // Get the container element where the legend will be appended
        const container = d3.select('#legendContainer');
        // Remove the existing legend if it exists
        container.remove();
        // Call the addLegend function to recreate the legend with updated dimensions
        (0, legend_1.addLegend)(provenanceTreeVisualization.container);
    });
    (0, legend_1.addLegend)(provenanceTreeVisualization.container);
    const HelpButton = provenanceTreeVisualization.container
        .append('button')
        .attr('id', 'help_trigger')
        .attr('class', 'mat-icon-button mat-button-base mat-primary')
        .attr('color', 'primary')
        .attr('style', 'position: absolute; z-index: 10; Bottom: 0.7%; Right: 1.0%;')
        .attr('ng-reflect-color', 'primary')
        .attr('title', 'Graph color legend')
        .on('mousedown', () => {
        const legendContainer = d3.select("#legendContainer");
        const isVisible = legendContainer.style("display") === "none";
        legendContainer.style("display", isVisible ? "Block" : "none");
    });
    HelpButton
        .append('span')
        .attr('class', 'mat-button-wrapper')
        .append('mat-icon')
        .attr('class', 'mat-icon notranslate material-icons mat-icon-no-color')
        .attr('role', 'img')
        .attr('aria-hidden', 'true')
        .text('help_outline');
    HelpButton
        .append('div')
        .attr('class', 'mat-button-ripple mat-ripple mat-button-ripple-round')
        .attr('ng-reflect-centered', 'true')
        .attr('ng-reflect-disabled', 'false')
        .attr('ng-reflect-trigger', '[object HTMLButtonElement]');
    HelpButton
        .append('div')
        .attr('class', 'mat-button-focus-overlay');
}
exports.addAggregationButtons = addAggregationButtons;
//# sourceMappingURL=components.js.map