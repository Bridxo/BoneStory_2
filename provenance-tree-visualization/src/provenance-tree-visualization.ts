import * as d3 from 'd3';
import { HierarchyPointNode } from 'd3';
import { ProvenanceGraphTraverser, ProvenanceNode } from '@visualstorytelling/provenance-core';

import gratzl from './gratzl';
import { provGraphControls } from './controls';
import { IHierarchyPointNodeWithMaxDepth } from './gratzl';
import { IGroupedTreeNode,cam_test } from './utils';
import { NodeAggregator, transferToParent, transferChildren, transferChildren_2 } from './aggregation/aggregation-implementations';

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

declare const event: any;

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
  public camera_show: boolean = true;
  public colorScheme: any;
  public numberofnodes: number = 1;
  public numberOfUniqueValues: number = 1;
  public groupnumber: number = 0;
  public real_traverser: any;
  public g: D3SVGGSelection;
  public svg: D3SVGSelection;
  public container: any;
  public aggregation: IAggregation = {
    aggregator: rawData,
    arg: 1
  };
  public caterpillarActivated = false;
  public alt = true;


  private hierarchyRoot:
    | IHierarchyPointNodeWithMaxDepth<IGroupedTreeNode<ProvenanceNode>>
    | undefined;

  private zoomer: any;
  private currentHierarchyNodelength: any = 0;
  private currentHierarchyMaxlength: any = 0;
  private keynode: any;
  
  private TreeLength: any = 0;
  private TreeWidth: any = 0.1;

  private sizeX: any = window.innerWidth;
  private sizeY: any = window.innerHeight;

  public mergingEnabled: boolean = false;
  public transferringEnabled: boolean = false;
  public copyingEnabled: boolean = false;

  constructor(traverser: ProvenanceGraphTraverser, elm: HTMLDivElement) {
    this.traverser = traverser;
    this.colorScheme = d3.scaleOrdinal(d3.schemeAccent);
    this.container = d3.select(elm)
      .append('div')
      .attr('class', 'visualizationContainer')
      .attr('style', 'width: 100%; height:' + `${window.innerHeight}` + 'px');

    provGraphControls(this);

    // Append svg element
    this.svg = this.container
      .append('div')
      .append('svg')
      .attr(
        'style',
        `overflow: visible; width: 100%; height: 100%; font-size: ${fontSize}px; line-height: ${fontSize}px`
      );

    this.g = this.svg.append('g');

    // Append grouping buttons
    addAggregationButtons(this.container, this);

    // Disable dbclick zoom
    this.svg.on('dblclick.zoom', null);

    traverser.graph.on('currentChanged', () => {
      this.update();
      (window as any).slideDeckViz.onChange(traverser.graph.current);
      (window as any).slideDeckViz.provchanged(traverser.graph.current);


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
    this.zoomer = d3.zoom() as any;
    this.setZoomExtent();
    this.svg.call(this.zoomer);
  }
  public setZoomExtent() {
    this.zoomer.scaleExtent([0.1, 10]).on('zoom', () => {
      this.g.attr('transform', (d3 as any).event.transform);
    });
    this.scaleToFit();
  }

  public scaleToFit() {


    const maxScale = 3;
    const magicNum = 0.75; // todo: get relevant number based on dimensions
    this.sizeX = window.innerWidth * 0.2;
    this.sizeY = window.innerHeight;
    const margin = 0;
    const node_length = (this.currentHierarchyNodelength) * yScale * maxScale;
    const node_width = (this.TreeWidth) * xScale * maxScale;
    const node_max = Math.floor(this.sizeY / (yScale * maxScale));
    const trans_y = (node_length > this.sizeY)? (this.currentHierarchyNodelength - node_max + margin) * yScale * maxScale: -20;


    const scaleFactor = Math.min(
      maxScale,
      (magicNum * this.sizeY) / (this.currentHierarchyNodelength * yScale),
      (magicNum * this.sizeX) / (this.TreeWidth * -xScale)
    );

    this.svg
      .transition()
      .duration(0)
      .call(this.zoomer.transform, () =>
        d3.zoomIdentity.translate(this.sizeX / 2.1, -trans_y).scale(maxScale)
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

  public camerahide(): void {
    function find_noncameranode(c_trav : any) {
      let traverser = c_trav.graph.current;
      if(traverser.label === "root")
        return traverser;
      do{        
        const searchpattern = cam_test(traverser.label);
        if(!searchpattern)
          return traverser;
        traverser = traverser.parent;
        } while(traverser.label !== "root");
      return traverser;
    }
    this.camera_show = this.camera_show ? false : true;
    if(!this.camera_show){
      const closenode = find_noncameranode(this.traverser);
      this.traverser.toStateNode(closenode.id, 0);
    }
    this.update();
    this.getFullsizeview();
  }

  public getFullsizeview(): void {
    this.sizeX = window.innerWidth * 0.2;
    this.sizeY = window.innerHeight;
    const maxScale = 3;
    const margin = 0;
    const node_length = (this.currentHierarchyMaxlength + 1 + margin) * yScale * maxScale;
    const node_max = this.sizeY / node_length;
    //Need to Modify
    const tx = (this.TreeWidth >= 4) ? (this.sizeX / 1.8) : (this.sizeX / 2);
    const scaleFactor = Math.min(
      maxScale,
      maxScale * node_max,
      maxScale * this.sizeX / (this.TreeWidth * -xScale * 2.1 * maxScale)
    ); // find the smallest scale(Length, Width, )
    this.svg
    .transition()
    .duration(0)
    .call(this.zoomer.transform, () =>
      d3.zoomIdentity.translate(tx, 20).scale(scaleFactor) // fix size
    );
  }


  public setTraverser(traverser: ProvenanceGraphTraverser): void {
    this.traverser = traverser;
  }

  public removeNodesAndLinkChildren<T>(tree: IGroupedTreeNode<T>, condition: (node: IGroupedTreeNode<T>) => boolean): IGroupedTreeNode<T> {
    const removeNodes = (node: IGroupedTreeNode<T>) => {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
  
        if (condition(child)) {
          // Remove the node from the children array
          node.children.splice(i, 1);
  
          // Append the children of the removed node to the parent
          node.children.push(...child.children);
  
          // Decrement the index to recheck the same position after the update
          i--;
        } else {
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
  public Grouping_hierarchy<T>(wraproot: IGroupedTreeNode<ProvenanceNode>): d3.HierarchyNode<IGroupedTreeNode<ProvenanceNode>> {
    let hierarchyRoot = d3.hierarchy(wraproot);
    let allnodes = hierarchyRoot.descendants().filter((d: any) => d.data.wrappedNodes[0].label !== 'Root');
    let branches = allnodes.filter((d:any) => d.data.children.length > 1).length;
    let bookmarks = allnodes.filter((d:any) => d.data.wrappedNodes[0].metadata.bookmarked).length;
    allnodes = allnodes.filter((d:any) => d.parent.data.children.length == 1); // exclude branches merging
    allnodes.sort((a, b) => {
      return a.data.wrappedNodes[0].metadata.H_value - b.data.wrappedNodes[0].metadata.H_value;
    });
    
    console.log('======Before======')
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
    groupslicenodes.sort((a, b) => {return b.depth - a.depth});

    // Group nodes by branchnumber
    // const nodesByBranch = groupslicenodes.reduce((acc, node) => {
    //   const branchNumber :number = node.data.wrappedNodes[0].metadata.branchnumber;
    //   if (!acc[branchNumber]) {
    //     acc[branchNumber] = [];
    //   }
    //   acc[branchNumber].push(node);
    //   return acc;
    // }, {});

    // Extract values from nodesByBranch object into an array of arrays
    // const nodesByBranchArr = Object.values(nodesByBranch);

    // console.log(nodesByBranchArr);
    groupslicenodes.sort((a, b) => {return a.data.wrappedNodes[0].metadata.branchnumber - b.data.wrappedNodes[0].metadata.branchnumber})
    let Endnode = 0;
    let Startnode = 0;
    for(let i = 0; i<groupslicenodes.length; i++){
      if(groupslicenodes[i].depth - groupslicenodes[i+1]?.depth == 1){
        Startnode = i;
        Endnode = i+1;
        for(Endnode; Endnode<groupslicenodes.length; Endnode++){
          if(groupslicenodes[Endnode].depth - groupslicenodes[Endnode+1]?.depth != 1){
            break;
          }
        }
        transferChildren_2(groupslicenodes[Endnode].parent, groupslicenodes[Endnode],groupslicenodes[Startnode]);
        i = Endnode;
      }
      else{
        transferChildren(groupslicenodes[i].parent!.parent!.data as any, groupslicenodes[i].parent!.data as any, groupslicenodes[i].data as any);
      }

    }
    // groupslicenodes.forEach((node) => transferChildren(node.parent!.parent!.data as any, node.parent!.data as any, node.data as any));
    // for(let i = 0; i < this.groupnumber; i++){
    
    //   if (allnodes.length >= i && allnodes[i]?.parent?.data && allnodes[i].data) {
    //     transferChildren(allnodes[i].parent!.parent!.data, allnodes[i].parent!.data, allnodes[i].data);
    //   }
    //  }

    hierarchyRoot = d3.hierarchy(wraproot); // Updated the treeRoot
    allnodes = hierarchyRoot.descendants().filter((d: any) => d.data.wrappedNodes[0].label !== 'Root');
    allnodes.sort((a, b) => {
      return a.data.wrappedNodes[0].metadata.H_value - b.data.wrappedNodes[0].metadata.H_value;
    });
    console.log('======After======')
    console.log(groupslicenodes);
    console.log(allnodes.map(node => node.depth));
    console.log(allnodes.map(node => node.data.wrappedNodes[0].metadata.H_value));
    console.log(allnodes.map(node => node.data.wrappedNodes[0].metadata.O_group));

    return hierarchyRoot;
  }
  /**
   * @description Update the tree layout.
   */
  public update = ()  =>  {
    let wrappedRoot = wrapNode(this.traverser.graph.root);
    let clonedWrappedRoot = wrapNode(this.traverser.graph.root);
    let camhideNodes = this.removeNodesAndLinkChildren(clonedWrappedRoot, node => node.camera === true); 

    let hierarchyRoot;
    // aggregateNodes(this.aggregation, wrappedRoot, this.traverser.graph.current);
    if (this.camera_show == true)
      // hierarchyRoot = d3.hierarchy(wrappedRoot); // Updated the treeRoot
      hierarchyRoot = this.Grouping_hierarchy(wrappedRoot);
    else{
      hierarchyRoot = d3.hierarchy(camhideNodes);
      if(cam_test(this.traverser.graph.current.label)){
        this.currentHierarchyNodelength = hierarchyRoot.path(this.keynode
          ).length;
        this.scaleToFit();
        return ;
      }
    }
    let currentHierarchyNode;
    hierarchyRoot.each(node => {
      if (node.data.wrappedNodes.includes(this.traverser.graph.current)) {
        currentHierarchyNode = node;
      }
    });
    if (currentHierarchyNode === undefined) {
      this.traverser.toStateNode((this.traverser.graph.current as any).parent.id);
      return;
    }
    this.currentHierarchyNodelength = hierarchyRoot.path(currentHierarchyNode as d3.HierarchyNode<IGroupedTreeNode<ProvenanceNode>>).length;
    const tree = gratzl(hierarchyRoot, currentHierarchyNode as d3.HierarchyNode<IGroupedTreeNode<ProvenanceNode>>);
    this.hierarchyRoot = tree;
    const treeNodes = tree.descendants().filter((d: any) => d.data.wrappedNodes[0].metadata.option !== 'merged');
    const treemaxwidth = tree.descendants().map(function (item) {return item.x}).reduce(function(prev, current) {return (prev > current) ? prev : current});
    const treemaxlength = tree.descendants().map(function (item) {return item.y}).reduce(function(prev, current) {return (prev > current) ? prev : current});
    this.currentHierarchyMaxlength = treemaxlength;
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
    .append('foreignObject')
    .attr('class', 'circle-img')
    .attr('width', 15)
    .attr('height', 15)
    .attr('x', 7)
    .attr('y', -17)
    .html(d => {
      if (d.data.wrappedNodes[0].metadata.screenshot) {
        return `<div><img src="${d.data.wrappedNodes[0].metadata.screenshot}" width="15" height="15" /></div>`;
      } else {
        return '';
      }
    })
    
  
  newNodes
    .append('text')
    .attr('class', 'circle-label')
    .text(d => groupNodeLabel(d.data)) // .text(d => d.data.neighbour.toString())
    .attr('x', 7)
    .attr('alignment-baseline', 'central');

  // newNodes
  //   .append('text')
  //   .attr('class', 'depth-label')
  //   .text(d => (d.data.wrappedNodes.length > 1)?d.data.wrappedNodes.length:'') // .text(d => d.data.neighbour.toString())
  //   .attr('x', 0)
  //   .attr('alignment-baseline', 'central');

    // .call(this.wrap, 70);
    const updateNodes = newNodes.merge(oldNodes as any);

    updateNodes.selectAll('g.normal').remove();
    updateNodes.selectAll('g.bookmarked').remove();
    updateNodes.selectAll('.circle-text').remove();

    const getNodeSize = (node: any) => {
      let counter = 0;
      const countWrappedNodesRecursively = (currentNode: ProvenanceNode[]) => {
        counter += currentNode.length;
        currentNode.forEach((nodes: any) => {
            if (nodes.wrappedNodes) {
              countWrappedNodesRecursively(nodes.wrappedNodes as any);
            }
          });
      };
    
      countWrappedNodesRecursively(node.wrappedNodes);      
      
      return Math.min(2.7 + 0.6 * node.wrappedNodes.length, 7);
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
      this.traverser.toStateNode(d.data.wrappedNodes[0].id, 0);
      this.traverser.graph.current = this.traverser.graph.getNode(d.data.wrappedNodes[0].id);
      // this.update();
      // (window as any).slideDeckViz.onChange();
      d.data.wrappedNodes[0].metadata.bookmarked = !d.data.wrappedNodes[0].metadata.bookmarked;
      if (!d.data.wrappedNodes[0].metadata.bookmarked) {
        (window as any).slideDeckViz.onDelete(null, this.traverser.graph.current);
        this.traverser.graph.current.metadata.H_value-=50000;
      } else {
        (window as any).slideDeckViz.onAdd(this.traverser.graph.current);
        this.traverser.graph.current.metadata.H_value+=50000;
      }
      this.update();
    });

    updateNodes.on('dblclick', (d: any) => {
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
        .filter((d: any) => {
        if (d.x === 0) {
          d.data.wrappedNodes[0].metadata.mainbranch = true;
        }
        else {
          d.data.wrappedNodes[0].metadata.mainbranch = false;
        }
        return d.x === 0; 
      })
      .attr('class', 'node branch-active')
      .filter((d: any) => {
        let neighbourNode: boolean = false;
        if ((this.traverser.graph.current as any).parent) { // 위에 뭐가 있는지 확인
          neighbourNode = (this.traverser.graph.current as any).parent === d.data.wrappedNodes[0] ? true : neighbourNode; // 현 노드에 위가 있으면 네이버는 참
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
      .append((d: any) => {
        const isBookmarked = d.data.wrappedNodes.some((node: any) => {
          return node.metadata.bookmarked === true;
        });
        // Check if the node is bookmarked
        if (isBookmarked) {
          // If yes, create a square shape
          return document.createElementNS(d3.namespaces.svg, 'rect');
        } else {
          // Otherwise, create a circle shape
          return document.createElementNS(d3.namespaces.svg, 'circle');
        }
      })
      .on('dblclick.zoom', null)
      .attr('class', (d: any) => {
        let classString = '';
        const isBookmarked = d.data.wrappedNodes.some((node: any) => {
          return node.metadata.bookmarked === true;
        });
        if (isBookmarked) {
          classString += ' bookmarked';
        } else if (d.data.wrappedNodes[0].metadata.loaded === true) {
          classString += ' loaded';
        }
        if (isKeyNode(d.data.wrappedNodes[0])) {
          classString += ' keynode';
          this.keynode = d;
        }
        classString += ' intent_' + getNodeIntent(d.data.wrappedNodes[0]);
        return classString;
      })
      .attr('r', (d: any) => {
        let nodeSize: number = getNodeSize(d.data);
        if (d.data.wrappedNodes[0].metadata.neighbour === true) {
          nodeSize = getNodeSize(d.data) * 1;
        }
        if (d.data.wrappedNodes.includes(this.traverser.graph.current)) {
          nodeSize = getNodeSize(d.data) * 1;
        }
        return nodeSize;
      })
      .attr('width', (d: any) => {
        // Set square width based on node size if bookmarked
        return getNodeSize(d.data) * 2;
      })
      .attr('height', (d: any) => {
        // Set square height based on node size if bookmarked
        return getNodeSize(d.data) * 2;
      })
      .attr('x', (d: any) => {
        // Position square based on node size if bookmarked
        const isBookmarked = d.data.wrappedNodes.some((node: any) => {
          return node.metadata.bookmarked === true;
        });
        if (isBookmarked) {
          return -getNodeSize(d.data);
        }
        else
          return 7

      })
      .attr('y', (d: any) => {
        // Position square based on node size if bookmarked
        const isBookmarked = d.data.wrappedNodes.some((node: any) => {
          return node.metadata.bookmarked === true;
        });
        if (isBookmarked) {
          return -getNodeSize(d.data);
        }
        else
          return -17
      });
    // hide labels not in branch
    updateNodes
      .select('text.circle-label')
      .attr('class', (d: any) => 'circle-label renderer_' + getNodeRenderer(d.data.wrappedNodes[0]))
      .attr('visibility', (d: any) => (d.x === 0 ? 'visible' : 'hidden'));

    updateNodes
      .select('foreignObject.circle-img')
      .attr('class', (d: any) => 'circle-img renderer_' + getNodeRenderer(d.data.wrappedNodes[0]))
      .attr('visibility', (d: any) => (d.x === 0 ? 'visible' : 'hidden'));
    
    updateNodes.on('click', d => {
      
      if(d.data.wrappedNodes[0].id !== this.traverser.graph.current.id){
        this.traverser.toStateNode(d.data.wrappedNodes[0].id, 0); // set to 0 to all trans related works
      }
    });

    updateNodes
    .append('text')
    .attr('class', 'depth-label')
    .text(d => (d.data.wrappedNodes.length > 1)?d.data.wrappedNodes.length:'') // .text(d => d.data.neighbour.toString())
    .attr('x', -1)
    .attr('alignment-baseline', 'central');


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
    if (this.caterpillarActivated) {
      caterpillar(updateNodes, treeNodes, updatedLinks, this);
    }
    this.real_traverser = updateNodes;
    // this.scaleToFit();
  } // end update

  public getTraverser(): ProvenanceGraphTraverser {
    return this.traverser;
  }
}