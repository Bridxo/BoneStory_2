import { ActionFunction, ActionFunctionRegistry } from '@visualstorytelling/provenance-core';
import { BrainvisCanvasComponent } from './brainvis-canvas.component';

const getActions = (canvas: BrainvisCanvasComponent): {[key: string]: ActionFunction} => ({
  CameraZoom: (args) => Promise.resolve(canvas.CameraZoom(args, 500)),
  CameraMove: (args) => Promise.resolve(canvas.CameraMove(args, 500)),
  CameraPan: (args) => Promise.resolve(canvas.CameraPan(args, 500)),
  // setSlicePlaneOrientation: (position, direction) => Promise.resolve(canvas.setSlicePlanePosition({position, direction}, 500)),
  // setSlicePlaneZoom: (position, direction) => Promise.resolve(canvas.setSlicePlaneZoom({position, direction}, 500)),
  showSlice: (value: boolean) => Promise.resolve(canvas.showSlice = value),
  showObjects: (value: boolean) => Promise.resolve(canvas.showObjects = value),
  showSliceHandle: (value: boolean) => Promise.resolve(canvas.showSliceHandle = value),
  showSegmentedObjects: (value: boolean) => Promise.resolve(canvas.showObjects = value),
  selectObject: (value: any[], valueb: any[], valuec: any[], valued: any[]) => Promise.resolve(canvas.selectObject = [value,valueb,valuec,valued]),
  translateObject: (value:THREE.Vector3) => Promise.resolve(canvas.ObjectTrans(value,500)),
  rotateObject: (value: THREE.Vector3) => Promise.resolve(canvas.ObjectRotate(value, 500))
});

export const registerActions = (registry: ActionFunctionRegistry, canvas: BrainvisCanvasComponent) => {
  const actions = getActions(canvas);

  Object.keys(actions).forEach(actionName => {
    registry.register(actionName, actions[actionName]);
  });
};
