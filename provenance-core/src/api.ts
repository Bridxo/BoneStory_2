/**
 * String identifier for nodes (e.g., a generated UUID)
 */

import { ProvenanceGraph } from "./ProvenanceGraph";
import { SlideAnnotation } from './SlideAnnotation';

export type NodeIdentifier = string;

/**
 * Action can be either reversible or irreversible
 */
// export type Action = ReversibleAction | IrreversibleAction;
export type Action = ReversibleAction;

/**
 * ActionMetadata
 */
export interface ActionMetadata {
  /**
   * List of tags
   */
  tags?: string[];

  /**
   * The intent of the user to trigger this action
   */
  userIntent?: string;

  /**
   * Enable custom properties
   */
  [key: string]: any;
}

/**
 * NodeMetadata
 */
export interface NodeMetadata {
  /**
   * Username
   */
  createdBy: string;

  /**
   * UNIX timestamp
   */
  createdOn: number;

  /**
   * Enable custom properties
   */
  [key: string]: any;


  /**
   * HLEE added 1. Branch number (get branch number for slide conversion)
   * HLEE added 2. H_value (for Heirarchical Clustering tree value)
   * HLEE added 3. screenshot (for screenshot of the slide)
   * HLEE added 4. O_group (for O_group of the slide)
   */
  branchnumber: number;
  screenshot:string;
  H_value: number;
  O_group: string;
}

/**
 * Artifacts that are attached to a node
 */
export interface Artifacts {
  /**
   * Enable custom properties
   */
  [key: string]: any;
}

/**
 * Generic node
 */
export interface RootNode {
  /**
   * Node identifier
   */
  id: NodeIdentifier;

  /**
   * Label
   */
  label: string;

  /**
   * Node metadata
   */
  metadata: NodeMetadata;

  /**
   * Children
   */
  children: StateNode[];

  /**
   * Artifacts
   */
  artifacts: Artifacts;
}

/**
 * State node extending the RootNode
 */
export type StateNode = RootNode & {
  /**
   * Action
   */
  action: Action;

  /**
   * Action result
   */
  actionResult: any;

  /**
   * Parent node of this node
   */
  parent: ProvenanceNode;
};

/**
 * Provenance node generic type for both root and state nodes
 */
export type ProvenanceNode = RootNode | StateNode;

/**
 * Irreversible action that can only be applied, but cannot be reverted
 */
export interface IrreversibleAction {
  /**
   * Metadata (optional)
   */
  metadata?: ActionMetadata;

  /**
   * Function name to a registered function that is executed when applying an action
   */
  do: string;

  /**
   * Multiple arguments that are passed to the registered do function.
   * The arguments should be immutable!
   */
  doArguments: any[]; // should be immutable
}

/**
 * Reversible action that can be applied and reverted
 */
export interface ReversibleAction {
  /**
   * Metadata (optional)
   */
  metadata?: ActionMetadata;

  /**
   * Function name to a registered function that is executed when applying an action
   */
  do: string;

  /**
   * Multiple arguments that are passed to the registered do function.
   * The arguments should be immutable and serializable to json!
   */
  doArguments: any[];

  /**
   * Function name to a registered function that is executed when reverting an action
   */
  undo: string;

  /**
   * Multiple arguments that are passed to the registered do function.
   * The arguments should be immutable and serializable to json!
   */
  undoArguments: any[];
}

/**
 * Action function that can be registered and will be executed when applying an Action
 */
export type ActionFunction = (...args: any[]) => Promise<any>;

/**
 * Bundle of an ActionFunction with a reference to the `this` context
 */
export interface ActionFunctionWithThis {
  /**
   * Action function
   */
  func: ActionFunction;

  /**
   * Value to use as this (i.e the reference Object) when executing callback
   */
  thisArg: any;
}

/**
 * Metadata about the application
 */
export interface Application {
  /**
   * Application name
   */
  name: string;

  /**
   * Application version
   */
  version: string;
}

export type Handler = (event?: any) => void;

/**
 * Provenance graph stores the nodes, the current pointer and is bound to a specific application
 */
export interface IProvenanceGraph {
  /**
   * Application metadata
   */
  application: Application;

  /**
   * Pointer to the currently active node
   */
  current: ProvenanceNode;
  id: string;
  root: RootNode;

  /**
   * Add a new node to the provenance graph
   * @param node ProvenanceNode to add
   */
  addNode(node: ProvenanceNode): void;

  /**
   * Find a node by a given identifier and return the node if found
   * @param id ProvenanceNode identifier
   */
  getNode(id: NodeIdentifier): ProvenanceNode;

  emitNodeChangedEvent(node: ProvenanceNode): void;

  /**
   * Available events:
   * * nodeAdded, emitted when node is added via this.addNode()
   * * currentChanged, emitted when this.current is changed
   * * nodeChanged, emitted when this.emitNodeChangedEvent() is called
   *
   * @param type
   * @param handler
   */
  on(type: string, handler: Handler): void;
  off(type: string, handler: Handler): void;
  getSelf(): SerializedProvenanceGraph;
  restoreSelf(sgraph: SerializedProvenanceGraph): ProvenanceGraph;
}

/**
 * Action function registry stores all available functions that can be applied
 */
export interface IActionFunctionRegistry {
  /**
   * Add a new function to the registry
   * @param name The name of the new function to register
   * @param func Function that get called with the doArguments or undoArguments
   * @param thisArg Value to use as this (i.e the reference Object) when executing callback
   */
  register(name: string, func: ActionFunction, thisArg?: any): void;

  /**
   * Find a registered function by name and return the function if found
   * @param name Name of the registered function
   */
  getFunctionByName(name: string): ActionFunctionWithThis;
}

/**
 * The provenance tracker takes a action function registry.
 * New actions are executed and if successful stored as new StateNode in the graph.
 */
export interface IProvenanceTracker {
  /**
   * When acceptActions is false, the Tracker will ignore calls to applyAction
   */
  acceptActions: boolean;
  /**
   * Action function registry
   */
  registry: IActionFunctionRegistry;

  // screenShotProvider: IScreenShotProvider | null;

  /**
   * If true, adds a screenshot to all provenance nodes metadata
   * (if screenShotProvider is set)
   */
  // autoScreenShot: boolean;

  /**
   * 1. Calls the action.do function with action.doArguments
   * 2. Append action to graph via a StateEdge and StateNode
   * 3. Makes the created StateNode the current state node
   *
   * @param action
   * @param skipFirstDoFunctionCall If set to true, the do-function will not be called this time,
   *        it will only be called when traversing.
   */
  applyAction(action: Action, skipFirstDoFunctionCall: boolean): Promise<StateNode>;
}

/**
 * The traverser changes the current node in the provenance graph
 * and executes the undo/redo function while moving through the graph structure.
 */
export interface IProvenanceGraphTraverser {
  /**
   * trackingWhenTraversing === false disables tracking when traversing to prevent feedback.
   * When applying an action, the object we're tracking might trigger its event listeners. This
   * means that more Nodes are added to the ProvenanceGraph when traversing, which is most likely
   * unwanted behaviour.
   *
   * It will enable/disable immediately before/after calling the action. So if the event is emitted
   * asynchronously after the action, it will not work.
   */
  trackingWhenTraversing: boolean;

  graph: IProvenanceGraph;

  /**
   * Finds shortest path between current node and node with request identifer.
   * Calls the do/undo functions of actions on the path.
   *
   * @param id
   */
  toStateNode(id: NodeIdentifier, transitionTime?: number): Promise<ProvenanceNode | undefined>;

  /**
   * Available events:
   * * invalidTraversal, emitted when node is invalid to traverse to, because of a irreversible node or disconnected graph.
   *
   * @param type
   * @param handler
   */
  on(type: string, handler: Handler): void;
  off(type: string, handler: Handler): void;
}

export interface SerializedProvenanceGraph {
  nodes: SerializedProvenanceNode[];
  root: NodeIdentifier;
  application: Application;
  current: NodeIdentifier;
}

export interface SerializedRootNode {
  id: NodeIdentifier;
  children: NodeIdentifier[];
  label: string;
  metadata: NodeMetadata;
  artifacts: Artifacts;
}

export type SerializedStateNode = SerializedRootNode & {
  parent: NodeIdentifier;
  action: Action;
  actionResult: any;
};

export type SerializedProvenanceNode = SerializedStateNode | SerializedRootNode;

export interface ISlideAnnotation<T> {
  id: string;
  data: T | null;

  on(type: string, handler: Handler): any;
  off(type: string, handler: Handler): any;
}

export type SerializedProvenanceSlide = {
  node: string | null;
  name: string;
  duration: number;
  transitionTime: number;
  mainAnnotation: SlideAnnotation<any>[];
}

export type SerializedSlidedeck = {
  slides: SerializedProvenanceSlide[];
  id: string;
}

export interface IProvenanceSlide {
  id: string;
  node: ProvenanceNode | null;
  name: string;
  duration: number;
  transitionTime: number;
  annotations: SlideAnnotation<any>[];
  xPosition: number;
  metadata: any;

  addAnnotation(annotation: ISlideAnnotation<any>): void;
  removeAnnotation(annotation: ISlideAnnotation<any>): void;
}

export interface IProvenanceSlidedeck {
  /**
   * Application metadata
   */
  readonly application: Application;
  slides: IProvenanceSlide[];
  selectedSlide: IProvenanceSlide | null;
  graph: IProvenanceGraph;

  screenShotProvider: IScreenShotProvider | null;

  /**
   * If true, adds a screenshot to all slides
   * (if screenShotProvider is set)
   */
  autoScreenShot: boolean;

  addSlide(slide?: IProvenanceSlide, index?: number): IProvenanceSlide;
  removeSlide(slide: IProvenanceSlide): void;
  removeSlideAtIndex(index: number): void;
  moveSlide(indexFrom: number, indexTo: number, count?: number): void;
  next(): void;
  previous(): void;
  startTime(slide: IProvenanceSlide): number;
  slideAtTime(time: number): IProvenanceSlide | null;

  /**
   * Available events:
   * * slideAdded, emitted when slide is added via this.addSlide()
   * * slideSelected, emitted when this.selectedSlide is changed
   * * slidesMoved, emitted when this.moveSlide() is called
   * * slideRemoved, emitted when this.removeSlide() is called
   *
   * @param type
   * @param handler
   */
  on(type: string, handler: Handler): void;
  off(type: string, handler: Handler): void;
  serializeSelf(): SerializedSlidedeck;
  restoreSelf(
    serializedSlides: SerializedSlidedeck,
    traverser: IProvenanceGraphTraverser,
    graph: ProvenanceGraph,
    app: Application): IProvenanceSlidedeck;
}

export type IScreenShot = any;

/* A ScreenShotProvider provides screenshots from the application
   that can be attached to provenance nodes or to SlideDeck slides.
 */
export type IScreenShotProvider = () => IScreenShot;
