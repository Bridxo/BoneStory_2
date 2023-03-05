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
      let s_1 = new Vector3((startEvent as any).orientation.position[0],(startEvent as any).orientation.position[1],(startEvent as any).orientation.position[2]);
      let s_2 = new Vector3((event as any).orientation.position[0],(event as any).orientation.position[1],(event as any).orientation.position[2]);
      if(s_1.distanceTo(s_2)>1.0){
        switch(canvas.viewpoint_action){
          case 0:
            tracker.applyAction({
              metadata: {userIntent: 'exploration', screenshot: canvas.ScreenShot()},
              do: 'CameraMove',
              doArguments: [(event as any).orientation],
              undo: 'CameraMove',
              undoArguments: [(startEvent as any).orientation],
            });
            break;
          case 1:
            tracker.applyAction({
              metadata: {userIntent: 'exploration'},
              do: 'ViewpointTop',
              doArguments: [(event as any).orientation],
              undo: 'ViewpointTop',
              undoArguments: [(startEvent as any).orientation],
            });
            break;
          case 2:
            tracker.applyAction({
              metadata: {userIntent: 'exploration'},
              do: 'ViewpointBottom',
              doArguments: [(event as any).orientation],
              undo: 'ViewpointBottom',
              undoArguments: [(startEvent as any).orientation],
            });
            break;
          case 3:
            tracker.applyAction({
              metadata: {userIntent: 'exploration'},
              do: 'ViewpointLeft',
              doArguments: [(event as any).orientation],
              undo: 'ViewpointLeft',
              undoArguments: [(startEvent as any).orientation],
            });
            break;
          case 4:
            tracker.applyAction({
              metadata: {userIntent: 'exploration'},
              do: 'ViewpointRight',
              doArguments: [(event as any).orientation],
              undo: 'ViewpointRight',
              undoArguments: [(startEvent as any).orientation],
            });
            break;
          case 5:
            tracker.applyAction({
              metadata: {userIntent: 'exploration'},
              do: 'ViewpointFront',
              doArguments: [(event as any).orientation],
              undo: 'ViewpointFront',
              undoArguments: [(startEvent as any).orientation],
            });
            break;
          case 6:
            tracker.applyAction({
              metadata: {userIntent: 'exploration'},
              do: 'ViewpointBack',
              doArguments: [(event as any).orientation],
              undo: 'ViewpointBack',
              undoArguments: [(startEvent as any).orientation],
            });
            break;

        }
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
      const transEndListener =  debounce ((event) => {
        let s_1 = new Vector3((startEvent as any).position[0],(startEvent as any).position[1],(startEvent as any).position[2]);
        let s_2 = new Vector3((event as any).position[0],(event as any).position[1],(event as any).position[2]);
        if(s_1.distanceTo(s_2)>0){
          tracker.applyAction({
            metadata: {userIntent: 'selection'},
            do: 'TranslateObject',
            doArguments: [(event as any).position,0],
            undo: 'TranslateObject',
            undoArguments: [(startEvent as any).position,0],
            });
          }
        canvas.removeEventListener('transEnd', transEndListener);
      }, 0 , { trailing: true });
    canvas.addEventListener('transEnd',transEndListener);
  });
  
  canvas.addEventListener('rotationStart', (startEvent) => {
    const rotationEndListener = debounce ((event) => {
        tracker.applyAction({
          metadata: {userIntent: 'selection'},
          do: 'rotateObject',
          doArguments: [(event as any).rotation],
          undo: 'rotateObject',
          undoArguments: [(startEvent as any).rotation],
          })
      canvas.removeEventListener('rotationEnd', rotationEndListener);
        }, 0, { trailing: true });
  canvas.addEventListener('rotationEnd', rotationEndListener);
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
      do: 'SelectObject',
      doArguments: [val[0],val[1],val[2],val[3]], //  new , old, new color, old color
      undo: 'SelectObject',
      undoArguments: [val[1],val[0],val[3],val[2]] // return back old, new, old color, new color
    }, true);
  });


  canvas.addEventListener('annotation', (event) => {
    tracker.applyAction({
      metadata: {userIntent: 'provenance'},
      do: 'Annotation',
      doArguments: [(event as any).text, (event as any).inter], //  new , old, new color, old color
      undo: 'Annotation',
      undoArguments: ['', (event as any).inter, true] // return back old, new, old color, new color
    }, true);
  });
};
