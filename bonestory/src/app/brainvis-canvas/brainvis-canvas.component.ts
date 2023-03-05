import { Component, Injectable, ElementRef, EventEmitter, Input, OnInit, Output, OnDestroy, HostListener, ViewChild, AfterViewInit } from '@angular/core';

import { fromEvent, Observable, ReplaySubject, Subscription } from 'rxjs';

import * as THREE from 'three';
import Annotation_2D from './annotation_2D';
import * as dat from 'dat.gui';

import { IOrientation, ISlicePosition } from './types';

import Trackball from './trackball';
// import SliceManipulatorWidget from './sliceManipulatorWidget';
// import MeshManipulatorWidget from './meshManipulatorWidget';
import STLLoader from './stlLoader';
import { IntersectionManager, StaticGeometryListener } from './intersectionManager';
import ObjectSelector from './objectSelector';


import { TransformControls } from 'three-stdlib/controls/TransformControls';

import { ProvenanceService } from '../provenance.service';
import { registerActions } from './provenanceActions';
import { addListeners } from './provenanceListeners';

import { AppComponent } from '../app.component';
import { add, filter } from 'lodash';

enum modes {
  Translation = 0,
  Rotation = 1,
  Cammode = 2,
  Annotationmode = 3
}

enum modes {
  Idle = 0,
  Top = 1,
  Bottom = 2,
  Left = 3,
  Right = 4,
  Front = 5,
  Back = 6
}
@Component({
  selector: 'app-brainvis-canvas',
  template: '<div id="gui"></div>',
  styleUrls: ['./brainvis-canvas.component.css']
})
@Injectable({
  providedIn: 'root'
})

export class BrainvisCanvasComponent {
  //check user offline, online
  onlineEvent: Observable<Event>;
  offlineEvent: Observable<Event>;
  subscriptions: Subscription[] = [];

  //for dat.gui
  ui: dat.GUI;
  guiElement: HTMLElement;

  //sync with main (appcomponent) and stl_load_models

  private _showSlice = false;
  private _showSliceHandle = false;
  private _showObjects = true;
  private objectSelector: ObjectSelector;
  private appcomponent: AppComponent;
  private mm;
  private mode;
  public intersection_info;
  public keydown_coordinate: THREE.Vector2;
  public viewpoint_action = 0;

  @Input() set showObjects(showObjects: boolean) {
    this._showObjects = showObjects;
    this.toggleObjects(showObjects);
    this.showObjectsChange.emit(showObjects);
  }
  @Output() showObjectsChange = new EventEmitter<boolean>();
  get showObjects() { return this._showObjects; }

  //TODO--need to change get fragment name and as MESH
  @Input() set selectObject(newSelectedObjects: Object[]) {
    this.objectSelector.setSelection(newSelectedObjects); // [0] new [1] old
    this.selectedObjectsChange.emit(newSelectedObjects);
  }
  @Output() selectedObjectsChange = new EventEmitter<any>();
  get selectObject() 
  { return this.objectSelector.getpastcurrentobject(); }

  private width: number;
  private height: number;
  private elem: Element;
  public scene = new THREE.Scene();
  private group = new THREE.Group();
  private objects: THREE.Object3D; // all the loaded objects go in here

  // private camera: THREE.PerspectiveCamera;
  public camera: THREE.OrthographicCamera;
  private renderer = new THREE.WebGLRenderer();

  // private transform: TransformControls;
  private number_of_stl = 0; //incresase numbers
  
  private controls: Trackball;
  private stackHelper = 0;
  // private sliceManipulator: SliceManipulatorWidget;
  // private meshManipulator: MeshManipulatorWidget;
  private eventdispatcher: THREE.EventDispatcher;
  private directionalLight: THREE.DirectionalLight;
  private lightRotation: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // for the 2D slice
  private alignButton: HTMLInputElement;
  // stored gui state to recoveren when swithing back from 2D view
  private cachedCameraOrigin: THREE.Vector3;
  private cachedCameraTarget: THREE.Vector3;
  private cachedCameraUp: THREE.Vector3;
  private cachedSliceHandleVisibility: boolean;
  private cachedObjectsShown: boolean;

  // callback to call when loading is completed
  private loadCompeletedCallback: () => void;

  private intersectionManager: IntersectionManager;
  public service: ProvenanceService;

  // HJ added values
  private selectedobj: THREE.Mesh; // for indicating selected object
  public helper; // for indicating selected object surface normal
  public annotations = []; // Create an array to store the annotations
  // stl file information
  private stl_objs: FormData;

  constructor(elem: ElementRef, provenance: ProvenanceService) {

    this.elem = elem.nativeElement;
    this.service = provenance;
    this.eventdispatcher = new THREE.EventDispatcher();
    this.objects = new THREE.Object3D();
    this.objectSelector = new ObjectSelector(this.objects,this.renderer.domElement, this.camera, this);
    // todo: remove object from window
    registerActions(this.service.registry, this);
    addListeners(this.service.tracker, this);
  }
  addEventListener(type, listener){
      this.eventdispatcher.addEventListener(type,listener);
  }
  removeEventListener(type, listener){
    this.eventdispatcher.removeEventListener(type,listener);
}
  onWindowResize() {
    const sidenav = document.querySelector('app-provenance-visualization');
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    //orthographic camera
    this.camera.left = this.width / -2;
    this.camera.right = this.width / 2;
    this.camera.top = this.height / 2;
    this.camera.bottom = this.height / -2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);

    //sidenav -> provenance graph
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.onWindowResize();
  }


  ngOnInit() {

    //check user offline, online
    this.onlineEvent = fromEvent(window, 'online');
    this.offlineEvent = fromEvent(window, 'offline');

    this.subscriptions.push(this.onlineEvent.subscribe(e => {
      // this.connectionStatusMessage = 'Back to online';
      // this.connectionStatus = 'online';
      console.log('Online...');
    }));

    this.subscriptions.push(this.offlineEvent.subscribe(e => {
      // this.connectionStatusMessage = 'Connection lost! You are not connected to internet';
      // this.connectionStatus = 'offline';
      console.log('Offline...');
    }));

    // todo: remove object from window
    // registerActions(this.service.registry, this);
    // addListeners(this.service.tracker, this);
    // this.elem = ElementRef.nativeElement;
    (window as any).canvas = this;
    this.width = this.elem.clientWidth;
    this.height = this.elem.clientHeight;

    this.scene.background = new THREE.Color('#a5a29a');
    
    this.camera = new THREE.OrthographicCamera(this.width / -2, this.width / 2, this.height / 2, this.height / - 2,0.1,3000);
    // this.camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 0.01, 3000);

    const canvasElm = this.renderer.domElement;
    this.elem.appendChild(canvasElm);
    canvasElm.style.display = 'block';
    this.controls = new Trackball(this.camera, this.renderer.domElement);
    this.scene.add(this.objects);
    this.controls.reset();

    //change starting position of the camera
    this.camera.position.set(0,600,0);
    this.camera.up.set(0,1,1);

    this.camera.updateMatrix();
    this.renderer.setSize(this.width, this.height);
    this.controls.update();
    this.mm = new TransformControls(this.camera, this.renderer.domElement);
    this.mm.setSize(0.4);

    
    this.intersectionManager = new IntersectionManager(this.renderer.domElement, this.camera);
    this.intersectionManager.addListener(this.objectSelector);

    this.initScene();
    this.addEventListeners();
    this.animate();
  }

  ngOnDestroy(): void {
    /**
    * Unsubscribe all subscriptions to avoid memory leak
    */
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }


  initScene() {

    // Setup lights
    this.scene.add(new THREE.AmbientLight(0xffffff,0.1));
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    let directionallight_2 = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.set(1, 1, 1).normalize();
    directionallight_2.position.set(-1,-1,-1).normalize();
    const gridHelper = new THREE.GridHelper(500, 10);
    const AxesHelper = new THREE.AxesHelper(500);
    var instructions = document.getElementById('instructions');

    
    this.scene.add(this.directionalLight);
    this.scene.add(directionallight_2);
    this.scene.add(this.group);
    this.scene.add(this.mm);
    this.scene.add(gridHelper);
    this.scene.add(AxesHelper);

    this.ui = new dat.GUI({autoPlace: false, width: 200});
    const vis_helper = this.ui.addFolder('Helpers');
    vis_helper.add(gridHelper,'visible').name('Grid');
    vis_helper.add(AxesHelper,'visible').name('Axes');
    vis_helper.add({ instructions: true }, 'instructions').name('Instructions').onChange((value: boolean) => {
      instructions.style.display = value ? 'block' : 'none';
    });
    vis_helper.open();

    const cam_offset = this.ui.addFolder('Camera offset');
    cam_offset.add(this.viewpoint_button, 'click_front').name('★ Front view');
    cam_offset.add(this.viewpoint_button, 'click_back').name('Back view');
    cam_offset.add(this.viewpoint_button, 'click_top').name('Top view');
    cam_offset.add(this.viewpoint_button, 'click_bottom').name('Bottom view');
    cam_offset.add(this.viewpoint_button, 'click_left').name('Left view');
    cam_offset.add(this.viewpoint_button, 'click_right').name('Right view');
    cam_offset.open();


    var customContainer = document.getElementById('gui');
    customContainer.appendChild(this.ui.domElement);
  }
  
  addEventListeners() {
      // resize event
    var x = 0, y = 0;
    var keydown_coordinate;


    this.renderer.domElement.addEventListener(
      "resize",
      this.onWindowResize,
      false
    );

    window.addEventListener("beforeunload", function (e) {
      var confirmationMessage = "\o/";
      console.log('user terminated');
      (e || window.event).returnValue = confirmationMessage; //Gecko + IE
      return confirmationMessage;                            //Webkit, Safari, Chrome
    });
    window.addEventListener('mousemove', (e) => {

      x = ( e.clientX / this.renderer.domElement.clientWidth ) * 2 - 1;
      y = - ( e.clientY / this.renderer.domElement.clientHeight ) * 2 + 1;
      keydown_coordinate = e;
      // const have = this.intersectionManager.intersectObjects(e,this.objects.children);
  }, false);

    window.addEventListener('keydown', (event) => {
      
      this.objectSelector.setkey(event, keydown_coordinate);
      this.mode = this.objectSelector.getmode();
      if(this.mode == modes.Cammode) // camera
        this.controls.enabled = true;
      else
        this.controls.enabled = false;
      // this.controls.update();
      });

    this.controls.addEventListener('zoomstart', (event) => {
      const position = this.controls.camera.position.toArray();
      const target = this.controls.target.toArray();
      const up = this.controls.camera.up.toArray();
      const orientation = { position, target, up };

      this.eventdispatcher.dispatchEvent({
        type: 'zoomStart',
        orientation
      });
    });

    this.controls.addEventListener('zoomend', (event) => {
      const position = this.controls.camera.position.toArray();
      const target = this.controls.target.toArray();
      const up = this.controls.camera.up.toArray();
      const orientation = { position, target, up };

      this.eventdispatcher.dispatchEvent({
        type: 'zoomEnd',
        orientation
      });
    });

    this.controls.addEventListener('start', (event) => {
      const position = this.controls.camera.position.toArray();
      const target = this.controls.target.toArray();
      const up = this.controls.camera.up.toArray();
      const orientation = { position, target, up };

      this.eventdispatcher.dispatchEvent({
        type: 'cameraStart',
        orientation
      });
    });
    
    this.controls.addEventListener('end', (event) => {
      const position = this.controls.camera.position.toArray();
      const target = this.controls.target.toArray();
      const up = this.controls.camera.up.toArray();
      const orientation = { position, target, up };
      const state = event.state;
      this.eventdispatcher.dispatchEvent({
        type: 'cameraEnd',
        orientation,
        state
      });
    });

    this.objectSelector.addEventListener('t_start', (event:any) => {
      // const position = this.objectSelector.gettranslateObject().position.toArray();
      this.eventdispatcher.dispatchEvent({
        type: 'transStart',
        position: event.position.toArray()
      });
    });
    this.objectSelector.addEventListener('t_end', (event:any) => {
      // const position = this.objectSelector.gettranslateObject().position.toArray();
      this.eventdispatcher.dispatchEvent({
        type: 'transEnd',
        position: event.position.toArray()
      });
    });

    this.objectSelector.addEventListener('r_start', (event:any) => {
      this.eventdispatcher.dispatchEvent({
        type: 'rotationStart',
        rotation: event.rotation
      });
    });
    this.objectSelector.addEventListener('r_end', (event:any) => {
      this.eventdispatcher.dispatchEvent({
        type: 'rotationEnd',
        rotation: event.rotation
      });
    });
    // this.objectSelector.addEventListener('translateObject', (event: any) => {
    //   this.eventdispatcher.dispatchEvent({
    //     type: 'objectMove',
    //     position: event.position
    //   });
    // });
    


    this.objectSelector.addEventListener('interactive', (event: any) => {
      const inter = this.objectSelector.getinteractive();
      const mode = this.objectSelector.getmode();
      this.selectedobj = this.objectSelector.getcurrobject();
      console.log('interactive: ' + inter);
      this.setInteractive(inter);
      if (mode == 0 && this.selectedobj!=undefined){ // Translation 
        this.mm.setMode('translate');
        this.recenter_mm(event.intersect);
        this.mm.attach(this.selectedobj);
        this.controls.enabled = false;
      }
      else if (mode == 1 && this.selectedobj!=undefined){ //Rotation
        this.mm.setMode('rotate');
        if(event.intersect!=undefined){
          this.mm.attach(this.selectedobj);
          this.recenter_mm(event.intersect);
        }

        this.controls.enabled = false;
      }
      else {
        this.mm.detach();
        this.controls.enabled = true;
      }
      // this.controls.update();
    });

    this.objectSelector.addEventListener('objectSelection', (event: any) => {

      this.selectedobj = event.newObject[0];
      this.selectObject = [event.newObject[0], event.newObject[1], event.newObject[2], event.newObject[3]];
      const inter = this.objectSelector.getinteractive();
      this.setInteractive(inter);
      this.mm.detach();
    });

    // this.objectSelector.addEventListener('objectTranslation', (event: any) => {
    //   this.showtranslateObject = this.objectSelector.gettranslateObject();
    // });
    // this.objectSelector.addEventListener('objectRotation', (event: any) => {
    //   this.showrotateObject = this.objectSelector.gettranslateObject();
    // });
    
  }

  setSize(width: number, height: number) {
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.controls.handleResize();
  }

  setInteractive(interactive: boolean) {
    this.controls.enabled = interactive;
  }

  CameraZoom(newOrientation: IOrientation, within: number) {
    this.controls.changeCamera(new THREE.Vector3(newOrientation.position[0], newOrientation.position[1], newOrientation.position[2]),
      new THREE.Vector3(newOrientation.target[0], newOrientation.target[1], newOrientation.target[2]),
      new THREE.Vector3(newOrientation.up[0], newOrientation.up[1], newOrientation.up[2]),
      within > 0 ? within : 1000);
    // this.controls.zoomCamera()
  }

  CameraMove(newOrientation: IOrientation, within: number) {
    this.controls.changeCamera(new THREE.Vector3(newOrientation.position[0], newOrientation.position[1], newOrientation.position[2]),
      new THREE.Vector3(newOrientation.target[0], newOrientation.target[1], newOrientation.target[2]),
      new THREE.Vector3(newOrientation.up[0], newOrientation.up[1], newOrientation.up[2]),
      within > 0 ? within : 1000);
  }

  CameraPan(newOrientation: IOrientation, within: number) {
    this.controls.changeCamera(new THREE.Vector3(newOrientation.position[0], newOrientation.position[1], newOrientation.position[2]),
      new THREE.Vector3(newOrientation.target[0], newOrientation.target[1], newOrientation.target[2]),
      new THREE.Vector3(newOrientation.up[0], newOrientation.up[1], newOrientation.up[2]),
      within > 0 ? within : 1000);
  }

  async ObjectTrans(newPosition: any, within: number) {
    await this.changeControlsAsync(newPosition, within);
    this.objectSelector.settransobj(newPosition);
  }

  ObjectRotate(newRotation: THREE.Vector3, within: number) {
    this.objectSelector.changecontrols_rotation(new THREE.Vector3(newRotation.x, newRotation.y, newRotation.z), within > 0 ? within : 1000);
    this.objectSelector.setrotateobj(newRotation);
  }
  Annotation(text: string, intersect: any, undo?: boolean) {
    const filteredchildren = this.scene.children.filter(child => child.type == 'Sprite');
    if(intersect[0] != undefined){
      for (var i = 0; i < filteredchildren.length; i++) {
        if (filteredchildren[i].position.equals(intersect[0].point)) {
          if(undo == true){
            this.scene.remove(filteredchildren[i]);
            return;
          }
          else{
          }
        }
      }
      var text_plane =  new THREE.CanvasTexture(function () {
        
        var plane = document.createElement('canvas');

        var context = plane.getContext('2d');
        var metrics = context.measureText(text);
        var planeLength = 160, textHeight = 60;
        plane.width = 512;
        
        var words = text.split(' ');
        var line = '';
        var lineCount = 0;
        var lines = [];
        for (var n = 0; n < words.length; n++) {
          var testLine = line + words[n] + ' ';
          var testWidth = context.measureText(testLine).width;
          if (testWidth > planeLength) {
            lines.push(line);
            line = words[n] + ' ';
            lineCount++;
          } else {
            line = testLine;
          }
        }
        lineCount++;
        lines.push(line);
        plane.height = textHeight + lineCount * textHeight;
        context.fillStyle = 'white';
        context.fillRect(0, 0, 512, textHeight + (lineCount * textHeight));
        context.font = '50px Arial';
        context.fillStyle = 'black';
        context.textAlign = 'left';
        context.textBaseline = 'middle';
        context.imageSmoothingEnabled = true;
        context.arc(32,32,30,0,Math.PI*2);
        for (var i = 0; i < lineCount; i++) {
          context.fillText(lines[i], 0, textHeight + (i * textHeight), 512);
        }
        return plane;
      }());
      text_plane.needsUpdate = true;
      var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        color: 0xffffff,
        alphaTest: 0.5,
        transparent: true,
        depthTest: false,
        depthWrite: false}));
      sprite.scale.set(100, 50, 1);
      sprite.position.copy(intersect[0].point);
      sprite.material.map = text_plane;
      sprite.material.opacity = 0.5;
      intersect[0].object.add(sprite);
      // this.scene.add(sprite);
      this.eventdispatcher.dispatchEvent({
        type: 'annotation',
        text: text,
        inter: intersect
      });
    }
    else if(text == '' && intersect[0] != undefined){
      this.eventdispatcher.dispatchEvent({
        type: 'annotation',
        text: text,
        inter: intersect
      });
    }
    else{
      const annotation_2d = new Annotation_2D({
        position: new THREE.Vector3(10, 10, 0),
        text: 'Hello, world!',
      }, this.camera);
      this.scene.add(annotation_2d);
      this.eventdispatcher.dispatchEvent({
        type: 'annotation',
        text: text,
        inter: intersect
      });
    }
  }

  animate = () => {
    requestAnimationFrame(this.animate);

    // update light position
    if (this.stackHelper) {
      const lightDir = this.camera.position.clone();
      // lightDir.sub(this.stackHelper.stack.worldCenter());
      lightDir.normalize();

      const lightRotationTemp = this.lightRotation.clone();
      lightRotationTemp.applyQuaternion(this.camera.quaternion);

      this.directionalLight.position.set(lightDir.x, lightDir.y, lightDir.z);
      this.directionalLight.position.add(new THREE.Vector3(lightRotationTemp.x, lightRotationTemp.y, lightRotationTemp.z));
      this.directionalLight.position.normalize();
    }

    this.controls.update();
    this.mm.addEventListener( 'change', function() {this.render}.bind(this));
    this.render();
    
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
  getrender() {
    return this.renderer.render(this.scene, this.camera);
  }


  
//HL_object related functions
  
  // moveselectedobject = (event) => {
  //   if(this.selectedObjects){ //if fragment selected
  //   }
  //   else{ //if fragment not selected

  //   }
  // }

  onShowObjectsChange = (visible) => {

    this.eventdispatcher.dispatchEvent({
      type: 'objectsVisibilityChanged',
      change: visible
    });
  }

  showObjectsToggled = (checkBox) => {
    this.toggleObjects(checkBox.currentTarget.checked);
    this.onShowObjectsChange(checkBox.currentTarget.checked);
  }

  toggleObjects(visible) {
    this.objects.visible = visible;
  }

  recenter_mm(intersect?){
    const objpose = new THREE.Vector3();
    const mode = this.objectSelector.getmode();
    this.selectedobj.geometry.boundingBox.getCenter(objpose);
    if(mode === 1){ // if rotation
      this.mm.position.set(intersect['x'],intersect['y'],intersect['z']);
      // this.mm.position.set(0,0,0);
    }
    
    else // if translation
      this.mm.position.set(objpose.x,objpose.y,objpose.z);
  }
  viewpoint_button = {
    click_top: () => {
      this.viewpoint_action = modes.Top;
      let position = this.controls.camera.position.toArray();
      let target = this.controls.target.toArray();
      let up = this.controls.camera.up.toArray();
      let orientation = { position, target, up };
      this.eventdispatcher.dispatchEvent({
        type: 'cameraStart',
        orientation
      });
      let cc_1 = new THREE.Vector3(0,0,700);
      let cc_2 = new THREE.Vector3(0,0,0);
      let cc_3 = new THREE.Vector3(0,-1,1);
  
      this.controls.changeCamera(cc_1,cc_2,cc_3,1000);
      position = cc_1.toArray();
      target =  cc_2.toArray();
      up = cc_3.toArray();
      orientation = { position, target, up };
      this.eventdispatcher.dispatchEvent({
        type: 'cameraEnd',
        orientation
      });
      this.viewpoint_action = modes.Idle;
    },
    click_bottom: () => {
      this.viewpoint_action = modes.Bottom;
      let position = this.controls.camera.position.toArray();
      let target = this.controls.target.toArray();
      let up = this.controls.camera.up.toArray();
      let orientation = { position, target, up };
      this.eventdispatcher.dispatchEvent({
        type: 'cameraStart',
        orientation
      });
      let cc_1 = new THREE.Vector3(0,0,-700);
      let cc_2 = new THREE.Vector3(0,0,0);
      let cc_3 = new THREE.Vector3(0,1,0);
  
      this.controls.changeCamera(cc_1,cc_2,cc_3,1000);
      position = cc_1.toArray();
      target =  cc_2.toArray();
      up = cc_3.toArray();
      orientation = { position, target, up };
      this.eventdispatcher.dispatchEvent({
        type: 'cameraEnd',
        orientation
      });
      this.viewpoint_action = modes.Idle;
    },
    click_left: () => {
      this.viewpoint_action = modes.Left;
      let position = this.controls.camera.position.toArray();
      let target = this.controls.target.toArray();
      let up = this.controls.camera.up.toArray();
      let orientation = { position, target, up };
      this.eventdispatcher.dispatchEvent({
        type: 'cameraStart',
        orientation
      });
      let cc_1 = new THREE.Vector3(700,0,0);
      let cc_2 = new THREE.Vector3(0,0,0);
      let cc_3 = new THREE.Vector3(-1,0,0);
      this.controls.changeCamera(cc_1,cc_2,cc_3,1000);
  
      position = cc_1.toArray();
      target =  cc_2.toArray();
      up = cc_3.toArray();
      orientation = { position, target, up };
      this.eventdispatcher.dispatchEvent({
        type: 'cameraEnd',
        orientation
      });
      this.viewpoint_action = modes.Idle;
    },
    click_right: () => {
      this.viewpoint_action = modes.Right;
      let position = this.controls.camera.position.toArray();
      let target = this.controls.target.toArray();
      let up = this.controls.camera.up.toArray();
      let orientation = { position, target, up };
      this.eventdispatcher.dispatchEvent({
        type: 'cameraStart',
        orientation
      });
      let cc_1 = new THREE.Vector3(-700,0,0);
      let cc_2 = new THREE.Vector3(0,0,0);
      let cc_3 = new THREE.Vector3(1,0,0);
      this.controls.changeCamera(cc_1,cc_2,cc_3,1000);
  
      position = cc_1.toArray();
      target =  cc_2.toArray();
      up = cc_3.toArray();
      orientation = { position, target, up };
      this.eventdispatcher.dispatchEvent({
        type: 'cameraEnd',
        orientation
      });
      this.viewpoint_action = modes.Idle;
    },
    click_front: () => 
    {
      this.viewpoint_action = modes.Front;
      let position = this.controls.camera.position.toArray();
      let target = this.controls.target.toArray();
      let up = this.controls.camera.up.toArray();
      let orientation = { position, target, up };
      this.eventdispatcher.dispatchEvent({
        type: 'cameraStart',
        orientation
      });
      let cc_1 = new THREE.Vector3(0,700,0);
      let cc_2 = new THREE.Vector3(0,0,0);
      let cc_3 = new THREE.Vector3(0,1,1);
      this.controls.changeCamera(cc_1,cc_2,cc_3,1000);
  
      position = cc_1.toArray();
      target =  cc_2.toArray();
      up = cc_3.toArray();
      orientation = { position, target, up };
      this.eventdispatcher.dispatchEvent({
        type: 'cameraEnd',
        orientation
      });
      this.viewpoint_action = modes.Idle;
    },
    click_back: () =>
    {
      this.viewpoint_action = modes.Back;
      let position = this.controls.camera.position.toArray();
      let target = this.controls.target.toArray();
      let up = this.controls.camera.up.toArray();
      let orientation = { position, target, up };
      this.eventdispatcher.dispatchEvent({
        type: 'cameraStart',
        orientation
      });
      let cc_1 = new THREE.Vector3(0,-700,0);
      let cc_2 = new THREE.Vector3(0,0,0);
      let cc_3 = new THREE.Vector3(0,1,1);
      this.controls.changeCamera(cc_1,cc_2,cc_3,1000);
  
      position = cc_1.toArray();
      target =  cc_2.toArray();
      up = cc_3.toArray();
      orientation = { position, target, up };
      this.eventdispatcher.dispatchEvent({
        type: 'cameraEnd',
        orientation
      });
      this.viewpoint_action = modes.Idle;
    }
  }
  load_stl_models = async(alpha) => {
        // Load STL models        
        const fragment_folder = this.ui.addFolder('Fragments Opecity');
        for(var file of alpha)
        {
          let name = 'f' + this.number_of_stl.toString();
          const color = this.selectColor(this.number_of_stl);
          let loaderSTL = new STLLoader();
          let material = new THREE.MeshPhongMaterial({ color: color, specular: 0x111111, shininess: 100, transparent: true});
          let geometry = loaderSTL.parse(file.result);
          let mesh = new THREE.Mesh(geometry, material);
          let centroid = new THREE.Vector3();
          mesh.geometry.computeBoundingBox();
          centroid.x = (geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2;
          centroid.y = (geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2;
          centroid.z = (geometry.boundingBox.max.z + geometry.boundingBox.min.z) / 2;
          mesh.name = name.toString();
          geometry.center();
          mesh.position.copy(centroid);
          mesh.rotation.set(0,0,0);
          // can add this but too complicated when there are many edges in the model
          // const edgesGeometry = new THREE.EdgesGeometry(geometry);
          // const edgesMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
          // const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
          // mesh.add(edges);
          this.objects.add(mesh);

          fragment_folder.add(material, 'opacity', 0, 1).name(name)
          .onChange((value) => {material.opacity = value;});
          fragment_folder.open();
          this.number_of_stl++;
        }
        //positioning all loaded meshes to the center of the scene. 
        // compute average position of child meshes
        const center = new THREE.Vector3();
        this.objects.children.forEach((child) => {
          center.add(child.position);
        });
        center.divideScalar(alpha.length);
        const origin = new THREE.Vector3(0, 0, 0);
        const direction = center.clone().sub(origin).normalize();
        const distance = origin.distanceTo(center);
        const newVector = origin.clone().add(direction.multiplyScalar(distance));
        // subtract the average position from each child mesh's position
        this.objects.children.forEach((child) => {
          child.position.sub(newVector);
        });

        // set the parent object's position to the negative of the average position
        this.objects.position.copy(center);
        center.sub(new THREE.Vector3(0, 0, 0));
        this.objects.position.set(0,0,0);
  }
  generateHeight( width, height ) {

    const size = width * height, data = new Uint8Array( size ),
      perlin = Math.random() * 100;

    let quality = 1;

    for ( let j = 0; j < 4; j ++ ) {

      for ( let i = 0; i < size; i ++ ) {

        const x = i % width, y = ~ ~ ( i / width );
        data[ i ] += Math.abs( quality * 1.75 );

      }

      quality *= 5;

    }

    return data;

  }
  selectColor(number) { // color generator based on visible spectrum
    const hue = number * 137.508; // use golden angle approximation
    return `hsl(${hue},50%,75%)`;
  }

  ScreenShot = () => {
    var dataURL = this.renderer.domElement.toDataURL('image/png');
    var img = document.createElement('img');
    img.src = dataURL;
    return img;
  }

  changeControlsAsync(newPosition: number[], within: number): Promise<void> {
    return new Promise(resolve => {
      this.objectSelector.changecontrols(new THREE.Vector3(newPosition[0], newPosition[1], newPosition[2]), within);
      resolve();
    });
  }
}


