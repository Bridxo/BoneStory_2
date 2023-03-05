(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3'), require('@visualstorytelling/provenance-core')) :
  typeof define === 'function' && define.amd ? define(['exports', 'd3', '@visualstorytelling/provenance-core'], factory) :
  (global = global || self, factory(global.provenanceTreeVisualization = {}, global.d3, global.provenanceCore));
}(this, (function (exports, d3, provenanceCore) { 'use strict';

  function depthSort(a, b) {
      if (a.maxDescendantDepth > b.maxDescendantDepth) {
          return -1;
      }
      else if (a.maxDescendantDepth < b.maxDescendantDepth) {
          return 1;
      }
      return 0;
  }
  function GratzlLayout(_root, _current) {
      var root = _root;
      var current = _current;
      var widths = [];
      // const maxY = Math.max.apply(null, root.leaves().map((leaf) => leaf.depth));
      function setTreeX(node, val) {
          node.x = val;
          node.y = node.depth;
          widths[node.depth] = val;
          if (node.children) {
              node
                  .leaves()
                  .sort(depthSort)
                  .forEach(function (leaf) {
                  if (typeof leaf.x === "undefined") {
                      var width = Math.max.apply(null, widths.slice(node.depth, leaf.depth + 1));
                      setTreeX(leaf, val > width ? val : width + 1);
                  }
              });
          }
          if (node.parent && typeof node.parent.x === "undefined") {
              setTreeX(node.parent, val);
          }
      }
      root.leaves().forEach(function (leaf) {
          leaf.ancestors().forEach(function (leafAncestor) {
              if (!leafAncestor.maxDescendantDepth ||
                  leaf.depth > leafAncestor.maxDescendantDepth) {
                  leafAncestor.maxDescendantDepth = leaf.depth;
              }
          });
      });
      /* start at the deepest (active) leaf of activeNode. */
      var deepestLeaf = current;
      deepestLeaf.leaves().forEach(function (leaf) {
          if (deepestLeaf.depth < leaf.depth) {
              deepestLeaf = leaf;
          }
      });
      setTreeX(deepestLeaf, 0);
      //
      // const maxX = Math.max.apply(null, widths);
      // const maxY = Math.max.apply(null, root.leaves().map((leaf) => leaf.depth));
      // root.each((node) => {
      //   sizeNode(node, maxX, maxY);
      // });
      return root;
      //
      // const tree: IGratzlLayout<Datum> = Object.assign(
      //   (_root: HierarchyNode<Datum>, _activeNode: HierarchyNode<Datum>) => {
      //     /*
      //   * set maxDescendantDepth on each node,
      //   * which is the depth of its deepest child
      //   *
      //   * */
      //
      //     const root = _root as IHierarchyPointNodeWithMaxDepth<Datum>;
      //     const activeNode = _activeNode as IHierarchyPointNodeWithMaxDepth<Datum>;
      //
      //     root.leaves().forEach((leaf) => {
      //       leaf.ancestors().forEach((leafAncestor) => {
      //         if (
      //           !leafAncestor.maxDescendantDepth ||
      //           leaf.depth > leafAncestor.maxDescendantDepth
      //         ) {
      //           leafAncestor.maxDescendantDepth = leaf.depth;
      //         }
      //       });
      //     });
      //
      //     /* rendering should start at the deepest leaf of activeNode. */
      //     let deepestLeaf = activeNode;
      //     activeNode.leaves().forEach((leaf) => {
      //       if (deepestLeaf.depth < leaf.depth) {
      //         deepestLeaf = leaf;
      //       }
      //     });
      //
      //     setTreeX(deepestLeaf, 0);
      //
      //     const maxX = Math.max.apply(null, widths);
      //     const maxY = Math.max.apply(null, root.leaves().map((leaf) => leaf.depth));
      //     root.each((node) => {
      //       sizeNode(node, maxX, maxY);
      //     });
      //
      //     return root;
      //   },
      //   {
      //     size: ((x: [number, number] | undefined) => {
      //       return x ? ((dx = +x[0]), (dy = +x[1]), tree) : [dx, dy];
      //     }) as any,
      //   },
      // );
      //
      // function sizeNode(
      //   node: IHierarchyPointNodeWithMaxDepth<any>,
      //   maxX: number,
      //   maxY: number,
      // ): void {
      //   node.x = maxX === 0 ? dx : dx - (dx / maxX) * node.xOffset;
      //   node.y = maxY === 0 ? dy : (dy / maxY) * node.depth;
      // }
      // return tree;
  }

  function provGraphControls(provenanceTreeVisualization) {
      var graph = provenanceTreeVisualization.traverser.graph;
      var traverser = provenanceTreeVisualization.traverser;
      document.onkeydown = keyPress;
      function keyPress(e) {
          var evtobj = window.event ? event : e;
          // ctrl + Z  / undo
          if (evtobj.keyCode === 38 && evtobj.altKey && graph.current.parent) {
              traverser.toStateNode(graph.current.parent.id, 250);
              provenanceTreeVisualization.update();
          }
          // ctrl + X  / go to the root
          else if (evtobj.keyCode === 88 && evtobj.altKey) {
              traverser.toStateNode(graph.root.id, 250);
          }
          // ctrl + A  / redo
          else if (evtobj.keyCode === 40 && evtobj.altKey && graph.current.children[0]) {
              for (var _i = 0, _a = graph.current.children; _i < _a.length; _i++) {
                  var child = _a[_i];
                  if (child.metadata.mainbranch) {
                      traverser.toStateNode(graph.current.children[0].id, 250);
                      provenanceTreeVisualization.update();
                  }
              }
          }
          // ctrl + Q  / add the current node to the story
          else if (evtobj.keyCode === 81 && evtobj.altKey) {
              graph.current.metadata.story = true;
              window.slideDeck.onAdd(graph.current);
          }
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
          provenanceTreeVisualization.update();
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
  var doNothing = function (currentNode, node, tests) { };

  /**
   * @description Getter for the user intent of the node selected.
   * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Node selected.
   * @returns Returns the Intent of the user for the node selected.
   */
  function getNodeIntent(node) {
      if (provenanceCore.isStateNode(node) &&
          node.action &&
          node.action.metadata &&
          node.action.metadata.userIntent) {
          return node.action.metadata.userIntent;
      }
      return "none";
  }
  function getNodeRenderer(node) {
      if (provenanceCore.isStateNode(node) &&
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
      if (!provenanceCore.isStateNode(node) ||
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
  var groupNodeLabel = function (node) {
      if (node.wrappedNodes.length === 1) {
          return node.wrappedNodes[0].label;
      }
      else {
          return node.wrappedNodes[0].label;
      }
  };
  /**
   * @description Wraps a node and its children recursively
   * in an extra IGroupedTreeNode; which can be manipulated for grouping etc,
   * without modifying the (provenance) node.
   * @param  node  {IGroupedTreeNode<ProvenanceNode>} - Node selected.
   */
  var wrapNode = function (node) {
      return {
          wrappedNodes: [node],
          children: node.children.map(wrapNode),
          plotTrimmerValue: -1,
          neighbour: false,
          bookmarked: false
      };
  };
  /**
   * @description Test placeholder.
   * @param a {IGroupedTreeNode<ProvenanceNode>} - Node #1 to be tested.
   * @param b {IGroupedTreeNode<ProvenanceNode>} - Node #2 to be tested.
   */
  var testNothing = function (a, b) { return false; };
  /**
   * @description Object of the interface DataAggregation<ProvenanceNode>.
   */
  var rawData = {
      name: "Raw data",
      tests: [testNothing],
      algorithm: doNothing,
      arg: false,
      description: "No algorithm is applied. The full provenance data is shown."
  };

  /**
   * @description Show the buttons of the user interface.
   */
  function addAggregationButtons(elm, provenanceTreeVisualization) {
      var container = elm.append('div').attr('class', 'container');
      var holder = provenanceTreeVisualization.container
          .append("div")
          .attr("class", "holder")
          .attr("id", "groupingContainer")
          .attr("style", "position: absolute; bottom: 25%; display:none;");
      // const holder = container.append('div');
      // addLegend(container);
      // addCommandsList(container);
      // addTasksList(container);
      // legendButton
      // const legendButton = provenanceTreeVisualization.container
      //   .append('button')
      //   .attr('id', 'minimap-trigger')
      //   .attr('class', 'mat-icon-button mat-button-base mat-primary')
      //   .attr('color', 'primary')
      //   .attr('style', 'position: absolute; color: orange; z-index: 1; bottom: 1%; left: 1%;')
      //   .attr('ng-reflect-color', 'primary')
      //   .on('mousedown', () => {
      //     const visible = d3.select("#legendContainer").style('display') === 'block';
      //     if (visible) {
      //       taskListButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
      //       commandsListButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
      //       legendButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
      //       d3.select("#legendContainer").style('display', 'none');
      //       d3.select("#commandsContainer").style('display', 'none');
      //       d3.select("#tasksContainer").style('display', 'none');
      //       provenanceTreeVisualization.update();
      //       // provenanceTreeVisualization.scaleToFit();
      //     } else {
      //       taskListButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
      //       commandsListButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
      //       legendButton.attr('class', 'mat-icon-button mat-button-base mat-primary checked')
      //       d3.select("#legendContainer").style('display', 'block');
      //       d3.select("#commandsContainer").style('display', 'none');
      //       d3.select("#tasksContainer").style('display', 'none');
      //       provenanceTreeVisualization.update();
      //       // provenanceTreeVisualization.scaleToFit();
      //     }
      //   });
      // legendButton
      //   .append('span')
      //   .attr('class', 'mat-button-wrapper')
      //   .append('mat-icon')
      //   .attr('class', 'mat-icon notranslate material-icons mat-icon-no-color')
      //   .attr('role', 'img')
      //   .attr('aria-hidden', 'true')
      //   .text('color_lens');
      // legendButton
      //   .append('div')
      //   .attr('class', 'mat-button-ripple mat-ripple mat-button-ripple-round')
      //   .attr('ng-reflect-centered', 'true')
      //   .attr('ng-reflect-disabled', 'false')
      //   .attr('ng-reflect-trigger', '[object HTMLButtonElement]');
      // legendButton
      //   .append('div')
      //   .attr('class', 'mat-button-focus-overlay');
      // const commandsListButton = provenanceTreeVisualization.container
      //   .append('button')
      //   .attr('id', 'minimap-trigger')
      //   .attr('class', 'mat-icon-button mat-button-base mat-primary')
      //   .attr('color', 'primary')
      //   .attr('style', 'position: absolute; color: orange; z-index: 1; bottom: 1%; left: 8%; ')
      //   .attr('ng-reflect-color', 'primary')
      //   .on('mousedown', () => {
      //     const visible = d3.select("#commandsContainer").style('display') === 'block';
      //     if (visible) {
      //       taskListButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
      //       commandsListButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
      //       legendButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
      //       d3.select("#legendContainer").style('display', 'none');
      //       d3.select("#commandsContainer").style('display', 'none');
      //       d3.select("#tasksContainer").style('display', 'none');
      //       provenanceTreeVisualization.update();
      //       // provenanceTreeVisualization.scaleToFit();
      //     } else {
      //       taskListButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
      //       commandsListButton.attr('class', 'mat-icon-button mat-button-base mat-primary checked')
      //       legendButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
      //       d3.select("#legendContainer").style('display', 'none');
      //       d3.select("#commandsContainer").style('display', 'block');
      //       d3.select("#tasksContainer").style('display', 'none');
      //       provenanceTreeVisualization.update();
      //       // provenanceTreeVisualization.scaleToFit();
      //     }
      //   });
      // commandsListButton
      //   .append('span')
      //   .attr('class', 'mat-button-wrapper')
      //   .append('mat-icon')
      //   .attr('class', 'mat-icon notranslate material-icons mat-icon-no-color')
      //   .attr('role', 'img')
      //   .attr('aria-hidden', 'true')
      //   .text('list');
      // commandsListButton
      //   .append('div')
      //   .attr('class', 'mat-button-ripple mat-ripple mat-button-ripple-round')
      //   .attr('ng-reflect-centered', 'true')
      //   .attr('ng-reflect-disabled', 'false')
      //   .attr('ng-reflect-trigger', '[object HTMLButtonElement]');
      // commandsListButton
      //   .append('div')
      //   .attr('class', 'mat-button-focus-overlay');
      // const taskListButton = provenanceTreeVisualization.container
      //   .append('button')
      //   .attr('id', 'minimap-trigger')
      //   .attr('class', 'mat-icon-button mat-button-base mat-primary')
      //   .attr('color', 'primary')
      //   .attr('style', 'position: absolute; color: orange; z-index: 1; bottom: 1%; left: 15%;')
      //   .attr('ng-reflect-color', 'primary')
      //   .on('mousedown', () => {
      //     const visible = d3.select("#tasksContainer").style('display') === 'block';
      //     if (visible) {
      //       taskListButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
      //       commandsListButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
      //       legendButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
      //       d3.select("#legendContainer").style('display', 'none');
      //       d3.select("#commandsContainer").style('display', 'none');
      //       d3.select("#tasksContainer").style('display', 'none');
      //       provenanceTreeVisualization.update();
      //       // provenanceTreeVisualization.scaleToFit();
      //     } else {
      //       taskListButton.attr('class', 'mat-icon-button mat-button-base mat-primary checked')
      //       commandsListButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
      //       legendButton.attr('class', 'mat-icon-button mat-button-base mat-primary')
      //       d3.select("#legendContainer").style('display', 'none');
      //       d3.select("#commandsContainer").style('display', 'none');
      //       d3.select("#tasksContainer").style('display', 'block');
      //       provenanceTreeVisualization.update();
      //       // provenanceTreeVisualization.scaleToFit();
      //     }
      //   });
      // taskListButton
      //   .append('span')
      //   .attr('class', 'mat-button-wrapper')
      //   .append('mat-icon')
      //   .attr('class', 'mat-icon notranslate material-icons mat-icon-no-color')
      //   .attr('role', 'img')
      //   .attr('aria-hidden', 'true')
      //   .text('done');
      // taskListButton
      //   .append('div')
      //   .attr('class', 'mat-button-ripple mat-ripple mat-button-ripple-round')
      //   .attr('ng-reflect-centered', 'true')
      //   .attr('ng-reflect-disabled', 'false')
      //   .attr('ng-reflect-trigger', '[object HTMLButtonElement]');
      // taskListButton
      //   .append('div')
      //   .attr('class', 'mat-button-focus-overlay');
      var HidecameraButton = provenanceTreeVisualization.container
          .append('button')
          .attr('id', 'camera-trigger')
          .attr('class', 'mat-icon-button mat-button-base mat-primary')
          .attr('color', 'primary')
          .attr('style', 'position: absolute; z-index: 1; top: 17%;')
          .attr('ng-reflect-color', 'primary')
          .on('mousedown', function () {
          if (provenanceTreeVisualization.traverser.graph.root) {
              provenanceTreeVisualization.camerahide();
          }
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
      var goToTheRootButton = provenanceTreeVisualization.container
          .append('button')
          .attr('id', 'root-trigger')
          .attr('class', 'mat-icon-button mat-button-base mat-primary')
          .attr('color', 'primary')
          .attr('style', 'position: absolute; z-index: 1; top: 2%;')
          .attr('ng-reflect-color', 'primary')
          .on('mousedown', function () {
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
      var upwardButton = provenanceTreeVisualization.container
          .append('button')
          .attr('id', 'upward-trigger')
          .attr('class', 'mat-icon-button mat-button-base mat-primary')
          .attr('color', 'primary')
          .attr('style', 'position: absolute; z-index: 1; top: 7%;')
          .attr('ng-reflect-color', 'primary')
          .on('mousedown', function () {
          if (provenanceTreeVisualization.traverser.graph.current.label !== 'Root') {
              provenanceTreeVisualization.traverser.toStateNode(provenanceTreeVisualization.traverser.graph.current.parent.id, 250);
              provenanceTreeVisualization.update();
          }
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
      var downwardButton = provenanceTreeVisualization.container
          .append('button')
          .attr('id', 'downward-trigger')
          .attr('class', 'mat-icon-button mat-button-base mat-primary')
          .attr('color', 'primary')
          .attr('style', 'position: absolute; z-index: 1; top: 12%;')
          .attr('ng-reflect-color', 'primary')
          .on('mousedown', function () {
          if (provenanceTreeVisualization.traverser.graph.current.children[0]) {
              for (var _i = 0, _a = provenanceTreeVisualization.traverser.graph.current.children; _i < _a.length; _i++) {
                  var child = _a[_i];
                  if (child.metadata.mainbranch) {
                      provenanceTreeVisualization.traverser.toStateNode(provenanceTreeVisualization.traverser.graph.current.children[0].id, 250);
                      provenanceTreeVisualization.update();
                  }
              }
          }
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
  }

  /**
   * @description Return the HierarchyNode corresponding to the ProvenanceNode.
   */
  function findHierarchyNodeFromProvenanceNode(hierarchyNode, currentNode) {
      var currentHierarchyNode;
      hierarchyNode.each(function (node) {
          if (node.data.wrappedNodes.includes(currentNode)) {
              currentHierarchyNode = node;
          }
      });
      if (currentHierarchyNode === undefined) {
          throw new Error("Cannot find current selected node in tree.");
      }
      return currentHierarchyNode;
  }

  function depthSort$1(a, b) {
      if (a.maxDescendantDepth > b.maxDescendantDepth) {
          return -1;
      }
      else if (a.maxDescendantDepth < b.maxDescendantDepth) {
          return 1;
      }
      return 0;
  }
  function GratzlLayoutOld() {
      var dx = 5;
      var dy = 50;
      var widths = [];
      function setTreeX(node, val) {
          node.xOffset = val;
          widths[node.depth] = val;
          if (node.children) {
              node
                  .leaves()
                  .sort(depthSort$1)
                  .forEach(function (leaf) {
                  if (typeof leaf.xOffset === "undefined") {
                      var width = Math.max.apply(null, widths.slice(node.depth, leaf.depth + 1));
                      setTreeX(leaf, val > width ? val : width + 1);
                  }
              });
          }
          if (node.parent && typeof node.parent.xOffset === "undefined") {
              setTreeX(node.parent, val);
          }
      }
      var tree = Object.assign(function (_root, _activeNode) {
          /*
           * set maxDescendantDepth on each node,
           * which is the depth of its deepest child
           *
           * */
          var root = _root;
          var activeNode = _activeNode;
          root.leaves().forEach(function (leaf) {
              leaf.ancestors().forEach(function (leafAncestor) {
                  if (!leafAncestor.maxDescendantDepth ||
                      leaf.depth > leafAncestor.maxDescendantDepth) {
                      leafAncestor.maxDescendantDepth = leaf.depth;
                  }
              });
          });
          /* rendering should start at the deepest leaf of activeNode. */
          var deepestLeaf = activeNode;
          activeNode.leaves().forEach(function (leaf) {
              if (deepestLeaf.depth < leaf.depth) {
                  deepestLeaf = leaf;
              }
          });
          setTreeX(deepestLeaf, 0);
          var maxX = Math.max.apply(null, widths);
          var maxY = Math.max.apply(null, root.leaves().map(function (leaf) { return leaf.depth; }));
          root.each(function (node) {
              sizeNode(node, maxX, maxY);
          });
          return root;
      }, {
          size: (function (x) {
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
                  var treeLayoutCat = GratzlLayoutOld().size([35, 120]);
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
                          ? "translate(" + (d.x - 3) + ", " + d.y + ")"
                          : "translate(" + d.x + ", " + d.y + ")";
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
                      if (isKeyNode(datum.data.wrappedNodes[0])) {
                          classString += " keynode";
                      }
                      classString += " intent_" + getNodeIntent(d.data.wrappedNodes[0]);
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

  var xScale = -20;
  var yScale = 20;
  var treeWidth = 0;
  var maxtreeWidth = 10;
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
          this.camera_show = true;
          this.aggregation = {
              aggregator: rawData,
              arg: 1
          };
          this.caterpillarActivated = false;
          this.currentHierarchyNodelength = 0;
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
          this.update = function () {
              var wrappedRoot = wrapNode(_this.traverser.graph.root);
              // aggregateNodes(this.aggregation, wrappedRoot, this.traverser.graph.current);
              var hierarchyRoot = d3.hierarchy(wrappedRoot); // Updated de treeRoot
              var currentHierarchyNode = findHierarchyNodeFromProvenanceNode(hierarchyRoot, _this.traverser.graph.current);
              _this.currentHierarchyNodelength = hierarchyRoot.path(currentHierarchyNode).length;
              var tree = GratzlLayout(hierarchyRoot, currentHierarchyNode);
              //I want to modify the tree -> for hide camera and view
              // const tree = tree_original.copy();
              _this.hierarchyRoot = tree;
              var treeNodes;
              var searchpattern = /Camera|View/;
              // console.log(tree);
              if (_this.camera_show == false) {
                  tree.each(function (node) {
                      if (searchpattern.test(node.data.wrappedNodes[0].label))
                          node.data.wrappedNodes[0].metadata.option = 'merged';
                  });
              }
              treeNodes = tree.descendants().filter(function (d) { return d.data.wrappedNodes[0].metadata.option !== 'merged'; });
              var treemaxwidth = tree.descendants().map(function (item) { return item.x; }).reduce(function (prev, current) { return (prev > current) ? prev : current; });
              var treemaxlength = tree.descendants().map(function (item) { return item.y; }).reduce(function (prev, current) { return (prev > current) ? prev : current; });
              var oldNodes = _this.g.selectAll('g.node').data(treeNodes, function (d) {
                  var data = d.data.wrappedNodes.map(function (n) { return n.id; }).join();
                  return data;
              });
              // console.log(treemaxwidth);
              _this.TreeWidth = Math.max(_this.TreeWidth, treemaxwidth);
              _this.TreeLength = Math.max(_this.TreeLength, treemaxlength);
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
                  .text(function (d) { return groupNodeLabel(d.data); }) // .text(d => d.data.neighbour.toString())
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
                  if (_this.traverser.graph.current.parent) { // 위에 뭐가 있는지 확인
                      neighbourNode = _this.traverser.graph.current.parent === d.data.wrappedNodes[0] ? true : neighbourNode; // 현 노드에 위가 있으면 네이버는 참
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
                  if (isKeyNode(d.data.wrappedNodes[0])) {
                      classString += ' keynode';
                  }
                  classString += ' intent_' + getNodeIntent(d.data.wrappedNodes[0]);
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
                  .attr('class', function (d) { return 'circle-label renderer_' + getNodeRenderer(d.data.wrappedNodes[0]); })
                  .attr('visibility', function (d) { return (d.x === 0 ? 'visible' : 'hidden'); });
              updateNodes.on('click', function (d) {
                  if (d.data.wrappedNodes[0].id !== _this.traverser.graph.current.id) {
                      _this.traverser.toStateNode(d.data.wrappedNodes[0].id, 250);
                      // (window as any).slideDeck.onChange(this.traverser.graph.current.metadata.branchnumber);
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
                  }
                  else {
                      var classString = "translate(" + d.x * xScale + ", " + d.y * yScale + ")";
                  }
                  return classString;
              });
              var oldLinks = _this.g
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
              if (_this.caterpillarActivated) {
                  caterpillar(updateNodes, treeNodes, updatedLinks, _this);
              }
              // this.scaleToFit();
          }; // end update
          this.traverser = traverser;
          this.colorScheme = d3.scaleOrdinal(d3.schemeAccent);
          this.container = d3.select(elm)
              .append('div')
              .attr('class', 'visualizationContainer')
              .attr('style', 'height:' + ("" + (window.innerHeight - 178)) + 'px');
          provGraphControls(this);
          // Append svg element
          this.svg = this.container
              .append('div')
              .attr('style', ' width: 95%; margin-left:5px;flex: 4')
              .append('svg')
              .attr('style', "overflow: visible; width: 100%; height: 100%; font-size: " + fontSize + "px; line-height: " + fontSize + "px");
          this.g = this.svg.append('g');
          // Append grouping buttons
          addAggregationButtons(this.container, this);
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
          this.zoomer.scaleExtent([0.25, 4]).on('zoom', function () {
              _this.g.attr('transform', d3.event.transform);
          });
          this.scaleToFit();
      };
      ProvenanceTreeVisualization.prototype.scaleToFit = function () {
          var _this = this;
          var maxScale = 3;
          var magicNum = 0.75; // todo: get relevant number based on dimensions
          this.sizeX = window.innerWidth * 0.2;
          this.sizeY = window.innerHeight;
          var margin = 0;
          var node_length = (this.currentHierarchyNodelength) * yScale * maxScale;
          var node_max = Math.floor(this.sizeY / (yScale * maxScale));
          var trans_y = (node_length > this.sizeY) ? (this.currentHierarchyNodelength - node_max + margin) * yScale * maxScale : -20;
          var scaleFactor = Math.min(maxScale, (magicNum * this.sizeY) / (this.currentHierarchyNodelength * yScale));
          this.svg
              .transition()
              .duration(0)
              .call(this.zoomer.transform, function () {
              return d3.zoomIdentity.translate(_this.sizeX / 2.1, -trans_y).scale(maxScale);
          });
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
      ProvenanceTreeVisualization.prototype.camerahide = function () {
          this.camera_show = this.camera_show ? false : true;
          this.update();
      };
      ProvenanceTreeVisualization.prototype.getFullsizeview = function () {
          var _this = this;
          this.sizeX = window.innerWidth * 0.2;
          this.sizeY = window.innerHeight;
          var maxScale = 3;
          var margin = 0;
          var node_length = (this.currentHierarchyNodelength + margin) * yScale * maxScale;
          var node_max = this.sizeY / node_length;
          //Need to Modify
          var scaleFactor = Math.min(maxScale, maxScale * node_max); // find the smallest scale(Length, Width, )
          this.svg
              .transition()
              .duration(0)
              .call(this.zoomer.transform, function () {
              return d3.zoomIdentity.translate(_this.sizeX / 2, 20).scale(scaleFactor);
          } // fix size
          );
      };
      ProvenanceTreeVisualization.prototype.setTraverser = function (traverser) {
          this.traverser = traverser;
      };
      ProvenanceTreeVisualization.prototype.getTraverser = function () {
          return this.traverser;
      };
      return ProvenanceTreeVisualization;
  }());

  exports.ProvenanceTreeVisualization = ProvenanceTreeVisualization;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=provenance-tree-visualization.umd.js.map
