import {
  IProvenanceGraphTraverser,
  ProvenanceNode,
  StateNode,
  IActionFunctionRegistry,
  IProvenanceGraph,
  NodeIdentifier,
  ActionFunctionWithThis,
  IProvenanceTracker,
  Handler
} from './api';
import { isReversibleAction, isStateNode, cam_test } from './utils';
import mitt from './mitt';

function isNextNodeInTrackUp(currentNode: ProvenanceNode, nextNode: ProvenanceNode): boolean {
  if (isStateNode(currentNode) && currentNode.parent === nextNode) {
    return true;
  } else if (isStateNode(nextNode) && nextNode.parent !== currentNode) {
    // This is a guard against the illegitimate use of this function for unconnected nodes
    /* istanbul ignore next */
    throw new Error('Unconnected nodes, you probably should not be using this function');
  } else {
    return false;
  }
}

function findPathToTargetNode(
  currentNode: ProvenanceNode,
  targetNode: ProvenanceNode,
  track: ProvenanceNode[],
  comingFromNode: ProvenanceNode = currentNode
): boolean {
  if (currentNode && currentNode === targetNode) {
    track.unshift(currentNode);
    return true;
  } else if (currentNode) {
    // Map the StateNodes in the children StateEdges
    const nodesToCheck: ProvenanceNode[] = [...currentNode.children];

    // Add the parent node to that same list
    /* istanbul ignore else */
    if (isStateNode(currentNode)) {
      nodesToCheck.push(currentNode.parent);
    }

    for (const node of nodesToCheck) {
      // If the node to check is in the track already, skip it.
      if (node === comingFromNode) {
        continue;
      }
      /* istanbul ignore else */
      if (findPathToTargetNode(node, targetNode, track, currentNode)) {
        track.unshift(currentNode);
        return true;
      }
    }
  }
  /* istanbul ignore next */
  return false;
}

class IrreversibleError extends Error {
  invalidTraversal = true;
}

export class ProvenanceGraphTraverser implements IProvenanceGraphTraverser {
  public graph: IProvenanceGraph;
  public tracker: IProvenanceTracker | null;
  /**
   * trackingWhenTraversing === false disables tracking when traversing to prevent feedback.
   * When applying an action, the object we're tracking might trigger its event listeners. This
   * means that more Nodes are added to the ProvenanceGraph when traversing, which is most likely
   * unwanted behaviour.
   *
   * It will enable/disable immediately before/after calling the action. So if the event is emitted
   * asynchronously after the action, it will not work.
   */
  public trackingWhenTraversing = false;
  private registry: IActionFunctionRegistry;
  private _mitt: any;
  private up: any;

  constructor(
    registry: IActionFunctionRegistry,
    graph: IProvenanceGraph,
    tracker: IProvenanceTracker | null = null
  ) {
    const w = window as any;
    this.registry = registry;
    this.graph = graph;
    this.tracker = tracker;
    this._mitt = mitt();
  }

  async executeFunctions(functionsToDo: ActionFunctionWithThis[], argumentsToDo: any[], artifactsToLoad: any[], transitionTimes: number[]) {
    let result;
    for (let i = 0; i < functionsToDo.length; i++) {
      const funcWithThis = functionsToDo[i];
      let promise;
      if (this.tracker && this.tracker.acceptActions && !this.trackingWhenTraversing) {
        this.tracker.acceptActions = false;
        //Fix problem with go back to node (time correction)
        if(funcWithThis.func.name != "SelectObject" && funcWithThis.func.name != "Annotation" && funcWithThis.func.name != "Measurement"){
          const argwithThis  = argumentsToDo[i];
          const duration_index = argwithThis.length - 1;
          argumentsToDo[i][duration_index] = transitionTimes[i];
        }
        promise = Promise.resolve(funcWithThis.func.apply(funcWithThis.thisArg, argumentsToDo[i])).then((window as any).canvas.Returnobjinfo(artifactsToLoad[i]));
        this.tracker.acceptActions = true;
      } else {
        promise = Promise.resolve(funcWithThis.func.apply(funcWithThis.thisArg, argumentsToDo[i])).then((window as any).canvas.Returnobjinfo(artifactsToLoad[i]));
      }
      result = await promise;
    }
    return result;
  } 

  /**
   * Finds shortest path between current node and node with request identifer.
   * Calls the do/undo functions of actions on the path.
   *
   * @param id Node identifier
   */
  async toStateNode(
    id: NodeIdentifier,
    transitionTime?: number
  ): Promise<ProvenanceNode | undefined> {
    const currentNode = this.graph.current;
    const targetNode = this.graph.getNode(id);

    if (currentNode === targetNode) {
      return Promise.resolve(currentNode);
    }

    const trackToTarget: ProvenanceNode[] = [];

    const success = findPathToTargetNode(currentNode, targetNode, trackToTarget);

    /* istanbul ignore if */
    if (!success) {
      throw new Error('No path to target node found in graph');
    }

    let functionsToDo: ActionFunctionWithThis[], argumentsToDo: any[], artifactsToLoad: any[];
    const transitionTimes: number[] = [];

    interface CustomError extends Error {
      invalidTraversal?: boolean;
    }

    try {
      const arg = this.getFunctionsAndArgsFromTrack(trackToTarget);
      functionsToDo = arg.functionsToDo;
      argumentsToDo = arg.argumentsToDo;
      artifactsToLoad = arg.artifactsToLoad;
      // functionsToDo.forEach((func: any) => {
      //   transitionTimes.push(transitionTime || 0);
      // });
      let last_cam = 0;
      let calcy = this.up? 0 : 1;
      functionsToDo.forEach((func: any, i) => {
        if(cam_test(trackToTarget[i + calcy].label))
          last_cam = i + calcy;
        if((trackToTarget[i + calcy].metadata.O_group != targetNode.metadata.O_group))
          transitionTimes.push(0);
        else
          transitionTimes.push(transitionTime || 0);
      });
      transitionTimes[last_cam] = transitionTime || 0;
    } catch (error) {
      const customError = error as CustomError;
      if (customError.invalidTraversal) {
        this._mitt.emit('invalidTraversal', targetNode);
        return undefined;
      } else {
        /* istanbul ignore next */
        throw customError; // should never happen
      }
    }
    const result = await this.executeFunctions(functionsToDo, argumentsToDo, artifactsToLoad, transitionTimes);
    this.graph.current = targetNode;
    return targetNode;
  }

  private getFunctionsAndArgsFromTrack(
    track: ProvenanceNode[]
  ): {
    functionsToDo: ActionFunctionWithThis[];
    argumentsToDo: any[];
    artifactsToLoad: any[];
  } {
    const functionsToDo: ActionFunctionWithThis[] = [];
    const argumentsToDo: any[] = [];
    const artifactsToLoad: any[] = [];

    for (let i = 0; i < track.length - 1; i++) {
      const thisNode = track[i];
      const nextNode = track[i + 1];
      this.up = isNextNodeInTrackUp(thisNode, nextNode);

      if (this.up) {
        /* istanbul ignore else */
        if (isStateNode(thisNode)) {
          if (!isReversibleAction(thisNode.action)) {
            throw new IrreversibleError('trying to undo an Irreversible action');
          }
          const undoFunc = this.registry.getFunctionByName(thisNode.action.undo);
          functionsToDo.push(undoFunc);
          argumentsToDo.push(thisNode.action.undoArguments);
          artifactsToLoad.push(thisNode.parent.artifacts);
        } else {
          /* istanbul ignore next */
          throw new Error('Going up from root? unreachable error ... i hope');
        }
      } else {
        /* istanbul ignore else */
        if (isStateNode(nextNode)) {
          const doFunc = this.registry.getFunctionByName(nextNode.action.do);
          functionsToDo.push(doFunc);
          argumentsToDo.push(nextNode.action.doArguments);
          artifactsToLoad.push(nextNode.artifacts);
        } else {
          /* istanbul ignore next */
          throw new Error('Going down to the root? unreachable error ... i hope');
        }
      }
    }

    return { functionsToDo, argumentsToDo , artifactsToLoad};
  }

  on(type: string, handler: Handler) {
    this._mitt.on(type, handler);
  }

  off(type: string, handler: Handler) {
    this._mitt.off(type, handler);
  }
}
