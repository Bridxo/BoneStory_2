import { Component, Injectable, ElementRef, EventEmitter, Input, OnInit, Output, OnDestroy, HostListener, ViewChild, AfterViewInit } from '@angular/core';
// import {CSS2DRenderer, CSS2DObject} from 'three-css2drenderer'
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

(window as any).istyping = false;

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
  relativePos: THREE.Vector3;

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
  private pivot_group = new THREE.Group();
  private objects: THREE.Object3D; // all the loaded objects go in here

  // private camera: THREE.PerspectiveCamera;
  public camera: THREE.OrthographicCamera;
  private renderer = new THREE.WebGLRenderer();

  // private transform: TransformControls;
  private number_of_stl = 0; //incresase numbers
  
  private controls: Trackball;
  private stackHelper = 1;
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
  public Base;
  // stl file information
  private stl_objs: FormData;

  constructor(elem: ElementRef, provenance: ProvenanceService) {

    this.elem = elem.nativeElement;
    this.service = provenance;
    this.eventdispatcher = new THREE.EventDispatcher();
    this.objects = new THREE.Object3D();
    this.objectSelector = new ObjectSelector(this.objects,this.renderer.domElement, this.camera, this);
    // todo: remove object from window
    // registerActions(this.service.registry, this);
    // addListeners(this.service.tracker, this);
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


    // register actions for provenance
    registerActions(this.service.registry, this);
    addListeners(this.service.tracker, this);

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
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    // let directionallight_2 = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.set(1, 1, 1).normalize();
    // directionallight_2.position.set(-1,-1,-1).normalize();
    const gridHelper = new THREE.GridHelper(500, 10);
    const AxesHelper = new THREE.AxesHelper(500);
    var instructions = document.getElementById('instructions');

    
    this.scene.add(this.directionalLight);
    // this.scene.add(directionallight_2);
    this.scene.add(this.mm);
    this.scene.add(gridHelper);
    this.scene.add(AxesHelper);
    this.scene.add(this.pivot_group);

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

    window.addEventListener("wheel", event => {
      const delta = Math.sign(event.deltaY);
      console.info(delta);
  });

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

    this.controls.addEventListener('zoom_track_start', (event) => {
      const position = this.controls.camera.position.toArray();
      const target = this.controls.target.toArray();
      const up = this.controls.camera.up.toArray();
      const orientation = { position, target, up };
      this.eventdispatcher.dispatchEvent({
        type: 'zoomStart',
        orientation
      });
    });

    this.controls.addEventListener('zoom_track_end', (event) => {
      const position = this.controls.camera.position.toArray();
      const target = this.controls.target.toArray();
      const up = this.controls.camera.up.toArray();
      const orientation = { position, target, up };
      const state = event.state;
      this.eventdispatcher.dispatchEvent({
        type: 'zoomEnd',
        orientation,
        state
      });
    });

    this.controls.addEventListener('start', (event) => {
      const position = this.controls.camera.position.toArray();
      const target = this.controls.target.toArray();
      const up = this.controls.camera.up.toArray();
      const orientation = { position, target, up };
      if(event.state == 0){
        this.eventdispatcher.dispatchEvent({
          type: 'cameraStart',
          orientation
        });
      }
      else{
        this.eventdispatcher.dispatchEvent({
          type: 'cameraStart',
          orientation
        });
      }
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
        rotation: event.rotation,
        position: event.position.add(this.pivot_group.position.clone())
      });
    });
    this.objectSelector.addEventListener('r_end', (event:any) => {

      this.eventdispatcher.dispatchEvent({
        type: 'rotationEnd',
        rotation: this.selectedobj.rotation.clone(),
        position: this.selectedobj.position.clone()
      });
    });

    this.objectSelector.addEventListener('interactive', (event: any) => {
      const inter = this.objectSelector.getinteractive();
      const mode = this.objectSelector.getmode();
      this.selectedobj = this.objectSelector.getcurrobject();
      this.setInteractive(inter);
      if (mode == 0 && this.selectedobj!=undefined){ // Translation 
        this.mm.setMode('translate');
        this.mm.position.set(0,0,0);
        this.mm.attach(this.selectedobj);
        this.controls.enabled = false;
      }
      else if (mode == 1 && this.selectedobj!=undefined){ //Rotation
        this.mm.setMode('rotate');
        if(event.intersect!=undefined){
          this.pivot_group.position.set(0,0,0);
          this.pivot_group.rotation.set(0,0,0);
          this.pivot_group.add(this.selectedobj);
          this.pivot_group.position.copy(event.intersect);
          this.selectedobj.position.sub(event.intersect);
          this.mm.attach(this.pivot_group);
        }

        this.controls.enabled = false;
      }
      else {
        this.mm.detach();
        this.controls.enabled = true;
      }
    });

    this.objectSelector.addEventListener('objectSelection', (event: any) => {

      this.selectedobj = event.newObject[0];
      this.selectObject = [event.newObject[0], event.newObject[1], event.newObject[2], event.newObject[3]];
      const inter = this.objectSelector.getinteractive();
      this.setInteractive(inter);
      this.mm.detach();
    });
    
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
    let cc_1 = new THREE.Vector3(newOrientation.position[0], newOrientation.position[1], newOrientation.position[2]);
    let cc_2 = new THREE.Vector3(newOrientation.target[0], newOrientation.target[1], newOrientation.target[2]);
    let cc_3 = new THREE.Vector3(newOrientation.up[0], newOrientation.up[1], newOrientation.up[2]);
    this.controls.changeCamera(cc_1, cc_2, cc_3,within > 0 ? within : 1000);
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

  ObjectTrans(newPosition: any, within: number) {
    within = 500;
    this.objectSelector.changecontrols(new THREE.Vector3(newPosition[0], newPosition[1], newPosition[2]), within);
  }

  async ObjectRotate(newargs: any, newpos:any ,within: number) {
    within = 500;
    // this.objectSelector.changecontrols(new THREE.Vector3(newpos.x,newpos.y,newpos.z), within, undefined, new THREE.Vector3(newargs.x, newargs.y, newargs.z));
    this.objectSelector.changecontrols_rotation(new THREE.Vector3(newargs.x, newargs.y, newargs.z), within);
    this.objectSelector.changecontrols(new THREE.Vector3(newpos.x,newpos.y,newpos.z), 0);
  }
  Annotation(text: string, intersect: any, undo?: boolean) {
    if(undo === true){
      intersect[0].object.children.forEach (function (child) {
        if(child.name === text){
          child.material.dispose();
          intersect[0].object.remove(child);
        }
      });
      return;
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
    sprite.name = text;
    sprite.position.copy(intersect[0].point.sub(intersect[0].object.position));
    const scaler= this.camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
    const scale_value = scaler/2;
    sprite.scale.set(scale_value, scale_value/5, 1);
    sprite.material.map = text_plane;
    sprite.material.opacity = 0.5;
    intersect[0].object.add(sprite); //add annotation on the object

    this.eventdispatcher.dispatchEvent({
      type: 'annotation',
      text: text,
      inter: intersect
    });
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
    
    this.render();
    
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
  getrender() {
    return this.renderer.render(this.scene, this.camera);
  }

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
        orientation,
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
        let fragment_folder
        let uis = this.ui;
        if(uis.__folders['Fragments Opacity']==null)
          fragment_folder = uis.addFolder('Fragments Opacity');
        else
          fragment_folder = uis.__folders['Fragments Opacity'];
        for(var file of alpha)
        {
          let name = 'f' + this.number_of_stl.toString();
          const color = this.selectColor(this.number_of_stl);
          let loaderSTL = new STLLoader();
          let material = new THREE.MeshPhongMaterial({ color: color, specular: 0x111111, shininess: 50, transparent: true});
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
          this.objects.add(mesh);
          // this.connect_label(mesh);
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
  load_demo = () =>{
        // Load STL models  
        const alpha = ['assets/SP_1.stl','assets/SP_2.stl','assets/SP_3.stl','assets/Clavicle Mid Shaft Bone Plate_2.stl'];      
        const fragment_folder = this.ui.addFolder('Fragments Opecity');
        for(var file of alpha)
        {
          let name = 'f' + this.number_of_stl.toString();
          const color = this.selectColor(this.number_of_stl);
          let loaderSTL = new STLLoader();
          
          let material = new THREE.MeshPhongMaterial({ color: color, specular: 0x111111, shininess: 100, transparent: true});
          let geometry = loaderSTL.load(file,function(geometry){          
            const mesh = new THREE.Mesh(geometry, material);
            let centroid = new THREE.Vector3();
            mesh.geometry.computeBoundingBox();
            centroid.x = (geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2;
            centroid.y = (geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2;
            centroid.z = (geometry.boundingBox.max.z + geometry.boundingBox.min.z) / 2;
            mesh.name = name.toString();
            geometry.center();
            mesh.position.copy(centroid);
            mesh.rotation.set(0,0,0);
            this.objects.add(mesh);
          }.bind(this));
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
    const dataURLSample =
  'data:image/png;base64,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';
    (window as any).slideDeckViz.screenShotProvider = dataURLSample;
    return img;
  }

  changeControlsAsync(newPosition: number[], within: number): Promise<void> {
    return new Promise(resolve => {
      this.objectSelector.changecontrols(new THREE.Vector3(newPosition[0], newPosition[1], newPosition[2]), within);
      resolve();
    });
  }
}


