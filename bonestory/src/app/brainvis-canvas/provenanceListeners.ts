// import { P } from '@angular/core/src/render3';
import { ProvenanceTracker} from '@visualstorytelling/provenance-core';
import { debounce } from 'lodash';
import { Vector3 } from 'three';
import { BrainvisCanvasComponent } from './brainvis-canvas.component';
import { registerActions } from './provenanceActions';


export const addListeners = (tracker: ProvenanceTracker, canvas: BrainvisCanvasComponent) => {

  /** This is a naive approach to resetting the canavas after a graph is imported Since I don't think this is necessary I did not implement it better */

  let elem = document.createElement('button');
  elem.setAttribute('id', 'fake');
  elem.style.display = "none";
  elem.addEventListener('click', resetCanavas);
  document.body.appendChild(elem);

  function resetCanavas(e: Event){
    registerActions(canvas.service.registry, canvas);
    addListeners(canvas.service.tracker, canvas);
    canvas.addEventListeners();
  }

  canvas.addEventListener('cameraStart', (startEvent) => {
    const cameraEndListener = (event) => {
      // console.log('hello---->'+ (startEvent as any).orientation.position);
      let s_1 = new Vector3((startEvent as any).orientation.position[0],(startEvent as any).orientation.position[1],(startEvent as any).orientation.position[2]);
      let s_2 = new Vector3((event as any).orientation.position[0],(event as any).orientation.position[1],(event as any).orientation.position[2]);
      // console.log('sumup--->'+  s_1.distanceTo(s_2));
      // console.log((event as any).orientation);
      if(s_1.distanceTo(s_2)>1.0){
        tracker.applyAction({
          metadata: {userIntent: 'exploration'},
          do: 'CameraMove',
          doArguments: [(event as any).orientation],
          undo: 'CameraMove',
          undoArguments: [(startEvent as any).orientation],
        });
      }

      canvas.removeEventListener('cameraEnd', cameraEndListener);
    };
    canvas.addEventListener('cameraEnd', cameraEndListener);
  });

  let zoomEndListener: EventListener = null;
  const zoomStartListener = (startEvent) => {
    canvas.removeEventListener('zoomEnd', zoomEndListener);
    zoomEndListener = debounce ((event) => {
      tracker.applyAction({
        metadata: {
          userIntent: 'exploration',
          value: (event as any).orientation
        },
        do: 'CameraZoom',
        doArguments: [(event as any).orientation],
        undo: 'CameraZoom',
        undoArguments: [(startEvent as any).orientation],
      }, true);
    }, 500, { trailing: true });
    canvas.addEventListener('zoomEnd', zoomEndListener);
  };
  canvas.addEventListener('zoomStart', debounce(zoomStartListener, 500, { leading: true }));


  canvas.addEventListener('transStart', (startEvent) => {
    const transEndListener = (event) => {
        tracker.applyAction({
          metadata: {userIntent: 'selection'},
          do: 'translateObject',
          doArguments: [(event as any).position],
          undo: 'translateObject',
          undoArguments: [(startEvent as any).position],
          })
      canvas.removeEventListener('transEnd', transEndListener);
    };
  canvas.addEventListener('transEnd',transEndListener);
  });

  canvas.addEventListener('rotationStart', (startEvent) => {
    const rotationEndListener = (event) => {
        tracker.applyAction({
          metadata: {userIntent: 'selection'},
          do: 'rotateObject',
          doArguments: [(event as any).rotation],
          undo: 'rotateObject',
          undoArguments: [(startEvent as any).rotation],
          });
      canvas.removeEventListener('rotationEnd', rotationEndListener);
    };
  canvas.addEventListener('rotationEnd',rotationEndListener);
  });

  canvas.showrotateObjectChange.subscribe(object => {
    tracker.applyAction({
      metadata: {userIntent: 'selection'},
      do: 'rotateObject',
      doArguments: [object],
      undo: 'rotateObject',
      undoArguments: [!object],
    }, true);
  });


  canvas.addEventListener('sliceOrientationChanged', (event: any) => {
    const { position, direction, oldPosition, oldDirection } = event.changes;
    tracker.applyAction({
      metadata: {userIntent: 'exploration'},
      do: 'setSlicePlaneOrientation',
      doArguments: [position, direction],
      undo: 'setSlicePlaneOrientation',
      undoArguments: [oldPosition, oldDirection],
    });
  });

  canvas.addEventListener('sliceZoomChanged', (event: any) => {
    const { position, direction, oldPosition, oldDirection } = event.changes;
    tracker.applyAction({
      metadata: {userIntent: 'exploration'},
      do: 'setSlicePlaneZoom',
      doArguments: [position, direction],
      undo: 'setSlicePlaneZoom',
      undoArguments: [oldPosition, oldDirection],
    });
  });

  canvas.showSliceChange.subscribe(val => {
    tracker.applyAction({
      metadata: {userIntent: 'configuration'},
      do: 'showSlice',
      doArguments: [val],
      undo: 'showSlice',
      undoArguments: [!val],
    }, true);
  });

  canvas.showSliceHandleChange.subscribe(val => {
    tracker.applyAction({
      metadata: {userIntent: 'configuration'},
      do: 'showSliceHandle',
      doArguments: [val],
      undo: 'showSliceHandle',
      undoArguments: [!val],
    }, true);
  });

  canvas.showObjectsChange.subscribe(val => {
    tracker.applyAction({
      metadata: {userIntent: 'configuration'},
      do: 'showObjects',
      doArguments: [val],
      undo: 'showObjects',
      undoArguments: [!val],
    }, true);
  });



  canvas.selectedObjectsChange.subscribe(val => {
    tracker.applyAction({
      metadata: {userIntent: 'configuration'},
      do: 'selectObject',
      doArguments: [val[0],val[1],val[2],val[3]],
      undo: 'selectObject',
      undoArguments: [val[1],val[0],val[3],val[2]]
    }, true);
  });
};
