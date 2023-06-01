"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLegend = void 0;
const legendData = {
    legends: [
        {
            name: 'Camera',
            color: '#8dd3c7',
            shape: 'circle',
            stroke: '#000000'
        },
        {
            name: 'Object Transformation',
            color: '#80b1d3',
            shape: 'circle',
            stroke: '#000000'
        },
        {
            name: 'Object Selection',
            color: '#fdb462',
            shape: 'circle',
            stroke: '#000000'
        },
        {
            name: 'Story Node',
            color: '#f9f9f9',
            shape: 'circle',
            stroke: '#ff0000'
        },
        {
            name: 'Measurement',
            color: '#bebada',
            shape: 'circle',
            stroke: '#000000'
        },
    ],
    commands: [
        'HOW TO PERFORM SOME INTERACTIONS:',
        '- RIGHT-CLICK+DRAGGING on imaging data = Zoom the imaging data',
        '- SHIFT+CLICK on imaging data = Magnify a view',
        '- ALT+RIGHT CLICK on measurements = Delete a measurement',
        '- RIGHT CLICK on graph nodes = Bookmark a node and to add one slide representing the current state to the storyline',
        '- SCROLLING on graph = Zoom the graph',
        '- SHIFT+SCROLLING on storyline = Scale the graph',
        '- SHIFT+DRAGGING on text box = Move the text box',
        '- SCROLLING on storyline = Slide the graph'
    ],
    tasks: [
        'TASKS TO BE PERFORMED:',
        '- TASK 1 = Explore the imaging data to find all nodules/anomalies in it.',
        '- TASK 2 = Measure the diameter of all the nodules/anomalies found in the imaging data.',
        '- TASK 3 = Create annotations and/or make additional measurements on the nodules/anomalies found in the imaging data.',
        '- TASK 4 = Create a text report and a visual data story to communicate your findings to collaborators.'
    ]
};
function addLegend(elm) {
    const legendContainer = elm
        .append('div')
        .attr('class', 'legend')
        .attr('id', 'legendContainer')
        .style('position', 'absolute')
        .style('z-index', '1')
        .style('bottom', '1%')
        .style('right', '1%')
        .style('display', 'none');
    const containerWidth = window.innerWidth * 0.2;
    const legendWidth = containerWidth * 0.8;
    const legendBox = legendContainer
        .append('div')
        .attr('class', 'legend-box')
        .style('background-color', '#f9f9f9')
        .style('border', '1px solid #ddd')
        .style('padding', '10px')
        .style('border-radius', '4px')
        .style('width', `${legendWidth}px`)
        .style('min-height', '60px');
    const legendList = legendBox.append('ul');
    const listItem = legendList
        .selectAll('li')
        .data(legendData.legends)
        .enter()
        .append('li')
        .style('list-style-type', 'none')
        .style('margin-bottom', '5px')
        .style('display', 'flex')
        .style('align-items', 'center');
    const legendSvg = listItem
        .append('svg')
        .attr('width', 12)
        .attr('height', 12);
    legendSvg.append('circle')
        .attr('cx', 6)
        .attr('cy', 6)
        .attr('r', 6)
        .style('fill', (d) => d.color)
        .style('stroke', (d) => d.stroke || '#000000')
        .style('stroke-width', '1px');
    listItem
        .append('span')
        .style('margin-left', '5px')
        .text((d) => d.name);
}
exports.addLegend = addLegend;
// export function addCommandsList(elm: any) {
//   const commandsContainer = elm.append('div').attr('class', 'legend')
//     .attr('id', 'commandsContainer').attr('style', 'margin-bottom: 15%; display: none;');
//   const commandsList = commandsContainer.append('ul');
//   const commandsListItem = commandsList
//     .selectAll('li')
//     .data(legendData.commands)
//     .enter()
//     .append('li');
//   commandsListItem
//     .append('div')
//   commandsListItem.append('span').text((d: any) => {
//     return d;
//   });
// }
// export function addTasksList(elm: any) {
// const tasksContainer = elm.append('div').attr('class', 'legend')
//       .attr('id', 'tasksContainer').attr('style', 'margin-bottom: 15%; display: none;');
//     const tasksList = tasksContainer.append('ul');
//     const tasksListItem = tasksList
//       .selectAll('li')
//       .data(legendData.tasks)
//       .enter()
//       .append('li');
//       tasksListItem
//       .append('div')
//     tasksListItem.append('span').text((d: any) => {
//       return d;
//     });
//   }
//# sourceMappingURL=legend.js.map