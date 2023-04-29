"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLegend = void 0;
const legendData = {
    legends: [
        {
            name: 'bookmarked',
            color: '#fff',
            shape: 'circle',
            opacity: 0.3
        },
        {
            name: 'exploration',
            color: '#8dd3c7',
            shape: 'circle',
            opacity: 0.3
        },
        {
            name: 'selection',
            color: '#80b1d3',
            shape: 'circle',
            opacity: 0.3
        },
        {
            name: 'configuration',
            color: '#fdb462',
            shape: 'circle',
            opacity: 0.3
        },
        {
            name: 'derivation',
            color: '#fb8072',
            shape: 'circle',
            opacity: 0.3
        },
        {
            name: 'provenance',
            color: '#bebada',
            shape: 'circle',
            opacity: 0.3
        },
        {
            name: 'annotation',
            color: '#EEE932',
            shape: 'circle',
            opacity: 0.3
        }
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
    const legendContainer = elm.append('div').attr('class', 'legend').attr('id', 'legendContainer').attr('style', 'margin-bottom: 15%; display: none;');
    const legendList = legendContainer.append('ul');
    const listItem = legendList
        .selectAll('li')
        .data(legendData.legends)
        .enter()
        .append('li');
    listItem
        .append('div')
        .attr('class', (d) => {
        if (d.name === 'bookmarked') {
            return 'bookmarked';
        }
        else if (d.name === 'story') {
            return 'story';
        }
        else if (d.name === 'loaded') {
            return 'loaded';
        }
        else {
            return 'circle';
        }
    })
        .attr('style', (d) => `background-color:${d.color}`);
    listItem.append('span').text((d) => {
        return d.name;
    });
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