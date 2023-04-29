"use strict";
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
    constructor(traverser, elm) {
        this.camera_show = true;
        this.numberofnodes = 1;
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
        /**
         * @description Update the tree layout.
         */
        this.update = () => {
            let wrappedRoot = (0, aggregation_objects_1.wrapNode)(this.traverser.graph.root);
            let clonedWrappedRoot = (0, aggregation_objects_1.wrapNode)(this.traverser.graph.root);
            let camhideNodes = this.removeNodesAndLinkChildren(clonedWrappedRoot, node => node.camera === true);
            let hierarchyRoot;
            // aggregateNodes(this.aggregation, wrappedRoot, this.traverser.graph.current);
            if (this.camera_show == true)
                // hierarchyRoot = d3.hierarchy(wrappedRoot); // Updated the treeRoot
                hierarchyRoot = this.Grouping_hierarchy(wrappedRoot);
            else {
                hierarchyRoot = d3.hierarchy(camhideNodes);
                if ((0, utils_1.cam_test)(this.traverser.graph.current.label)) {
                    this.currentHierarchyNodelength = hierarchyRoot.path(this.keynode).length;
                    this.scaleToFit();
                    return;
                }
            }
            let currentHierarchyNode;
            hierarchyRoot.each(node => {
                if (node.data.wrappedNodes.includes(this.traverser.graph.current)) {
                    currentHierarchyNode = node;
                }
            });
            if (currentHierarchyNode === undefined) {
                this.traverser.toStateNode(this.traverser.graph.current.parent.id);
                return;
            }
            this.currentHierarchyNodelength = hierarchyRoot.path(currentHierarchyNode).length;
            const tree = (0, gratzl_1.default)(hierarchyRoot, currentHierarchyNode);
            this.hierarchyRoot = tree;
            const treeNodes = tree.descendants().filter((d) => d.data.wrappedNodes[0].metadata.option !== 'merged');
            const treemaxwidth = tree.descendants().map(function (item) { return item.x; }).reduce(function (prev, current) { return (prev > current) ? prev : current; });
            const treemaxlength = tree.descendants().map(function (item) { return item.y; }).reduce(function (prev, current) { return (prev > current) ? prev : current; });
            this.currentHierarchyMaxlength = treemaxlength;
            const oldNodes = this.g.selectAll('g.node').data(treeNodes, (d) => {
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
            newNodes
                .append('foreignObject')
                .attr('class', 'circle-img')
                .attr('width', 15)
                .attr('height', 15)
                .attr('x', 7)
                .attr('y', -17)
                .html(d => {
                if (d.data.wrappedNodes[0].metadata.screenshot) {
                    return `<div><img src="${d.data.wrappedNodes[0].metadata.screenshot}" width="15" height="15" /></div>`;
                }
                else {
                    return '';
                }
            });
            newNodes
                .append('text')
                .attr('class', 'circle-label')
                .text(d => (0, aggregation_objects_1.groupNodeLabel)(d.data)) // .text(d => d.data.neighbour.toString())
                .attr('x', 7)
                .attr('alignment-baseline', 'central');
            // newNodes
            //   .append('text')
            //   .attr('class', 'depth-label')
            //   .text(d => (d.data.wrappedNodes.length > 1)?d.data.wrappedNodes.length:'') // .text(d => d.data.neighbour.toString())
            //   .attr('x', 0)
            //   .attr('alignment-baseline', 'central');
            // .call(this.wrap, 70);
            const updateNodes = newNodes.merge(oldNodes);
            updateNodes.selectAll('g.normal').remove();
            updateNodes.selectAll('g.bookmarked').remove();
            updateNodes.selectAll('.circle-text').remove();
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
            // other nodes to circle
            updateNodes
                .filter((d) => {
                return !d.data.wrappedNodes.some((node) => node.metadata.isSlideAdded);
            })
                .append('g')
                .attr('class', 'normal');
            updateNodes.on('contextmenu', (d) => {
                this.traverser.toStateNode(d.data.wrappedNodes[0].id, 0);
                this.traverser.graph.current = this.traverser.graph.getNode(d.data.wrappedNodes[0].id);
                // this.update();
                // (window as any).slideDeckViz.onChange();
                d.data.wrappedNodes[0].metadata.bookmarked = !d.data.wrappedNodes[0].metadata.bookmarked;
                if (!d.data.wrappedNodes[0].metadata.bookmarked) {
                    window.slideDeckViz.onDelete(null, this.traverser.graph.current);
                    this.traverser.graph.current.metadata.H_value -= 50000;
                }
                else {
                    window.slideDeckViz.onAdd(this.traverser.graph.current);
                    this.traverser.graph.current.metadata.H_value += 50000;
                }
                this.update();
            });
            updateNodes.on('dblclick', (d) => {
                this.traverser.toStateNode(d.data.wrappedNodes[0].id, 0);
                this.traverser.graph.current = this.traverser.graph.getNode(d.data.wrappedNodes[0].id);
                // collapse the nodes as it is
                // if((this.traverser.graph.current as any).parent.){
                //   this.traverser.graph.current = this.traverser.graph.current.children[0];
                // }
                console.log('hello');
                this.update();
                // d.data.
            });
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
                const ref = d.data.wrappedNodes.includes(this.traverser.graph.current);
                return ref;
            })
                .attr('class', 'node branch-active neighbour node-active');
            updateNodes
                .select('g')
                .append((d) => {
                const isBookmarked = d.data.wrappedNodes.some((node) => {
                    return node.metadata.bookmarked === true;
                });
                // Check if the node is bookmarked
                if (isBookmarked) {
                    // If yes, create a square shape
                    return document.createElementNS(d3.namespaces.svg, 'rect');
                }
                else {
                    // Otherwise, create a circle shape
                    return document.createElementNS(d3.namespaces.svg, 'circle');
                }
            })
                .on('dblclick.zoom', null)
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
            updateNodes.on('click', d => {
                if (d.data.wrappedNodes[0].id !== this.traverser.graph.current.id) {
                    this.traverser.toStateNode(d.data.wrappedNodes[0].id, 0); // set to 0 to all trans related works
                }
            });
            updateNodes
                .append('text')
                .attr('class', 'depth-label')
                .text(d => (d.data.wrappedNodes.length > 1) ? d.data.wrappedNodes.length : '') // .text(d => d.data.neighbour.toString())
                .attr('x', -1)
                .attr('alignment-baseline', 'central');
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
            // this.scaleToFit();
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
        traverser.graph.on('currentChanged', () => {
            this.update();
            window.slideDeckViz.onChange(traverser.graph.current);
            window.slideDeckViz.provchanged(traverser.graph.current);
        });
        traverser.graph.on('nodeChanged', () => {
            this.update();
        });
        traverser.graph.on('nodeAdded', () => {
            this.currentHierarchyNodelength += 1.0;
            this.scaleToFit();
            this.numberofnodes++;
        });
        this.update();
        this.zoomer = d3.zoom();
        this.setZoomExtent();
        this.svg.call(this.zoomer);
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
    }
    removeNodesAndLinkChildren(tree, condition) {
        const removeNodes = (node) => {
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                if (condition(child)) {
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
        // Create a shallow copy of the tree
        // Call the removeNodes function on the copied tree
        removeNodes(tree);
        return tree;
    }
    Grouping_hierarchy(wraproot) {
        var _a, _b;
        let hierarchyRoot = d3.hierarchy(wraproot);
        let allnodes = hierarchyRoot.descendants().filter((d) => d.data.wrappedNodes[0].label !== 'Root');
        let branches = allnodes.filter((d) => d.data.children.length > 1).length;
        let bookmarks = allnodes.filter((d) => d.data.wrappedNodes[0].metadata.bookmarked).length;
        allnodes = allnodes.filter((d) => d.parent.data.children.length == 1); // exclude branches merging
        allnodes.sort((a, b) => {
            return a.data.wrappedNodes[0].metadata.H_value - b.data.wrappedNodes[0].metadata.H_value;
        });
        console.log('======Before======');
        console.log(allnodes.map(node => node.depth));
        console.log(allnodes.map(node => node.data.wrappedNodes[0].metadata.H_value));
        console.log(allnodes.map(node => node.data.wrappedNodes[0].metadata.O_group));
        //size-calculation (왔다 갔다 할 경우 고려해야함)
        const uniqueValues = allnodes.map(node => node.data.wrappedNodes[0].metadata.O_group);
        var outputArr = uniqueValues.filter((value, index, self) => {
            return self.indexOf(value) === index;
        });
        this.numberOfUniqueValues = outputArr.length + branches + bookmarks;
        const groupslicenodes = allnodes.slice(0, this.groupnumber);
        groupslicenodes.sort((a, b) => { return b.depth - a.depth; });
        groupslicenodes.sort((a, b) => { return a.data.wrappedNodes[0].metadata.branchnumber - b.data.wrappedNodes[0].metadata.branchnumber; });
        let Endnode = 0;
        let Startnode = 0;
        for (let i = 0; i < groupslicenodes.length; i++) {
            if (groupslicenodes[i].depth - ((_a = groupslicenodes[i + 1]) === null || _a === void 0 ? void 0 : _a.depth) == 1) {
                Startnode = i;
                Endnode = i + 1;
                for (Endnode; Endnode < groupslicenodes.length; Endnode++) {
                    if (groupslicenodes[Endnode].depth - ((_b = groupslicenodes[Endnode + 1]) === null || _b === void 0 ? void 0 : _b.depth) != 1) {
                        break;
                    }
                }
                (0, aggregation_implementations_1.transferChildren_2)(groupslicenodes[Endnode].parent, groupslicenodes[Endnode], groupslicenodes[Startnode]);
                i = Endnode;
            }
            else {
                (0, aggregation_implementations_1.transferChildren)(groupslicenodes[i].parent.parent.data, groupslicenodes[i].parent.data, groupslicenodes[i].data);
            }
        }
        // groupslicenodes.forEach((node) => transferChildren(node.parent!.parent!.data as any, node.parent!.data as any, node.data as any));
        // for(let i = 0; i < this.groupnumber; i++){
        //   if (allnodes.length >= i && allnodes[i]?.parent?.data && allnodes[i].data) {
        //     transferChildren(allnodes[i].parent!.parent!.data, allnodes[i].parent!.data, allnodes[i].data);
        //   }
        //  }
        hierarchyRoot = d3.hierarchy(wraproot); // Updated the treeRoot
        allnodes = hierarchyRoot.descendants().filter((d) => d.data.wrappedNodes[0].label !== 'Root');
        allnodes.sort((a, b) => {
            return a.data.wrappedNodes[0].metadata.H_value - b.data.wrappedNodes[0].metadata.H_value;
        });
        console.log('======After======');
        console.log(groupslicenodes);
        console.log(allnodes.map(node => node.depth));
        console.log(allnodes.map(node => node.data.wrappedNodes[0].metadata.H_value));
        console.log(allnodes.map(node => node.data.wrappedNodes[0].metadata.O_group));
        return hierarchyRoot;
    }
    getTraverser() {
        return this.traverser;
    }
}
exports.ProvenanceTreeVisualization = ProvenanceTreeVisualization;
//# sourceMappingURL=provenance-tree-visualization.js.map