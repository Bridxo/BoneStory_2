import { ActionFunction, ActionFunctionRegistry } from '@visualstorytelling/provenance-core';
import { BrainvisCanvasComponent } from './brainvis-canvas.component';

const getActions = (canvas: BrainvisCanvasComponent): {[key: string]: ActionFunction} => ({
  CameraZoom: (args) => Promise.resolve(canvas.CameraZoom(args, 500)),
  CameraMove: (args) => Promise.resolve(canvas.CameraMove(args, 500)),
  CameraPan: (args) => Promise.resolve(canvas.CameraPan(args, 500)),
  ViewpointRight: (args) => Promise.resolve(canvas.CameraMove(args, 500)),
  ViewpointLeft: (args) => Promise.resolve(canvas.CameraMove(args, 500)),
  ViewpointTop: (args) => Promise.resolve(canvas.CameraMove(args, 500)),
  ViewpointBottom: (args) => Promise.resolve(canvas.CameraMove(args, 500)),
  ViewpointFront: (args) => Promise.resolve(canvas.CameraMove(args, 500)),
  ViewpointBack: (args) => Promise.resolve(canvas.CameraMove(args, 500)),
  showObjects: (value: boolean) => Promise.resolve(canvas.showObjects = value),
  showSegmentedObjects: (value: boolean) => Promise.resolve(canvas.showObjects = value),
  SelectObject: (value: any[], valueb: any[], valuec: any[], valued: any[]) => Promise.resolve(canvas.selectObject = [value,valueb,valuec,valued]),
  TranslateObject: (value:any) => Promise.resolve(canvas.ObjectTrans(value,500)),
  rotateObject: (value: any, valueb: any) => Promise.resolve(canvas.ObjectRotate(value, valueb, 500)),
  Annotation: (value: any, inter: any, undo: any) => Promise.resolve(canvas.Annotation(value, inter, undo)),
  Measurement: (value: any, undo: any) => Promise.resolve(canvas.Measurement(value, undo)),
});

export const registerActions = (registry: ActionFunctionRegistry, canvas: BrainvisCanvasComponent) => {
  const actions = getActions(canvas);

  Object.keys(actions).forEach(actionName => {
    registry.register(actionName, actions[actionName]);
  });
};
