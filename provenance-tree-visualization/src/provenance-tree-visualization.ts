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
  public numberofnodeswocam : number = 0;
  public numberofnodeswcam: number = 0;
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
  public activeleave: any;
  public group_text_value: number = 1000;

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

    traverser.graph.on('currentChanged', async () => {
      await this.update();
      (window as any).slideDeckViz.onChange(this.activeleave);
      (window as any).slideDeckViz.provchanged(traverser.graph.current);
    });

    traverser.graph.on('nodeChanged', () => {
      this.update();
    });

    traverser.graph.on('nodeAdded', (event) => {
      this.currentHierarchyNodelength += 1.0;
      this.scaleToFit();
      this.numberofnodeswcam++;
      if(!cam_test(event.label)){
        this.numberofnodeswocam++;
      }
      else{
        this.camera_show = true;
        d3.select('#camera-trigger').style('color','#3f51b5');
      }

    });

    this.update();
    this.zoomer = d3.zoom() as any;
    this.setZoomExtent();
    this.svg.call(this.zoomer);
    this.svg.on('dblclick.zoom', (event) =>{return null;});
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
    const sliderElement = document.getElementById('provslider') as HTMLInputElement;
    sliderElement.value = '0';
    this.update();
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
      this.groupnumber = 0;
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
    provGraphControls(this);

  }

  public removeNodesAndLinkChildren<T>(tree: IGroupedTreeNode<T>, condition: (node: IGroupedTreeNode<T>) => boolean): IGroupedTreeNode<T> {
    const removeNodes = (node: IGroupedTreeNode<T>) => {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
  
        if (condition(child)&& !child.bookmarked) {
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
    removeNodes(tree);
  
    return tree;
  }
  public async deletesingleNode(): Promise<void> {
    if (this.traverser.graph.current.label === "root") return;

    else {
      const current_node = this.traverser.graph.current as any;
      const parent_node = current_node.parent;
      const parent_children = parent_node.children;
      const current_index = parent_children.indexOf(current_node);
      if(cam_test(current_node.label)){
        this.numberofnodeswocam--;
        this.numberofnodeswcam--;
      }
      else
        this.numberofnodeswcam--;
      
      this.traverser.toStateNode(parent_node.id, 0);
      if(current_node.metadata.bookmarked)
        (window as any).slideDeckViz.onDelete(null);
      
      parent_children.splice(current_index, 1);
      this.traverser.graph.current = parent_node;
      parent_node.children.push(...current_node.children);
      current_node.children.forEach((child: any) => {
        child.parent = parent_node;
      });
      if(current_node.children.length > 0){
        this.traverser.toStateNode(current_node.children[0].id, 0);
      }

      else
      {
        if(parent_node.children.length > 0)
          this.traverser.toStateNode(parent_node.children[0].id, 0);
        this.traverser.toStateNode(parent_node.id, 0);
      }


    } 
  }
  public async deleteNode(): Promise<void> {
    if (this.traverser.graph.current.label === "root") return;
  
    if (this.traverser.graph.current.label !== 'root') {
      const current_node = this.traverser.graph.current as any;
      const parent_node = current_node.parent;
      const parent_children = parent_node.children;
      const current_index = parent_children.indexOf(current_node);
  
      const deleteChildrenRecursively = (node: any) => {
        if (node.children.length > 0) {
          node.children.forEach((child: any) => deleteChildrenRecursively(child));
        }
        node.children = [];
        if(cam_test(node.label)){
          this.numberofnodeswocam--;
          this.numberofnodeswcam--;
        }

        else
          this.numberofnodeswcam--;

        if(node.metadata.bookmarked)
          (window as any).slideDeckViz.onDelete(null);
      };
  
      deleteChildrenRecursively(current_node);
      parent_children.splice(current_index, 1);
      if(parent_node.children.length > 0)
        this.traverser.toStateNode(parent_node.children[0].id, 0);
      this.traverser.toStateNode(parent_node.id, 0);
    }
  }
  
  
  public Grouping_hierarchy<T>(wraproot: IGroupedTreeNode<ProvenanceNode>): d3.HierarchyNode<IGroupedTreeNode<ProvenanceNode>> {
    let hierarchyRoot = d3.hierarchy(wraproot);
    let allnodes = hierarchyRoot.descendants().filter((d: any) => d.data.wrappedNodes[0].label !== 'Root' && d.data.depth !== 1);
    let branches = allnodes.reduce((sum: number, node: any) => {
      if (node.data.children.length > 1) {
        return sum + node.data.children.length;
      } else {
        return sum;
      }
    }, 0);
    if(hierarchyRoot.children != undefined){
      hierarchyRoot.children!.forEach((child: any) => {
          branches++;
      });
    }
    
    allnodes = allnodes.filter((d:any) => d.parent.children.length == 1); // exclude branches merging
    allnodes.sort((a, b) => {
      return a.data.wrappedNodes[0].metadata.H_value - b.data.wrappedNodes[0].metadata.H_value;
    });
    
    console.log('======Before======')
    console.log(allnodes.map(node => node.depth));
    console.log(allnodes.map(node => node.data.wrappedNodes[0].metadata.H_value));
    console.log(allnodes.map(node => node.data.wrappedNodes[0].metadata.O_group));

    //size-calculation (왔다 갔다 할 경우 고려해야함)
    const uniqueValues = allnodes
    .filter(node => node.parent!.data.wrappedNodes[0].metadata.O_group != node.data.wrappedNodes[0].metadata.O_group && node.parent!.data.children.length == 1 && node.parent!.data.wrappedNodes[0].label != 'Root')
    .map(node => node.data.wrappedNodes[0].metadata.O_group);

    this.numberOfUniqueValues = uniqueValues.length + branches;
    // console.log('uniqueValues', uniqueValues);
    // console.log('branches', branches);


    const groupslicenodes = allnodes.slice(0, this.groupnumber);
    groupslicenodes.sort((a, b) => {return b.depth - a.depth});
    groupslicenodes.sort((a, b) => {return a.data.wrappedNodes[0].metadata.branchnumber - b.data.wrappedNodes[0].metadata.branchnumber})
    let Endnode = 0;
    let Startnode = 0;
    for(let i = 0; i<groupslicenodes.length; i++){
      if (groupslicenodes[i].data.wrappedNodes[0].metadata.branchnumber != groupslicenodes[i+1]?.data.wrappedNodes[0].metadata.branchnumber)
      {
        transferChildren(groupslicenodes[i].parent!.parent! as any, groupslicenodes[i].parent! as any, groupslicenodes[i] as any);
      }
      else if(groupslicenodes[i].depth - groupslicenodes[i+1]?.depth == 1){
        Startnode = i;
        Endnode = i+1;
        for(Endnode; Endnode<groupslicenodes.length; Endnode++){
          if(groupslicenodes[Endnode].depth - groupslicenodes[Endnode+1]?.depth != 1 || 
            groupslicenodes[Endnode].data.wrappedNodes[0].metadata.branchnumber != groupslicenodes[Endnode+1]?.data.wrappedNodes[0].metadata.branchnumber){
            break;
          }
        }
        transferChildren_2(groupslicenodes[Endnode].parent, groupslicenodes[Endnode],groupslicenodes[Startnode]);
        i = Endnode;
      }
      else{
        transferChildren(groupslicenodes[i].parent!.parent! as any, groupslicenodes[i].parent! as any, groupslicenodes[i] as any);
      }

    }

    hierarchyRoot = d3.hierarchy(wraproot); // Updated the treeRoot
    const g_nodes = groupslicenodes.map(node => node.data.wrappedNodes[0].metadata.H_value);
    this.group_text_value = Math.max(...g_nodes);
    console.log('======After======')
    console.log('HVALUE: ' + this.group_text_value);
    console.log(groupslicenodes);
    console.log(groupslicenodes.map(node => node.depth));
    console.log(groupslicenodes.map(node => node.data.wrappedNodes[0].metadata.H_value));
    console.log(groupslicenodes.map(node => node.data.wrappedNodes[0].metadata.O_group));

    return hierarchyRoot;
  }
  /**
   * @description Update the tree layout.
   */
  public update = ()  =>  {
    console.log('update');
    this.traverser.graph.root.children.forEach((child: any) => {
      child.metadata.H_value = 1000000;
    });
    let wrappedRoot = wrapNode(this.traverser.graph.root);
    let clonedWrappedRoot = wrapNode(this.traverser.graph.root);
    let camhideNodes = this.removeNodesAndLinkChildren(clonedWrappedRoot, node => node.camera === true); 

    let hierarchyRoot;
    // aggregateNodes(this.aggregation, wrappedRoot, this.traverser.graph.current);
    if (this.camera_show == true){
      // hierarchyRoot = d3.hierarchy(wrappedRoot); // Updated the treeRoot
      this.numberofnodes = this.numberofnodeswcam;
      hierarchyRoot = this.Grouping_hierarchy(wrappedRoot);
      
    }

    else{
      hierarchyRoot = d3.hierarchy(camhideNodes);
      if(cam_test(this.traverser.graph.current.label)){
        this.currentHierarchyNodelength = hierarchyRoot.path(this.keynode
          ).length;
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
    this.currentHierarchyNodelength = hierarchyRoot.path(currentHierarchyNode as d3.HierarchyNode<IGroupedTreeNode<ProvenanceNode>>).length;
    const tree = gratzl(hierarchyRoot, currentHierarchyNode as d3.HierarchyNode<IGroupedTreeNode<ProvenanceNode>>);
    this.hierarchyRoot = tree;
    const treeNodes = tree.descendants().filter((d: any) => d.data.wrappedNodes[0].metadata.option !== 'merged');
    const treemaxwidth = tree.descendants().map(function (item) {return item.x}).reduce(function(prev, current) {return (prev > current) ? prev : current});
    const treemaxlength = tree.descendants().map(function (item) {return item.y}).reduce(function(prev, current) {return (prev > current) ? prev : current});
    this.currentHierarchyMaxlength = treemaxlength;
    const oldNodes = this.g.selectAll('g').data(treeNodes, (d: any) => {
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
  let hoverTimeout: any;

    const updateNodes = newNodes.merge(oldNodes as any);
    updateNodes.selectAll('g.normal').remove();
    updateNodes.selectAll('g.bookmarked').remove();
    updateNodes.selectAll('.circle-text').remove();
    updateNodes.selectAll('.circle-label').remove();
    updateNodes.selectAll('.circle-img').remove();
    updateNodes.selectAll('.plan-label').remove();
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

    updateNodes
    .append('text')
    .attr('class', 'circle-label')
    .text(d => groupNodeLabel(d.data)) // .text(d => d.data.neighbour.toString())
    .attr('x', d => d.data.wrappedNodes.length<=4? 7:9)
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
    } else {
      return '';
    }
  })
  .on('mouseenter', function (d: any) {
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
          (thumbnail as HTMLElement).style.width = '50px';
          (thumbnail as HTMLElement).style.height = '50px';
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
      (thumbnail as HTMLElement).style.width = '15px';
      (thumbnail as HTMLElement).style.height = '15px';
    }
  });

    // other nodes to circle
    updateNodes
      .filter((d: any) => {
        return !d.data.wrappedNodes.some(
          (node: ProvenanceNode) => node.metadata.isSlideAdded
        );
      })
      .append('g')
      .attr('class', 'normal');


    updateNodes.on('contextmenu', async (d: any) => {
      if(d.data.wrappedNodes.length !=1)
        return;
      await this.traverser.toStateNode(d.data.wrappedNodes[0].id, 0);
      this.traverser.graph.current = this.traverser.graph.getNode(d.data.wrappedNodes[0].id);
      d.data.wrappedNodes[0].metadata.bookmarked = !d.data.wrappedNodes[0].metadata.bookmarked;
      if (!d.data.wrappedNodes[0].metadata.bookmarked) {
        (window as any).slideDeckViz.onDelete(null);
      } else {
        (window as any).slideDeckViz.onAdd(this.traverser.graph.current);
      }
      this.update();
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
        if(d.data.wrappedNodes.length == 1){
          const ref = d.data.wrappedNodes.includes(this.traverser.graph.current);
          return ref;
        }
      })
      .attr('class', 'node branch-active neighbour node-active');

    hierarchyRoot.leaves().forEach((node: any) => {
      if(node.data.wrappedNodes[0].metadata.mainbranch)
        this.activeleave = node;
    });
    updateNodes
      .select('g')
      .append((d: any) => {
        const isBookmarked = d.data.wrappedNodes.some((node: any) => {
          return node.metadata.bookmarked === true;
        });
        // Check if the node is bookmarked
        if (isBookmarked && d.data.wrappedNodes.length == 1) {
          // If yes, create a square shape
          return document.createElementNS(d3.namespaces.svg, 'rect');
        } 
        else {
          // Otherwise, create a circle shape
        if(d.data.wrappedNodes.length == 1) 
            return document.createElementNS(d3.namespaces.svg, 'circle');
        else { // ordinal creator
            // Initialize the colorScale array
            const colorScale: string[] = [];

            // Populate the colorScale array based on the conditions
            d.data.wrappedNodes.forEach((node: any) => {
              if (node.metadata.bookmarked === true) {
                colorScale.push('#a94442');
              } else if (node.label.includes('Camera') || node.label.includes('View')) {
                colorScale.push('#60aa85');
              } else if (node.label.includes('SelectObject')) {
                colorScale.push('#b8852c');
              } else if (node.label.includes('TranslateObject') || node.label.includes('RotateObject')) {
                colorScale.push('#286090');
              } else if (node.label.includes('Measurement')) {
                colorScale.push('#9210dd');
              }
            });

            // Create an array of objects containing label and value properties
            const data = d.data.wrappedNodes.map((node: any) => ({
              label: node, // Use the entire original node object as the label
              value: 1
            }));
            // Calculate pie chart data
            const pieChartData = d3.pie<{ label: object; value: number }>().value((d: any) => d.value)(data);
            const pieGroup = document.createElementNS(d3.namespaces.svg, 'g');
            pieChartData.reverse();
            const arc = d3.arc().outerRadius(getNodeSize(d.data)).innerRadius(0);
            let tempactive: SVGPathElement;
            // Iterate over the pie chart data and create the pie slices
            pieChartData.forEach((slice: any, index: number) => {

              const path = document.createElementNS(d3.namespaces.svg, 'path');
              const pathElement = path as SVGPathElement;
              pathElement.setAttribute('d', arc(slice) as string);
              pathElement.setAttribute('fill', colorScale[index]);
            
              // Add class to the path element based on the condition
              if (data[index].label === this.traverser.graph.current) {
                pathElement.setAttribute('class', 'node-activepie');
                tempactive = pathElement;
              }
            
              pathElement.addEventListener('click', async () => {
                if(tempactive)
                  tempactive.setAttribute('class', '');
                await this.traverser.toStateNode(data[index].label.id, 0); // set to 0 to all trans related work
            
                // Add class to the clicked path element
                pathElement.setAttribute('class', 'node-activepie');
                tempactive = pathElement;
              });
              pathElement.addEventListener('contextmenu', async (event: MouseEvent) => {
                await this.traverser.toStateNode(data[index].label.id, 0);
                this.traverser.graph.current = this.traverser.graph.getNode(data[index].label.id);
                data[index].label.metadata.bookmarked = !data[index].label.metadata.bookmarked;
                if (!data[index].label.metadata.bookmarked) {
                  (window as any).slideDeckViz.onDelete(null);
                } else {
                  (window as any).slideDeckViz.onAdd(this.traverser.graph.current);
                }
                this.update();
              });
              pieGroup.appendChild(path);
            });

            return pieGroup;
          }
          
        }
      })
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
    
    updateNodes.on('click', async (d,i) => {
      if(d.data.wrappedNodes.length > 1){
        // this.traverser.toStateNode(d.data.wrappedNodes[i].id, 0);
      }
      else if(d.data.wrappedNodes[0].id !== this.traverser.graph.current.id){
        await this.traverser.toStateNode(d.data.wrappedNodes[0].id, 0); // set to 0 to all trans related works
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

    // Raise each node in newNodes in reverse order
    updateNodes.nodes().slice().reverse().forEach(node => {
      d3.select(node).raise();
    });

    updateNodes.filter(function(d) { return !d.children; })
    .append('text')
    .attr('class', 'plan-label')
    .attr('dy', '2.0em')
    .style('fill', 'red')
    .attr('visibility', 'visible')
    .attr('text-anchor', function(d) { return d.children ? 'end' : 'start'; })
    .text(function(d) { return d.children ? '' : 'Plan ' + (d.data.wrappedNodes[0].metadata.branchnumber + 1); });

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
  } // end update

  public getTraverser(): ProvenanceGraphTraverser {
    return this.traverser;
  }
}