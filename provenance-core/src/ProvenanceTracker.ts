import {
  StateNode,
  Action,
  IProvenanceTracker,
  IActionFunctionRegistry,
  IProvenanceGraph,
  ActionFunctionWithThis,
  ProvenanceNode,
  RootNode,
  IScreenShotProvider,
  SerializedProvenanceGraph
} from './api';
import { generateUUID, generateTimestamp } from './utils';
/**
 * Provenance Graph Tracker implementation
 *
 * @param graph The provenance graph to track (this will serve as storage construct)
 * @param current Optional parameter to set current node for importing a provenance graph that is non-empty
 *
 */
let bnum = 0;
export class ProvenanceTracker implements IProvenanceTracker {
  registry: IActionFunctionRegistry;

  /**
   * When acceptActions is false, the Tracker will ignore calls to applyAction
   */
  public acceptActions = true;

  private graph: IProvenanceGraph;
  private username: string;

  private _screenShotProvider: IScreenShotProvider | null = null;
  private _autoScreenShot = false;

  constructor(
    registry: IActionFunctionRegistry,
    graph: IProvenanceGraph,
    username: string = 'Unknown',
  ) {
    this.registry = registry;
    this.graph = graph;
    this.username = username;
  }

  /**
   * Calls the action.do function with action.doArguments. This will also create a new StateNode
   * in the graph corresponding to the action taken. Optionally, the label set in action.metadata.label
   * will be taken as the label for this node.
   *
   * @param action
   * @param skipFirstDoFunctionCall If set to true, the do-function will not be called this time,
   *        it will only be called when traversing.
   */
  async applyAction(action: Action, skipFirstDoFunctionCall: boolean = false): Promise<StateNode> {
    if (!this.acceptActions) {
      return Promise.resolve(this.graph.current as StateNode);
    }

    let label = '';
    if (action.metadata && action.metadata.label) {
      label = action.metadata.label;
    } else {
      label = action.do;
    }

    const createNewStateNode = (parentNode: ProvenanceNode, actionResult: any): StateNode => ({
      id: generateUUID(),
      label: label,
      metadata: {
        loaded: false,
        mainbranch: true,
        bookmarked: false,
        createdBy: this.username,
        createdOn: generateTimestamp(),
        branchnumber: 0,
        H_value: 0
      },
      action,
      actionResult,
      parent: parentNode,
      children: [],
      artifacts: {}
    });

    let newNode: StateNode;

    // Save the current node because the next block could be asynchronous
    const currentNode = this.graph.current;

    if (skipFirstDoFunctionCall) {
      newNode = createNewStateNode(this.graph.current, null);
    } else {
      // Get the registered function from the action out of the registry
      const functionNameToExecute: string = action.do;
      const funcWithThis: ActionFunctionWithThis = this.registry.getFunctionByName(
        functionNameToExecute
      );
      const actionResult = await funcWithThis.func.apply(funcWithThis.thisArg, action.doArguments);

      newNode = createNewStateNode(currentNode, actionResult);
    }
    //screen-shot part
    // if (this.autoScreenShot && this.screenShotProvider) {
    //   try {
    //     newNode.metadata.screenShot = this.screenShotProvider();
    //   } catch (e) {
    //     console.warn('Error while getting screenshot', e);
    //   }
    // }

    // When the node is created, we need to update the graph.
    currentNode.children.push(newNode);
    this.graph.addNode(newNode);
    //multiple story part
    if(currentNode.children.length>1)
    {
      bnum = bnum + 1;
      newNode.metadata.branchnumber = bnum;
    }
    else 
      newNode.metadata.branchnumber = currentNode.metadata.branchnumber;
    this.graph.current = newNode;
    //H-value calculation part
    newNode.metadata.H_value = this.H_value(newNode);
    console.log('bnum: ', bnum);
    console.log('H_value: ', newNode.metadata.H_value);
    return newNode;
  }

  normalizeValue(value: number, minValue: number, maxValue: number, newMinValue: number, newMaxValue: number): number {
    return (value - minValue) / (maxValue - minValue) * (newMaxValue - newMinValue) + newMinValue;
  }
  
  calculateDifference(pos1: number[], pos2: number[]): number {
    const xDiff = pos1[0] - pos2[0];
    const yDiff = pos1[1] - pos2[1];
    const zDiff = pos1[2] - pos2[2];
    return Math.sqrt(xDiff * xDiff + yDiff * yDiff + zDiff * zDiff);
  }

  H_value(NewNode: StateNode): number {
    let H_val = 0;
    type ActionLabels = keyof typeof onehot_action;
    const onehot_action = {
      'CameraMove': 0b0000000000000,
      'CameraPan': 0b0000000000000,
      'CameraZoom': 0b0010000000000,
      'Viewpoint': 0b0100000000000,
      'SelectObject': 0b0110000000000,
      'TranslateObject': 0b1000000000000,
      'RotateObject': 0b1010000000000,
      'Measurement': 0b1100000000000,
      'Annotation': 0b1110000000000,
    };
    const onehot_general = {
      'idle': 0b0000000000000000,
      'f0': 0b0010000000000000,
      'f1': 0b0100000000000000,
      'f2': 0b0110000000000000,
      'f3': 0b1000000000000000,
      'f4': 0b1010000000000000,
      'f5': 0b1100000000000000,
      'f6': 0b1110000000000000,
      'f7': 0b10000000000000000,
      'f8': 0b10010000000000000,
      'f9': 0b10100000000000000,
      'f10': 0b10110000000000000,
      'f11': 0b11000000000000000,
      'f12': 0b11010000000000000
    };

  // Find general value of the node.
  H_val += onehot_general['idle'];

  // Find action value of the node.
  H_val += onehot_action[NewNode.label as ActionLabels];

  // Calculate difference value of the node (parent comparison)
  try {
    const doArgs = NewNode.action.doArguments[0];
    const undoArgs = NewNode.action.undoArguments[0];
    const do_position = doArgs.position || doArgs.zoom || doArgs.rotation;
    const undo_position = undoArgs.position || undoArgs.zoom || undoArgs.rotation;

    if (do_position && undo_position) {
      const diff = this.calculateDifference(do_position, undo_position);
      const maxValue = NewNode.label === 'TranslateObject' ? 2000 : 5000;
      const normalizedValue = this.normalizeValue(diff, 0, maxValue, 0, 1023);
      H_val += normalizedValue;
    } else if (NewNode.label === 'RotateObject') {
      const diff = Math.abs(do_position[0] - undo_position[0]) + Math.abs(do_position[1] - undo_position[1]) + Math.abs(do_position[2] - undo_position[2]);
      const normalizedValue = this.normalizeValue(diff, 0, 1077, 0, 1023);
      H_val += normalizedValue;
    } else {
      H_val += 1023;
    }
  } catch (e) {
    console.log(e);
  }

  return H_val;
}

  get screenShotProvider() {
    return this._screenShotProvider;
  }

  set screenShotProvider(provider: IScreenShotProvider | null) {
    this._screenShotProvider = provider;
  }

  get autoScreenShot(): boolean {
    return this._autoScreenShot;
  }

  getGraph(): SerializedProvenanceGraph {
    return this.graph.getSelf();
  }

  set autoScreenShot(value: boolean) {
    this._autoScreenShot = value;
    if (value && !this._screenShotProvider) {
      console.warn('Setting autoScreenShot to true, but no screenShotProvider is set');
    }
  }
}
