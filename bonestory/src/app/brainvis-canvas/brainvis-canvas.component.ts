import {
  Component,
  Injectable,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy,
  HostListener,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { fromEvent, Observable, ReplaySubject, Subscription } from 'rxjs';
import * as THREE from 'three';
import * as dat from 'dat.gui';
// import { STLExporter } from 'three/addons/exporters/STLExporter.js';

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
import { updateModeDisplay } from '../util/Displaywidget';

import { DragControls } from 'three/examples/jsm/controls/DragControls';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { position } from 'html2canvas/dist/types/css/property-descriptors/position';
import { StateNode } from '@visualstorytelling/provenance-core';

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
  @ViewChild('canvas_', { static: true }) canvas_: ElementRef;
  //check user offline, online
  onlineEvent: Observable<Event>;
  offlineEvent: Observable<Event>;
  subscriptions: Subscription[] = [];

  //for dat.gui
  public ui: dat.GUI;
  public guiElement: HTMLElement;

  //sync with main (appcomponent) and stl_load_models
  private _showSlice = false;
  private _showSliceHandle = false;
  private _showObjects = true;
  private _randerorder = 1;
  private objectSelector: ObjectSelector;
  private appcomponent: AppComponent;
  public mm: TransformControls;
  private mode;
  public intersection_info;
  public keydown_coordinate: THREE.Vector2;
  public viewpoint_action = 0;
  relativePos: THREE.Vector3;
  rotate_counter = 0;
  rotate_prev_intersect: THREE.Vector3;
  trans_counter = 0;
  middle_point: THREE.Vector3;

  @Input() set showObjects(showObjects: boolean) {
    this._showObjects = showObjects;
    this.toggleObjects(showObjects);
    this.showObjectsChange.emit(showObjects);
  }
  @Output() showObjectsChange = new EventEmitter<boolean>();
  get showObjects() {
    return this._showObjects;
  }

  private width: number;
  private height: number;
  private elem: Element;
  public scene = new THREE.Scene();
  public pivot_group = new THREE.Group();
  private objects: THREE.Object3D; // all the loaded objects go in here

  // private camera: THREE.PerspectiveCamera;
  public camera: THREE.OrthographicCamera;
  private renderer = new THREE.WebGLRenderer({
    antialias: true,
    logarithmicDepthBuffer: true,
    preserveDrawingBuffer: true
  });

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
  public selectedobj: THREE.Mesh; // for indicating selected object
  public helper; // for indicating selected object surface normal
  public measure_groups = []; // Create an array to store the annotations
  public measure_counter = [];
  public annotations = [];
  public composer;
  public outlinePass;
  public renderPass;
  public gizmoLayer;
  private initial_zoom = 1;
  private spriteMap = new Map();
  private firstload = true;
  private ModeText = ['Object', 'Object', 'Camera', 'Annotation'];
  private ModeText_add = '';
  private dragControls;
  private gridHelper;
  private AxesHelper;
  private inter_have;
  private inter_helper;
  private objstat: { name: string[]; opacity: number[]; hide_val: boolean[] };
  private hidden_refresh = false;
  private image_loaded = false;

  // stl file information
  private stl_objs: FormData;

  constructor(elem: ElementRef, provenance: ProvenanceService) {
    this.elem = elem.nativeElement;
    this.service = provenance;
    this.eventdispatcher = new THREE.EventDispatcher();
    this.objects = new THREE.Object3D();
    this.objectSelector = new ObjectSelector(
      this.objects,
      this.renderer.domElement,
      this.camera,
      this
    );

    // todo: remove object from window
    // registerActions(this.service.registry, this);
    // addListeners(this.service.tracker, this);
  }
  addEventListener(type, listener) {
    this.eventdispatcher.addEventListener(type, listener);
  }
  removeEventListener(type, listener) {
    this.eventdispatcher.removeEventListener(type, listener);
  }
  onWindowResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Update pixel ratio
    const pixelRatio = window.devicePixelRatio || 1;

    // Orthographic camera
    this.camera.left = this.width / -2;
    this.camera.right = this.width / 2;
    this.camera.top = this.height / 2;
    this.camera.bottom = this.height / -2;
    this.camera.updateProjectionMatrix();

    // Adjust renderer size and pixel ratio
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(pixelRatio);

    // Render the scene
    this.composer.render();
    this.render();
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

    this.subscriptions.push(
      this.onlineEvent.subscribe(e => {
        // this.connectionStatusMessage = 'Back to online';
        // this.connectionStatus = 'online';
        console.log('Online...');
      })
    );

    this.subscriptions.push(
      this.offlineEvent.subscribe(e => {
        // this.connectionStatusMessage = 'Connection lost! You are not connected to internet';
        // this.connectionStatus = 'offline';
        console.log('Offline...');
      })
    );

    // this.elem = ElementRef.nativeElement;
    (window as any).canvas = this;

    this.width = this.elem.clientWidth;
    this.height = this.elem.clientHeight;

    this.scene.background = new THREE.Color('#a5a29a');

    this.camera = new THREE.OrthographicCamera(
      this.width / -2,
      this.width / 2,
      this.height / 2,
      this.height / -2,
      0.1,
      6000
    );
    // this.camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 0.01, 3000);

    const canvasElm = this.renderer.domElement;
    this.elem.appendChild(canvasElm);
    canvasElm.style.display = 'block';
    this.controls = new Trackball(this.camera, this.renderer.domElement);
    this.scene.add(this.objects);
    this.controls.reset();

    //change starting position of the camera
    this.camera.position.set(0, 600, 0);
    this.camera.up.set(0, 0, 1);
    this.camera.frustumCulled = true;
    this.camera.updateMatrix();
    this.camera.zoom = 1;
    this.renderer.setSize(this.width, this.height);
    this.controls.update();
    this.mm = new TransformControls(this.camera, this.renderer.domElement);
    this.mm.setSize(0.4);
    // Set custom layer for the gizmo
    this.gizmoLayer = new THREE.Layers();
    this.gizmoLayer.set(1);

    this.intersectionManager = new IntersectionManager(
      this.renderer.domElement,
      this.camera
    );
    this.intersectionManager.addListener(this.objectSelector);

    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    this.outlinePass = new OutlinePass(
      new THREE.Vector2(this.width, this.height),
      this.scene,
      this.camera
    );
    this.outlinePass.selectedObjects = [];
    this.outlinePass.edgeStrength = 1.0;
    this.outlinePass.edgeGlow = 0.5;
    this.outlinePass.edgeThickness = 1.0;
    this.outlinePass.pulsePeriod = 0;
    this.outlinePass.usePatternTexture = false;
    this.outlinePass.visibleEdgeColor.set('#ffffff');
    this.outlinePass.hiddenEdgeColor.set('#ffffff');
    this.composer.addPass(this.outlinePass);

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
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.1));
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);

    this.directionalLight.position.set(1, 1, 1).normalize();
    this.gridHelper = new THREE.GridHelper(500, 10);
    this.AxesHelper = new THREE.AxesHelper(500);
    var instructions = document.getElementById('instructions');

    this.scene.add(this.directionalLight);
    // this.scene.add(directionallight_2);
    this.scene.add(this.mm);
    this.scene.add(this.gridHelper);
    this.scene.add(this.AxesHelper);
    this.scene.add(this.pivot_group);

    this.ui = new dat.GUI({ autoPlace: false, width: 200 });
    const vis_helper = this.ui.addFolder('Helpers');
    vis_helper.add(this.gridHelper, 'visible').name('Grid');
    vis_helper.add(this.AxesHelper, 'visible').name('Axes');
    vis_helper
      .add({ instructions: true }, 'instructions')
      .name('Instructions')
      .onChange((value: boolean) => {
        instructions.style.display = value ? 'block' : 'none';
      });
    vis_helper.open();

    //add camera offset indicator gui
    const sphereGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    this.inter_helper = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.inter_helper.position.set(0, 0, 0);
    this.inter_helper.visible = false;
    this.scene.add(this.inter_helper);

    const cam_offset = this.ui.addFolder('Camera offset');
    cam_offset.add(this.viewpoint_button, 'click_front').name('★ Front view');
    cam_offset.add(this.viewpoint_button, 'click_back').name('Back view');
    cam_offset.add(this.viewpoint_button, 'click_top').name('Top view');
    cam_offset.add(this.viewpoint_button, 'click_bottom').name('Bottom view');
    cam_offset.add(this.viewpoint_button, 'click_left').name('Left view');
    cam_offset.add(this.viewpoint_button, 'click_right').name('Right view');
    cam_offset.open();

    var customContainer = document.getElementById('gui');
    customContainer.style.overflowY = 'scroll';
    customContainer.style.maxHeight = '50%'; // Adjust max height as needed
    customContainer.appendChild(this.ui.domElement);

    // Hide CloseControls button
    const style = document.createElement('style');
    style.innerHTML = '.dg .close-button {display: none;}';
    document.head.appendChild(style);
  }

  addEventListeners() {
    // resize event
    var x = 0,
      y = 0;
    var keydown_coordinate;

    this.renderer.domElement.addEventListener(
      'resize',
      this.onWindowResize,
      false
    );
    this.addEventListener('wheel', event => {
      console.log('wheel');
    });
    window.addEventListener('beforeunload', function(e) {
      var confirmationMessage = 'o/';
      console.log('user terminated');
      (e || window.event).returnValue = confirmationMessage; //Gecko + IE
      return confirmationMessage; //Webkit, Safari, Chrome
    });
    window.addEventListener(
      'mousemove',
      e => {
        x = (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
        y = -(e.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
        keydown_coordinate = e;
        // const have = this.intersectionManager.intersectObjects(e,this.objects.children);
      },
      false
    );

    window.addEventListener('keyup', async event => {
      if (
        event.key == 'Shift' &&
        !(window as any).istyping &&
        this.outlinePass.selectedObjects.length > 0
      ) {
        //안변하면 유지하는거 구현해야함
        const past = this.objectSelector.pastSelectedObjects;
        const pastname = past.length > 0 ? past[0].name : undefined;
        let prev_names = '';
        let past_names = '';
        this.objectSelector.previousSelectedObjects.map(obj => {
          prev_names = prev_names + ',' + obj.name;
        });
        this.objectSelector.pastSelectedObjects.map(obj => {
          past_names = past_names + ',' + obj.name;
        });
        prev_names = prev_names.substring(1);
        past_names = past_names.substring(1);
        let temp = [
          this.outlinePass.selectedObjects[0].name,
          pastname,
          prev_names,
          past_names
        ];
        const cur_node = this.service.traverser.graph.current as StateNode;
        console.log(this.service.graph.application);
        console.log(temp[2]);
        if (!temp[2].includes(cur_node.action.doArguments[0][2])) {
          this.objectSelector.setSelection(temp);
          this.eventdispatcher.dispatchEvent({
            type: 'objsel',
            val: temp
          });
        } else {
          cur_node.metadata.O_group = prev_names;
          cur_node.action.doArguments[0][2] = temp[2];
          cur_node.action.undoArguments[0][3] = temp[2];
          cur_node.metadata.screenshot = await this.ScreenShot();
        }
      }
      this.objectSelector.setkey(event, keydown_coordinate);
      this.mode = this.objectSelector.getmode();
      if (this.mode == modes.Cammode)
        // camera
        this.controls.enabled = true;
      else {
        this.controls.enabled = false;
        if (this.mode == modes.Translation) this.ModeText_add = '\nTranslate';
        else if (this.mode == modes.Rotation) this.ModeText_add = '\nRotate';
      }
      // this.controls.update();
    });

    // window.addEventListener('keyup', (event) => {
    //   if(event.key == 'Control'){
    //     this.ctrl_down = false;
    //     this.objectSelector.pastSelectedObjects = this.objectSelector.previousSelectedObjects
    //     this.objectSelector.previousSelectedObjects = this.outlinePass.selectedObjects;
    //     // this.eventdispatcher.dispatchEvent({
    //     //   type: 'objectSelection',
    //     //   newObject: [this.previousSelectedObject, this.pastSelectedObject, this.previousColor, this.pastColor]
    //     // });
    //   }
    //   this.objectSelector.setkey(event, keydown_coordinate);
    //   this.mode = this.objectSelector.getmode();
    //   if(this.mode == modes.Cammode) // camera
    //     this.controls.enabled = true;
    //   else{
    //     this.controls.enabled = false;
    //     if(this.mode == modes.Translation)
    //       this.ModeText_add = '\nTranslate';
    //     else if(this.mode == modes.Rotation)
    //       this.ModeText_add = '\nRotate';
    //   }
    //   // this.controls.update();
    //   });

    // window.addEventListener('keyup', (event) => {
    //   if(event.key == 'Control'){
    //     this.ctrl_down = false;
    //     this.objectSelector.pastSelectedObjects = this.objectSelector.previousSelectedObjects
    //     this.objectSelector.previousSelectedObjects = this.outlinePass.selectedObjects;
    //     // this.eventdispatcher.dispatchEvent({
    //     //   type: 'objectSelection',
    //     //   newObject: [this.previousSelectedObject, this.pastSelectedObject, this.previousColor, this.pastColor]
    //     // });
    //   }
    //   this.objectSelector.setkey(event, keydown_coordinate);
    //   this.mode = this.objectSelector.getmode();
    //   if(this.mode == modes.Cammode) // camera
    //     this.controls.enabled = true;
    //   else{
    //     this.controls.enabled = false;
    //     if(this.mode == modes.Translation)
    //       this.ModeText_add = '\nTranslate';
    //     else if(this.mode == modes.Rotation)
    //       this.ModeText_add = '\nRotate';
    //   }
    //   // this.controls.update();
    //   });

    this.controls.addEventListener('zoom_track_start', event => {
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

    this.controls.addEventListener('zoom_track_end', event => {
      const position = this.controls.camera.position.toArray();
      const target = this.controls.target.toArray();
      const up = this.controls.camera.up.toArray();
      const zoom = this.controls.camera.zoom;
      const orientation = { position, target, up, zoom };
      const state = event.state;
      updateModeDisplay(this.ModeText[this.mode], '\nMove');
      this.eventdispatcher.dispatchEvent({
        type: 'zoomEnd',
        orientation,
        state
      });
      this.ModeText_add = '\nMove';
    });

    this.controls.addEventListener('start', event => {
      this.inter_have = this.intersectionManager.intersectObjects(
        event.mouse,
        this.objects.children
      );
      const position = this.controls.camera.position.toArray();
      let target = this.controls.target.toArray();
      if (this.inter_have != false) {
        const offset = new THREE.Vector3();
        offset.copy(this.camera.position).sub(this.inter_have.point);
        this.controls.target.copy(this.inter_have.point);
        target = this.controls.target.toArray();
      }
      const up = this.controls.camera.up.toArray();
      const zoom = this.controls.camera.zoom;
      const orientation = { position, target, up, zoom };
      this.inter_helper.position.copy(target);
      this.inter_helper.visible = true;
      this.render();

      this.eventdispatcher.dispatchEvent({
        type: 'cameraStart',
        orientation
      });
      this.mode = modes.Cammode;
      this.ModeText_add = '\nMove';
    });

    this.controls.addEventListener('end', event => {
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
      this.inter_helper.visible = false;
      this.render();
    });

    this.objectSelector.addEventListener('t_start', (event: any) => {
      this.eventdispatcher.dispatchEvent({
        type: 'transStart',
        rotation: event.rotation,
        position: event.position
      });
      this.mode = modes.Translation;
      this.ModeText_add = '\nTranslate';
    });
    this.objectSelector.addEventListener('t_end', (event: any) => {
      this.eventdispatcher.dispatchEvent({
        type: 'transEnd',
        rotation: event.rotation,
        position: event.position
      });
      this.mode = modes.Cammode;
      this.ModeText_add = '';
    });

    this.objectSelector.addEventListener('r_start', (event: any) => {
      event.position.forEach((element: any) => {
        element.add(this.pivot_group.position.clone());
      });
      this.eventdispatcher.dispatchEvent({
        type: 'rotationStart',
        rotation: event.rotation,
        position: event.position
      });
      this.mode = modes.Rotation;
      this.ModeText_add = '\nRotate';
    });
    this.objectSelector.addEventListener('r_end', (event: any) => {
      this.eventdispatcher.dispatchEvent({
        type: 'rotationEnd',
        rotation: event.rotation,
        position: event.position
      });
      this.mode = modes.Cammode;
      this.ModeText_add = '';
    });

    this.objectSelector.addEventListener('interactive', (event: any) => {
      const inter = this.objectSelector.getinteractive();
      const mode = this.objectSelector.getmode();
      this.selectedobj = this.objectSelector.getcurrobject();
      this.setInteractive(inter);
      if (mode == 0 && this.selectedobj != undefined) {
        // Translation
        this.mm.setMode('translate');
        this.controls.enabled = false;
      } else if (mode == 1 && this.selectedobj != undefined) {
        //Rotation
        this.mm.setMode('rotate');
        if (event.intersect != undefined) {
          this.pivot_group.position.set(0, 0, 0);
          this.pivot_group.rotation.set(0, 0, 0);
          this.outlinePass.selectedObjects.forEach(obj => {
            if (this.rotate_counter > 0) {
              obj.position.add(this.rotate_prev_intersect);
            }
            this.pivot_group.add(obj);
            this.pivot_group.position.copy(event.intersect);
            obj.position.sub(event.intersect);
          });
          this.rotate_prev_intersect = event.intersect;

          this.mm.attach(this.pivot_group);
          this.mm.traverse(node => {
            node.layers.enable(this.gizmoLayer.mask);
          });
          this.rotate_counter++;
        }
        this.controls.enabled = false;
      } else {
        if (this.trans_counter > 0 || this.rotate_counter > 0) {
          this.outlinePass.selectedObjects.forEach(element => {
            let tempQuaternion = new THREE.Quaternion();
            let tempVector = new THREE.Vector3();
            element.getWorldQuaternion(tempQuaternion);
            element.getWorldPosition(tempVector);
            this.objects.add(element);
            element.setRotationFromQuaternion(tempQuaternion);
            element.position.set(tempVector.x, tempVector.y, tempVector.z);
            element.updateMatrixWorld();
            this.objects.add(element);
          });
          this.pivot_group.position.set(0, 0, 0);
          if (this.trans_counter > 0) this.trans_counter = 0;
          if (this.rotate_counter > 0) this.rotate_counter = 0;
        }
        this.mm.detach();
        this.controls.enabled = true;
        this.mode = modes.Cammode;
      }
    });

    this.objectSelector.addEventListener('objectSelection', (event: any) => {
      if (this.selectedobj != event.newObject[0])
        this.selectedobj = event.newObject[0];
      else this.selectedobj = undefined;
      let temp = [
        event.newObject[0],
        event.newObject[1],
        event.newObject[2],
        event.newObject[3]
      ];
      this.objectSelector.setSelection(temp);
      this.eventdispatcher.dispatchEvent({
        type: 'objsel',
        val: temp
      });
      const inter = this.objectSelector.getinteractive();
      this.setInteractive(inter);
      this.mm.detach();
    });
  }
  selectedObjectsChange(value) {
    this.objectSelector.setSelection(value);
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
    let cc_1 = new THREE.Vector3(
      newOrientation.position[0],
      newOrientation.position[1],
      newOrientation.position[2]
    );
    let cc_2 = new THREE.Vector3(
      newOrientation.target[0],
      newOrientation.target[1],
      newOrientation.target[2]
    );
    let cc_3 = new THREE.Vector3(
      newOrientation.up[0],
      newOrientation.up[1],
      newOrientation.up[2]
    );
    this.controls.changeCamera(cc_1, cc_2, cc_3, newOrientation.zoom, within);
  }

  CameraMove(newOrientation: IOrientation, within: number) {
    // console.log(this.camera);
    this.controls.changeCamera(
      new THREE.Vector3(
        newOrientation.position[0],
        newOrientation.position[1],
        newOrientation.position[2]
      ),
      new THREE.Vector3(
        newOrientation.target[0],
        newOrientation.target[1],
        newOrientation.target[2]
      ),
      new THREE.Vector3(
        newOrientation.up[0],
        newOrientation.up[1],
        newOrientation.up[2]
      ),
      newOrientation.zoom,
      within
    );
  }

  CameraPan(newOrientation: IOrientation, within: number) {
    this.controls.changeCamera(
      new THREE.Vector3(
        newOrientation.position[0],
        newOrientation.position[1],
        newOrientation.position[2]
      ),
      new THREE.Vector3(
        newOrientation.target[0],
        newOrientation.target[1],
        newOrientation.target[2]
      ),
      new THREE.Vector3(
        newOrientation.up[0],
        newOrientation.up[1],
        newOrientation.up[2]
      ),
      newOrientation.zoom,
      within
    );
  }

  async ObjectTrans(newargs: any, newpos: any, within: number) {
    this.trans_counter = 0;
    await this.objectSelector.changeControls_total(newpos, within, newargs);
  }

  async ObjectRotate(newargs: any, newpos: any, within: number) {
    this.rotate_counter = 0;
    await this.objectSelector.changeControls_total(newpos, within, newargs);
  }
  Measure(intersect: any, undo?: boolean) {
    if (undo === true) {
      intersect[0].object.children.forEach(function(child) {
        if (child.name === 'measure') {
          child.materiaml.dispose();
          intersect[0].object.remove(child);
        }
      });
      return;
    }
    if (this.measure_counter.length == Measurement.Zero) {
      this.measure_counter.push(intersect[0].point.clone());
      const geometry = new THREE.CylinderGeometry(1, 1, 1, 32);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: false,
        depthwrite: true
      });
      const cylinder = new THREE.Mesh(geometry, material);
      cylinder.position.copy(this.measure_counter[0]);
      cylinder.renderOrder = this._randerorder;
      this._randerorder++;
      cylinder.name = 'measure';
      this.measure_counter.push(cylinder);
      this.scene.add(cylinder);
    } else if (this.measure_counter.length == Measurement.Two) {
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
      const text = distance.toFixed(2) + ' mm';
      const sprite = this.makeTextSprite(text, { fontsize: 60 });
      sprite.position.copy(middlePoint);
      // Add the sprite to the scene
      this.scene.add(sprite);

      // reset the counter
      this.measure_groups.push([cylinder, sprite]);
      this.Measurement([cylinder, sprite]);
      this.measure_counter = [];
    } else {
    }
  }
  Measurement(measuregroup: any, undo?: boolean) {
    // console.log(measuregroup[0]);
    if (undo === true) {
      measuregroup[0].material.visible = false;
      measuregroup[1].material.visible = false;
    } else {
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
    if (undo === true) {
      intersect[0].object.children.forEach(function(child) {
        if (child.name === text) {
          child.material.dispose();
          intersect[0].object.remove(child);
        }
      });
      return;
    }
    var text_plane = new THREE.CanvasTexture(
      (function() {
        var plane = document.createElement('canvas');

        var context = plane.getContext('2d');
        var planeLength = 160,
          textHeight = 80; // Increase textHeight to 80
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
        context.fillRect(0, 0, 512, textHeight + lineCount * textHeight);
        context.font = '40px Arial'; // Decrease font size to 40px
        context.fillStyle = 'black';
        context.textAlign = 'left';
        context.textBaseline = 'middle';
        context.imageSmoothingEnabled = true;
        context.arc(32, 32, 30, 0, Math.PI * 2);
        for (var i = 0; i < lineCount; i++) {
          context.fillText(lines[i], 0, textHeight + i * textHeight, 512);
        }
        return plane;
      })()
    );
    text_plane.needsUpdate = true;
    var sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        color: 0xffffff,
        alphaTest: 0.5,
        transparent: true,
        depthTest: false,
        depthWrite: false
      })
    );
    sprite.name = text;

    const scaler = this.camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
    const scale_value = scaler / 2;
    sprite.scale.set(scale_value / 5, scale_value / 5, 1);
    sprite.position.copy(intersect[0].point.sub(intersect[0].object.position));
    sprite.material.map = text_plane;
    sprite.material.opacity = 0.5;
    sprite.name = text;
    intersect[0].object.add(sprite); //add annotation on the object

    this.eventdispatcher.dispatchEvent({
      type: 'annotation',
      text: text,
      inter: intersect
    });
    this.mode = modes.Cammode;
    this.ModeText_add = '';
  }

  // Annotation(text: string, intersect: any, undo?: boolean) {
  //   if(undo === true){
  //     intersect[0].object.children.forEach (function (child) {
  //       if(child.name === text){
  //         child.material.dispose();
  //         intersect[0].object.remove(child);
  //       }
  //     });
  //     return;
  //   }
  //   var text_plane =  new THREE.CanvasTexture(function () {

  //     var plane = document.createElement('canvas');

  //     var context = plane.getContext('2d');
  //     var planeLength = 160, textHeight = 80; // Increase textHeight to 80
  //     plane.width = 512;
  //     var words = text.split(' ');
  //     var line = '';
  //     var lineCount = 0;
  //     var lines = [];
  //     for (var n = 0; n < words.length; n++) {
  //       var testLine = line + words[n] + ' ';
  //       var testWidth = context.measureText(testLine).width;
  //       if (testWidth > planeLength) {
  //         lines.push(line);
  //         line = words[n] + ' ';
  //         lineCount++;
  //       } else {
  //         line = testLine;
  //       }
  //     }
  //     lineCount++;
  //     lines.push(line);
  //     plane.height = textHeight + lineCount * textHeight;
  //     context.fillStyle = 'white';
  //     context.fillRect(0, 0, 512, textHeight + (lineCount * textHeight));
  //     context.font = '40px Arial'; // Decrease font size to 40px
  //     context.fillStyle = 'black';
  //     context.textAlign = 'left';
  //     context.textBaseline = 'middle';
  //     context.imageSmoothingEnabled = true;
  //     context.arc(32,32,30,0,Math.PI*2);
  //     for (var i = 0; i < lineCount; i++) {
  //       context.fillText(lines[i], 0, textHeight + (i * textHeight), 512);
  //     }
  //     return plane;
  //   }());
  //   text_plane.needsUpdate = true;
  //   var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
  //     color: 0xffffff,
  //     alphaTest: 0.5,
  //     transparent: true,
  //     depthTest: false,
  //     depthWrite: false}));
  //   sprite.name = text;
  //   sprite.position.copy(intersect[0].point.sub(intersect[0].object.position));
  //   const scaler= this.camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
  //   const scale_value = scaler/2;
  //   sprite.scale.set(scale_value/5, scale_value/5, 1);
  //   sprite.material.map = text_plane;
  //   sprite.material.opacity = 0.5;
  //   intersect[0].object.add(sprite); //add annotation on the object

  //   this.eventdispatcher.dispatchEvent({
  //     type: 'annotation',
  //     text: text,
  //     inter: intersect
  //   });
  //   this.mode = modes.Cammode;
  //   this.ModeText_add = "";
  // }

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
      this.directionalLight.position.add(
        new THREE.Vector3(
          lightRotationTemp.x,
          lightRotationTemp.y,
          lightRotationTemp.z
        )
      );
      this.directionalLight.position.normalize();
    }
    updateModeDisplay(this.ModeText[this.mode], this.ModeText_add);
    this.controls.update();
    // Update annotation positions
    this.scene.traverse(object => {
      if (object.userData.annotations) {
        object.userData.annotations.forEach(annotation => {
          var annotationPosition = annotation.position
            .clone()
            .project(this.camera);
          annotation.element.style.left =
            ((annotationPosition.x + 1) / 2) * window.innerWidth + 'px';
          annotation.element.style.top =
            (-(annotationPosition.y - 1) / 2) * window.innerHeight + 'px';
        });
      }
    });
    this.composer.render();
  };

  render() {
    // this.renderer.render(this.scene, this.camera);
    this.composer.render();
  }
  getrender() {
    return this.renderer.render(this.scene, this.camera);
  }

  onShowObjectsChange = visible => {
    this.eventdispatcher.dispatchEvent({
      type: 'objectsVisibilityChanged',
      change: visible
    });
  };

  showObjectsToggled = checkBox => {
    this.toggleObjects(checkBox.currentTarget.checked);
    this.onShowObjectsChange(checkBox.currentTarget.checked);
  };

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
      let cc_1 = new THREE.Vector3(0, 0, 700);
      let cc_2 = new THREE.Vector3(0, 0, 0);
      let cc_3 = new THREE.Vector3(0, -1, 1);

      this.controls.changeCamera(cc_1, cc_2, cc_3, this.initial_zoom, 1000);
      position = cc_1.toArray();
      target = cc_2.toArray();
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
      let cc_1 = new THREE.Vector3(0, 0, -700);
      let cc_2 = new THREE.Vector3(0, 0, 0);
      let cc_3 = new THREE.Vector3(0, 1, 0);

      this.controls.changeCamera(cc_1, cc_2, cc_3, this.initial_zoom, 1000);
      position = cc_1.toArray();
      target = cc_2.toArray();
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
      let cc_1 = new THREE.Vector3(700, 0, 0);
      let cc_2 = new THREE.Vector3(0, 0, 0);
      let cc_3 = new THREE.Vector3(-1, 0, 1);
      this.controls.changeCamera(cc_1, cc_2, cc_3, this.initial_zoom, 500);

      position = cc_1.toArray();
      target = cc_2.toArray();
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
        orientation
      });
      let cc_1 = new THREE.Vector3(-700, 0, 0);
      let cc_2 = new THREE.Vector3(0, 0, 0);
      let cc_3 = new THREE.Vector3(1, 0, 1);
      this.controls.changeCamera(cc_1, cc_2, cc_3, this.initial_zoom, 500);

      position = cc_1.toArray();
      target = cc_2.toArray();
      up = cc_3.toArray();
      orientation = { position, target, up, zoom };
      this.eventdispatcher.dispatchEvent({
        type: 'cameraEnd',
        orientation
      });
      this.viewpoint_action = modes.Idle;
    },
    click_front: () => {
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
      let cc_1 = new THREE.Vector3(0, 700, 0);
      let cc_2 = new THREE.Vector3(0, 0, 0);
      let cc_3 = new THREE.Vector3(0, 1, 1);
      this.controls.changeCamera(cc_1, cc_2, cc_3, this.initial_zoom, 500);

      position = cc_1.toArray();
      target = cc_2.toArray();
      up = cc_3.toArray();
      orientation = { position, target, up, zoom };
      this.eventdispatcher.dispatchEvent({
        type: 'cameraEnd',
        orientation
      });
      this.viewpoint_action = modes.Idle;
    },
    click_back: () => {
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
      let cc_1 = new THREE.Vector3(0, -700, 0);
      let cc_2 = new THREE.Vector3(0, 0, 0);
      let cc_3 = new THREE.Vector3(0, 1, 1);
      this.controls.changeCamera(cc_1, cc_2, cc_3, this.initial_zoom, 500);

      position = cc_1.toArray();
      target = cc_2.toArray();
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
        // value.sprite.visible = value.visible;
      });
    }
  };

  load_stl_models = async alpha => {
    // Load STL models
    let fragment_folder;
    let uis = this.ui;
    if (this.firstload) {
      fragment_folder = uis.addFolder('Fragments');
      const labelsettings = { toggleAllSprites: true };
      fragment_folder
        .add(labelsettings, 'toggleAllSprites')
        .name('Toggle Labels')
        .onChange(value => {
          if (value) {
            this.spriteMap.forEach(spriteObject => {
              spriteObject.sprite.visible = true;
              spriteObject.line.visible = true;
            });
          } else {
            this.spriteMap.forEach(spriteObject => {
              spriteObject.sprite.visible = false;
              spriteObject.line.visible = false;
            });
          }
        });
    } else fragment_folder = uis.__folders['Fragments'];
    const objectSettings = {
      renderOrder: this._randerorder,
      hidden: false
    };
    for (var file of alpha) {
      let name = 'f' + this.number_of_stl.toString();
      const color = this.selectColor(this.number_of_stl);
      let material = new THREE.MeshLambertMaterial({
        color: color,
        transparent: true,
        depthTest: true,
        flatShading: true
      });
      material.polygonOffset = true;
      material.polygonOffsetFactor = 1;
      material.polygonOffsetUnits = 1;
      // const SM = new SimplifyModifier();
      const geometry = (await this.loadSTL(
        file.result
      )) as THREE.BufferGeometry;
      let mesh = new THREE.Mesh(geometry, material);
      // const SMG = await SM.modify(geometry, 0.2);
      // mesh.geometry = SMG;
      let centroid = new THREE.Vector3();
      mesh.geometry.computeBoundingBox();
      mesh.renderOrder = this._randerorder;
      this._randerorder++;
      centroid.x =
        (geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2;
      centroid.y =
        (geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2;
      centroid.z =
        (geometry.boundingBox.max.z + geometry.boundingBox.min.z) / 2;
      mesh.name = name.toString();

      geometry.center();

      mesh.position.copy(centroid);
      mesh.rotation.set(0, 0, 0);
      const sprite = this.makeTextSprite(name, {});
      sprite.position.set(0, 30, 0);
      // Create the line geometry
      const geometry_line = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        0,
        0,
        0,
        sprite.position.x,
        sprite.position.y,
        sprite.position.z
      ]);
      geometry_line.setAttribute(
        'position',
        new THREE.BufferAttribute(vertices, 3)
      );
      // create a red line material
      const material_line = new THREE.LineBasicMaterial({ color: 0x5b5c73 });

      // create the line
      const line = new THREE.Line(geometry_line, material_line);

      // add the line to the mesh
      mesh.add(line);
      this.spriteMap.set(name, { sprite: sprite, line: line });
      mesh.add(sprite);
      this.objects.add(mesh); // Add this line to update this.objects

      const meshSettings = { name: mesh.name, hidden: true, opacity: 1 };
      const replaceInArray = (arr, oldVal, newVal) => {
        for (let i = 0; i < arr.length; i++) {
          if (typeof arr[i] === 'string') {
            arr[i] = arr[i].replace(new RegExp(oldVal, 'g'), newVal);
          }
        }
      };
      const applyNameChange = (mesh, oldName, newName) => {
        const arrayFromObj = Object.keys(this.service.graph.getNodes()).map(
          key => this.service.graph.getNodes()[key]
        );
        arrayFromObj.forEach(node => {
          const groupArray = node.metadata.O_group.split(',');
          for (let i = 0; i < groupArray.length; i++) {
            if (groupArray[i] === oldName) {
              groupArray[i] = newName;
              break; // Assuming you only want to replace the first occurrence
            }
          }
          if (node.label == 'SelectObject' && 'action' in node) {
            replaceInArray(node.action.doArguments[0], oldName, newName);
            replaceInArray(node.action.undoArguments[0], oldName, newName);
          }
          node.metadata.O_group = groupArray.join(',');
        });
        const get_sprite = this.spriteMap.get(oldName);
        mesh.name = newName;
        const newSprite = this.makeTextSprite(newName, {});
        newSprite.position.set(0, 30, 0);
        mesh.remove(get_sprite.sprite);
        mesh.add(newSprite);
        this.spriteMap.delete(oldName);
        this.spriteMap.set(newName, {
          sprite: newSprite,
          visible: mesh.children[1]
        });
      };
      const n_s = this.number_of_stl - 1;
      fragment_folder
        .add(meshSettings, 'name')
        .name('Name')
        .onChange(value => {
          (window as any).istyping = true;
        })
        .onFinishChange(value => {
          const oldName = mesh.name;
          applyNameChange(mesh, oldName, value);
          this.objstat = this.Extractobjinfo(this.objects);
          this.fragmentoptionsrecorder();
          this.service.graph.emitNodeChangedEvent(this.service.graph.current);
          (window as any).istyping = false;
        });

      fragment_folder
        .add(meshSettings, 'hidden')
        .name('Visibility')
        .onChange(value => {
          if (!this.hidden_refresh) {
            mesh.visible = value;
            const spriteObject = this.spriteMap.get(meshSettings.name);
            if (spriteObject) spriteObject.visible = value;
            this.objstat = this.Extractobjinfo(this.objects);
            this.fragmentoptionsrecorder();
          }
          this.hidden_refresh = false;
        });

      fragment_folder
        .add(material, 'opacity', 0, 1)
        .name('Opacity')
        .onChange(value => {
          material.opacity = value;
          this.objstat = this.Extractobjinfo(this.objects);
          this.fragmentoptionsrecorder();
        });
      fragment_folder.open();
      this.number_of_stl++;
    }
    if (this.firstload) {
      this.firstload = false;
      this.model_centering();
    }
    this.objstat = this.Extractobjinfo(this.objects);

    this.service.graph.current.artifacts = JSON.parse(
      JSON.stringify(this.objstat)
    );
  };
  model_centering = () => {
    //positioning all loaded meshes to the center of the scene.
    // compute average position of child meshes
    const center = new THREE.Vector3();
    this.objects.children.forEach(child => {
      center.add(child.position);
    });
    center.divideScalar(this.objects.children.length);
    const origin = new THREE.Vector3(0, 0, 0);
    const direction = center
      .clone()
      .sub(origin)
      .normalize();
    const distance = origin.distanceTo(center);
    const newVector = origin.clone().add(direction.multiplyScalar(distance));
    // subtract the average position from each child mesh's position
    this.objects.children.forEach(child => {
      child.position.sub(newVector);
    });

    // set the parent object's position to the negative of the average position
    this.objects.position.set(0, 0, 0);

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

    // //type 1
    // if(maxDim > 200)
    //   this.initial_zoom = maxDim / 200;
    // else
    //   this.initial_zoom = maxDim;

    //type 2
    const w_size = this.width / width;
    const h_size = this.height / height;

    const min_size = Math.min(w_size, h_size);

    this.initial_zoom = min_size / 4;

    // Set the camera position and target to view all objects
    this.camera.lookAt(center_bbox);
    this.camera.zoom = this.initial_zoom;
    this.camera.updateProjectionMatrix();
  };
  load_demo = async () => {
    if (this.firstload) this.firstload = false;
    else return;

    // Load STL models
    let fragment_folder;
    let uis = this.ui;
    const alpha = [
      'assets/SP_1_reduced.stl',
      'assets/SP_2_reduced.stl',
      'assets/SP_3_reduced.stl',
      'assets/Clavicle Mid Shaft Bone Plate_2.stl'
    ];
    fragment_folder = uis.addFolder('Fragments');
    const labelsettings = { toggleAllSprites: true };
    fragment_folder
      .add(labelsettings, 'toggleAllSprites')
      .name('Toggle Labels')
      .onChange(value => {
        if (value) {
          this.spriteMap.forEach(spriteObject => {
            spriteObject.sprite.visible = true;
            spriteObject.line.visible = true;
          });
        } else {
          this.spriteMap.forEach(spriteObject => {
            spriteObject.sprite.visible = false;
            spriteObject.line.visible = false;
          });
        }
      });

    for (let file of alpha) {
      await new Promise<void>(resolve => {
        let name = 'f' + this.number_of_stl.toString();
        const color = this.selectColor(this.number_of_stl);
        let loaderSTL = new STLLoader();

        let material = new THREE.MeshLambertMaterial({
          color: color,
          transparent: true,
          flatShading: false
        });
        material.polygonOffset = true;
        material.polygonOffsetFactor = 1;
        material.polygonOffsetUnits = 1;

        loaderSTL.load(
          file,
          function(geometry) {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = this._randerorder;
            this._randerorder++;

            const bbox = new THREE.Box3().setFromObject(mesh);
            const centroid = new THREE.Vector3();
            bbox.getCenter(centroid);

            mesh.name = name.toString();
            geometry.center();
            mesh.position.copy(centroid);
            mesh.position.sub(new THREE.Vector3(57.5, 29.2, 86.5));

            mesh.rotation.set(0, 0, 0);

            const sprite = this.makeTextSprite(name, {});
            sprite.position.set(0, 30, 0);
            mesh.add(sprite);

            // Create the line geometry
            const geometry_line = new THREE.BufferGeometry();
            const vertices = new Float32Array([
              0,
              0,
              0,
              sprite.position.x,
              sprite.position.y,
              sprite.position.z
            ]);
            geometry_line.setAttribute(
              'position',
              new THREE.BufferAttribute(vertices, 3)
            );
            // create a red line material
            const material_line = new THREE.LineBasicMaterial({
              color: 0x5b5c73
            });

            // create the line
            const line = new THREE.Line(geometry_line, material_line);

            // add the line to the mesh
            mesh.add(line);
            this.spriteMap.set(name, { sprite: sprite, line: line });

            this.objects.add(mesh);

            const meshSettings = { name: mesh.name, hidden: true, opacity: 1 };

            const replaceInArray = (arr, oldVal, newVal) => {
              for (let i = 0; i < arr.length; i++) {
                if (typeof arr[i] === 'string') {
                  arr[i] = arr[i].replace(new RegExp(oldVal, 'g'), newVal);
                }
              }
            };

            const applyNameChange = (mesh, oldName, newName) => {
              const arrayFromObj = Object.keys(
                this.service.graph.getNodes()
              ).map(key => this.service.graph.getNodes()[key]);
              arrayFromObj.forEach(node => {
                const groupArray = node.metadata.O_group.split(',');
                for (let i = 0; i < groupArray.length; i++) {
                  if (groupArray[i] === oldName) {
                    groupArray[i] = newName;
                    break; // Assuming you only want to replace the first occurrence
                  }
                }
                if (node.label == 'SelectObject') {
                  replaceInArray(node.action.doArguments[0], oldName, newName);
                  replaceInArray(
                    node.action.undoArguments[0],
                    oldName,
                    newName
                  );
                }
                node.metadata.O_group = groupArray.join(',');
              });
              const get_sprite = this.spriteMap.get(oldName);
              mesh.name = newName;
              const newSprite = this.makeTextSprite(newName, {});
              newSprite.position.set(0, 30, 0);
              mesh.remove(get_sprite.sprite);
              mesh.add(newSprite);
              this.spriteMap.delete(oldName);
              this.spriteMap.set(newName, {
                sprite: newSprite,
                visible: mesh.children[1]
              });
            };
            const n_s = this.number_of_stl - 1;
            fragment_folder
              .add(meshSettings, 'name')
              .name('Name')
              .onChange(value => {
                (window as any).istyping = true;
              })
              .onFinishChange(value => {
                const oldName = mesh.name;
                applyNameChange(mesh, oldName, value);
                this.objstat = this.Extractobjinfo(this.objects);
                this.fragmentoptionsrecorder();
                this.service.graph.emitNodeChangedEvent(
                  this.service.graph.current
                );
                (window as any).istyping = false;
              });

            fragment_folder
              .add(meshSettings, 'hidden')
              .name('Visibility')
              .onChange(value => {
                if (!this.hidden_refresh) {
                  mesh.visible = value;
                  const spriteObject = this.spriteMap.get(meshSettings.name);
                  if (spriteObject) spriteObject.visible = value;
                  this.objstat = this.Extractobjinfo(this.objects);
                  this.fragmentoptionsrecorder();
                }
                this.hidden_refresh = false;
              });

            fragment_folder
              .add(material, 'opacity', 0, 1)
              .name('Opacity')
              .onChange(value => {
                material.opacity = value;
                this.objstat = this.Extractobjinfo(this.objects);
                this.fragmentoptionsrecorder();
              });
            fragment_folder.open();
            this.number_of_stl++;
            resolve();
          }.bind(this)
        );
      });
    }
    this.initial_zoom = 3.5;
    this.camera.zoom = this.initial_zoom;
    this.objstat = this.Extractobjinfo(this.objects);
    this.service.graph.current.artifacts = JSON.parse(
      JSON.stringify(this.objstat)
    );
  };
  async fragmentoptionsrecorder() {
    this.service.graph.current.artifacts = JSON.parse(
      JSON.stringify(this.objstat)
    );
    await this.render();
    this.service.graph.current.metadata.screenshot = await this.ScreenShot();
  }
  generateHeight(width, height) {
    const size = width * height,
      data = new Uint8Array(size),
      perlin = Math.random() * 100;

    let quality = 1;

    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < size; i++) {
        const x = i % width,
          y = ~~(i / width);
        data[i] += Math.abs(quality * 1.75);
      }

      quality *= 5;
    }

    return data;
  }
  selectColor(number) {
    // color generator based on visible spectrum
    const hue = number * 137.508; // use golden angle approximation
    return `hsl(${hue},50%,75%)`;
  }

  createDragControls(
    annotations: THREE.Object3D[],
    camera: THREE.Camera,
    domElement: HTMLElement
  ) {
    this.dragControls = new DragControls(annotations, camera, domElement);

    this.dragControls.addEventListener('dragstart', () => {
      this.controls.enabled = false; // Disable camera controls while dragging
    });

    this.dragControls.addEventListener('dragend', () => {
      this.controls.enabled = true; // Re-enable camera controls after dragging
    });
  }
  makeTextSprite = (message, parameters) => {
    if (parameters === undefined) parameters = {};
    var fontface = parameters.hasOwnProperty('fontface')
      ? parameters['fontface']
      : 'Courier New';
    var fontsize = parameters.hasOwnProperty('fontsize')
      ? parameters['fontsize']
      : 50;
    var borderThickness = parameters.hasOwnProperty('borderThickness')
      ? parameters['borderThickness']
      : 4;
    var borderColor = parameters.hasOwnProperty('borderColor')
      ? parameters['borderColor']
      : { r: 0, g: 0, b: 0, a: 1.0 };
    var backgroundColor = parameters.hasOwnProperty('backgroundColor')
      ? parameters['backgroundColor']
      : { r: 0, g: 0, b: 0, a: 1.0 };
    var textColor = parameters.hasOwnProperty('textColor')
      ? parameters['textColor']
      : { r: 0, g: 0, b: 0, a: 1.0 };

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.font = 'Bold ' + fontsize + 'px ' + fontface;
    var metrics = context.measureText(message);
    var textWidth = metrics.width;

    context.fillStyle =
      'rgba(' +
      backgroundColor.r +
      ',' +
      backgroundColor.g +
      ',' +
      backgroundColor.b +
      ',' +
      backgroundColor.a +
      ')';
    context.strokeStyle =
      'rgba(' +
      borderColor.r +
      ',' +
      borderColor.g +
      ',' +
      borderColor.b +
      ',' +
      borderColor.a +
      ')';
    context.fillStyle =
      'rgba(' +
      textColor.r +
      ', ' +
      textColor.g +
      ', ' +
      textColor.b +
      ', 1.0)';
    context.fillText(
      message,
      canvas.width / 2 - textWidth / 2,
      canvas.height / 2 + fontsize / 2
    );

    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    var spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      depthWrite: false,
      depthTest: false
    });
    var sprite = new THREE.Sprite(spriteMaterial);
    sprite.renderOrder = 999;
    sprite.scale.set(0.5 * fontsize, 0.25 * fontsize, 0.75 * fontsize);
    return sprite;
  };

  loadSTL(url) {
    return new Promise((resolve, reject) => {
      const loader = new STLLoader();
      try {
        resolve(loader.parse(url));
      } catch (e) {
        reject(e);
      }
    });
  }

  Extractobjinfo(obj: THREE.Object3D) {
    if (obj == null) obj = this.objects;
    let opacity = [];
    let name = [];
    let hide_val = [];
    obj.traverse(child => {
      if (child instanceof THREE.Mesh) {
        opacity.push(child.material.opacity);
        name.push(child.name);
        hide_val.push(child.visible);
      }
    });
    return { name: name, opacity: opacity, hide_val: hide_val };
  }
  Returnobjinfo(objinfo) {
    console.log(objinfo);
    this.objstat = objinfo;
    let opacity = objinfo.opacity;
    let hide_val = objinfo.hide_val;
    let i = 0;
    this.objects.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.material.opacity = opacity[i];
        child.visible = hide_val[i];
        i++;
      }
    });
    i = 0;
    try {
      if (this.ui.__folders['Fragments'] != undefined) {
        this.ui.__folders['Fragments'].__controllers.forEach(controller => {
          if (controller.property == 'hidden') {
            this.hidden_refresh = true;
            controller.setValue(hide_val[i]);
            i++;
          }
        });
      }
    } catch (e) {
      confirm('Please refresh the page or load the STL file first.');
    }
    this.ui.updateDisplay();
  }

  ScreenShot = async () => {
    let dataURL;
    const grid_temp = this.gridHelper.visible;
    const axes_temp = this.AxesHelper.visible;
    this.gridHelper.visible = false;
    this.AxesHelper.visible = false;
    this.renderer.autoClear = false; // Prevent automatic clearing of the renderer

    // Render the scene normally
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.outlinePass.edgeThickness = 5.0;
    this.outlinePass.edgeStrength = 9.0;
    // Render the composer which includes the OutlinePass
    this.composer.render();

    // Capture the screenshot
    dataURL = this.renderer.domElement.toDataURL('image/png');

    this.renderer.autoClear = true; // Restore automatic clearing
    this.outlinePass.edgeStrength = 1.0;
    this.outlinePass.edgeThickness = 1.0;
    this.gridHelper.visible = grid_temp;
    this.AxesHelper.visible = axes_temp;
    return dataURL;
  };

  async generateNodeThumbnail(node: StateNode): Promise<string> {
    // Move to the node's state
    await this.service.traverser.toStateNode(node.id);

    // Optionally wait for UI to update
    await new Promise(resolve => setTimeout(resolve, 50));

    // Capture the canvas
    const screenshot = await this.ScreenShot();

    // Save it back into the node
    node.metadata.screenshot = screenshot;

    return screenshot;
  }

  async generateAllThumbnails() {
    const nodes = Object.values(this.service.graph.getNodes());

    for (const node of nodes) {
      if (!node.metadata?.screenshot) {
        try {
          await this.generateNodeThumbnail(node as StateNode);
        } catch (e) {
          console.warn(`Failed to generate thumbnail for node ${node.id}`, e);
        }
      }
    }
  }
}
