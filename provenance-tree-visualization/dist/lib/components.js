"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSlider = exports.addAggregationButtons = exports.setTitle = void 0;
var d3 = require("d3");
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
    var container = elm.append('div').attr('class', 'container');
    var holder = provenanceTreeVisualization.container
        .append("div")
        .attr("class", "holder")
        .attr("id", "groupingContainer")
        .attr("style", "position: absolute; bottom: 25%; display:none;");
    // holder = container.append('div');
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
    var HidecameraButton = provenanceTreeVisualization.container
        .append('button')
        .attr('id', 'camera-trigger')
        .attr('class', 'mat-icon-button mat-button-base mat-primary')
        .attr('color', 'primary')
        .attr('style', 'position: absolute; z-index: 1; top: 17%;')
        .attr('ng-reflect-color', 'primary')
        .attr('title', 'Hide/Show Camera Actions')
        .on('mousedown', function () {
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
    var goToTheRootButton = provenanceTreeVisualization.container
        .append('button')
        .attr('id', 'root-trigger')
        .attr('class', 'mat-icon-button mat-button-base mat-primary')
        .attr('color', 'primary')
        .attr('title', 'Show the full provenance tree')
        .attr('style', 'position: absolute; z-index: 1; top: 2%;')
        .attr('ng-reflect-color', 'primary')
        .on('mousedown', function () {
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
    var upwardButton = provenanceTreeVisualization.container
        .append('button')
        .attr('id', 'upward-trigger')
        .attr('title', 'Move Up One Node')
        .attr('class', 'mat-icon-button mat-button-base mat-primary')
        .attr('color', 'primary')
        .attr('style', 'position: absolute; z-index: 1; top: 7%;')
        .attr('ng-reflect-color', 'primary')
        .on('mousedown', function () {
        if (provenanceTreeVisualization.traverser.graph.current.label !== 'Root') {
            provenanceTreeVisualization.traverser.toStateNode(provenanceTreeVisualization.traverser.graph.current.parent.id, 250);
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
    var downwardButton = provenanceTreeVisualization.container
        .append('button')
        .attr('id', 'downward-trigger')
        .attr('title', 'Move Down One Node')
        .attr('class', 'mat-icon-button mat-button-base mat-primary')
        .attr('color', 'primary')
        .attr('style', 'position: absolute; z-index: 1; top: 12%;')
        .attr('ng-reflect-color', 'primary')
        .on('mousedown', function () {
        if (provenanceTreeVisualization.traverser.graph.current.children[0]) {
            for (var _i = 0, _a = provenanceTreeVisualization.traverser.graph.current.children; _i < _a.length; _i++) {
                var child = _a[_i];
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
exports.addAggregationButtons = addAggregationButtons;
/**
 * @description Slider for Arguments in simple HTML
 */
function addSlider(elem, onChange) {
    var container = elem.append('div');
    container.attr('class', 'sliderContainer');
    container.attr('style', 'visibility: show');
    var slider = container
        .append('input')
        .attr('id', 'arg')
        .attr('type', 'range')
        .attr('min', 0)
        .attr('max', 10)
        .attr('value', '0')
        .attr('class', 'slider');
    var currentValue = container.append('span').text(0);
    slider.on('change', function () {
        var val = parseInt(slider.node().value, 10);
        currentValue.text(val);
        onChange(val);
    });
}
exports.addSlider = addSlider;
function showSlider(value) {
    var slider = d3.select('.sliderContainer');
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
//# sourceMappingURL=components.js.map