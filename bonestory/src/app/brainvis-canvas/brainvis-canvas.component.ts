import { Component, Injectable, ElementRef, EventEmitter, Input, OnInit, Output, OnDestroy, HostListener, ViewChild, AfterViewInit } from '@angular/core';
import { fromEvent, Observable, ReplaySubject, Subscription } from 'rxjs';
import * as THREE from 'three';
import * as dat from 'dat.gui';

import { IOrientation } from './types';

import Trackball from './trackball';
// import SliceManipulatorWidget from './sliceManipulatorWidget';
// import MeshManipulatorWidget from './meshManipulatorWidget';
import STLLoader from './stlLoader';
import { IntersectionManager } from './intersectionManager';
import ObjectSelector from './objectSelector';


import { TransformControls } from 'three/examples/jsm/controls/TransformControls';

import { ProvenanceService } from '../provenance.service';
import { registerActions } from './provenanceActions';
import { addListeners } from './provenanceListeners';

import { AppComponent } from '../app.component';
import {updateModeDisplay} from '../util/Displaywidget';

import { DragControls } from 'three/examples/jsm/controls/DragControls';
 


(window as any).istyping = false;

enum Measurement {
  Zero = 0,
  One = 1,
  Two = 2
}

enum modes {
  Translation = 0,
  Rotation = 1,
  Cammode = 2,
  Annotationmode = 3,
  Measurementmode = 4
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
  public mm;
  private mode;
  public intersection_info;
  public keydown_coordinate: THREE.Vector2;
  public viewpoint_action = 0;
  relativePos: THREE.Vector3;
  rotate_counter = 0;
  rotate_prev_intersect: THREE.Vector3;

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
  private renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });

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
  public measure_groups = []; // Create an array to store the annotations
  public measure_counter = [];
  public annotations = [];
  private initial_zoom = 1;
  private spriteMap = new Map();
  private firstload = true;
  private ModeText = ['Object', 'Object', 'Camera', 'Annotation'];
  private ModeText_add = '';
  private dragControls;

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
    this.camera.up.set(0,0,1);
    this.camera.frustumCulled = true;
    this.camera.updateMatrix();
    this.camera.zoom = 1;
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

    this.directionalLight.position.set(1, 1, 1).normalize();
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
    this.addEventListener('wheel', (event) => {
      console.log('wheel');
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
      else{
        this.controls.enabled = false;
        if(this.mode == modes.Translation)
          this.ModeText_add = '\nTranslate';
        else if(this.mode == modes.Rotation)
          this.ModeText_add = '\nRotate';
      }
      // this.controls.update();
      });

    this.controls.addEventListener('zoom_track_start', (event) => {
      const position = this.controls.camera.position.toArray();
      const target = this.controls.target.toArray();
      const up = this.controls.camera.up.toArray();
      const zoom = this.controls.camera.zoom;
      const orientation = { position, target, up, zoom };
      this.eventdispatcher.dispatchEvent({
        type: 'zoomStart',
        orientation
      });
      this.ModeText_add = '\nMove';
    });

    this.controls.addEventListener('zoom_track_end', (event) => {
      const position = this.controls.camera.position.toArray();
      const target = this.controls.target.toArray();
      const up = this.controls.camera.up.toArray();
      const zoom = this.controls.camera.zoom;
      const orientation = { position, target, up, zoom };
      const state = event.state;
      updateModeDisplay(this.ModeText[this.mode],'\nMove');
      this.eventdispatcher.dispatchEvent({
        type: 'zoomEnd',
        orientation,
        state
      });
      this.ModeText_add = '\nMove';
      console.log(orientation.zoom);
    });

    this.controls.addEventListener('start', (event) => {
      const position = this.controls.camera.position.toArray();
      const target = this.controls.target.toArray();
      const up = this.controls.camera.up.toArray();
      const zoom = this.controls.camera.zoom;
      const orientation = { position, target, up, zoom };
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
      this.mode = modes.Cammode;
      this.ModeText_add = '\nMove';
    });
    
    this.controls.addEventListener('end', (event) => {
      const position = this.controls.camera.position.toArray();
      const target = this.controls.target.toArray();
      const up = this.controls.camera.up.toArray();
      const zoom = this.controls.camera.zoom;
      const orientation = { position, target, up, zoom };
      const state = event.state;
      this.eventdispatcher.dispatchEvent({
        type: 'cameraEnd',
        orientation,
        state
      });
      this.mode = modes.Cammode;
      this.ModeText_add = '';
    });

    this.objectSelector.addEventListener('t_start', (event:any) => {
      // const position = this.objectSelector.gettranslateObject().position.toArray();
      this.eventdispatcher.dispatchEvent({
        type: 'transStart',
        position: event.position.toArray()
      });
      this.mode = modes.Translation;
      this.ModeText_add = '\nTranslate';
    });
    this.objectSelector.addEventListener('t_end', (event:any) => {
      // const position = this.objectSelector.gettranslateObject().position.toArray();
      this.eventdispatcher.dispatchEvent({
        type: 'transEnd',
        position: event.position.toArray()
      });
      this.mode = modes.Cammode;
      this.ModeText_add = '';
    });

    this.objectSelector.addEventListener('r_start', (event:any) => {
      this.eventdispatcher.dispatchEvent({
        type: 'rotationStart',
        rotation: event.rotation,
        position: event.position.add(this.pivot_group.position.clone())
      });
      this.mode = modes.Rotation;
      this.ModeText_add = '\nRotate';
    });
    this.objectSelector.addEventListener('r_end', (event:any) => {

      this.eventdispatcher.dispatchEvent({
        type: 'rotationEnd',
        rotation: this.selectedobj.rotation.clone(),
        position: this.selectedobj.position.clone()
      });
      this.mode = modes.Cammode;
      this.ModeText_add = '';
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
          if(this.rotate_counter>0){
            this.selectedobj.position.add(this.rotate_prev_intersect);
          }
          this.pivot_group.position.set(0,0,0);
          this.pivot_group.rotation.set(0,0,0);
          this.pivot_group.add(this.selectedobj);
          this.pivot_group.position.copy(event.intersect);
          this.selectedobj.position.sub(event.intersect);
          this.rotate_prev_intersect = event.intersect;
          this.mm.attach(this.pivot_group);
          this.rotate_counter++;
        }
        this.controls.enabled = false;
      }
      else {
        this.mm.detach();
        this.controls.enabled = true;
        this.mode = modes.Cammode;
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
    //monitoring the camera
    let cc_1 = new THREE.Vector3(newOrientation.position[0], newOrientation.position[1], newOrientation.position[2]);
    let cc_2 = new THREE.Vector3(newOrientation.target[0], newOrientation.target[1], newOrientation.target[2]);
    let cc_3 = new THREE.Vector3(newOrientation.up[0], newOrientation.up[1], newOrientation.up[2]);
    this.controls.changeCamera(cc_1,cc_2,cc_3,newOrientation.zoom,within);
  }

  CameraMove(newOrientation: IOrientation, within: number) {
    // console.log(this.camera);
    // this.ScreenShot();
    this.controls.changeCamera(new THREE.Vector3(newOrientation.position[0], newOrientation.position[1], newOrientation.position[2]),
      new THREE.Vector3(newOrientation.target[0], newOrientation.target[1], newOrientation.target[2]),
      new THREE.Vector3(newOrientation.up[0], newOrientation.up[1], newOrientation.up[2]),
      newOrientation.zoom,
      within);
  }

  CameraPan(newOrientation: IOrientation, within: number) {
      this.controls.changeCamera(new THREE.Vector3(newOrientation.position[0], newOrientation.position[1], newOrientation.position[2]),
      new THREE.Vector3(newOrientation.target[0], newOrientation.target[1], newOrientation.target[2]),
      new THREE.Vector3(newOrientation.up[0], newOrientation.up[1], newOrientation.up[2]),
      newOrientation.zoom,
      within);
  }

  async ObjectTrans(newPosition: any, within: number) {
    await this.objectSelector.changecontrols(new THREE.Vector3(newPosition[0], newPosition[1], newPosition[2]), within);
  }

  async ObjectRotate(newargs: any, newpos:any ,within: number) {
    this.rotate_counter = 0;
    // this.objectSelector.changecontrols(new THREE.Vector3(newpos.x,newpos.y,newpos.z), within, undefined, new THREE.Vector3(newargs.x, newargs.y, newargs.z));
    await this.objectSelector.changecontrols_rotation(new THREE.Vector3(newargs.x, newargs.y, newargs.z), within);
    await this.objectSelector.changecontrols(new THREE.Vector3(newpos.x,newpos.y,newpos.z), 0);
  }
  Measure(intersect: any, undo?: boolean) {
    if(undo === true){
      intersect[0].object.children.forEach (function (child) {
        if(child.name === 'measure'){
          child.material.dispose();
          intersect[0].object.remove(child);
        }
      });
      return;
    }
    if (this.measure_counter.length == Measurement.Zero) {
      this.measure_counter.push(intersect[0].point.clone());
      const geometry = new THREE.CylinderGeometry(1, 1, 1, 32);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
      const cylinder = new THREE.Mesh(geometry, material);
      cylinder.position.copy(this.measure_counter[0]);
      cylinder.name = 'measure';
      this.measure_counter.push(cylinder);
      this.scene.add(cylinder);
    }
    else if (this.measure_counter.length == Measurement.Two) {
      this.measure_counter.push(intersect[0].point);
      //calulate distance
      const distance = this.measure_counter[0].distanceTo(intersect[0].point);
      const cylinder = this.measure_counter[1];
      //calculate middle point
      const middlePoint = new THREE.Vector3();
      middlePoint.addVectors(this.measure_counter[0], intersect[0].point);
      middlePoint.multiplyScalar(0.5);
      cylinder.position.copy(middlePoint);
      // Change the height of the cylinder
      const newHeight = distance; // New height in units
      const radius = cylinder.geometry.parameters.radiusTop; // Get the radius of the cylinder
      cylinder.scale.setY(newHeight); // Set the scale along the y-axis to twice the new height divided by the radius
      cylinder.lookAt(intersect[0].point);
      cylinder.rotateX(Math.PI / 2);

      // Add Distance Label on the top
      // Set the position of the sprite to be above the mesh
      const text = distance.toFixed(2) + " mm";
      const sprite = this.makeTextSprite(text,{ fontsize: 60 });
      sprite.position.copy(middlePoint);
      // Add the sprite to the scene
      this.scene.add(sprite);

      // reset the counter
      this.measure_groups.push([cylinder, sprite]);
      this.Measurement([cylinder, sprite]);
      this.measure_counter = [];
    }
    else {

    }
  }
  Measurement(measuregroup: any, undo?: boolean) {
    console.log(measuregroup[0]);
    if(undo === true){
      measuregroup[0].material.visible = false;
      measuregroup[1].material.visible = false;
    }
    else{
      measuregroup[0].material.visible = true;
      measuregroup[1].material.visible = true;
    }
    this.eventdispatcher.dispatchEvent({
      type: 'measure',
      measuregroup: measuregroup,
      undo: false
    });
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
      var planeLength = 160, textHeight = 80; // Increase textHeight to 80
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
      context.font = '40px Arial'; // Decrease font size to 40px
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
    sprite.scale.set(scale_value/5, scale_value/5, 1);
    sprite.material.map = text_plane;
    sprite.material.opacity = 0.5;
    intersect[0].object.add(sprite); //add annotation on the object

    this.eventdispatcher.dispatchEvent({
      type: 'annotation',
      text: text,
      inter: intersect
    });
    // this.mode = modes.Cammode;
    // this.ModeText_add = "";
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
    updateModeDisplay(this.ModeText[this.mode],this.ModeText_add);
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
      let zoom = this.controls.camera.zoom;
      let orientation = { position, target, up, zoom };
      this.eventdispatcher.dispatchEvent({
        type: 'cameraStart',
        orientation
      });
      let cc_1 = new THREE.Vector3(0,0,700);
      let cc_2 = new THREE.Vector3(0,0,0);
      let cc_3 = new THREE.Vector3(0,-1,1);
  
      this.controls.changeCamera(cc_1,cc_2,cc_3,this.initial_zoom,1000);
      position = cc_1.toArray();
      target =  cc_2.toArray();
      up = cc_3.toArray();
      zoom = this.initial_zoom;
      orientation = { position, target, up, zoom };
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
      let zoom = this.controls.camera.zoom;
      let orientation = { position, target, up, zoom };
      this.eventdispatcher.dispatchEvent({
        type: 'cameraStart',
        orientation
      });
      let cc_1 = new THREE.Vector3(0,0,-700);
      let cc_2 = new THREE.Vector3(0,0,0);
      let cc_3 = new THREE.Vector3(0,1,0);
  
      this.controls.changeCamera(cc_1,cc_2,cc_3,this.initial_zoom,1000);
      position = cc_1.toArray();
      target =  cc_2.toArray();
      up = cc_3.toArray();
      orientation = { position, target, up, zoom };
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
      let zoom = this.controls.camera.zoom;
      let orientation = { position, target, up, zoom };
      this.eventdispatcher.dispatchEvent({
        type: 'cameraStart',
        orientation
      });
      let cc_1 = new THREE.Vector3(700,0,0);
      let cc_2 = new THREE.Vector3(0,0,0);
      let cc_3 = new THREE.Vector3(-1,0,0);
      this.controls.changeCamera(cc_1,cc_2,cc_3,this.initial_zoom,500);
  
      position = cc_1.toArray();
      target =  cc_2.toArray();
      up = cc_3.toArray();
      orientation = { position, target, up, zoom };
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
      let zoom = this.controls.camera.zoom;
      let orientation = { position, target, up, zoom };      
      this.eventdispatcher.dispatchEvent({
        type: 'cameraStart',
        orientation,
      });
      let cc_1 = new THREE.Vector3(-700,0,0);
      let cc_2 = new THREE.Vector3(0,0,0);
      let cc_3 = new THREE.Vector3(1,0,0);
      this.controls.changeCamera(cc_1,cc_2,cc_3,this.initial_zoom,500);
  
      position = cc_1.toArray();
      target =  cc_2.toArray();
      up = cc_3.toArray();
      orientation = { position, target, up, zoom };
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
      let zoom = this.controls.camera.zoom;
      let orientation = { position, target, up, zoom };      
      this.eventdispatcher.dispatchEvent({
        type: 'cameraStart',
        orientation
      });
      let cc_1 = new THREE.Vector3(0,700,0);
      let cc_2 = new THREE.Vector3(0,0,0);
      let cc_3 = new THREE.Vector3(0,1,1);
      this.controls.changeCamera(cc_1,cc_2,cc_3,this.initial_zoom,500);
  
      position = cc_1.toArray();
      target =  cc_2.toArray();
      up = cc_3.toArray();
      orientation = { position, target, up, zoom };
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
      let zoom = this.controls.camera.zoom;
      let orientation = { position, target, up, zoom };      
      this.eventdispatcher.dispatchEvent({
        type: 'cameraStart',
        orientation
      });
      let cc_1 = new THREE.Vector3(0,-700,0);
      let cc_2 = new THREE.Vector3(0,0,0);
      let cc_3 = new THREE.Vector3(0,1,1);
      this.controls.changeCamera(cc_1,cc_2,cc_3,this.initial_zoom,500);
  
      position = cc_1.toArray();
      target =  cc_2.toArray();
      up = cc_3.toArray();
      orientation = { position, target, up, zoom };
      this.eventdispatcher.dispatchEvent({
        type: 'cameraEnd',
        orientation
      });
      this.viewpoint_action = modes.Idle;
    },
    toggleAllSprites: () => {
        this.spriteMap.forEach((value, key) => {
          value.visible = !value.visible;
          value.sprite.visible = value.visible;
        });
      }
  }

  load_stl_models = async(alpha) => {
        // Load STL models
        let fragment_folder
        let uis = this.ui;
        if(this.firstload){
          fragment_folder = uis.addFolder('Fragments Opacity');
          fragment_folder.add(this.viewpoint_button, "toggleAllSprites").name("Toggle Labels");  
        }
        else
          fragment_folder = uis.__folders['Fragments Opacity'];

        
        
        for(var file of alpha)
        {
          let name = 'f' + this.number_of_stl.toString();
          const color = this.selectColor(this.number_of_stl);
          let material = new THREE.MeshLambertMaterial({ color: color, transparent: true,  depthTest: true});
          material.polygonOffset = true;
          material.polygonOffsetFactor = 1;
          material.polygonOffsetUnits = 1;
          // const SM = new SimplifyModifier();
          const geometry = await this.loadSTL(file.result) as THREE.BufferGeometry;
          let mesh = new THREE.Mesh(geometry , material);
          // const SMG = await SM.modify(geometry, 0.2);
          // mesh.geometry = SMG;
          let centroid = new THREE.Vector3();
          mesh.geometry.computeBoundingBox();
          centroid.x = (geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2;
          centroid.y = (geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2;
          centroid.z = (geometry.boundingBox.max.z + geometry.boundingBox.min.z) / 2;
          mesh.name = name.toString();
          geometry.center();
          mesh.position.copy(centroid);
          mesh.rotation.set(0,0,0);
          const sprite = this.makeTextSprite(name, {});
          this.spriteMap.set(name, { sprite: sprite, visible: true });
          mesh.add(sprite);
          this.objects.add(mesh);
          // this.connect_label(mesh);
          fragment_folder.add(material, 'opacity', 0, 1).name(name)
          .onChange((value) => {material.opacity = value;});
          fragment_folder.open();
          this.number_of_stl++;
        }
        if(this.firstload){
          this.firstload = false;
          this.model_centering();
        }
  }
  model_centering = () => {
        //positioning all loaded meshes to the center of the scene. 
        // compute average position of child meshes
        const center = new THREE.Vector3();
        this.objects.children.forEach((child) => {
          center.add(child.position);
        });
        center.divideScalar(this.objects.children.length);
        const origin = new THREE.Vector3(0, 0, 0);
        const direction = center.clone().sub(origin).normalize();
        const distance = origin.distanceTo(center);
        const newVector = origin.clone().add(direction.multiplyScalar(distance));
        // subtract the average position from each child mesh's position
        this.objects.children.forEach((child) => {
          child.position.sub(newVector);
        });

        // set the parent object's position to the negative of the average position
        this.objects.position.set(0,0,0);

        // Calculate the bounding box that contains all objects
        var bbox = new THREE.Box3().setFromObject(this.objects);

        // Calculate the center of the bounding box
        var center_bbox = new THREE.Vector3();
        bbox.getCenter(center);

        // Calculate the radius of the bounding box
        const width = bbox.max.x - bbox.min.x;
        const height = bbox.max.y - bbox.min.y;
        const depth = bbox.max.z - bbox.min.z;  
        const maxDim = Math.max(width, height, depth);
        if(maxDim < 200)
          this.initial_zoom = 200/maxDim;
        else
          this.initial_zoom = 50/maxDim;
        // Set the camera position and target to view all objects
        this.camera.lookAt(center_bbox);
        this.camera.zoom = this.initial_zoom;
        this.camera.updateProjectionMatrix();
  }
  load_demo = () =>{
        if(this.firstload)
          this.firstload = false;
        else
          return;
        // Load STL models  
        let fragment_folder
        let uis = this.ui;
        const alpha = ['assets/SP_1_reduced.stl','assets/SP_2_reduced.stl','assets/SP_3_reduced.stl'];      
        fragment_folder = uis.addFolder('Fragments Opacity');
        fragment_folder.add(this.viewpoint_button, "toggleAllSprites").name("Toggle Labels");  

        for(var file of alpha)
        {
          let name = 'f' + this.number_of_stl.toString();
          const color = this.selectColor(this.number_of_stl);
          let loaderSTL = new STLLoader();
          
          let material = new THREE.MeshLambertMaterial({ color: color, transparent: true});
          material.polygonOffset = true;
          material.polygonOffsetFactor = 1;
          material.polygonOffsetUnits = 1;
          loaderSTL.load(file, function (geometry) {
            const mesh = new THREE.Mesh(geometry, material);
            const bbox = new THREE.Box3().setFromObject(mesh);
            const centroid = new THREE.Vector3();
            bbox.getCenter(centroid);
          
            mesh.name = name.toString();
            geometry.center();
            mesh.position.copy(centroid);
            mesh.position.sub(new THREE.Vector3(57.5,29.2,86.5));
            mesh.rotation.set(0, 0, 0);
          
            const sprite = this.makeTextSprite(name, {});
            this.spriteMap.set(name, { sprite: sprite, visible: true });
            mesh.add(sprite);
            this.objects.add(mesh);

          }.bind(this));

          fragment_folder.add(material, 'opacity', 0, 1).name(name)
          .onChange((value) => {material.opacity = value;});
          fragment_folder.open();
          this.number_of_stl++;
        }
        this.objects.position.set(0,0,0);
        let loaderSTL = new STLLoader();
        let name = 'f' + this.number_of_stl.toString();
        const color = this.selectColor(this.number_of_stl);
        let material = new THREE.MeshLambertMaterial({ color: color, transparent: true});
        this.model_centering();
        loaderSTL.load('assets/Clavicle Mid Shaft Bone Plate_2.stl',function(geometry){          
          const mesh = new THREE.Mesh(geometry, material);
          let centroid = new THREE.Vector3();
          mesh.geometry.computeBoundingBox();
          centroid.x = (geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2;
          centroid.y = (geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2;
          centroid.z = (geometry.boundingBox.max.z + geometry.boundingBox.min.z) / 2;
          mesh.name = name.toString();
          geometry.center();
          mesh.position.copy(centroid);
          mesh.position.sub(new THREE.Vector3(20,40,100));
          mesh.rotation.set(0,0,0);
          const sprite = this.makeTextSprite(name, {});
          this.spriteMap.set(name, { sprite: sprite, visible: true });
          mesh.add(sprite);
          this.objects.add(mesh);
        }.bind(this));
        fragment_folder.add(material, 'opacity', 0, 1).name(name);
        this.initial_zoom = 2.27;
        this.number_of_stl++;
        this.camera.zoom = this.initial_zoom;
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

  createDragControls(annotations: THREE.Object3D[], camera: THREE.Camera, domElement: HTMLElement) {
    this.dragControls = new DragControls(annotations, camera, domElement);
  
    this.dragControls.addEventListener('dragstart', () => {
      this.controls.enabled = false; // Disable camera controls while dragging
    });
  
    this.dragControls.addEventListener('dragend', () => {
      this.controls.enabled = true; // Re-enable camera controls after dragging
    });
  }

  ScreenShot = () => {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d');
    const gl = this.renderer.getContext();
    const width = this.renderer.domElement.clientWidth;
    const height = this.renderer.domElement.clientHeight;
    const data = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
    const imageData = new ImageData(new Uint8ClampedArray(data), this.width, this.height);
    ctx.putImageData(imageData, 0, 0);
    const dataURL = canvas.toDataURL();
    return dataURL;
  }

  makeTextSprite = ( message, parameters ) => {
        if ( parameters === undefined ) parameters = {};
        var fontface = parameters.hasOwnProperty("fontface") ? parameters["fontface"] : "Courier New";
        var fontsize = parameters.hasOwnProperty("fontsize") ? parameters["fontsize"] : 70;
        var borderThickness = parameters.hasOwnProperty("borderThickness") ? parameters["borderThickness"] : 4;
        var borderColor = parameters.hasOwnProperty("borderColor") ?parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
        var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?parameters["backgroundColor"] : { r:0, g:0, b:0, a:1.0 };
        var textColor = parameters.hasOwnProperty("textColor") ?parameters["textColor"] : { r:0, g:0, b:0, a:1.0 };

        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        context.font = "Bold " + fontsize + "px " + fontface;
        var metrics = context.measureText( message );
        var textWidth = metrics.width;

        context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
        context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," + borderColor.b + "," + borderColor.a + ")";
        context.fillStyle = "rgba("+textColor.r+", "+textColor.g+", "+textColor.b+", 1.0)";
        context.fillText( message, borderThickness, fontsize + borderThickness);

        var texture = new THREE.Texture(canvas) 
        texture.needsUpdate = true;
        var spriteMaterial = new THREE.SpriteMaterial( { map: texture, depthWrite: false, depthTest: false } );
        var sprite = new THREE.Sprite( spriteMaterial );
        sprite.scale.set(0.5 * fontsize, 0.25 * fontsize, 0.75 * fontsize);
        return sprite;  
    }

  loadSTL(url) {
    return new Promise((resolve, reject) => {
      const loader = new STLLoader();
      try{resolve(loader.parse(url))}
      catch(e){reject(e)}
    });
  }
}


