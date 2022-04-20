import { Component, ElementRef, EventEmitter, Input, OnInit, Output, HostListener } from '@angular/core';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

import * as THREE from 'three';
// import * as AMI from 'ami.js';

import { IOrientation, ISlicePosition } from './types';

import Trackball from './trackball';
// import SliceManipulatorWidget from './sliceManipulatorWidget';
// import MeshManipulatorWidget from './meshManipulatorWidget';
import STLLoader from './stlLoader';
import { IntersectionManager, StaticGeometryListener } from './intersectionManager';
import ObjectSelector from './objectSelector';

// import AnnotationAnchorSelector from './annotationAnchorSelector';
// import AnnotationAnchor from './annotationAnchor';

import { TransformControls } from 'three-stdlib/controls/TransformControls';

import { ProvenanceService } from '../provenance.service';
import { registerActions } from './provenanceActions';
import { addListeners } from './provenanceListeners';


@Component({
  selector: 'app-brainvis-canvas',
  template: '',
  styleUrls: ['./brainvis-canvas.component.css']
})


export class BrainvisCanvasComponent {
  private _showSlice = false;
  private _showSliceHandle = false;
  private _showObjects = true;
  private objectSelector: ObjectSelector;
  private mm;
  private mode;
  // private eventdispatcher = new THREE.EventDispatcher();
  // private annotationAnchorSelector: AnnotationAnchorSelector;

  @Input() set showSlice(showSlice: boolean) {
    this._showSlice = showSlice;
    this.toggleSlice(showSlice);
    this.showSliceChange.emit(showSlice);
  }
  @Output() showSliceChange = new EventEmitter<boolean>();
  get showSlice() { return this._showSlice; }

  @Input() set showSliceHandle(showSliceHandle: boolean) {
    this._showSliceHandle = showSliceHandle;
    this.toggleSliceHandle(showSliceHandle);
    this.showSliceHandleChange.emit(showSliceHandle);
  }
  @Output() showSliceHandleChange = new EventEmitter<boolean>();
  get showSliceHandle() { return this._showSliceHandle; }

  @Input() set showObjects(showObjects: boolean) {
    this._showObjects = showObjects;
    this.toggleObjects(showObjects);
    this.showObjectsChange.emit(showObjects);
  }
  @Output() showObjectsChange = new EventEmitter<boolean>();
  get showObjects() { return this._showObjects; }

  @Input() set showtranslateObject(moveObject: THREE.Mesh){
    this.showtranslateObjectChange.emit(moveObject);
  }
  @Output() showtranslateObjectChange = new EventEmitter<THREE.Mesh>();
  get showtranslateObject() {return this.objectSelector.gettranslateObject();}

  @Input() set showrotateObject(moveObject: THREE.Mesh){
    this.showrotateObjectChange.emit(moveObject);
  }
  @Output() showrotateObjectChange = new EventEmitter<THREE.Mesh>();
  get showrotateObject() {return this.objectSelector.gettranslateObject();}

  //TODO--need to change get fragment name and as MESH
  @Input() set selectObject(newSelectedObjects: Object[]) {
    this.objectSelector.setSelection(newSelectedObjects); // [0] new [1] old
    this.selectedObjectsChange.emit(newSelectedObjects);
  }
  @Output() selectedObjectsChange = new EventEmitter<any>();
  get selectObject() 
  { return this.objectSelector.getpastcurrentobject(); }

  // @Input() set annotationAnchors(newAnchors: THREE.Object3D[]) {
  //   const oldAnchors = this.annotationAnchorSelector.getObjects();
  //   this.annotationAnchorSelector.setSelection(newAnchors);
  //   this.annotationAnchorsChange.emit([newAnchors, oldAnchors]);
  // }
  // @Output() annotationAnchorsChange = new EventEmitter<[THREE.Object3D[], THREE.Object3D[]]>();
  // get annotationAnchors() { return this.annotationAnchorSelector.getObjects(); }

  private width: number;
  private height: number;
  private elem: Element;
  private scene = new THREE.Scene();
  private objects: THREE.Object3D; // all the loaded objects go in here
  // private camera: THREE.PerspectiveCamera;
  private camera: THREE.OrthographicCamera;
  private renderer = new THREE.WebGLRenderer();

  // private transform: TransformControls;
  
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
  private selectedobj: THREE.Mesh;

  constructor(elem: ElementRef, provenance: ProvenanceService) {
    // registerActions(provenance.registry, this);
    // addListeners(provenance.tracker, this);
    this.elem = elem.nativeElement;
    this.service = provenance;
    this.eventdispatcher = new THREE.EventDispatcher();
    this.objects = new THREE.Object3D();
  }
  addEventListener(type, listener){
      this.eventdispatcher.addEventListener(type,listener);
  }
  removeEventListener(type, listener){
    this.eventdispatcher.removeEventListener(type,listener);
}
  onWindowResize() {
    const width = this.renderer.domElement.clientWidth;
    const height = this.renderer.domElement.clientHeight;
    //orthographic camera
    this.camera.left = width / -2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = height / -2;
    this.camera.near = 1;
    this.camera.far = 1000;
    //perspective camera 
    // this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.onWindowResize();
  }


  ngOnInit() {
    // todo: remove object from window
    registerActions(this.service.registry, this);
    addListeners(this.service.tracker, this);
    // this.elem = ElementRef.nativeElement;
    (window as any).canvas = this;
    this.width = this.elem.clientWidth;
    this.height = this.elem.clientHeight;

    this.scene.background = new THREE.Color('black');
    // this.camera = new THREE.PerspectiveCamera(85, this.width / this.height, 0.1, 20000);
    this.camera = new THREE.OrthographicCamera(this.width / - 2, this.width / 2, this.height / 2, this.height / - 2, 1, 2000);

    this.renderer.setSize(this.width, this.height);

    const canvasElm = this.renderer.domElement;
    this.elem.appendChild(canvasElm);
    canvasElm.style.display = 'block';
    this.controls = new Trackball(this.camera, this.renderer.domElement);

    this.scene.add(this.objects);
    // this.scene.rotateX(-90);

    // Initial camera position
    this.controls.position0.set(0, 0, 5);
    this.controls.reset();
    //HL_init camera position toward zoomed out
    this.camera.position.set(1187.0,181.0, -471.0);

    //change starting position of the camera
    let cc_1 = new THREE.Vector3(-3.0910644329944716, -360.60060594128834, 136.36674723121544);
    let cc_2 = new THREE.Vector3(88.56415535026616, 4.1676014986671985, -19.330792759980017);
    let cc_3 = new THREE.Vector3(-0.007806819749730532, 0.21960363780433093, 0.9755579407849119);
    this.controls.changeCamera(cc_1,cc_2,cc_3,0);


    this.controls.update();
    this.camera.updateMatrix();
    this.mm = new TransformControls(this.camera, this.renderer.domElement);
    this.mm.setMode('rotate');
    this.mm.setSize(0.4);
    
    
    this.initScene();

    this.objectSelector = new ObjectSelector(this.objects,this.renderer.domElement, this.camera);
    // this.annotationAnchorSelector = new AnnotationAnchorSelector(this.objects);

    this.intersectionManager = new IntersectionManager(this.renderer.domElement, this.camera);

    this.intersectionManager.addListener(this.objectSelector);
    // this.intersectionManager.addListener(this.annotationAnchorSelector);
    // window.console.log(this.controls.enabled);
    this.addEventListeners();
    this.animate();
  }

  initScene() {

    // Setup lights
    this.scene.add(new THREE.AmbientLight(0xffffff,0.1));

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    let directionallight_2 = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.set(1, 1, 1).normalize();
    directionallight_2.position.set(-1,-1,-1).normalize();
    this.scene.add(this.directionalLight);
    this.scene.add(directionallight_2);
    // var light = new THREE.PointLight(0xffffff,1);
    // this.camera.add(light);
    // this.controls.camera.add(light);

    // Setup loader
    // const loader = new AMI.VolumeLoader(this.renderer.domElement);

    const t1 = [
      // tslint:disable-next-line
      '36747136', '36747150', '36747164', '36747178', '36747192', '36747206', '36747220', '36747234', '36747248', '36747262', '36747276', '36747290', '36747304', '36747318', '36747332', '36747346', '36747360', '36747374', '36747388', '36747402', '36747416', '36747430', '36747444', '36747458', '36747472', '36747486', '36747500', '36747514', '36747528', '36747542', '36747556', '36747570', '36747584', '36747598', '36747612', '36747626', '36747640', '36747654', '36747668', '36747682', '36747696', '36747710', '36747724', '36747738', '36747752', '36747766', '36747780', '36747794', '36747808', '36747822', '36747836', '36747850', '36747864', '36747878', '36747892', '36747906', '36747920', '36747934', '36747948', '36747962', '36747976', '36747990', '36748004', '36748018', '36748032', '36748046', '36748060', '36748074', '36748088', '36748102', '36748116', '36748130', '36748144', '36748158', '36748172', '36748186', '36748578', '36748592', '36748606', '36748620', '36748634', '36748648', '36748662', '36748676', '36748690', '36748704', '36748718', '36748732', '36748746', '36748760', '36748774', '36748788', '36748802', '36748816', '36748830', '36748844', '36748858', '36748872', '36748886', '36748900', '36748914', '36748928', '36748942', '36748956', '36748970', '36748984', '36748998', '36749012', '36749026', '36749040', '36749054', '36749068', '36749082', '36749096', '36749110', '36749124', '36749138', '36749152', '36749166', '36749180', '36749194', '36749208', '36749222', '36749236', '36749250', '36749264', '36749278', '36749292', '36749306', '36749320', '36749334', '36749348', '36749362', '36749376', '36749390', '36749404', '36749418', '36749446', '36749460', '36749474', '36749488', '36749502', '36749516', '36749530', '36749544', '36749558', '36749572', '36749586', '36749600', '36749614', '36749628', '36749642', '36749656', '36749670', '36749684', '36749698', '36749712', '36749726', '36749740', '36749754', '36749768', '36749782', '36749796', '36749810', '36749824', '36749838', '36749852', '36749866', '36749880', '36749894', '36749908', '36749922', '36749936', '36749950', '36749964'
      // '36747136', '36747150', '36747164', '36747178', '36747192', '36747206'
    ];

    // const files = t1.map(function(v) {
    //   return 'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/' + v;
    // });

    // loader
    //   .load(files)
    //   .then(function() {
    //     // merge files into clean series/stack/frame structure
    //     const series = loader.data[0].mergeSeries(loader.data);
    //     loader.free();
    //     // loader = null;

    //     // be carefull that series and target stack exist!
    //     // this.stackHelper = new AMI.StackHelper(series[0].stack[0]);
    //     // this.stackHelper.border.color = 0xffeb3b;
    //     // this.scene.add(this.stackHelper);

    //     // // setup slice
    //     // const centerLPS = this.stackHelper.stack.worldCenter();
    //     // this.stackHelper.slice.aabbSpace = 'LPS';
    //     // this.stackHelper.slice.planePosition.x = centerLPS.x;
    //     // this.stackHelper.slice.planePosition.y = centerLPS.y;
    //     // this.stackHelper.slice.planePosition.z = centerLPS.z;
    //     // this.stackHelper.slice.planeDirection = new THREE.Vector3(1, 0, 0).normalize();
    //     // this.stackHelper.slice._update();
    //     // this.stackHelper.border.helpersSlice = this.stackHelper.slice;
    //     // // HL_Disable stackHelper
    //     // this.stackHelper.visible = this._showSlice;
    //     // const sliceGeometry = new StaticGeometryListener(this.stackHelper.slice);
    //     // this.intersectionManager.addListener(sliceGeometry);
        
    //     // //HL_scene rotation
    //     // // this.scene.rotation.x=-90*Math.PI/180;

    //     // // object manipulator
    //     // // this.object

    //     // // slice manipulator
    //     // this.sliceManipulator = new SliceManipulatorWidget(this.stackHelper, this.reSTLnderer.domElement, this.camera);
    //     // this.scene.add(this.sliceManipulator);

    //     // this.sliceManipulator.addEventListener('zoomChange', this.onSlicePlaneZoomChange);
    //     // this.sliceManipulator.addEventListener('orientationChange', this.onSlicePlaneOrientationChange);
    //     // this.sliceManipulator.visible = this._showSliceHandle;
    //     // this.intersectionManager.addListener(this.sliceManipulator);

    //     // // Annotation Anchor(s)
    //     // // this.anchorDummy = new AnnotationAnchor(this.renderer.domElement, this.camera);
    //     // // this.scene.add(this.anchorDummy);
    //     // // this.anchorDummy.visible = true;

    //     // // this.intersectionManager.addListener(this.anchorDummy);

    //     // this.controls.initEventListeners();
    //   }.bind(this))
    //   .catch(function(error) {
    //     // window.console.log(this.objects);
    //     window.console.log('oops... something went wrong...');
    //     window.console.log(error);
    //   });

    // Load STL models
    const loaderSTL = new STLLoader();
    // const path = require('path');
    // const __dirname = dirname(__filename);
    loaderSTL.load('https://raw.githack.com/Bridxo/CT_example/main/fracture_4.stl', function(geometry) {
      const material = new THREE.MeshPhongMaterial({ color: 0x9FE350, specular: 0x111111, shininess: 200 });
      const mesh = new THREE.Mesh(geometry, material);
      let centroid = new THREE.Vector3();
      mesh.geometry.computeBoundingBox();
      mesh.geometry.boundingBox.getCenter(centroid);
      centroid.x = centroid.x - 700.0;
      centroid.y = centroid.y - 100.0;
      centroid.z = centroid.z - 200.0;
      mesh.name = 'f4';
      geometry.center();
      mesh.position.copy(centroid);
      mesh.rotation.set(0,0,0);
      this.objects.add(mesh);
    }.bind(this));

    loaderSTL.load('https://raw.githack.com/Bridxo/CT_example/main/fracture_5.stl', function(geometry) {
      const material = new THREE.MeshPhongMaterial({ color: 0xE36250, specular: 0x111111, shininess: 200 });
      const mesh = new THREE.Mesh(geometry, material);
      let centroid = new THREE.Vector3();
      mesh.geometry.computeBoundingBox();
      mesh.geometry.boundingBox.getCenter(centroid);
      // console.log(centroid);
      centroid.x = centroid.x - 700.0;
      centroid.y = centroid.y - 100.0;
      centroid.z = centroid.z - 200.0;
      mesh.name = 'f5';
      geometry.center();
      mesh.position.copy(centroid);
      mesh.rotation.set(0,0,0);
      this.objects.add(mesh);
    }.bind(this));

    loaderSTL.load('https://raw.githack.com/Bridxo/CT_example/main/fracture_1.stl', function(geometry) {
      const material = new THREE.MeshPhongMaterial({ color: 0xE3DE50, specular: 0x111111, shininess: 200 });
      const mesh = new THREE.Mesh(geometry, material);
      let centroid = new THREE.Vector3();
      mesh.geometry.computeBoundingBox();
      mesh.geometry.boundingBox.getCenter(centroid);
      centroid.x = centroid.x - 700.0;
      centroid.y = centroid.y - 100.0;
      centroid.z = centroid.z - 200.0;
      mesh.name = 'f1';
      geometry.center();
      mesh.position.copy(centroid);
      mesh.rotation.set(0,0,0);
      this.objects.add(mesh);
    }.bind(this));

    loaderSTL.load('https://raw.githack.com/Bridxo/CT_example/main/fracture_2.stl', function(geometry) {
      const material = new THREE.MeshPhongMaterial({ color: 0x50E3DB, specular: 0x111111, shininess: 200 });
      const mesh = new THREE.Mesh(geometry, material);
      let centroid = new THREE.Vector3();
      mesh.geometry.computeBoundingBox();
      mesh.geometry.boundingBox.getCenter(centroid);
      centroid.x = centroid.x - 700.0;
      centroid.y = centroid.y - 100.0;
      centroid.z = centroid.z - 200.0;
      mesh.name = 'f2';
      geometry.center();
      mesh.position.copy(centroid);
      mesh.rotation.set(0,0,0);
      this.objects.add(mesh);
    }.bind(this));

    loaderSTL.load('https://raw.githack.com/Bridxo/CT_example/main/fracture_3.stl', function(geometry) {
      const material = new THREE.MeshPhongMaterial({ color: 0xD250E3, specular: 0x111111, shininess: 200 });
      const mesh = new THREE.Mesh(geometry, material);
      let centroid = new THREE.Vector3();
      mesh.geometry.computeBoundingBox();
      mesh.geometry.boundingBox.getCenter(centroid);
      centroid.x = centroid.x - 700.0;
      centroid.y = centroid.y - 100.0;
      centroid.z = centroid.z - 200.0;
      mesh.name = 'f3';
      geometry.center();
      mesh.position.copy(centroid);
      mesh.rotation.set(0,0,0);
      this.objects.add(mesh);
    }.bind(this));
    

    // this.meshManipulator = new MeshManipulatorWidget();
    // this.scene.add(this.meshManipulator);
    this.scene.add(this.mm);
  }
  
  addEventListeners() {
      // resize event
    this.renderer.domElement.addEventListener(
      "resize",
      this.onWindowResize,
      false
    );
    
    window.addEventListener('keydown', (event) => {
      // window.console.log(event);
      this.objectSelector.setkey(event);
      this.mode = this.objectSelector.getmode();
      if(this.mode == 2) // camera
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
      // const position = this.objectSelector.gettranslateObject().position.toArray();
      this.eventdispatcher.dispatchEvent({
        type: 'rotationStart',
        rotation: event.rotation
      });
    });
    this.objectSelector.addEventListener('r_end', (event:any) => {
      // const position = this.objectSelector.gettranslateObject().position.toArray();
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
      this.setInteractive(inter);
      if (mode == 0 &&this.selectedobj!=undefined){ // Translation 
        this.mm.setMode('translate');
        this.recenter_mm();
        this.mm.attach(this.selectedobj);
        this.controls.enabled = false;
      }
      else if (mode == 1 &&this.selectedobj!=undefined){ //Rotation
        this.mm.setMode('rotate');
        this.recenter_mm();
        this.mm.attach(this.selectedobj);
        this.controls.enabled = false;
      }
      else {
        this.mm.detach(this.selectedobj);
        this.controls.enabled = true;
      }
      // this.controls.update();
      // window.console.log(inter);
    });

    this.objectSelector.addEventListener('objectSelection', (event: any) => {

      this.selectedobj = event.newObject[0];
      this.selectObject = [event.newObject[0], event.newObject[1], event.newObject[2], event.newObject[3]];
      // if(this.selectedobj.name != undefined && this.objectSelector.getmode() == 1){
      //   this.mm.setMode('rotate');
      //   this.recenter_mm();
      //   this.mm.attach(this.selectedobj);      
      // }
      // else if(this.selectedobj.name != undefined && this.objectSelector.getmode() == 0){
      //   this.mm.setMode('translate');
      //   this.recenter_mm();
      //   this.mm.attach(this.selectedobj);
      // }

      const inter = this.objectSelector.getinteractive();
      this.setInteractive(inter);
      this.mm.detach();
    });

    this.objectSelector.addEventListener('objectTranslation', (event: any) => {
      this.showtranslateObject = this.objectSelector.gettranslateObject();
    });
    this.objectSelector.addEventListener('objectRotation', (event: any) => {
      this.showrotateObject = this.objectSelector.gettranslateObject();
    });
    
  }

  setSize(width: number, height: number) {
    //perspective camera
    // this.camera.aspect = width / height;
    //orthographic camera
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.controls.handleResize();
  }

  setInteractive(interactive: boolean) {
    this.controls.enabled = interactive;
    // if (this.sliceManipulator) {
    //   this.sliceManipulator.enabled = interactive;
    // }
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

  ObjectTrans(newPosition: THREE.Vector3, within: number) {

    // this.objectSelector.changecontrols(new THREE.Vector3(newPosition[0], newPosition[1], newPosition[2]), within>0 ? within : 0);
    this.objectSelector.settransobj(newPosition);
  }

  ObjectRotate(newRotation: THREE.Vector3, within: number) {

    // this.objectSelector.changecontrols_rotation(new THREE.Vector3(newRotation.x, newRotation.y, newRotation.z), within>0 ? within : 0);
    this.objectSelector.setrotateobj(newRotation);
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
  getSlicePlaneChanges = (event) => {
    const position = event.position.toArray();
    const direction = event.direction.toArray();
    const oldPosition = event.oldPosition.toArray();
    const oldDirection = event.oldDirection.toArray();

    return { position, direction, oldPosition, oldDirection };
  }

  // gettransform = (event) => {
  //   return this.transform;
  // }

  onSlicePlaneOrientationChange = (event) => {
    const changes = this.getSlicePlaneChanges(event);

    this.eventdispatcher.dispatchEvent({
      type: 'sliceOrientationChanged',
      changes
    });
  }

  onSlicePlaneZoomChange = (event) => {
    const changes = this.getSlicePlaneChanges(event);

    this.eventdispatcher.dispatchEvent({
      type: 'sliceZoomChanged',
      changes
    });
  }

  onSliceVisibilityChange = (event) => {
    this.eventdispatcher.dispatchEvent({
      type: 'sliceVisibilityChanged',
      change: event
    });
  }

  onSliceHandleVisibilityChange = (event) => {
    this.eventdispatcher.dispatchEvent({
      type: 'sliceHandleVisibilityChanged',
      change: event
    });
  }

  setSlicePlanePosition(positions: ISlicePosition, within: number) {
    // if (this.stackHelper) {
    //   this.sliceManipulator.changeSlicePosition(new THREE.Vector3(positions.position[0], positions.position[1], positions.position[2]),
    //     new THREE.Vector3(positions.direction[0], positions.direction[1], positions.direction[2]), within > 0 ? within : 1000);
    // }
  }

  setSlicePlaneZoom(positions: ISlicePosition, within: number) {
    // if (this.stackHelper) {
    //   this.sliceManipulator.changeSlicePosition(new THREE.Vector3(positions.position[0], positions.position[1], positions.position[2]),
    //     new THREE.Vector3(positions.direction[0], positions.direction[1], positions.direction[2]), within > 0 ? within : 1000);
    // }
  }

  toggleSlice(state) {
    // if (this.stackHelper) {
    //   // this.stackHelper._slice.visible = state;
    //   // this.stackHelper._border.visible = state;
    //   if (state === false) {
    //     this.sliceManipulator.visible = state;
    //   } else {
    //     this.sliceManipulator.visible = this._showSlice;
    //   }
    // }
  }

  toggleSliceHandle(state) {
    // if (this.sliceManipulator) {
    //   this.sliceManipulator.visible = state;
    // }
  }

  // slice alignment
  moveCameraTo2DSlice = (event?) => {
    if (this.stackHelper) {
      // if this comes from the button we dispach an event to the provenance graph
      // the graph will then call this function again
      if (event) {
        this.eventdispatcher.dispatchEvent({
          type: 'sliceModeChanged',
          mode2D: true
        });
        return;
      }
      this.controls.finishCurrentTransition();
      // this.sliceManipulator.finishCurrentTransition();
      this.cachedCameraOrigin = this.controls.camera.position.clone();
      this.cachedCameraTarget = this.controls.target.clone();
      this.cachedCameraUp = this.controls.camera.up.clone();
      // this.cachedSliceHandleVisibility = this.sliceManipulator.visible;
      this.cachedObjectsShown = this.objects.visible;
      // this.sliceManipulator.visible = false;
      this.objects.visible = false;
      // const cameraPosition: THREE.Vector3 = this.stackHelper.slice.planePosition.clone();
      // cameraPosition.addScaledVector(this.stackHelper.slice.planeDirection, 150.0);
      // choose a up vector that does not point in the same way as the target plane
      const upVector = new THREE.Vector3(0, 0, 1);
      // if (Math.abs(this.stackHelper.slice.planeDirection.x) < 0.001 && Math.abs(this.stackHelper.slice.planeDirection.y) < 0.001) {
      //   upVector.set(0, 1, 0);
      // }
      // this.controls.changeCamera(cameraPosition, this.stackHelper.slice.planePosition.clone(), upVector, 0);
      this.alignButton.removeEventListener('click', this.moveCameraTo2DSlice);
      this.alignButton.addEventListener('click', this.moveCameraFrom2DSlice);
      this.alignButton.value = 'Back to 3D';
      this.controls.enabled = false;
    }
  }

  moveCameraFrom2DSlice = (event?) => {
    if (this.stackHelper) {
      // if this comes from the button we dispach an event to the provenance graph
      // the graph will then call this function again
      if (event) {
        this.eventdispatcher.dispatchEvent({
          type: 'sliceModeChanged',
          mode2D: false
        });
        return;
      }
      this.controls.enabled = true;
      this.controls.changeCamera(this.cachedCameraOrigin, this.cachedCameraTarget, this.cachedCameraUp, 0);
      this.alignButton.removeEventListener('click', this.moveCameraFrom2DSlice);
      this.alignButton.addEventListener('click', this.moveCameraTo2DSlice);
      this.alignButton.value = 'Align to slice';
      // this.sliceManipulator.visible = this.cachedSliceHandleVisibility;
      this.objects.visible = this.cachedObjectsShown;
    }
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

  recenter_mm(){
    const objpose = new THREE.Vector3();
    this.selectedobj.geometry.computeBoundingBox();
    this.selectedobj.geometry.boundingBox.getCenter(objpose);
    // console.log(objpose);
    this.mm.position.set(objpose.x,objpose.y,objpose.z);
  }

  center_button_Canvas(){
    let cc_1 = new THREE.Vector3(-3.0910644329944716, -360.60060594128834, 136.36674723121544);
    let cc_2 = new THREE.Vector3(88.56415535026616, 4.1676014986671985, -19.330792759980017);
    let cc_3 = new THREE.Vector3(-0.007806819749730532, 0.21960363780433093, 0.9755579407849119);
    this.controls.changeCamera(cc_1,cc_2,cc_3,0);
  }

  top_button_Canvas(){
    let cc_1 = new THREE.Vector3(-3.0910644329944716, -360.60060594128834, 136.36674723121544);
    let cc_2 = new THREE.Vector3(88.56415535026616, 4.1676014986671985, -19.330792759980017);
    let cc_3 = new THREE.Vector3(-0.007806819749730532, 0.21960363780433093, 0.9755579407849119);
    this.controls.changeCamera(cc_1,cc_2,cc_3,0);
  }
  
}

