"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.caterpillar = void 0;
var aggregation_objects_1 = require("./aggregation/aggregation-objects");
var gratzl_old_1 = require("./gratzl_old");
var d3 = require("d3");
function caterpillar(updateNodes, treeNodes, updatedLinks, provenanceTreeVisualization) {
    if (provenanceTreeVisualization.caterpillarActivated) {
        var mainNodes = updateNodes.filter(function (d) { return d.x === 0; });
        var mainNodesData_1 = mainNodes
            .data()
            .map(function (d) { return d.data.wrappedNodes[0].id; });
        // console.log(mainNodesData);
        var edgeNodes = mainNodes.filter(function (d) {
            if (d.children) {
                return d.children.length > 1;
            }
            return false;
        });
        edgeNodes.select("circle").attr("class", "intent_wrapped");
        edgeNodes.select("rect").attr("class", "intent_wrapped");
        // Hide the rest of the circles and links
        updateNodes.filter(function (d) { return d.x !== 0; }).attr("class", "node hiddenClass");
        updatedLinks
            .filter(function (d) { return d.target.x !== 0; })
            .attr("class", "node hiddenClass");
        // Set the label which indicate the number of nodes wrapped
        updateNodes
            .select("text.circle-text")
            .filter(function (d) { return d.x !== 0; })
            .attr("visibility", "visible");
        edgeNodes
            .select(".normal>text.circle-text")
            .attr("visibility", "visible")
            .text(function (d) {
            var copyNode = d.copy();
            copyNode.children = copyNode.children.filter(function (e, i, arr) {
                return !mainNodesData_1.includes(e.data.wrappedNodes[0].id);
            });
            return copyNode.descendants().length;
        })
            .attr("x", function (d) {
            var copyNode = d.copy();
            copyNode.children = copyNode.children.filter(function (e, i, arr) {
                return !mainNodesData_1.includes(e.data.wrappedNodes[0].id);
            });
            if (copyNode.descendants().length < 10) {
                return -1.5;
            }
            else {
                return -3;
            }
        });
        // Set the radius of the circle
        edgeNodes.select("circle").attr("r", function (d) {
            return Math.min(4 + 0.15 * d.descendants().length, 6);
        });
        // Set the click function
        edgeNodes.on("click", function (d) {
            var actualCatGraph = d3.selectAll(".classCat");
            // When click again -> auxiliar tree disappearss.
            if (actualCatGraph
                .data()
                .map(function (k) { return k.data.wrappedNodes[0].id; })
                .includes(d.data.wrappedNodes[0].id)) {
                actualCatGraph
                    .data([])
                    .exit()
                    .remove();
                d3.selectAll("path.linkCat")
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
                var treeCopy = d.copy();
                treeCopy.children = treeCopy.children.filter(function (e, i, arr) {
                    return !mainNodesData_1.includes(e.data.wrappedNodes[0].id);
                });
                var treeLayoutCat = (0, gratzl_old_1.default)().size([35, 120]);
                var treeCat = treeLayoutCat(treeCopy, treeCopy);
                var excatNodes = provenanceTreeVisualization.g
                    .selectAll("g.classCat")
                    .data(treeCat.descendants(), function (datum) {
                    return datum.data.wrappedNodes.map(function (n) { return n.id; }).join();
                });
                excatNodes.exit().remove();
                var catNodes = excatNodes
                    .enter()
                    .append("g")
                    .attr("class", "classCat node branch-active ")
                    .data(treeNodes)
                    .attr("transform", function (datum) {
                    return datum.data.wrappedNodes[0].metadata.isSlideAdded
                        ? "translate(".concat(d.x - 3, ", ").concat(d.y, ")")
                        : "translate(".concat(d.x, ", ").concat(d.y, ")");
                });
                // .append('g')
                // .attr('class', 'classCat node branch-active ')
                // .attr('transform', (k: any) => `translate(${k.x}, ${k.y})`);
                catNodes.append("circle").attr("r", 3);
                // Fix the radius of the circles according to #nodes wrapped
                catNodes.select("circle").attr("r", function (datum) {
                    var radius = 2;
                    if (datum.data.neighbour === true) {
                        radius = 3;
                    }
                    if (datum.data.wrappedNodes.length !== 1) {
                        radius = Math.min(4 + 0.15 * datum.data.wrappedNodes.length, 6);
                    }
                    return radius;
                });
                // Assign classes to the circles
                catNodes.select("circle").attr("class", function (datum) {
                    var classString = "";
                    console.log(d.data.wrappedNodes[0].metadata);
                    if (d.data.wrappedNodes[0].metadata.bookmarked === true) {
                        classString += ' bookmarked';
                    }
                    if ((0, aggregation_objects_1.isKeyNode)(datum.data.wrappedNodes[0])) {
                        classString += " keynode";
                    }
                    classString += " intent_" + (0, aggregation_objects_1.getNodeIntent)(d.data.wrappedNodes[0]);
                    return classString;
                });
                catNodes.on("click", function (datum) {
                    return provenanceTreeVisualization.traverser.toStateNode(datum.data.wrappedNodes[0].id, 250);
                });
                // Set the #nodes-wrapped label
                catNodes
                    .append("text")
                    .attr("class", "circle-text")
                    .attr("visibility", function (datum) {
                    if (datum.data.wrappedNodes.length === 1) {
                        return "hidden";
                    }
                    else {
                        return "visible";
                    }
                })
                    .attr("x", function (datum) {
                    if (datum.data.wrappedNodes.length >= 10) {
                        return -3;
                    }
                    return -1.5;
                })
                    .attr("y", 2)
                    .text(function (datum) { return datum.data.wrappedNodes.length.toString(); });
                // Set the links between circles
                var oldLinksCat = provenanceTreeVisualization.g
                    .selectAll("path.linkCat")
                    .data(treeCat.links(), function (datum) {
                    return datum.target.data.wrappedNodes.map(function (n) { return n.id; }).join();
                });
                oldLinksCat.exit().remove();
                var newLinksCat = oldLinksCat
                    .enter()
                    .insert("path", "g")
                    .attr("d", provenanceTreeVisualization.linkPath);
                oldLinksCat
                    .merge(newLinksCat)
                    .attr("class", "link linkCat")
                    .filter(function (datum) { return datum.target.x === 0; })
                    .attr("class", "link active linkCat");
            } // end else actualgraph
        }); // end on click
    } // if of caterpillar procedure
}
exports.caterpillar = caterpillar;
//# sourceMappingURL=caterpillar.js.map