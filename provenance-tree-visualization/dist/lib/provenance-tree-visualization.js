"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvenanceTreeVisualization = void 0;
var d3 = require("d3");
var gratzl_1 = require("./gratzl");
var aggregation_objects_1 = require("./aggregation/aggregation-objects");
var components_1 = require("./components");
var aggregation_1 = require("./aggregation/aggregation");
var caterpillar_1 = require("./caterpillar");
var xScale = -20;
var yScale = 20;
var treeWidth = 0;
var maxtreeWidth = 10;
var p = 3;
var fontSize = 8;
/**
 * @description Class used to create and manage a provenance tree visualization.
 * @param traverser {ProvenanceGraphTraverser} - To manage the data structure of the graph.
 * @param svg {D3SVGSelection} - To manage the graphics of the tree.
 * @param _dataAggregation {aggregator<ProvenanceNode>} - Data aggregation in use.
 * @param caterpillarActivated {boolean} - True if this feature is enable.
 */
var ProvenanceTreeVisualization = /** @class */ (function () {
    function ProvenanceTreeVisualization(traverser, elm) {
        var _this = this;
        this.aggregation = {
            aggregator: aggregation_objects_1.rawData,
            arg: 1
        };
        this.caterpillarActivated = false;
        this.currentHierarchyNodelength = 0;
        this.TreeLength = 0;
        this.TreeWidth = 0.1;
        this.mergingEnabled = false;
        this.transferringEnabled = false;
        this.copyingEnabled = false;
        this.traverser = traverser;
        this.colorScheme = d3.scaleOrdinal(d3.schemeAccent);
        this.container = d3.select(elm)
            .append('div')
            .attr('class', 'visualizationContainer')
            .attr('style', 'height:' + ("" + (window.innerHeight - 178)) + 'px');
        // provGraphControls(this);
        // Append svg element
        this.svg = this.container
            .append('div')
            .attr('style', ' width: 95%; margin-left:5px;flex: 4')
            .append('svg')
            .attr('style', "overflow: visible; width: 100%; height: 100%; font-size: " + fontSize + "px; line-height: " + fontSize + "px");
        this.g = this.svg.append('g');
        // Append grouping buttons
        components_1.addAggregationButtons(this.container, this);
        traverser.graph.on('currentChanged', function () {
            _this.update();
        });
        traverser.graph.on('nodeChanged', function () {
            _this.update();
        });
        traverser.graph.on('nodeAdded', function () {
            _this.currentHierarchyNodelength += 1.0;
            _this.scaleToFit();
        });
        this.update();
        this.zoomer = d3.zoom();
        this.setZoomExtent();
        this.svg.call(this.zoomer);
    }
    ProvenanceTreeVisualization.prototype.setZoomExtent = function () {
        var _this = this;
        this.zoomer.scaleExtent([0.25, 2.5]).on('zoom', function () {
            _this.g.attr('transform', d3.event.transform);
        });
        this.scaleToFit();
    };
    ProvenanceTreeVisualization.prototype.scaleToFit = function () {
        var sizeX = this.svg.node().clientWidth;
        var sizeY = this.svg.node().clientHeight;
        var maxScale = 3;
        var magicNum = 0.75; // todo: get relevant number based on dimensions
        var relY = sizeY * 4 - (yScale * maxScale * this.currentHierarchyNodelength);
        // console.log(sizeY/2);
        // const scaleFactor = Math.min(
        //   maxScale,
        //   Math.pow(magicNum,this.y_zoom-maxScale) * maxScale 
        // );
        this.svg
            .transition()
            .duration(0)
            .call(this.zoomer.transform, function () {
            return d3.zoomIdentity.translate(sizeX / 2, relY).scale(maxScale);
        } // fix size
        );
    };
    ProvenanceTreeVisualization.prototype.linkPath = function (_a) {
        var source = _a.source, target = _a.target;
        var _b = [source, target], s = _b[0], t = _b[1];
        // tslint:disable-next-line
        return "M" + s.x * xScale + "," + s.y * yScale + "\n              C" + s.x * xScale + ",  " + (s.y * yScale + t.y * yScale) / 2 + " " + t.x *
            xScale + ",  " + (s.y * yScale + t.y * yScale) / 2 + " " + t.x * xScale + ",  " + t.y *
            yScale;
    };
    /**
     * @descriptionWrap text labels
     */
    ProvenanceTreeVisualization.prototype.wrap = function (text, width) {
        text.each(function () {
            var words = text
                .text()
                .split(/(?=[A-Z])/)
                .reverse();
            var word, line = [], lineNumber = 0;
            var lineHeight = 1.0, // ems
            y = text.attr('y'), dy = 0;
            var tspan = text
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
    };
    ProvenanceTreeVisualization.prototype.getFullsizeview = function () {
        var sizeX = this.svg.node().clientWidth;
        var sizeY = this.svg.node().clientHeight;
        var maxScale = 3;
        var magicNum_W = 0.25;
        var magicNum_H = 0.7; // todo: get relevant number based on dimensions
        if (this.TreeWidth >= 4)
            sizeX = sizeX - 10;
        //Need to Modify
        var scaleFactor = Math.min(maxScale, maxScale - (magicNum_H * (this.TreeLength) / 15), maxScale - (magicNum_W * this.TreeWidth)); // find the smallest scale(Length, Width, )
        this.svg
            .transition()
            .duration(0)
            .call(this.zoomer.transform, function () {
            return d3.zoomIdentity.translate(sizeX / 2, 40).scale(scaleFactor);
        } // fix size
        );
    };
    ProvenanceTreeVisualization.prototype.setTraverser = function (traverser) {
        this.traverser = traverser;
    };
    /**
     * @description Update the tree layout.
     */
    ProvenanceTreeVisualization.prototype.update = function () {
        var _this = this;
        var wrappedRoot = aggregation_objects_1.wrapNode(this.traverser.graph.root);
        // aggregateNodes(this.aggregation, wrappedRoot, this.traverser.graph.current);
        var hierarchyRoot = d3.hierarchy(wrappedRoot); // Updated de treeRoot
        var currentHierarchyNode = aggregation_1.findHierarchyNodeFromProvenanceNode(hierarchyRoot, this.traverser.graph.current);
        this.currentHierarchyNodelength = hierarchyRoot.path(currentHierarchyNode).length;
        var tree = gratzl_1.default(hierarchyRoot, currentHierarchyNode);
        this.hierarchyRoot = tree;
        // console.log(tree);
        var treeNodes = tree.descendants().filter(function (d) { return d.data.wrappedNodes[0].metadata.option !== 'merged'; });
        var treemaxwidth = tree.descendants().map(function (item) { return item.x; }).reduce(function (prev, current) { return (prev > current) ? prev : current; });
        var treemaxlength = tree.descendants().map(function (item) { return item.y; }).reduce(function (prev, current) { return (prev > current) ? prev : current; });
        var oldNodes = this.g.selectAll('g.node').data(treeNodes, function (d) {
            var data = d.data.wrappedNodes.map(function (n) { return n.id; }).join();
            return data;
        });
        // console.log(treemaxwidth);
        this.TreeWidth = Math.max(this.TreeWidth, treemaxwidth);
        this.TreeLength = Math.max(this.TreeLength, treemaxlength);
        oldNodes.exit().remove();
        // group wrapping a node
        var newNodes = oldNodes
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', function (d) { return "translate(" + d.x * xScale + ", " + d.y * yScale + ")"; });
        // node label
        newNodes
            .append('text')
            .attr('class', 'circle-label')
            .text(function (d) { return aggregation_objects_1.groupNodeLabel(d.data); }) // .text(d => d.data.neighbour.toString())
            .attr('x', 7)
            .attr('alignment-baseline', 'central');
        // .call(this.wrap, 70);
        var updateNodes = newNodes.merge(oldNodes);
        updateNodes.selectAll('g.normal').remove();
        updateNodes.selectAll('g.bookmarked').remove();
        updateNodes.selectAll('.circle-text').remove();
        var getNodeSize = function (node) {
            return Math.min(2.7 + 0.3 * node.wrappedNodes.length, 7);
        };
        // other nodes to circle
        updateNodes
            .filter(function (d) {
            return !d.data.wrappedNodes.some(function (node) { return node.metadata.isSlideAdded; });
        })
            .append('g')
            .attr('class', 'normal');
        updateNodes.on('contextmenu', function (d) {
            _this.traverser.graph.current = _this.traverser.graph.getNode(d.data.wrappedNodes[0].id);
            _this.update();
            d.data.wrappedNodes[0].metadata.bookmarked = !d.data.wrappedNodes[0].metadata.bookmarked;
            if (!d.data.wrappedNodes[0].metadata.bookmarked) {
                window.slideDeck.onDelete(null, _this.traverser.graph.current);
            }
            else {
                window.slideDeck.onAdd(_this.traverser.graph.current);
            }
        });
        // set classes on node
        updateNodes
            .attr('class', 'node')
            .filter(function (d) {
            if (d.x === 0) {
                d.data.wrappedNodes[0].metadata.mainbranch = true;
            }
            return d.x === 0;
        })
            .attr('class', 'node branch-active')
            .filter(function (d) {
            var neighbourNode = false;
            if (_this.traverser.graph.current.parent) {
                neighbourNode = _this.traverser.graph.current.parent === d.data.wrappedNodes[0] ? true : neighbourNode;
                d.data.wrappedNodes[0].metadata.neighbour = neighbourNode ? true : neighbourNode;
            }
            if (_this.traverser.graph.current.children.length !== 0) {
                for (var _i = 0, _a = _this.traverser.graph.current.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    neighbourNode = d.data.wrappedNodes.includes(child) ? true : neighbourNode;
                    d.data.wrappedNodes[0].metadata.neighbour = neighbourNode ? true : neighbourNode;
                }
            }
            return neighbourNode;
        })
            .attr('class', 'node branch-active neighbour');
        updateNodes
            .filter(function (d) {
            var ref = d.data.wrappedNodes.includes(_this.traverser.graph.current);
            return ref;
        })
            .attr('class', 'node branch-active neighbour node-active');
        updateNodes
            .select('g')
            .append('circle')
            .attr('class', function (d) {
            var classString = '';
            if (d.data.wrappedNodes[0].metadata.bookmarked === true) {
                classString += ' bookmarked';
            }
            else if (d.data.wrappedNodes[0].metadata.loaded === true) {
                classString += ' loaded';
            }
            if (aggregation_objects_1.isKeyNode(d.data.wrappedNodes[0])) {
                classString += ' keynode';
            }
            classString += ' intent_' + aggregation_objects_1.getNodeIntent(d.data.wrappedNodes[0]);
            return classString;
        })
            .attr('r', function (d) {
            var nodeSize = getNodeSize(d.data);
            if (d.data.wrappedNodes[0].metadata.neighbour === true) {
                nodeSize = getNodeSize(d.data) * 1.15;
            }
            if (d.data.wrappedNodes.includes(_this.traverser.graph.current)) {
                nodeSize = getNodeSize(d.data) * 1.3;
            }
            return nodeSize;
        });
        // hide labels not in branch
        updateNodes
            .select('text.circle-label')
            .attr('class', function (d) { return 'circle-label renderer_' + aggregation_objects_1.getNodeRenderer(d.data.wrappedNodes[0]); })
            .attr('visibility', function (d) { return (d.x === 0 ? 'visible' : 'hidden'); });
        updateNodes.on('click', function (d) {
            if (d.data.wrappedNodes[0].id !== _this.traverser.graph.current.id) {
                _this.traverser.toStateNode(d.data.wrappedNodes[0].id, 250);
                _this.update();
            }
        });
        updateNodes
            .data(treeNodes)
            .transition()
            .duration(500)
            .attr('transform', function (d) {
            if (d.x > treeWidth && treeWidth <= maxtreeWidth) {
                var classString = "translate(" + d.x * xScale + ", " + d.y * yScale + ")";
                treeWidth = d.x;
                if (treeWidth % p) {
                }
            }
            else {
                var classString = "translate(" + d.x * xScale + ", " + d.y * yScale + ")";
            }
            return classString;
        });
        var oldLinks = this.g
            .selectAll('path.link')
            .data(tree.links()
            .filter(function (d) { return d.target.data.wrappedNodes[0].metadata.option !== 'merged'; }), function (d) { return d.target.data.wrappedNodes.map(function (n) { return n.id; }).join(); });
        oldLinks.exit().remove();
        var newLinks = oldLinks
            .enter()
            .insert('path', 'g')
            .attr('d', function (d) { return _this.linkPath(d); });
        oldLinks
            .merge(newLinks)
            .attr('class', 'link')
            .filter(function (d) { return d.target.x === 0; })
            .attr('class', 'link active');
        oldLinks
            .merge(newLinks)
            .transition()
            .duration(500)
            .attr('d', function (d) { return _this.linkPath(d); });
        var updatedLinks = oldLinks.merge(newLinks);
        // console.log("--tree--");
        // console.log(tree);
        // console.log("--newLinks--");
        // console.log(newLinks);
        // console.log("--updateNodes--");
        // console.log(updateNodes);
        if (this.caterpillarActivated) {
            caterpillar_1.caterpillar(updateNodes, treeNodes, updatedLinks, this);
        }
    }; // end update
    ProvenanceTreeVisualization.prototype.getTraverser = function () {
        return this.traverser;
    };
    return ProvenanceTreeVisualization;
}());
exports.ProvenanceTreeVisualization = ProvenanceTreeVisualization;
//# sourceMappingURL=provenance-tree-visualization.js.map