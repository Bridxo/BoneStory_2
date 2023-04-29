"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.caterpillar = void 0;
const aggregation_objects_1 = require("./aggregation/aggregation-objects");
const gratzl_old_1 = require("./gratzl_old");
const d3 = require("d3");
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
            const actualCatGraph = d3.selectAll(".classCat");
            // When click again -> auxiliar tree disappearss.
            if (actualCatGraph
                .data()
                .map((k) => k.data.wrappedNodes[0].id)
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
                const treeCopy = d.copy();
                treeCopy.children = treeCopy.children.filter((e, i, arr) => !mainNodesData.includes(e.data.wrappedNodes[0].id));
                const treeLayoutCat = (0, gratzl_old_1.default)().size([35, 120]);
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
                    if ((0, aggregation_objects_1.isKeyNode)(datum.data.wrappedNodes[0])) {
                        classString += " keynode";
                    }
                    classString += " intent_" + (0, aggregation_objects_1.getNodeIntent)(d.data.wrappedNodes[0]);
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
exports.caterpillar = caterpillar;
//# sourceMappingURL=caterpillar.js.map