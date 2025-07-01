"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvenanceTreeVisualization = void 0;
const d3 = require("d3");
const gratzl_1 = require("./gratzl");
const controls_1 = require("./controls");
const utils_1 = require("./utils");
const aggregation_implementations_1 = require("./aggregation/aggregation-implementations");
const aggregation_objects_1 = require("./aggregation/aggregation-objects");
const components_1 = require("./components");
const caterpillar_1 = require("./caterpillar");
var xScale = -20;
var yScale = 20;
var treeWidth = 0;
var maxtreeWidth = 10;
var p = 3;
const fontSize = 8;
/**
 * @description Class used to create and manage a provenance tree visualization.
 * @param traverser {ProvenanceGraphTraverser} - To manage the data structure of the graph.
 * @param svg {D3SVGSelection} - To manage the graphics of the tree.
 * @param _dataAggregation {aggregator<ProvenanceNode>} - Data aggregation in use.
 * @param caterpillarActivated {boolean} - True if this feature is enable.
 */
class ProvenanceTreeVisualization {
    renumberBranchPlans() {
        const root = this.traverser.graph.root;
        const branchRoots = [];
        // Treat each direct child of root as a branch root
        root.children.forEach((child) => {
            branchRoots.push(child);
        });
        // Sort for consistent order
        branchRoots.sort((a, b) => a.metadata.branchnumber - b.metadata.branchnumber);
        // Assign branchnumbers recursively
        branchRoots.forEach((branchRoot, index) => {
            const reassign = (node) => {
                node.metadata.branchnumber = index;
                node.children.forEach(reassign);
            };
            reassign(branchRoot);
        });
    }
    constructor(traverser, elm) {
        this.camera_show = true;
        this.numberofnodes = 1;
        this.numberofnodeswocam = 0;
        this.numberofnodeswcam = 0;
        this.numberOfUniqueValues = 1;
        this.groupnumber = 0;
        this.aggregation = {
            aggregator: aggregation_objects_1.rawData,
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
        this.group_text_value = 1000;
        /**
         * @description Update the tree layout.
         */
        this.update = () => {
            console.log('update');
            this.traverser.graph.root.children.forEach((child) => {
                child.metadata.H_value = 1000000;
            });
            let wrappedRoot = (0, aggregation_objects_1.wrapNode)(this.traverser.graph.root);
            let clonedWrappedRoot = (0, aggregation_objects_1.wrapNode)(this.traverser.graph.root);
            let camhideNodes = this.removeNodesAndLinkChildren(clonedWrappedRoot, node => node.camera === true);
            let hierarchyRoot;
            // aggregateNodes(this.aggregation, wrappedRoot, this.traverser.graph.current);
            if (this.camera_show == true) {
                // hierarchyRoot = d3.hierarchy(wrappedRoot); // Updated the treeRoot
                this.numberofnodes = this.numberofnodeswcam;
                hierarchyRoot = this.Grouping_hierarchy(wrappedRoot);
            }
            else {
                hierarchyRoot = d3.hierarchy(camhideNodes);
                if ((0, utils_1.cam_test)(this.traverser.graph.current.label)) {
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
            const tree = (0, gratzl_1.default)(hierarchyRoot, currentHierarchyNode);
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
            updateNodes.selectAll('.plan-label').remove();
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
                .text(d => (0, aggregation_objects_1.groupNodeLabel)(d.data)) // .text(d => d.data.neighbour.toString())
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
                    d3.select(this).raise();
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
                d.data.bookmarked = !d.data.bookmarked;
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
                    return document.createElementNS(d3.namespaces.svg, 'rect');
                }
                else {
                    // Otherwise, create a circle shape
                    if (d.data.wrappedNodes.length == 1)
                        return document.createElementNS(d3.namespaces.svg, 'circle');
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
                        const pieChartData = d3.pie().value((d) => d.value)(data);
                        const pieGroup = document.createElementNS(d3.namespaces.svg, 'g');
                        pieChartData.reverse();
                        const arc = d3.arc().outerRadius(getNodeSize(d.data)).innerRadius(0);
                        let tempactive;
                        // Iterate over the pie chart data and create the pie slices
                        pieChartData.forEach((slice, index) => {
                            const path = document.createElementNS(d3.namespaces.svg, 'path');
                            const pathElement = path;
                            pathElement.setAttribute('d', arc(slice));
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
                                data[index].bookmarked = !data[index].bookmarked;
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
                if ((0, aggregation_objects_1.isKeyNode)(d.data.wrappedNodes[0])) {
                    classString += ' keynode';
                    this.keynode = d;
                }
                classString += ' intent_' + (0, aggregation_objects_1.getNodeIntent)(d.data.wrappedNodes[0]);
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
                .attr('class', (d) => 'circle-label renderer_' + (0, aggregation_objects_1.getNodeRenderer)(d.data.wrappedNodes[0]))
                .attr('visibility', (d) => (d.x === 0 ? 'visible' : 'hidden'));
            updateNodes
                .select('foreignObject.circle-img')
                .attr('class', (d) => 'circle-img renderer_' + (0, aggregation_objects_1.getNodeRenderer)(d.data.wrappedNodes[0]))
                .attr('visibility', (d) => (d.x === 0 ? 'visible' : 'hidden'));
            updateNodes.on('click', (d, i) => __awaiter(this, void 0, void 0, function* () {
                if (d.data.wrappedNodes.length > 1) {
                    // this.traverser.toStateNode(d.data.wrappedNodes[i].id, 0);
                }
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
                    if (treeWidth % p) {
                    }
                }
                else {
                    var classString = `translate(${d.x * xScale}, ${d.y * yScale})`;
                }
                return classString;
            });
            // Raise each node in newNodes in reverse order
            updateNodes.nodes().slice().reverse().forEach(node => {
                d3.select(node).raise();
            });
            updateNodes.filter(function (d) { return !d.children; })
                .append('text')
                .attr('class', 'plan-label')
                .attr('dy', '2.0em')
                .style('fill', 'red')
                .attr('visibility', 'visible')
                .attr('text-anchor', function (d) { return d.children ? 'end' : 'start'; })
                .text(d => d.children ? '' : 'Plan ' + (d.data.wrappedNodes[0].metadata.branchnumber + 1));
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
                (0, caterpillar_1.caterpillar)(updateNodes, treeNodes, updatedLinks, this);
            }
            this.real_traverser = updateNodes;
        }; // end update
        this.traverser = traverser;
        this.colorScheme = d3.scaleOrdinal(d3.schemeAccent);
        this.container = d3.select(elm)
            .append('div')
            .attr('class', 'visualizationContainer')
            .attr('style', 'width: 100%; height:' + `${window.innerHeight}` + 'px');
        (0, controls_1.provGraphControls)(this);
        // Append svg element
        this.svg = this.container
            .append('div')
            .append('svg')
            .attr('style', `overflow: visible; width: 100%; height: 100%; font-size: ${fontSize}px; line-height: ${fontSize}px`);
        this.g = this.svg.append('g');
        // Append grouping buttons
        (0, components_1.addAggregationButtons)(this.container, this);
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
            if (!(0, utils_1.cam_test)(event.label)) {
                this.numberofnodeswocam++;
            }
            else {
                this.camera_show = true;
                d3.select('#camera-trigger').style('color', '#3f51b5');
            }
        });
        this.update();
        this.zoomer = d3.zoom();
        this.setZoomExtent();
        this.svg.call(this.zoomer);
        this.svg.on('dblclick.zoom', (event) => { return null; });
    }
    setZoomExtent() {
        this.zoomer.scaleExtent([0.1, 10]).on('zoom', () => {
            this.g.attr('transform', d3.event.transform);
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
            .call(this.zoomer.transform, () => d3.zoomIdentity.translate(this.sizeX / 2.1, -trans_y).scale(maxScale));
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
                const searchpattern = (0, utils_1.cam_test)(traverser.label);
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
            .call(this.zoomer.transform, () => d3.zoomIdentity.translate(tx, 20).scale(scaleFactor) // fix size
        );
    }
    setTraverser(traverser) {
        this.traverser = traverser;
        (0, controls_1.provGraphControls)(this);
    }
    removeNodesAndLinkChildren(tree, condition) {
        const removeNodes = (node) => {
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                const books = node.children[i].wrappedNodes[0];
                if (condition(child) && !books.metadata.bookmarked) {
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
                if ((0, utils_1.cam_test)(current_node.label)) {
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
                yield this.renumberBranchPlans();
                yield this.update();
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
                    if ((0, utils_1.cam_test)(node.label)) {
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
                yield this.renumberBranchPlans();
                yield this.update();
            }
        });
    }
    Grouping_hierarchy(wraproot) {
        var _a, _b, _c, _d;
        let hierarchyRoot = d3.hierarchy(wraproot);
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
                (0, aggregation_implementations_1.transferChildren)(groupslicenodes[i].parent.parent, groupslicenodes[i].parent, groupslicenodes[i]);
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
                (0, aggregation_implementations_1.transferChildren_2)(groupslicenodes[Endnode].parent, groupslicenodes[Endnode], groupslicenodes[Startnode]);
                i = Endnode;
            }
            else {
                (0, aggregation_implementations_1.transferChildren)(groupslicenodes[i].parent.parent, groupslicenodes[i].parent, groupslicenodes[i]);
            }
        }
        hierarchyRoot = d3.hierarchy(wraproot); // Updated the treeRoot
        const g_nodes = groupslicenodes.map(node => node.data.wrappedNodes[0].metadata.H_value);
        this.group_text_value = Math.max(...g_nodes);
        console.log('======After======');
        console.log('HVALUE: ' + this.group_text_value);
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
exports.ProvenanceTreeVisualization = ProvenanceTreeVisualization;
//# sourceMappingURL=provenance-tree-visualization.js.map