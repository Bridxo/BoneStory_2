import { ActionFunction, ActionFunctionRegistry } from '@visualstorytelling/provenance-core';
import { BrainvisCanvasComponent } from './brainvis-canvas.component';

const getActions = (canvas: BrainvisCanvasComponent): {[key: string]: ActionFunction} => ({
  CameraZoom: (args,within:number) => Promise.resolve(canvas.CameraZoom(args, within)),
  CameraMove: (args,within:number) => Promise.resolve(canvas.CameraMove(args, within)),
  CameraPan: (args,within:number) => Promise.resolve(canvas.CameraPan(args, within)),
  ViewpointRight: (args,within:number) => Promise.resolve(canvas.CameraMove(args, within)),
  ViewpointLeft: (args,within:number) => Promise.resolve(canvas.CameraMove(args, within)),
  ViewpointTop: (args,within:number) => Promise.resolve(canvas.CameraMove(args, within)),
  ViewpointBottom: (args,within:number) => Promise.resolve(canvas.CameraMove(args, within)),
  ViewpointFront: (args,within:number) => Promise.resolve(canvas.CameraMove(args, within)),
  ViewpointBack: (args,within:number) => Promise.resolve(canvas.CameraMove(args, within)),
  showObjects: (value: boolean) => Promise.resolve(canvas.showObjects = value),
  showSegmentedObjects: (value: boolean) => Promise.resolve(canvas.showObjects = value),
  SelectObject: (value: any[], valueb: any[], valuec: any[], valued: any[]) => Promise.resolve(canvas.selectObject = [value,valueb,valuec,valued]),
  TranslateObject: (value:any,within:number) => Promise.resolve(canvas.ObjectTrans(value,within)),
  RotateObject: (value: any, valueb: any,within:number) => Promise.resolve(canvas.ObjectRotate(value, valueb, within)),
  Annotation: (value: any, inter: any, undo: boolean) => Promise.resolve(canvas.Annotation(value, inter, undo)),
  Measurement: (value: any, undo: boolean) => Promise.resolve(canvas.Measurement(value, undo)),
});

export const registerActions = (registry: ActionFunctionRegistry, canvas: BrainvisCanvasComponent) => {
  const actions = getActions(canvas);

  Object.keys(actions).forEach(actionName => {
    registry.register(actionName, actions[actionName]);
  });
};
