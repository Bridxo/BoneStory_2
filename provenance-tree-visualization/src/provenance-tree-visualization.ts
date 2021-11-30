import * as d3 from 'd3';
import { HierarchyPointNode } from 'd3';
import { ProvenanceGraphTraverser, ProvenanceNode } from '@visualstorytelling/provenance-core';

import gratzl from './gratzl';
import { IHierarchyPointNodeWithMaxDepth } from './gratzl';
import { IGroupedTreeNode } from './utils';
import { NodeAggregator } from './aggregation/aggregation-implementations';

import {
  getNodeIntent,
  getNodeRenderer,
  groupNodeLabel,
  isKeyNode,
  rawData,
  wrapNode,
  plotTrimmerC,
  plotTrimmerG
} from './aggregation/aggregation-objects';
import { addAggregationButtons } from './components';
import { findHierarchyNodeFromProvenanceNode } from './aggregation/aggregation';
import { caterpillar } from './caterpillar';

var xScale = -20;
var yScale = 20;
var treeWidth = 0;
var maxtreeWidth = 10;
var p = 3;
const fontSize = 8;

export type D3SVGSelection = d3.Selection<SVGSVGElement, any, null, undefined>;
export type D3SVGGSelection = d3.Selection<SVGGElement, any, null, undefined>;

export interface IAggregation {
  aggregator: NodeAggregator<ProvenanceNode>;
  arg: any;
}

/**
 * @description Class used to create and manage a provenance tree visualization.
 * @param traverser {ProvenanceGraphTraverser} - To manage the data structure of the graph.
 * @param svg {D3SVGSelection} - To manage the graphics of the tree.
 * @param _dataAggregation {aggregator<ProvenanceNode>} - Data aggregation in use.
 * @param caterpillarActivated {boolean} - True if this feature is enable.
 */
export class ProvenanceTreeVisualization {
  public traverser: ProvenanceGraphTraverser;
  public colorScheme: any;
  public g: D3SVGGSelection;
  public svg: D3SVGSelection;
  public container: any;
  public aggregation: IAggregation = {
    aggregator: rawData,
    arg: 1
  };
  public caterpillarActivated = false;
  private hierarchyRoot:
    | IHierarchyPointNodeWithMaxDepth<IGroupedTreeNode<ProvenanceNode>>
    | undefined;

  private zoomer: any;
  private currentHierarchyNodelength: any = 0;
  
  private TreeLength: any = 0;
  private TreeWidth: any = 0.1;

  public mergingEnabled: boolean = false;
  public transferringEnabled: boolean = false;
  public copyingEnabled: boolean = false;

  constructor(traverser: ProvenanceGraphTraverser, elm: HTMLDivElement) {
    this.traverser = traverser;
    this.colorScheme = d3.scaleOrdinal(d3.schemeAccent);
    this.container = d3.select(elm)
      .append('div')
      .attr('class', 'visualizationContainer')
      .attr('style', 'height:' + `${window.innerHeight - 178}` + 'px');

    // provGraphControls(this);

    // Append svg element
    this.svg = this.container
      .append('div')
      .attr('style', ' width: 95%; margin-left:5px;flex: 4')
      .append('svg')
      .attr(
        'style',
        `overflow: visible; width: 100%; height: 100%; font-size: ${fontSize}px; line-height: ${fontSize}px`
      );

    this.g = this.svg.append('g');

    // Append grouping buttons
    addAggregationButtons(this.container, this);

    traverser.graph.on('currentChanged', () => {
      this.update();
    });

    traverser.graph.on('nodeChanged', () => {
      this.update();
    });

    traverser.graph.on('nodeAdded', () => {
      this.currentHierarchyNodelength += 1.0;
      this.scaleToFit();
    });

    this.update();
    this.zoomer = d3.zoom() as any;
    this.setZoomExtent();
    this.svg.call(this.zoomer);
  }
  public setZoomExtent() {
    this.zoomer.scaleExtent([0.25, 2.5]).on('zoom', () => {
      this.g.attr('transform', (d3 as any).event.transform);
    });
    this.scaleToFit();
  }

  public scaleToFit() {
    const sizeX = this.svg.node()!.clientWidth;
    const sizeY = this.svg.node()!.clientHeight;
    const maxScale = 3;
    const magicNum = 0.75; // todo: get relevant number based on dimensions
    const relY = sizeY * 4 - (yScale * maxScale * this.currentHierarchyNodelength);
    // console.log(sizeY/2);
    // const scaleFactor = Math.min(
    //   maxScale,
    //   Math.pow(magicNum,this.y_zoom-maxScale) * maxScale 
    // );
    this.svg
      .transition()
      .duration(0)
      .call(this.zoomer.transform, () =>
        d3.zoomIdentity.translate(sizeX / 2, relY).scale(maxScale) // fix size
      );
  }

  public linkPath({
    source,
    target
  }: {
    source: HierarchyPointNode<IGroupedTreeNode<ProvenanceNode>>;
    target: HierarchyPointNode<IGroupedTreeNode<ProvenanceNode>>;
  }): string {
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
  public wrap(text: any, width: any) {
    text.each(function () {
      const words = text
        .text()
        .split(/(?=[A-Z])/)
        .reverse();
      let word,
        line = [],
        lineNumber = 0;
      const lineHeight = 1.0, // ems
        y = text.attr('y'),
        dy = 0;
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

  public getFullsizeview(): void {
    let sizeX = this.svg.node()!.clientWidth;
    let sizeY = this.svg.node()!.clientHeight;
    const maxScale = 3;
    let magicNum_W = 0.25;
    let magicNum_H = 0.7; // todo: get relevant number based on dimensions
    if(this.TreeLength<=14)
      magicNum_H = 1.4;
    else if(this.TreeLength<=24)
      magicNum_H = 1.3;
    else
      magicNum_H = 1.0;
    if(this.TreeWidth>=4)
      sizeX = sizeX + 100;
    //Need to Modify
    const scaleFactor = Math.min(
      maxScale,
      maxScale - (magicNum_H * (this.TreeLength)/15),
      maxScale - (magicNum_W * this.TreeWidth)
    ); // find the smallest scale(Length, Width, )
    this.svg
    .transition()
    .duration(0)
    .call(this.zoomer.transform, () =>
      d3.zoomIdentity.translate(sizeX / 2, 40).scale(scaleFactor) // fix size
    );
  }


  public setTraverser(traverser: ProvenanceGraphTraverser): void {
    this.traverser = traverser;
  }

  /**
   * @description Update the tree layout.
   */
  public update() {
    const wrappedRoot = wrapNode(this.traverser.graph.root);
    // aggregateNodes(this.aggregation, wrappedRoot, this.traverser.graph.current);
    const hierarchyRoot = d3.hierarchy(wrappedRoot); // Updated de treeRoot
    
    const currentHierarchyNode = findHierarchyNodeFromProvenanceNode(
      hierarchyRoot,
      this.traverser.graph.current
    );
    this.currentHierarchyNodelength = hierarchyRoot.path(currentHierarchyNode).length;
    const tree = gratzl(hierarchyRoot, currentHierarchyNode);
    this.hierarchyRoot = tree;
    // console.log(tree);
    const treeNodes = tree.descendants().filter((d: any) => d.data.wrappedNodes[0].metadata.option !== 'merged');
    const treemaxwidth = tree.descendants().map(function (item) {return item.x}).reduce(function(prev, current) {return (prev > current) ? prev : current});
    const treemaxlength = tree.descendants().map(function (item) {return item.y}).reduce(function(prev, current) {return (prev > current) ? prev : current});
    const oldNodes = this.g.selectAll('g.node').data(treeNodes, (d: any) => {
      const data = d.data.wrappedNodes.map((n: any) => n.id).join();
      return data;
    });
    // console.log(treemaxwidth);
    this.TreeWidth = Math.max(this.TreeWidth,treemaxwidth);
    this.TreeLength = Math.max(this.TreeLength,treemaxlength);
    oldNodes.exit().remove();
    // group wrapping a node
    const newNodes = oldNodes
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr(
        'transform',
        (d: any) => `translate(${d.x * xScale}, ${d.y * yScale})`
      );

    // node label
    newNodes
      .append('text')
      .attr('class', 'circle-label')
      .text(d => groupNodeLabel(d.data)) // .text(d => d.data.neighbour.toString())
      .attr('x', 7)
      .attr('alignment-baseline', 'central');
    // .call(this.wrap, 70);

    const updateNodes = newNodes.merge(oldNodes as any);

    updateNodes.selectAll('g.normal').remove();
    updateNodes.selectAll('g.bookmarked').remove();
    updateNodes.selectAll('.circle-text').remove();

    const getNodeSize = (node: IGroupedTreeNode<ProvenanceNode>) => {
      return Math.min(2.7 + 0.3 * node.wrappedNodes.length, 7);
    };

    // other nodes to circle
    updateNodes
      .filter((d: any) => {
        return !d.data.wrappedNodes.some(
          (node: ProvenanceNode) => node.metadata.isSlideAdded
        );
      })
      .append('g')
      .attr('class', 'normal');


    updateNodes.on('contextmenu', (d: any) => {
      this.traverser.graph.current = this.traverser.graph.getNode(d.data.wrappedNodes[0].id);
      this.update();
      d.data.wrappedNodes[0].metadata.bookmarked = !d.data.wrappedNodes[0].metadata.bookmarked;
      if (!d.data.wrappedNodes[0].metadata.bookmarked) {
        (window as any).slideDeck.onDelete(null, this.traverser.graph.current);
      } else {
        (window as any).slideDeck.onAdd(this.traverser.graph.current);
      }
    });


    // set classes on node
    updateNodes
        .attr('class', 'node')
        .filter((d: any) => {
        if (d.x === 0) {
          d.data.wrappedNodes[0].metadata.mainbranch = true;
        }
        return d.x === 0;
      })
      .attr('class', 'node branch-active')
      .filter((d: any) => {
        let neighbourNode: boolean = false;
        if ((this.traverser.graph.current as any).parent) {
          neighbourNode = (this.traverser.graph.current as any).parent === d.data.wrappedNodes[0] ? true : neighbourNode;
          d.data.wrappedNodes[0].metadata.neighbour = neighbourNode ? true : neighbourNode;
        }  
        if ((this.traverser.graph.current as any).children.length !== 0) {
          for (const child of (this.traverser.graph.current as any).children){
            neighbourNode = d.data.wrappedNodes.includes(child) ? true : neighbourNode;
            d.data.wrappedNodes[0].metadata.neighbour = neighbourNode ? true : neighbourNode;
          }
        }
        return neighbourNode;
      })      
      .attr('class', 'node branch-active neighbour');


      updateNodes
      .filter((d: any) => {
        const ref = d.data.wrappedNodes.includes(this.traverser.graph.current);
        return ref;
      })
      .attr('class', 'node branch-active neighbour node-active');


    updateNodes
      .select('g')
      .append('circle')
      .attr('class', (d: any) => {
        let classString = '';
        if (d.data.wrappedNodes[0].metadata.bookmarked === true) {
          classString += ' bookmarked';
        } else if (d.data.wrappedNodes[0].metadata.loaded === true) {
          classString += ' loaded';
        }
        if (isKeyNode(d.data.wrappedNodes[0])) {
          classString += ' keynode';
        }
        classString += ' intent_' + getNodeIntent(d.data.wrappedNodes[0]);
        return classString;
      })
      .attr('r', (d: any) => {
        let nodeSize: number = getNodeSize(d.data);
        if (d.data.wrappedNodes[0].metadata.neighbour === true) {
          nodeSize = getNodeSize(d.data) * 1.15;
        }
        if (d.data.wrappedNodes.includes(this.traverser.graph.current)) {
          nodeSize = getNodeSize(d.data) * 1.3;
        }
        return nodeSize;
      });



    // hide labels not in branch
    updateNodes
      .select('text.circle-label')
      .attr('class', (d: any) => 'circle-label renderer_' + getNodeRenderer(d.data.wrappedNodes[0]))
      .attr('visibility', (d: any) => (d.x === 0 ? 'visible' : 'hidden'));

    updateNodes.on('click', d => {
      if(d.data.wrappedNodes[0].id !== this.traverser.graph.current.id){
        this.traverser.toStateNode(d.data.wrappedNodes[0].id, 250);
        this.update();
      }
    });


    updateNodes
      .data(treeNodes)
      .transition()
      .duration(500)
      .attr(
        'transform',
        (d: any) => {
          if (d.x > treeWidth && treeWidth <= maxtreeWidth) {
            var classString = `translate(${d.x * xScale}, ${d.y * yScale})`;
            treeWidth = d.x;
            if (treeWidth % p) {
            }
          } else {
            var classString = `translate(${d.x * xScale}, ${d.y * yScale})`;
          }
          return classString;
        }
      );

    const oldLinks = this.g
      .selectAll('path.link')
      .data(tree.links()
        .filter((d: any) => d.target.data.wrappedNodes[0].metadata.option !== 'merged'),
        (d: any) => d.target.data.wrappedNodes.map((n: any) => n.id).join()
      );

    oldLinks.exit().remove();

    const newLinks = oldLinks
      .enter()
      .insert('path', 'g')
      .attr('d', (d: any) => this.linkPath(d));

    oldLinks
      .merge(newLinks as any)
      .attr('class', 'link')
      .filter((d: any) => d.target.x === 0)
      .attr('class', 'link active');

    oldLinks
      .merge(newLinks as any)
      .transition()
      .duration(500)
      .attr('d', (d: any) => this.linkPath(d));

    const updatedLinks = oldLinks.merge(newLinks as any);
    // console.log("--tree--");
    // console.log(tree);
    // console.log("--newLinks--");
    // console.log(newLinks);
    // console.log("--updateNodes--");
    // console.log(updateNodes);

    if (this.caterpillarActivated) {
      caterpillar(updateNodes, treeNodes, updatedLinks, this);
    }
  } // end update

  public getTraverser(): ProvenanceGraphTraverser {
    return this.traverser;
  }
}