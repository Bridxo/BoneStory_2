import { getNodeIntent, isKeyNode } from "./aggregation/aggregation-objects";
import { IHierarchyPointNodeWithMaxDepth } from "./gratzl";
import GratzlLayoutOld from "./gratzl_old";
import { IGroupedTreeNode } from "./utils";
import { ProvenanceNode } from "@visualstorytelling/provenance-core";
import { HierarchyPointLink } from "d3-hierarchy";
import { ProvenanceTreeVisualization } from "./provenance-tree-visualization";
import * as d3 from "d3";

export function caterpillar(
  updateNodes: d3.Selection<
    any,
    IHierarchyPointNodeWithMaxDepth<IGroupedTreeNode<ProvenanceNode>>,
    any,
    any
  >,
  treeNodes: IHierarchyPointNodeWithMaxDepth<
    IGroupedTreeNode<ProvenanceNode>
  >[],
  updatedLinks: d3.Selection<
    any,
    HierarchyPointLink<IGroupedTreeNode<ProvenanceNode>>,
    any,
    any
  >,
  provenanceTreeVisualization: ProvenanceTreeVisualization
) {
  if (provenanceTreeVisualization.caterpillarActivated) {
    const mainNodes = updateNodes.filter((d: any) => d.x === 0);
    const mainNodesData = mainNodes
      .data()
      .map((d: any) => d.data.wrappedNodes[0].id);

    // console.log(mainNodesData);

    const edgeNodes = mainNodes.filter((d: any) => {
      if (d.children) {
        return d.children.length > 1;
      }
      return false;
    });

    edgeNodes.select("circle").attr("class", "intent_wrapped");
    edgeNodes.select("rect").attr("class", "intent_wrapped");

    // Hide the rest of the circles and links
    updateNodes.filter((d: any) => d.x !== 0).attr("class", "node hiddenClass");

    updatedLinks
      .filter((d: any) => d.target.x !== 0)
      .attr("class", "node hiddenClass");

    // Set the label which indicate the number of nodes wrapped
    updateNodes
      .select("text.circle-text")
      .filter((d: any) => d.x !== 0)
      .attr("visibility", "visible");

    edgeNodes
      .select(".normal>text.circle-text")
      .attr("visibility", "visible")
      .text((d: any) => {
        const copyNode = d.copy();
        copyNode.children = copyNode.children.filter(
          (e: any, i: any, arr: any) =>
            !mainNodesData.includes(e.data.wrappedNodes[0].id)
        );
        return copyNode.descendants().length;
      })
      .attr("x", (d: any) => {
        const copyNode = d.copy();
        copyNode.children = copyNode.children.filter(
          (e: any, i: any, arr: any) =>
            !mainNodesData.includes(e.data.wrappedNodes[0].id)
        );
        if (copyNode.descendants().length < 10) {
          return -1.5;
        } else {
          return -3;
        }
      });

    // Set the radius of the circle
    edgeNodes.select("circle").attr("r", (d: any) => {
      return Math.min(4 + 0.15 * d.descendants().length, 6);
    });

    // Set the click function
    edgeNodes.on("click", (d: any) => {
      const actualCatGraph = d3.selectAll(".classCat");

      // When click again -> auxiliar tree disappearss.
      if (
        actualCatGraph
          .data()
          .map((k: any) => k.data.wrappedNodes[0].id)
          .includes(d.data.wrappedNodes[0].id)
      ) {
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
      } else {
        // else -> deploy the new tree.
        const treeCopy = d.copy();
        treeCopy.children = treeCopy.children.filter(
          (e: any, i: any, arr: any) =>
            !mainNodesData.includes(e.data.wrappedNodes[0].id)
        );
        const treeLayoutCat = GratzlLayoutOld<
          IGroupedTreeNode<ProvenanceNode>
        >().size([35, 120]);
        const treeCat = treeLayoutCat(treeCopy, treeCopy);

        const excatNodes = provenanceTreeVisualization.g
          .selectAll("g.classCat")
          .data(treeCat.descendants(), (datum: any) =>
            datum.data.wrappedNodes.map((n: any) => n.id).join()
          );
        excatNodes.exit().remove();

        const catNodes = excatNodes
          .enter()
          .append("g")
          .attr("class", "classCat node branch-active ")
          .data(treeNodes)
          .attr("transform", (datum: any) =>
            datum.data.wrappedNodes[0].metadata.isSlideAdded
              ? `translate(${d.x - 3}, ${d.y})`
              : `translate(${d.x}, ${d.y})`
          );
        // .append('g')
        // .attr('class', 'classCat node branch-active ')
        // .attr('transform', (k: any) => `translate(${k.x}, ${k.y})`);

        catNodes.append("circle").attr("r", 3);

        // Fix the radius of the circles according to #nodes wrapped
        catNodes.select("circle").attr("r", (datum: any) => {
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
        catNodes.select("circle").attr("class", (datum: any) => {
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

        catNodes.on("click", datum =>
          provenanceTreeVisualization.traverser.toStateNode(
            datum.data.wrappedNodes[0].id,
            250
          )
        );

        // Set the #nodes-wrapped label
        catNodes
          .append("text")
          .attr("class", "circle-text")
          .attr("visibility", (datum: any) => {
            if (datum.data.wrappedNodes.length === 1) {
              return "hidden";
            } else {
              return "visible";
            }
          })
          .attr("x", (datum: any) => {
            if (datum.data.wrappedNodes.length >= 10) {
              return -3;
            }
            return -1.5;
          })
          .attr("y", 2)
          .text((datum: any) => datum.data.wrappedNodes.length.toString());

        // Set the links between circles
        const oldLinksCat = provenanceTreeVisualization.g
          .selectAll("path.linkCat")
          .data(treeCat.links(), (datum: any) =>
            datum.target.data.wrappedNodes.map((n: any) => n.id).join()
          );

        oldLinksCat.exit().remove();

        const newLinksCat = oldLinksCat
          .enter()
          .insert("path", "g")
          .attr("d", provenanceTreeVisualization.linkPath as any);
        oldLinksCat
          .merge(newLinksCat as any)
          .attr("class", "link linkCat")
          .filter((datum: any) => datum.target.x === 0)
          .attr("class", "link active linkCat");
      } // end else actualgraph
    }); // end on click
  } // if of caterpillar procedure
}
