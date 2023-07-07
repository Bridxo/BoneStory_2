import { select, selectAll, hierarchy, namespaces, pie, arc, scaleOrdinal, schemeAccent, zoom, event as event$1, zoomIdentity } from 'd3';
import { isStateNode } from '@visualstorytelling/provenance-core';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function GratzlLayout(_root, _current) {
    const root = _root;
    const current = _current;
    const widths = [];
    // const maxY = Math.max.apply(null, root.leaves().map((leaf) => leaf.depth));
    function setTreeX(node, val) {
        node.x = val;
        node.y = node.depth;
        widths[node.depth] = val;
        if (node.children) {
            node
                .leaves()
                .forEach(leaf => {
                if (typeof leaf.x === "undefined") {
                    const width = Math.max.apply(null, widths.slice(node.depth, leaf.depth + 1));
                    setTreeX(leaf, val > width ? val : width + 1);
                }
            });
        }
        if (node.parent && typeof node.parent.x === "undefined") {
            setTreeX(node.parent, val);
        }
    }
    root.leaves().forEach(leaf => {
        leaf.ancestors().forEach(leafAncestor => {
            if (!leafAncestor.maxDescendantDepth ||
                leaf.depth > leafAncestor.maxDescendantDepth) {
                leafAncestor.maxDescendantDepth = leaf.depth;
            }
        });
    });
    /* start at the deepest (active) leaf of activeNode. */
    let deepestLeaf = current;
    deepestLeaf.leaves().forEach(leaf => {
        if (leaf.data.wrappedNodes[0].metadata.mainbranch) {
            deepestLeaf = leaf;
        }
        else if (leaf.depth > deepestLeaf.depth && !deepestLeaf.data.wrappedNodes[0].metadata.mainbranch) {
            deepestLeaf = leaf;
        }
    });
    setTreeX(deepestLeaf, 0);
    return root;
}

function provGraphControls(provenanceTreeVisualization) {
    var graph = provenanceTreeVisualization.traverser.graph;
    var traverser = provenanceTreeVisualization.traverser;
    window.onkeydown = keyPress;
    const handleControlZ = debounce(() => __awaiter(this, void 0, void 0, function* () {
        var real_traverser = provenanceTreeVisualization.real_traverser;
        var parent_id = '';
        yield real_traverser
            .filter((d) => {
            const ref = d.data.wrappedNodes.includes(graph.current);
            if (ref) {
                const index = d.data.wrappedNodes.indexOf(graph.current);
                if (index != d.data.wrappedNodes.length - 1)
                    parent_id = d.data.wrappedNodes[index + 1].id;
                else
                    parent_id = d.parent.data.wrappedNodes[0].id;
            }
        });
        yield traverser.toStateNode(parent_id, 250);
        yield provenanceTreeVisualization.getFullsizeview();
        yield provenanceTreeVisualization.update();
    }), 260);
    const handleControlY = debounce(() => __awaiter(this, void 0, void 0, function* () {
        var real_traverser = provenanceTreeVisualization.real_traverser;
        var child_id = '';
        yield real_traverser
            .filter((d) => {
            const ref = d.data.wrappedNodes.includes(graph.current);
            if (ref) {
                const index = d.data.wrappedNodes.indexOf(graph.current);
                if (index != 0)
                    child_id = d.data.wrappedNodes[index - 1].id;
                else {
                    if (d.children) {
                        d.children.forEach((child) => {
                            if (child.data.wrappedNodes[0].metadata.mainbranch) {
                                const ind = child.data.wrappedNodes.length - 1;
                                child_id = child.data.wrappedNodes[ind].id;
                            }
                            else {
                                return;
                            }
                        });
                    }
                    else
                        return;
                }
            }
        });
        yield traverser.toStateNode(child_id, 250);
        yield provenanceTreeVisualization.getFullsizeview();
        yield provenanceTreeVisualization.update();
    }), 260);
    function debounce(func, delay) {
        let timer;
        return function () {
            clearTimeout(timer);
            timer = setTimeout(func, delay);
        };
    }
    function keyPress(e) {
        return __awaiter(this, void 0, void 0, function* () {
            var evtobj = window.event ? event : e;
            // ctrl + Z  / undo
            if (evtobj.ctrlKey && evtobj.key.toLowerCase() === 'z' && graph.current.parent) {
                handleControlZ();
            }
            // ctrl + X  / go to the root
            else if (evtobj.ctrlKey && evtobj.key.toLowerCase() === 'x') {
                yield traverser.toStateNode(graph.root.id, 0);
                setTimeout(() => {
                }, 250);
            }
            // ctrl + y  / redo
            else if (evtobj.ctrlKey && evtobj.key.toLowerCase() === 'y' && graph.current.children[0]) {
                handleControlY();
                setTimeout(() => {
                }, 250);
            }
            // ctrl + Q  / add the current node to the story
            // else if (evtobj.keyCode === 81 && evtobj.altKey) {
            //     graph.current.metadata.story = true;
            //     (window as any).slideDeck.onAdd(graph.current);
            // }
            // // ctrl + 1  / all neighbour nodes are added to the slide deck (by creation order)
            // else if (evtobj.keyCode === 49 && evtobj.altKey) {
            //     let nodes = graph.getNodes();
            //     var arrayNodes = [];
            //     for (const nodeId of Object.keys(nodes)) {
            //         let node = nodes[nodeId];
            //         arrayNodes.push(node);
            //     }
            //     for (const node of arrayNodes) {
            //         if (((node.metadata.creationOrder > graph.current.metadata.creationOrder - 2) == true) &&     // the range can be adjusted
            //             ((node.metadata.creationOrder < graph.current.metadata.creationOrder + 2) == true)) {
            //             node.metadata.story = true;
            //             (window as any).slideDeck.onAdd(node);
            //         }
            //     }
            // }
            // // ctrl + W  / derivation and annotation (by creation order)
            // else if (evtobj.keyCode === 87 && evtobj.altKey) {
            //     let nodes = graph.getNodes();
            //     var arrayNodes: any[] = [];
            //     for (const nodeId of Object.keys(nodes)) {
            //         let node = nodes[nodeId];
            //         arrayNodes.push(node);
            //     }
            //     arrayNodes.shift();
            //     for (const node of (arrayNodes as any).filter((node: any) => node.action.metadata.userIntent == 'derivation' || 'annotation')) {
            //         node.metadata.story = true;
            //         (window as any).slideDeck.onAdd(node);
            //     }
            // }
        });
    }
    // ngAfterViewChecked() {
    //   this._viz.setZoomExtent();
    // }
    (function () {
        var blockContextMenu;
        blockContextMenu = function (evt) {
            evt.preventDefault();
        };
        window.addEventListener('contextmenu', blockContextMenu);
    })();
}

const cam_test = (label) => {
    const searchpattern = /Camera|View/;
    if (searchpattern.test(label))
        return true;
    else
        return false;
};

/**
 * @description Child removed, child's children go to grandChild. GrandChild becomes node's child.
 * @param node {IGroupedTreeNode<ProvenanceNode>} - Parent node
 * @param child {IGroupedTreeNode<ProvenanceNode>} - Child node
 * @param grandChild {IGroupedTreeNode<ProvenanceNode>} - Child of the child node
 */
function transferChildren(node, child, grandChild) {
    //data part
    node.data.children.splice(node.data.children.indexOf(child.data), 1);
    grandChild.data.wrappedNodes.push(...child.data.wrappedNodes);
    child.data.children.splice(child.data.children.indexOf(grandChild.data), 1);
    node.data.children.push(grandChild.data);
}
function transferChildren_2(Startparentnode, Startnode, Endnode) {
    //data part
    let tempNode = Endnode.parent;
    let superParent = Startparentnode.parent;
    do {
        tempNode.data.children.splice(tempNode.data.children.indexOf(Endnode.data), 1);
        Endnode.data.wrappedNodes.push(...tempNode.data.wrappedNodes);
        tempNode = tempNode.parent;
    } while (tempNode.data != Startparentnode.data);
    Startparentnode.data.children.splice(Startparentnode.data.children.indexOf(Startnode.data), 1);
    Endnode.data.wrappedNodes.push(...Startparentnode.data.wrappedNodes);
    superParent.data.children.splice(superParent.data.children.indexOf(Startparentnode.data), 1);
    superParent.data.children.push(Endnode.data);
}
// /**
//  * @description Constrain neighbours
//  * @param node {IGroupedTreeNode<ProvenanceNode>} - Node
//  * @param selectedNode {IGroupedTreeNode<ProvenanceNode>} - Selected node
//  */
// export const neighbours = (node: IGroupedTreeNode<ProvenanceNode>, selectedNode: IGroupedTreeNode<ProvenanceNode>) => {
//   let neighbour = false;
//   if (node === selectedNode || selectedNode.children.includes(node) || node.children.includes(selectedNode)) {
//     neighbour = true;
//   }
//   node.neighbour = neighbour;
//   for (const child of node.children) {
//     neighbours(child, selectedNode);
//   }
// };
/////////////////// DIFFERENT DATA AGGREGATION ALGORITHM ///////////
/**
 * @description No algorithm is applied. Created for a better understanding.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Root of the graph
 * @param  tests  {Array<NodeGroupTest<ProvenanceNode>>} - Test to be checked during execution.
 * @param  currentNode  {IGroupedTreeNode<ProvenanceNode>} -
 */
const doNothing = (currentNode, node, tests) => { };

/**
 * @description Getter for the user intent of the node selected.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Node selected.
 * @returns Returns the Intent of the user for the node selected.
 */
function getNodeIntent(node) {
    if (isStateNode(node) &&
        node.action &&
        node.action.metadata &&
        node.action.metadata.userIntent) {
        return node.action.metadata.userIntent;
    }
    return "none";
}
function getNodeRenderer(node) {
    if (isStateNode(node) &&
        node.action &&
        node.action.metadata &&
        node.action.metadata.renderer) {
        return node.action.metadata.renderer;
    }
    return "none";
}
/**
 * @description Test whether a node is a key node or not.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Node selected.
 */
function isKeyNode(node) {
    if (!isStateNode(node) ||
        node.children.length === 0 ||
        node.children.length > 1 ||
        node.parent.children.length > 1 ||
        (node.children.length === 1 &&
            getNodeIntent(node) !== getNodeIntent(node.children[0]))) {
        return true;
    }
    return false;
}
/**
 * @description Returns a label for grouped nodes.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Node selected.
 */
const groupNodeLabel = (node) => {
    if (node.wrappedNodes.length === 1) {
        if (node.wrappedNodes[0].label === "SelectObject")
            return "SelectObject(" + node.wrappedNodes[0].metadata.O_group + ")";
        else
            return node.wrappedNodes[0].label;
    }
    else {
        const label_arr = node.wrappedNodes.map(n => n.label);
        const unique_label_arr = new Set(label_arr);
        if (unique_label_arr.size === 1) //all labels are the same
            if (node.wrappedNodes.length >= 2)
                return node.wrappedNodes[0].label + "(" + node.wrappedNodes[0].metadata.O_group + ")";
            else
                return node.wrappedNodes[0].label;
        else { // labels are different
            let label = "";
            const searchpattern = /Camera|View/;
            const searchpattern_2 = /Object/;
            const searchpattern_3 = /Annotation/;
            const searchpattern_4 = /Measure/;
            for (let u_label of unique_label_arr.values()) {
                if (searchpattern.test(u_label) && label.search('Camera') === -1)
                    label = label + "Camera,";
                else if (searchpattern_2.test(u_label) && label.search('Object') === -1)
                    label = label + "Object,";
                else if (searchpattern_3.test(u_label) && label.search('Annotation') === -1)
                    label = label + "Annotation,";
                else if (searchpattern_4.test(u_label) && label.search('Measure') === -1)
                    label = label + "Measure,";
            }
            label = label.slice(0, -1);
            if (label.includes('Camera') && label.includes('Object') && node.wrappedNodes.length >= 2)
                label = node.wrappedNodes[0].metadata.O_group;
            else if (label == 'Object')
                label = label + "(" + node.wrappedNodes[0].metadata.O_group + ")";
            else if (label == 'SelectObject')
                label = label.slice(0, -6) + "(" + node.wrappedNodes[0].metadata.O_group + ")";
            else if (label == 'Camera')
                label = label + "(" + node.wrappedNodes[0].metadata.O_group + ")";
            else if (node.wrappedNodes.length >= 2) {
                label = label + "(" + node.wrappedNodes[0].metadata.O_group + ")";
            }
            return label;
        }
    }
};
/**
 * @description Wraps a node and its children recursively
 * in an extra IGroupedTreeNode; which can be manipulated for grouping etc,
 * without modifying the (provenance) node.
 * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Node selected.
 */
const wrapNode = (node) => {
    const searchpattern = /Camera|View/;
    if (searchpattern.test(node.label))
        return {
            wrappedNodes: [node],
            children: node.children.map(wrapNode),
            plotTrimmerValue: -1,
            neighbour: false,
            bookmarked: false,
            camera: true
        };
    else
        return {
            wrappedNodes: [node],
            children: node.children.map(wrapNode),
            plotTrimmerValue: -1,
            neighbour: false,
            bookmarked: false,
            camera: false
        };
};
/**
 * @description Test placeholder.
 * @param a {IGroupedTreeNode<ProvenanceNode>} - Node #1 to be tested.
 * @param b {IGroupedTreeNode<ProvenanceNode>} - Node #2 to be tested.
 */
const testNothing = (a, b) => false;
/**
 * @description Object of the interface DataAggregation<ProvenanceNode>.
 */
const rawData = {
    name: "Raw data",
    tests: [testNothing],
    algorithm: doNothing,
    arg: false,
    description: "No algorithm is applied. The full provenance data is shown."
};

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

/**
 * @description Show the buttons of the user interface.
 */
function addAggregationButtons(elm, provenanceTreeVisualization) {
    const container = elm.append('div').attr('class', 'container');
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
            if (ref && d.data.label != 'Root') {
                parent_id = d.parent.data.wrappedNodes[0].id;
            }
        });
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
        if (provenanceTreeVisualization.camera_show)
            HidecameraButton.style('color', '#3f51b5');
        else
            HidecameraButton.style('color', 'gray');
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
        .on('mousedown', () => {
        const event = new CustomEvent('deleteButtonClicked', { detail: { id: 'delete-trigger' } });
        window.dispatchEvent(event);
        // Dispatch a custom event that the button was clicked
    });
    DeleteNodeButton
        .append('span')
        .attr('class', 'mat-button-wrapper')
        .append('mat-icon')
        .attr('class', 'mat-icon notranslate material-icons mat-icon-no-color')
        .attr('role', 'img')
        .attr('aria-hidden', 'true')
        .text('delete_forever');
    DeleteNodeButton
        .append('div')
        .attr('class', 'mat-button-ripple mat-ripple mat-button-ripple-round')
        .attr('ng-reflect-centered', 'true')
        .attr('ng-reflect-disabled', 'false')
        .attr('ng-reflect-trigger', '[object HTMLButtonElement]');
    DeleteNodeButton
        .append('div')
        .attr('class', 'mat-button-focus-overlay');
    // Add a window resize event listener
    window.addEventListener('resize', () => {
        // Get the container element where the legend will be appended
        const container = select('#legendContainer');
        // Remove the existing legend if it exists
        container.remove();
        // Call the addLegend function to recreate the legend with updated dimensions
        addLegend(provenanceTreeVisualization.container);
    });
    addLegend(provenanceTreeVisualization.container);
    const HelpButton = provenanceTreeVisualization.container
        .append('button')
        .attr('id', 'help_trigger')
        .attr('class', 'mat-icon-button mat-button-base mat-primary')
        .attr('color', 'primary')
        .attr('style', 'position: absolute; z-index: 10; Bottom: 0.7%; Right: 1.0%;')
        .attr('ng-reflect-color', 'primary')
        .attr('title', 'Graph color legend')
        .on('mousedown', () => {
        const legendContainer = select("#legendContainer");
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

function depthSort(a, b) {
    if (a.maxDescendantDepth > b.maxDescendantDepth) {
        return -1;
    }
    else if (a.maxDescendantDepth < b.maxDescendantDepth) {
        return 1;
    }
    return 0;
}
function GratzlLayoutOld() {
    let dx = 5;
    let dy = 50;
    const widths = [];
    function setTreeX(node, val) {
        node.xOffset = val;
        widths[node.depth] = val;
        if (node.children) {
            node
                .leaves()
                .sort(depthSort)
                .forEach(leaf => {
                if (typeof leaf.xOffset === "undefined") {
                    const width = Math.max.apply(null, widths.slice(node.depth, leaf.depth + 1));
                    setTreeX(leaf, val > width ? val : width + 1);
                }
            });
        }
        if (node.parent && typeof node.parent.xOffset === "undefined") {
            setTreeX(node.parent, val);
        }
    }
    const tree = Object.assign((_root, _activeNode) => {
        /*
         * set maxDescendantDepth on each node,
         * which is the depth of its deepest child
         *
         * */
        const root = _root;
        const activeNode = _activeNode;
        root.leaves().forEach(leaf => {
            leaf.ancestors().forEach(leafAncestor => {
                if (!leafAncestor.maxDescendantDepth ||
                    leaf.depth > leafAncestor.maxDescendantDepth) {
                    leafAncestor.maxDescendantDepth = leaf.depth;
                }
            });
        });
        /* rendering should start at the deepest leaf of activeNode. */
        let deepestLeaf = activeNode;
        activeNode.leaves().forEach(leaf => {
            if (deepestLeaf.depth < leaf.depth) {
                deepestLeaf = leaf;
            }
        });
        setTreeX(deepestLeaf, 0);
        const maxX = Math.max.apply(null, widths);
        const maxY = Math.max.apply(null, root.leaves().map(leaf => leaf.depth));
        root.each(node => {
            sizeNode(node, maxX, maxY);
        });
        return root;
    }, {
        size: ((x) => {
            return x ? ((dx = +x[0]), (dy = +x[1]), tree) : [dx, dy];
        })
    });
    function sizeNode(node, maxX, maxY) {
        node.x = maxX === 0 ? dx : dx - (dx / maxX) * node.xOffset;
        node.y = maxY === 0 ? dy : (dy / maxY) * node.depth;
    }
    return tree;
}

function caterpillar(updateNodes, treeNodes, updatedLinks, provenanceTreeVisualization) {
    if (provenanceTreeVisualization.caterpillarActivated) {
        const mainNodes = updateNodes.filter((d) => d.x === 0);
        const mainNodesData = mainNodes
            .data()
            .map((d) => d.data.wrappedNodes[0].id);
        // console.log(mainNodesData);
        const edgeNodes = mainNodes.filter((d) => {
            if (d.children) {
                return d.children.length > 1;
            }
            return false;
        });
        edgeNodes.select("circle").attr("class", "intent_wrapped");
        edgeNodes.select("rect").attr("class", "intent_wrapped");
        // Hide the rest of the circles and links
        updateNodes.filter((d) => d.x !== 0).attr("class", "node hiddenClass");
        updatedLinks
            .filter((d) => d.target.x !== 0)
            .attr("class", "node hiddenClass");
        // Set the label which indicate the number of nodes wrapped
        updateNodes
            .select("text.circle-text")
            .filter((d) => d.x !== 0)
            .attr("visibility", "visible");
        edgeNodes
            .select(".normal>text.circle-text")
            .attr("visibility", "visible")
            .text((d) => {
            const copyNode = d.copy();
            copyNode.children = copyNode.children.filter((e, i, arr) => !mainNodesData.includes(e.data.wrappedNodes[0].id));
            return copyNode.descendants().length;
        })
            .attr("x", (d) => {
            const copyNode = d.copy();
            copyNode.children = copyNode.children.filter((e, i, arr) => !mainNodesData.includes(e.data.wrappedNodes[0].id));
            if (copyNode.descendants().length < 10) {
                return -1.5;
            }
            else {
                return -3;
            }
        });
        // Set the radius of the circle
        edgeNodes.select("circle").attr("r", (d) => {
            return Math.min(4 + 0.15 * d.descendants().length, 6);
        });
        // Set the click function
        edgeNodes.on("click", (d) => {
            const actualCatGraph = selectAll(".classCat");
            // When click again -> auxiliar tree disappearss.
            if (actualCatGraph
                .data()
                .map((k) => k.data.wrappedNodes[0].id)
                .includes(d.data.wrappedNodes[0].id)) {
                actualCatGraph
                    .data([])
                    .exit()
                    .remove();
                selectAll("path.linkCat")
                    .data([])
                    .exit()
                    .remove();
                // console.log(
                //   actualCatGraph.data().map((k: any) => k.data.wrappedNodes[0].id)
                // );
                // console.log(d.data.wrappedNodes[0].id);
            }
            else {
                // else -> deploy the new tree.
                const treeCopy = d.copy();
                treeCopy.children = treeCopy.children.filter((e, i, arr) => !mainNodesData.includes(e.data.wrappedNodes[0].id));
                const treeLayoutCat = GratzlLayoutOld().size([35, 120]);
                const treeCat = treeLayoutCat(treeCopy, treeCopy);
                const excatNodes = provenanceTreeVisualization.g
                    .selectAll("g.classCat")
                    .data(treeCat.descendants(), (datum) => datum.data.wrappedNodes.map((n) => n.id).join());
                excatNodes.exit().remove();
                const catNodes = excatNodes
                    .enter()
                    .append("g")
                    .attr("class", "classCat node branch-active ")
                    .data(treeNodes)
                    .attr("transform", (datum) => datum.data.wrappedNodes[0].metadata.isSlideAdded
                    ? `translate(${d.x - 3}, ${d.y})`
                    : `translate(${d.x}, ${d.y})`);
                // .append('g')
                // .attr('class', 'classCat node branch-active ')
                // .attr('transform', (k: any) => `translate(${k.x}, ${k.y})`);
                catNodes.append("circle").attr("r", 3);
                // Fix the radius of the circles according to #nodes wrapped
                catNodes.select("circle").attr("r", (datum) => {
                    let radius = 2;
                    if (datum.data.neighbour === true) {
                        radius = 3;
                    }
                    if (datum.data.wrappedNodes.length !== 1) {
                        radius = Math.min(4 + 0.15 * datum.data.wrappedNodes.length, 6);
                    }
                    return radius;
                });
                // Assign classes to the circles
                catNodes.select("circle").attr("class", (datum) => {
                    let classString = "";
                    console.log(d.data.wrappedNodes[0].metadata);
                    if (d.data.wrappedNodes[0].metadata.bookmarked === true) {
                        classString += ' bookmarked';
                    }
                    if (isKeyNode(datum.data.wrappedNodes[0])) {
                        classString += " keynode";
                    }
                    classString += " intent_" + getNodeIntent(d.data.wrappedNodes[0]);
                    return classString;
                });
                catNodes.on("click", datum => provenanceTreeVisualization.traverser.toStateNode(datum.data.wrappedNodes[0].id, 250));
                // Set the #nodes-wrapped label
                catNodes
                    .append("text")
                    .attr("class", "circle-text")
                    .attr("visibility", (datum) => {
                    if (datum.data.wrappedNodes.length === 1) {
                        return "hidden";
                    }
                    else {
                        return "visible";
                    }
                })
                    .attr("x", (datum) => {
                    if (datum.data.wrappedNodes.length >= 10) {
                        return -3;
                    }
                    return -1.5;
                })
                    .attr("y", 2)
                    .text((datum) => datum.data.wrappedNodes.length.toString());
                // Set the links between circles
                const oldLinksCat = provenanceTreeVisualization.g
                    .selectAll("path.linkCat")
                    .data(treeCat.links(), (datum) => datum.target.data.wrappedNodes.map((n) => n.id).join());
                oldLinksCat.exit().remove();
                const newLinksCat = oldLinksCat
                    .enter()
                    .insert("path", "g")
                    .attr("d", provenanceTreeVisualization.linkPath);
                oldLinksCat
                    .merge(newLinksCat)
                    .attr("class", "link linkCat")
                    .filter((datum) => datum.target.x === 0)
                    .attr("class", "link active linkCat");
            } // end else actualgraph
        }); // end on click
    } // if of caterpillar procedure
}

var xScale = -20;
var yScale = 20;
var treeWidth = 0;
var maxtreeWidth = 10;
const fontSize = 8;
/**
 * @description Class used to create and manage a provenance tree visualization.
 * @param traverser {ProvenanceGraphTraverser} - To manage the data structure of the graph.
 * @param svg {D3SVGSelection} - To manage the graphics of the tree.
 * @param _dataAggregation {aggregator<ProvenanceNode>} - Data aggregation in use.
 * @param caterpillarActivated {boolean} - True if this feature is enable.
 */
class ProvenanceTreeVisualization {
    constructor(traverser, elm) {
        this.camera_show = true;
        this.numberofnodes = 1;
        this.numberofnodeswocam = 0;
        this.numberofnodeswcam = 0;
        this.numberOfUniqueValues = 1;
        this.groupnumber = 0;
        this.aggregation = {
            aggregator: rawData,
            arg: 1
        };
        this.caterpillarActivated = false;
        this.alt = true;
        this.currentHierarchyNodelength = 0;
        this.currentHierarchyMaxlength = 0;
        this.TreeLength = 0;
        this.TreeWidth = 0.1;
        this.sizeX = window.innerWidth;
        this.sizeY = window.innerHeight;
        this.mergingEnabled = false;
        this.transferringEnabled = false;
        this.copyingEnabled = false;
        /**
         * @description Update the tree layout.
         */
        this.update = () => {
            console.log('update');
            this.traverser.graph.root.children.forEach((child) => {
                child.metadata.H_value = 1000000;
            });
            let wrappedRoot = wrapNode(this.traverser.graph.root);
            let clonedWrappedRoot = wrapNode(this.traverser.graph.root);
            let camhideNodes = this.removeNodesAndLinkChildren(clonedWrappedRoot, node => node.camera === true);
            let hierarchyRoot;
            // aggregateNodes(this.aggregation, wrappedRoot, this.traverser.graph.current);
            if (this.camera_show == true) {
                // hierarchyRoot = d3.hierarchy(wrappedRoot); // Updated the treeRoot
                this.numberofnodes = this.numberofnodeswcam;
                hierarchyRoot = this.Grouping_hierarchy(wrappedRoot);
            }
            else {
                hierarchyRoot = hierarchy(camhideNodes);
                if (cam_test(this.traverser.graph.current.label)) {
                    this.currentHierarchyNodelength = hierarchyRoot.path(this.keynode).length;
                    this.scaleToFit();
                }
                this.numberofnodes = this.numberofnodeswocam;
                hierarchyRoot = this.Grouping_hierarchy(camhideNodes);
            }
            let currentHierarchyNode = undefined;
            hierarchyRoot.each(node => {
                if (node.data.wrappedNodes.includes(this.traverser.graph.current)) {
                    currentHierarchyNode = node;
                }
            });
            if (currentHierarchyNode === undefined) {
                this.traverser.toStateNode(hierarchyRoot.leaves()[0].data.wrappedNodes[0].id);
                this.traverser.toStateNode(this.traverser.graph.root.id);
                return;
            }
            this.currentHierarchyNodelength = hierarchyRoot.path(currentHierarchyNode).length;
            const tree = GratzlLayout(hierarchyRoot, currentHierarchyNode);
            this.hierarchyRoot = tree;
            const treeNodes = tree.descendants().filter((d) => d.data.wrappedNodes[0].metadata.option !== 'merged');
            const treemaxwidth = tree.descendants().map(function (item) { return item.x; }).reduce(function (prev, current) { return (prev > current) ? prev : current; });
            const treemaxlength = tree.descendants().map(function (item) { return item.y; }).reduce(function (prev, current) { return (prev > current) ? prev : current; });
            this.currentHierarchyMaxlength = treemaxlength;
            const oldNodes = this.g.selectAll('g').data(treeNodes, (d) => {
                const data = d.data.wrappedNodes.map((n) => n.id).join();
                return data;
            });
            // console.log(treemaxwidth);
            this.TreeWidth = Math.max(this.TreeWidth, treemaxwidth);
            this.TreeLength = Math.max(this.TreeLength, treemaxlength);
            oldNodes.exit().remove();
            // group wrapping a node
            const newNodes = oldNodes
                .enter()
                .append('g')
                .attr('class', 'node')
                .attr('transform', (d) => `translate(${d.x * xScale}, ${d.y * yScale})`);
            // node label
            let hoverTimeout;
            const updateNodes = newNodes.merge(oldNodes);
            updateNodes.selectAll('g.normal').remove();
            updateNodes.selectAll('g.bookmarked').remove();
            updateNodes.selectAll('.circle-text').remove();
            updateNodes.selectAll('.circle-label').remove();
            updateNodes.selectAll('.circle-img').remove();
            const getNodeSize = (node) => {
                let counter = 0;
                const countWrappedNodesRecursively = (currentNode) => {
                    counter += currentNode.length;
                    currentNode.forEach((nodes) => {
                        if (nodes.wrappedNodes) {
                            countWrappedNodesRecursively(nodes.wrappedNodes);
                        }
                    });
                };
                countWrappedNodesRecursively(node.wrappedNodes);
                return Math.min(2.7 + 0.6 * node.wrappedNodes.length, 7);
            };
            updateNodes
                .append('text')
                .attr('class', 'circle-label')
                .text(d => groupNodeLabel(d.data)) // .text(d => d.data.neighbour.toString())
                .attr('x', d => d.data.wrappedNodes.length <= 4 ? 7 : 9)
                .attr('alignment-baseline', 'central');
            updateNodes
                .append('foreignObject')
                .attr('class', 'circle-img')
                .attr('width', 15)
                .attr('height', 15)
                .attr('x', 7)
                .attr('y', -17)
                .html(d => {
                if (d.data.wrappedNodes[0].metadata.screenshot) {
                    return `<div><img class="thumbnail" src="${d.data.wrappedNodes[0].metadata.screenshot}" width="15" height="15" /></div>`;
                }
                else {
                    return '';
                }
            })
                .on('mouseenter', function (d) {
                if (d.data.wrappedNodes[0].metadata.screenshot) {
                    // Clear any existing timeout
                    clearTimeout(hoverTimeout);
                    // Raise the current circle-img element to the top
                    select(this).raise();
                    // Set a timeout to resize the circle-img and thumbnail after .5 second
                    hoverTimeout = setTimeout(() => {
                        this.setAttribute('width', '50');
                        this.setAttribute('height', '50');
                        const thumbnail = this.querySelector('.thumbnail');
                        if (thumbnail) {
                            thumbnail.style.width = '50px';
                            thumbnail.style.height = '50px';
                        }
                    }, 300);
                }
            })
                .on('mouseleave', function () {
                // Clear the timeout and reset the circle-img and thumbnail size
                clearTimeout(hoverTimeout);
                this.setAttribute('width', '15');
                this.setAttribute('height', '15');
                const thumbnail = this.querySelector('.thumbnail');
                if (thumbnail) {
                    thumbnail.style.width = '15px';
                    thumbnail.style.height = '15px';
                }
            });
            // other nodes to circle
            updateNodes
                .filter((d) => {
                return !d.data.wrappedNodes.some((node) => node.metadata.isSlideAdded);
            })
                .append('g')
                .attr('class', 'normal');
            updateNodes.on('contextmenu', (d) => __awaiter(this, void 0, void 0, function* () {
                if (d.data.wrappedNodes.length != 1)
                    return;
                yield this.traverser.toStateNode(d.data.wrappedNodes[0].id, 0);
                this.traverser.graph.current = this.traverser.graph.getNode(d.data.wrappedNodes[0].id);
                d.data.wrappedNodes[0].metadata.bookmarked = !d.data.wrappedNodes[0].metadata.bookmarked;
                if (!d.data.wrappedNodes[0].metadata.bookmarked) {
                    window.slideDeckViz.onDelete(null);
                }
                else {
                    window.slideDeckViz.onAdd(this.traverser.graph.current);
                }
                this.update();
            }));
            // set classes on node
            updateNodes
                .attr('class', 'node')
                .filter((d) => {
                if (d.x === 0) {
                    d.data.wrappedNodes[0].metadata.mainbranch = true;
                }
                else {
                    d.data.wrappedNodes[0].metadata.mainbranch = false;
                }
                return d.x === 0;
            })
                .attr('class', 'node branch-active')
                .filter((d) => {
                let neighbourNode = false;
                if (this.traverser.graph.current.parent) { // 위에 뭐가 있는지 확인
                    neighbourNode = this.traverser.graph.current.parent === d.data.wrappedNodes[0] ? true : neighbourNode; // 현 노드에 위가 있으면 네이버는 참
                    d.data.wrappedNodes[0].metadata.neighbour = neighbourNode ? true : neighbourNode;
                }
                if (this.traverser.graph.current.children.length !== 0) {
                    for (const child of this.traverser.graph.current.children) {
                        neighbourNode = d.data.wrappedNodes.includes(child) ? true : neighbourNode;
                        d.data.wrappedNodes[0].metadata.neighbour = neighbourNode ? true : neighbourNode;
                    }
                }
                return neighbourNode;
            })
                .attr('class', 'node branch-active neighbour');
            updateNodes
                .filter((d) => {
                if (d.data.wrappedNodes.length == 1) {
                    const ref = d.data.wrappedNodes.includes(this.traverser.graph.current);
                    return ref;
                }
            })
                .attr('class', 'node branch-active neighbour node-active');
            hierarchyRoot.leaves().forEach((node) => {
                if (node.data.wrappedNodes[0].metadata.mainbranch)
                    this.activeleave = node;
            });
            updateNodes
                .select('g')
                .append((d) => {
                const isBookmarked = d.data.wrappedNodes.some((node) => {
                    return node.metadata.bookmarked === true;
                });
                // Check if the node is bookmarked
                if (isBookmarked && d.data.wrappedNodes.length == 1) {
                    // If yes, create a square shape
                    return document.createElementNS(namespaces.svg, 'rect');
                }
                else {
                    // Otherwise, create a circle shape
                    if (d.data.wrappedNodes.length == 1)
                        return document.createElementNS(namespaces.svg, 'circle');
                    else { // ordinal creator
                        // Initialize the colorScale array
                        const colorScale = [];
                        // Populate the colorScale array based on the conditions
                        d.data.wrappedNodes.forEach((node) => {
                            if (node.metadata.bookmarked === true) {
                                colorScale.push('#a94442');
                            }
                            else if (node.label.includes('Camera') || node.label.includes('View')) {
                                colorScale.push('#60aa85');
                            }
                            else if (node.label.includes('SelectObject')) {
                                colorScale.push('#b8852c');
                            }
                            else if (node.label.includes('TranslateObject') || node.label.includes('RotateObject')) {
                                colorScale.push('#286090');
                            }
                            else if (node.label.includes('Measurement')) {
                                colorScale.push('#9210dd');
                            }
                        });
                        // Create an array of objects containing label and value properties
                        const data = d.data.wrappedNodes.map((node) => ({
                            label: node,
                            value: 1
                        }));
                        // Calculate pie chart data
                        const pieChartData = pie().value((d) => d.value)(data);
                        const pieGroup = document.createElementNS(namespaces.svg, 'g');
                        pieChartData.reverse();
                        const arc$1 = arc().outerRadius(getNodeSize(d.data)).innerRadius(0);
                        let tempactive;
                        // Iterate over the pie chart data and create the pie slices
                        pieChartData.forEach((slice, index) => {
                            const path = document.createElementNS(namespaces.svg, 'path');
                            const pathElement = path;
                            pathElement.setAttribute('d', arc$1(slice));
                            pathElement.setAttribute('fill', colorScale[index]);
                            // Add class to the path element based on the condition
                            if (data[index].label === this.traverser.graph.current) {
                                pathElement.setAttribute('class', 'node-activepie');
                                tempactive = pathElement;
                            }
                            pathElement.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                                if (tempactive)
                                    tempactive.setAttribute('class', '');
                                yield this.traverser.toStateNode(data[index].label.id, 0); // set to 0 to all trans related work
                                // Add class to the clicked path element
                                pathElement.setAttribute('class', 'node-activepie');
                                tempactive = pathElement;
                            }));
                            pathElement.addEventListener('contextmenu', (event) => __awaiter(this, void 0, void 0, function* () {
                                yield this.traverser.toStateNode(data[index].label.id, 0);
                                this.traverser.graph.current = this.traverser.graph.getNode(data[index].label.id);
                                data[index].label.metadata.bookmarked = !data[index].label.metadata.bookmarked;
                                if (!data[index].label.metadata.bookmarked) {
                                    window.slideDeckViz.onDelete(null);
                                }
                                else {
                                    window.slideDeckViz.onAdd(this.traverser.graph.current);
                                }
                                this.update();
                            }));
                            pieGroup.appendChild(path);
                        });
                        return pieGroup;
                    }
                }
            })
                .attr('class', (d) => {
                let classString = '';
                const isBookmarked = d.data.wrappedNodes.some((node) => {
                    return node.metadata.bookmarked === true;
                });
                if (isBookmarked) {
                    classString += ' bookmarked';
                }
                else if (d.data.wrappedNodes[0].metadata.loaded === true) {
                    classString += ' loaded';
                }
                if (isKeyNode(d.data.wrappedNodes[0])) {
                    classString += ' keynode';
                    this.keynode = d;
                }
                classString += ' intent_' + getNodeIntent(d.data.wrappedNodes[0]);
                return classString;
            })
                .attr('r', (d) => {
                let nodeSize = getNodeSize(d.data);
                if (d.data.wrappedNodes[0].metadata.neighbour === true) {
                    nodeSize = getNodeSize(d.data) * 1;
                }
                if (d.data.wrappedNodes.includes(this.traverser.graph.current)) {
                    nodeSize = getNodeSize(d.data) * 1;
                }
                return nodeSize;
            })
                .attr('width', (d) => {
                // Set square width based on node size if bookmarked
                return getNodeSize(d.data) * 2;
            })
                .attr('height', (d) => {
                // Set square height based on node size if bookmarked
                return getNodeSize(d.data) * 2;
            })
                .attr('x', (d) => {
                // Position square based on node size if bookmarked
                const isBookmarked = d.data.wrappedNodes.some((node) => {
                    return node.metadata.bookmarked === true;
                });
                if (isBookmarked) {
                    return -getNodeSize(d.data);
                }
                else
                    return 7;
            })
                .attr('y', (d) => {
                // Position square based on node size if bookmarked
                const isBookmarked = d.data.wrappedNodes.some((node) => {
                    return node.metadata.bookmarked === true;
                });
                if (isBookmarked) {
                    return -getNodeSize(d.data);
                }
                else
                    return -17;
            });
            // hide labels not in branch
            updateNodes
                .select('text.circle-label')
                .attr('class', (d) => 'circle-label renderer_' + getNodeRenderer(d.data.wrappedNodes[0]))
                .attr('visibility', (d) => (d.x === 0 ? 'visible' : 'hidden'));
            updateNodes
                .select('foreignObject.circle-img')
                .attr('class', (d) => 'circle-img renderer_' + getNodeRenderer(d.data.wrappedNodes[0]))
                .attr('visibility', (d) => (d.x === 0 ? 'visible' : 'hidden'));
            updateNodes.on('click', (d, i) => __awaiter(this, void 0, void 0, function* () {
                if (d.data.wrappedNodes.length > 1) ;
                else if (d.data.wrappedNodes[0].id !== this.traverser.graph.current.id) {
                    yield this.traverser.toStateNode(d.data.wrappedNodes[0].id, 0); // set to 0 to all trans related works
                }
            }));
            updateNodes
                .data(treeNodes)
                .transition()
                .duration(500)
                .attr('transform', (d) => {
                if (d.x > treeWidth && treeWidth <= maxtreeWidth) {
                    var classString = `translate(${d.x * xScale}, ${d.y * yScale})`;
                    treeWidth = d.x;
                }
                else {
                    var classString = `translate(${d.x * xScale}, ${d.y * yScale})`;
                }
                return classString;
            });
            // Raise each node in newNodes in reverse order
            updateNodes.nodes().slice().reverse().forEach(node => {
                select(node).raise();
            });
            const oldLinks = this.g
                .selectAll('path.link')
                .data(tree.links()
                .filter((d) => d.target.data.wrappedNodes[0].metadata.option !== 'merged'), (d) => d.target.data.wrappedNodes.map((n) => n.id).join());
            oldLinks.exit().remove();
            const newLinks = oldLinks
                .enter()
                .insert('path', 'g')
                .attr('d', (d) => this.linkPath(d));
            oldLinks
                .merge(newLinks)
                .attr('class', 'link')
                .filter((d) => d.target.x === 0)
                .attr('class', 'link active');
            oldLinks
                .merge(newLinks)
                .transition()
                .duration(500)
                .attr('d', (d) => this.linkPath(d));
            const updatedLinks = oldLinks.merge(newLinks);
            if (this.caterpillarActivated) {
                caterpillar(updateNodes, treeNodes, updatedLinks, this);
            }
            this.real_traverser = updateNodes;
        }; // end update
        this.traverser = traverser;
        this.colorScheme = scaleOrdinal(schemeAccent);
        this.container = select(elm)
            .append('div')
            .attr('class', 'visualizationContainer')
            .attr('style', 'width: 100%; height:' + `${window.innerHeight}` + 'px');
        provGraphControls(this);
        // Append svg element
        this.svg = this.container
            .append('div')
            .append('svg')
            .attr('style', `overflow: visible; width: 100%; height: 100%; font-size: ${fontSize}px; line-height: ${fontSize}px`);
        this.g = this.svg.append('g');
        // Append grouping buttons
        addAggregationButtons(this.container, this);
        // Disable dbclick zoom
        this.svg.on('dblclick.zoom', null);
        traverser.graph.on('currentChanged', () => __awaiter(this, void 0, void 0, function* () {
            yield this.update();
            window.slideDeckViz.onChange(this.activeleave);
            window.slideDeckViz.provchanged(traverser.graph.current);
        }));
        traverser.graph.on('nodeChanged', () => {
            this.update();
        });
        traverser.graph.on('nodeAdded', (event) => {
            this.currentHierarchyNodelength += 1.0;
            this.scaleToFit();
            this.numberofnodeswcam++;
            if (!cam_test(event.label)) {
                this.numberofnodeswocam++;
            }
            else {
                this.camera_show = true;
                select('#camera-trigger').style('color', '#3f51b5');
            }
        });
        this.update();
        this.zoomer = zoom();
        this.setZoomExtent();
        this.svg.call(this.zoomer);
        this.svg.on('dblclick.zoom', (event) => { return null; });
    }
    setZoomExtent() {
        this.zoomer.scaleExtent([0.1, 10]).on('zoom', () => {
            this.g.attr('transform', event$1.transform);
        });
        this.scaleToFit();
    }
    scaleToFit() {
        const maxScale = 3;
        const magicNum = 0.75; // todo: get relevant number based on dimensions
        this.sizeX = window.innerWidth * 0.2;
        this.sizeY = window.innerHeight;
        const margin = 0;
        const node_length = (this.currentHierarchyNodelength) * yScale * maxScale;
        const node_width = (this.TreeWidth) * xScale * maxScale;
        const node_max = Math.floor(this.sizeY / (yScale * maxScale));
        const trans_y = (node_length > this.sizeY) ? (this.currentHierarchyNodelength - node_max + margin) * yScale * maxScale : -20;
        const scaleFactor = Math.min(maxScale, (magicNum * this.sizeY) / (this.currentHierarchyNodelength * yScale), (magicNum * this.sizeX) / (this.TreeWidth * -xScale));
        this.svg
            .transition()
            .duration(0)
            .call(this.zoomer.transform, () => zoomIdentity.translate(this.sizeX / 2.1, -trans_y).scale(maxScale));
    }
    linkPath({ source, target }) {
        const [s, t] = [source, target];
        // tslint:disable-next-line
        return `M${s.x * xScale},${s.y * yScale}
              C${s.x * xScale},  ${(s.y * yScale + t.y * yScale) / 2} ${t.x *
            xScale},  ${(s.y * yScale + t.y * yScale) / 2} ${t.x * xScale},  ${t.y *
            yScale}`;
    }
    /**
     * @descriptionWrap text labels
     */
    wrap(text, width) {
        text.each(function () {
            const words = text
                .text()
                .split(/(?=[A-Z])/)
                .reverse();
            let word, line = [], lineNumber = 0;
            const lineHeight = 1.0, // ems
            y = text.attr('y'), dy = 0;
            let tspan = text
                .text(null)
                .append('tspan')
                .attr('x', 7)
                .attr('y', y)
                .attr('dy', dy + 'em');
            while ((word = words.pop())) {
                line.push(word);
                tspan.text(line.join(' '));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(' '));
                    line = [word];
                    tspan = text
                        .append('tspan')
                        .attr('x', 7)
                        .attr('y', y)
                        .attr('dy', ++lineNumber * lineHeight + dy + 'em')
                        .text(word);
                }
            }
        });
    }
    camerahide() {
        const sliderElement = document.getElementById('provslider');
        sliderElement.value = '0';
        this.update();
        function find_noncameranode(c_trav) {
            let traverser = c_trav.graph.current;
            if (traverser.label === "root")
                return traverser;
            do {
                const searchpattern = cam_test(traverser.label);
                if (!searchpattern)
                    return traverser;
                traverser = traverser.parent;
            } while (traverser.label !== "root");
            return traverser;
        }
        this.camera_show = this.camera_show ? false : true;
        if (!this.camera_show) {
            this.groupnumber = 0;
            const closenode = find_noncameranode(this.traverser);
            this.traverser.toStateNode(closenode.id, 0);
        }
        this.update();
        this.getFullsizeview();
    }
    getFullsizeview() {
        this.sizeX = window.innerWidth * 0.2;
        this.sizeY = window.innerHeight;
        const maxScale = 3;
        const margin = 0;
        const node_length = (this.currentHierarchyMaxlength + 1 + margin) * yScale * maxScale;
        const node_max = this.sizeY / node_length;
        //Need to Modify
        const tx = (this.TreeWidth >= 4) ? (this.sizeX / 1.8) : (this.sizeX / 2);
        const scaleFactor = Math.min(maxScale, maxScale * node_max, maxScale * this.sizeX / (this.TreeWidth * -xScale * 2.1 * maxScale)); // find the smallest scale(Length, Width, )
        this.svg
            .transition()
            .duration(0)
            .call(this.zoomer.transform, () => zoomIdentity.translate(tx, 20).scale(scaleFactor) // fix size
        );
    }
    setTraverser(traverser) {
        this.traverser = traverser;
        provGraphControls(this);
    }
    removeNodesAndLinkChildren(tree, condition) {
        const removeNodes = (node) => {
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                if (condition(child) && !child.bookmarked) {
                    // Remove the node from the children array
                    node.children.splice(i, 1);
                    // Append the children of the removed node to the parent
                    node.children.push(...child.children);
                    // Decrement the index to recheck the same position after the update
                    i--;
                }
                else {
                    // Recursively call removeNodes for the child
                    removeNodes(child);
                }
            }
        };
        removeNodes(tree);
        return tree;
    }
    deletesingleNode() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.traverser.graph.current.label === "root")
                return;
            else {
                const current_node = this.traverser.graph.current;
                const parent_node = current_node.parent;
                const parent_children = parent_node.children;
                const current_index = parent_children.indexOf(current_node);
                if (cam_test(current_node.label)) {
                    this.numberofnodeswocam--;
                    this.numberofnodeswcam--;
                }
                else
                    this.numberofnodeswcam--;
                this.traverser.toStateNode(parent_node.id, 0);
                if (current_node.metadata.bookmarked)
                    window.slideDeckViz.onDelete(null);
                parent_children.splice(current_index, 1);
                this.traverser.graph.current = parent_node;
                parent_node.children.push(...current_node.children);
                current_node.children.forEach((child) => {
                    child.parent = parent_node;
                });
                if (current_node.children.length > 0) {
                    this.traverser.toStateNode(current_node.children[0].id, 0);
                }
                else {
                    if (parent_node.children.length > 0)
                        this.traverser.toStateNode(parent_node.children[0].id, 0);
                    this.traverser.toStateNode(parent_node.id, 0);
                }
            }
        });
    }
    deleteNode() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.traverser.graph.current.label === "root")
                return;
            if (this.traverser.graph.current.label !== 'root') {
                const current_node = this.traverser.graph.current;
                const parent_node = current_node.parent;
                const parent_children = parent_node.children;
                const current_index = parent_children.indexOf(current_node);
                const deleteChildrenRecursively = (node) => {
                    if (node.children.length > 0) {
                        node.children.forEach((child) => deleteChildrenRecursively(child));
                    }
                    node.children = [];
                    if (cam_test(node.label)) {
                        this.numberofnodeswocam--;
                        this.numberofnodeswcam--;
                    }
                    else
                        this.numberofnodeswcam--;
                    if (node.metadata.bookmarked)
                        window.slideDeckViz.onDelete(null);
                };
                deleteChildrenRecursively(current_node);
                parent_children.splice(current_index, 1);
                if (parent_node.children.length > 0)
                    this.traverser.toStateNode(parent_node.children[0].id, 0);
                this.traverser.toStateNode(parent_node.id, 0);
            }
        });
    }
    Grouping_hierarchy(wraproot) {
        var _a, _b, _c, _d;
        let hierarchyRoot = hierarchy(wraproot);
        let allnodes = hierarchyRoot.descendants().filter((d) => d.data.wrappedNodes[0].label !== 'Root' && d.data.depth !== 1);
        let branches = allnodes.reduce((sum, node) => {
            if (node.data.children.length > 1) {
                return sum + node.data.children.length;
            }
            else {
                return sum;
            }
        }, 0);
        if (hierarchyRoot.children != undefined) {
            hierarchyRoot.children.forEach((child) => {
                branches++;
            });
        }
        allnodes = allnodes.filter((d) => d.parent.children.length == 1); // exclude branches merging
        allnodes.sort((a, b) => {
            return a.data.wrappedNodes[0].metadata.H_value - b.data.wrappedNodes[0].metadata.H_value;
        });
        console.log('======Before======');
        console.log(allnodes.map(node => node.depth));
        console.log(allnodes.map(node => node.data.wrappedNodes[0].metadata.H_value));
        console.log(allnodes.map(node => node.data.wrappedNodes[0].metadata.O_group));
        //size-calculation (왔다 갔다 할 경우 고려해야함)
        const uniqueValues = allnodes
            .filter(node => node.parent.data.wrappedNodes[0].metadata.O_group != node.data.wrappedNodes[0].metadata.O_group && node.parent.data.children.length == 1 && node.parent.data.wrappedNodes[0].label != 'Root')
            .map(node => node.data.wrappedNodes[0].metadata.O_group);
        this.numberOfUniqueValues = uniqueValues.length + branches;
        // console.log('uniqueValues', uniqueValues);
        // console.log('branches', branches);
        const groupslicenodes = allnodes.slice(0, this.groupnumber);
        groupslicenodes.sort((a, b) => { return b.depth - a.depth; });
        groupslicenodes.sort((a, b) => { return a.data.wrappedNodes[0].metadata.branchnumber - b.data.wrappedNodes[0].metadata.branchnumber; });
        let Endnode = 0;
        let Startnode = 0;
        for (let i = 0; i < groupslicenodes.length; i++) {
            if (groupslicenodes[i].data.wrappedNodes[0].metadata.branchnumber != ((_a = groupslicenodes[i + 1]) === null || _a === void 0 ? void 0 : _a.data.wrappedNodes[0].metadata.branchnumber)) {
                transferChildren(groupslicenodes[i].parent.parent, groupslicenodes[i].parent, groupslicenodes[i]);
            }
            else if (groupslicenodes[i].depth - ((_b = groupslicenodes[i + 1]) === null || _b === void 0 ? void 0 : _b.depth) == 1) {
                Startnode = i;
                Endnode = i + 1;
                for (Endnode; Endnode < groupslicenodes.length; Endnode++) {
                    if (groupslicenodes[Endnode].depth - ((_c = groupslicenodes[Endnode + 1]) === null || _c === void 0 ? void 0 : _c.depth) != 1 ||
                        groupslicenodes[Endnode].data.wrappedNodes[0].metadata.branchnumber != ((_d = groupslicenodes[Endnode + 1]) === null || _d === void 0 ? void 0 : _d.data.wrappedNodes[0].metadata.branchnumber)) {
                        break;
                    }
                }
                transferChildren_2(groupslicenodes[Endnode].parent, groupslicenodes[Endnode], groupslicenodes[Startnode]);
                i = Endnode;
            }
            else {
                transferChildren(groupslicenodes[i].parent.parent, groupslicenodes[i].parent, groupslicenodes[i]);
            }
        }
        hierarchyRoot = hierarchy(wraproot); // Updated the treeRoot
        console.log('======After======');
        console.log(groupslicenodes);
        console.log(groupslicenodes.map(node => node.depth));
        console.log(groupslicenodes.map(node => node.data.wrappedNodes[0].metadata.H_value));
        console.log(groupslicenodes.map(node => node.data.wrappedNodes[0].metadata.O_group));
        return hierarchyRoot;
    }
    getTraverser() {
        return this.traverser;
    }
}

export { ProvenanceTreeVisualization };
//# sourceMappingURL=provenance-tree-visualization.es5.js.map
