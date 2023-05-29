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
        O_group: 'Idle',
        H_value: 0,
        screenshot: ''
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
    //artifact part 
    if((window as any).canvas.objstat != undefined)
      newNode.artifacts = JSON.parse(JSON.stringify((window as any).canvas.objstat));
    //screen-shot part
    newNode.metadata.screenshot = await this.ScreenShot();

    //Object group part
    if((window as any).canvas.selectedobj == undefined)
      newNode.metadata.O_group = 'Idle';
    else
      newNode.metadata.O_group = (window as any).canvas.selectedobj.name;
    //H-value calculation part
    newNode.metadata.H_value = this.H_value(newNode);

     //multiple story part
     if(currentNode.children.length>=1)
     {
       bnum = bnum + 1;
       newNode.metadata.branchnumber = bnum;
     }
     else 
       newNode.metadata.branchnumber = currentNode.metadata.branchnumber;
    // When the node is created, we need to update the graph.
    currentNode.children.push(newNode);
    this.graph.addNode(newNode);
   
    this.graph.current = newNode;

    return newNode;
  }

  normalizeValue(value: number, minValue: number, maxValue: number, newMinValue: number, newMaxValue: number): number {
    return (value - minValue) / (maxValue - minValue) * (newMaxValue - newMinValue) + newMinValue;
  }
  ScreenShot = async () => {
    let dataURL;
    const grid_temp = (window as any).canvas.gridHelper.visible;
    const axes_temp = (window as any).canvas.AxesHelper.visible;
    (window as any).canvas.gridHelper.visible = false;
    (window as any).canvas.AxesHelper.visible = false;
    (window as any).canvas.render();
    dataURL = (window as any).canvas.renderer.domElement.toDataURL('image/png');
    (window as any).canvas.gridHelper.visible = grid_temp;
    (window as any).canvas.AxesHelper.visible = axes_temp;
    // console.log(dataURL);
    return dataURL;
  }
  
  calculateDifference(pos1: any, pos2: any): number {
    let xDiff, yDiff, zDiff;
    if(pos1.x){
      xDiff = pos1.x - pos2.x;
      yDiff = pos1.y - pos2.y;
      zDiff = pos1.z - pos2.z;
    }
    else{
      xDiff = pos1[0] - pos2[0];
      yDiff = pos1[1] - pos2[1];
      zDiff = pos1[2] - pos2[2];
    }
    return Math.sqrt(xDiff * xDiff + yDiff * yDiff + zDiff * zDiff);
  }

  H_value(NewNode: StateNode): number {
    let H_val = 0;
    type ActionLabels = keyof typeof onehot_action;
    const onehot_action = {
      'Root':10,
      'CameraMove': 1,
      'CameraPan': 1,
      'CameraZoom': 1,
      'ViewpointFront': 1,
      'ViewpointBack': 1,
      'ViewpointLeft': 1,
      'ViewpointRight': 1,
      'ViewpointTop': 1,
      'ViewpointBottom': 1,
      'SelectObject': 2,
      'TranslateObject': 3.1,
      'RotateObject': 3.6,
      'Measurement': 6.6,
      'Annotation': 7.6
    };
  if(NewNode.metadata.O_group === NewNode.parent.metadata.O_group
    && NewNode.label === NewNode.parent.label)//같같
  {
    H_val += 0;
  }
  else if(NewNode.metadata.O_group === NewNode.parent.metadata.O_group
    && NewNode.label !== NewNode.parent.label)//같다
  {
    H_val += (Math.abs(onehot_action[NewNode.label as ActionLabels]-onehot_action[NewNode.parent.label as ActionLabels]) + 0.1) * 10000;
  }
  else // 다다
  {
    H_val += 100000;
  }
  // // Find general value of the node.
  // H_val += onehot_general['idle'];

  // // Find action value of the node.
  // H_val += onehot_action[NewNode.label as ActionLabels];

  // Calculate difference value of the node (parent comparison)
  try {
    const doArgs = NewNode.action.doArguments;
    const undoArgs = NewNode.action.undoArguments;


    if (doArgs && undoArgs && NewNode.label !=='SelectObject' && NewNode.label !=='Measurement' && NewNode.label !=='Annotation' && NewNode.label !=='RotateObject') {
      const do_position = doArgs[0].position || doArgs[1];
      const undo_position = undoArgs[0].position || undoArgs[1];
      const diff = this.calculateDifference(do_position, undo_position);
      const maxValue = NewNode.label === 'TranslateObject' ? 1000 : 5000;
      const normalizedValue = this.normalizeValue(diff, 0, maxValue, 0, 1023);
      H_val += normalizedValue;
    } else if (NewNode.label === 'RotateObject') {
      const do_position = doArgs;
      const undo_position = undoArgs;
      const diff = Math.abs(do_position[0]._x - undo_position[0]._x) + Math.abs(do_position[0]._y - undo_position[0]._y) + Math.abs(do_position[0]._z - undo_position[0]._z);
      const diff2 = this.calculateDifference(do_position[1], undo_position[1]);
      const normalizedValue = this.normalizeValue(diff+diff2, 0, 540+1500, 0, 1023);
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
