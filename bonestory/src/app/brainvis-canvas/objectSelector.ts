// import { elementStart } from '@angular/core/src/render3/instructions';
import * as THREE from 'three';
import { MeshPhongMaterial, MeshLambertMaterial } from 'three/src/Three';
import { updateModeDisplay } from '../util/Displaywidget';
import { BrainvisCanvasComponent } from './brainvis-canvas.component';
const { Object3D } = THREE;
import { IIntersectionListener } from './intersectionManager';


enum modes {
  Translation = 0,
  Rotation = 1,
  Cammode = 2,
  Annotationmode = 3,
  Delete = 4,
  Measure = 5
}

enum spaceModes {
  World = 0,
  View = 1
}
export default class ObjectSelector  implements IIntersectionListener  {
    private objects = new THREE.Object3D;
    private canvas: BrainvisCanvasComponent;
    private previousSelectedObject: THREE.Mesh = undefined;
    public previousSelectedObjects: THREE.Mesh[] = [];
    private pastSelectedObject: THREE.Mesh = undefined;
    public pastSelectedObjects: THREE.Mesh[] = [];
    private spaceMode = spaceModes.World;


    private pastColor: [];
    private previousColor: [];
    public isdragging = false;
    private interactive = true;
    private isobjmoving = false;
    private isobjrotating = false;
    private state = modes.Cammode;
    private camera: THREE.Camera;
    private domElement: Element;
    public raycaster = new THREE.Raycaster();
    private eventdispatcher: THREE.EventDispatcher;

    private intersection_point: THREE.Vector3;

    private toPosition: THREE.Vector3;
    private toRotation: THREE.Vector3;

    private sposition: THREE.Vector3;
    private srotation: THREE.Vector3;

    private changeTimeout = undefined;

    private temp_pos;
    private temp_rot;
    public _annotations = [];
    p3subp1 = new THREE.Vector3();
    targetposition = new THREE.Vector3();
    

    constructor(objects: THREE.Object3D,domElement,camera, canvas) {
        this.objects = objects;
        this.domElement = domElement;
        this.camera = canvas.camera;
        this.canvas = canvas;
        this.eventdispatcher = new THREE.EventDispatcher();
    }
    
    addEventListener(type, listener){
        this.eventdispatcher.addEventListener(type,listener);
    }
    setUpRaycaster(pointer: MouseEvent) {
      
        const rect = this.domElement.getBoundingClientRect();
        const x = (pointer.clientX - rect.left) / rect.width;
        const y = (pointer.clientY - rect.top) / rect.height;
        const pointerVector = new THREE.Vector2((x * 2) - 1, - (y * 2) + 1);
        this.raycaster.setFromCamera(pointerVector, this.canvas.camera);
        return pointerVector;
    }
    toggleSpaceMode() {
        if (this.spaceMode === spaceModes.World) {
            this.spaceMode = spaceModes.View;
            this.canvas.mm.spaceMode = 'View';
        } else {
            this.spaceMode = spaceModes.World;
            this.canvas.mm.spaceMode = 'World';
        }
        this.eventdispatcher.dispatchEvent({ type: 'spaceMode', mode: this.spaceMode });
    }
    public toggleSpaceModeUI() {
      this.spaceMode = this.spaceMode === spaceModes.World ? spaceModes.View : spaceModes.World;
      console.log("Space Mode:", this.spaceMode === spaceModes.World ? "World" : "View");
    
      // Optional: reorient pivot immediately
      if (this.canvas.pivot_group && this.spaceMode === spaceModes.View) {
        this.canvas.pivot_group.quaternion.copy(this.canvas.camera.quaternion);
      } else {
        this.canvas.pivot_group.quaternion.set(0, 0, 0, 1);
      }
    }
    public getSpaceMode(): string {
      return this.spaceMode === spaceModes.World ? 'World' : 'View';
    }
    setxy_norm(x_: any, y_: any) {
        var vec = new THREE.Vector3(); // create once and reuse
        var pos = new THREE.Vector3(); // create once and reuse
        
        vec.set(
            ( x_ / window.innerWidth ) * 2 - 1,
            - ( y_ / window.innerHeight ) * 2 + 1,
            0.5 );
        
        vec.unproject( this.canvas.camera );
        
        vec.sub( this.canvas.camera.position ).normalize();

        return vec;
    }

  onMouseDown(intersection: THREE.Intersection, pointer: MouseEvent) {
        this.isdragging = true;
        if(pointer.button == 0 && this.state == modes.Cammode){
          this.onMouseDoubleclick(intersection, pointer);
          return;
        }
          
        if(this.previousSelectedObject != undefined && this.state == modes.Translation){ //left click with translation
            this.interactive = false;
            this.isobjmoving = true;
            // this.temp_pos = this.previousSelectedObjects.map(obj => obj.position.clone());
            this.temp_rot = this.previousSelectedObjects.map(obj => obj.rotation.clone());
            this.eventdispatcher.dispatchEvent({type:'t_start',rotation: this.temp_rot, position: this.temp_pos});
        }
        else if(this.previousSelectedObject != undefined && this.state == modes.Rotation){
            this.interactive = false;
            this.isobjrotating = true;
            this.temp_pos = this.previousSelectedObjects.map(obj => obj.position.clone());
            this.temp_rot = this.previousSelectedObjects.map(obj => obj.rotation.clone());
            this.eventdispatcher.dispatchEvent({type:'r_start', rotation: this.temp_rot, position: this.temp_pos});
        }
        else{
            this.interactive = true;
            this.state = modes.Cammode;
        }
        this.eventdispatcher.dispatchEvent({
            type: 'interactive'
            // newObject: this.previousSelectedObject
        });
  }

  onMouseMove(intersection: THREE.Intersection, pointer: MouseEvent) {
  }

  onMouseUp(intersection: THREE.Intersection, pointer: MouseEvent) {
    this.isdragging = false;
    
    if (this.isobjmoving) {
      this.isobjmoving = false;
      if( Math.abs(this.canvas.pivot_group.position.x) +
      Math.abs(this.canvas.pivot_group.position.y) +
      Math.abs(this.canvas.pivot_group.position.z) > 0.1){
        let tempQuaternion = new THREE.Quaternion();
        let tempVector = new THREE.Vector3();
        this.previousSelectedObjects.forEach(element => {
          element.getWorldQuaternion(tempQuaternion);
          element.getWorldPosition(tempVector);
          this.objects.add(element);
          element.setRotationFromQuaternion(tempQuaternion);
          element.position.set(tempVector.x,tempVector.y ,tempVector.z);
          element.updateMatrixWorld();
        });
      }
      else{
        console.log("no change");
      }

      this.temp_pos = this.previousSelectedObjects.map(obj => obj.position.clone());
      this.temp_rot = this.previousSelectedObjects.map(obj => obj.rotation.clone());
      this.eventdispatcher.dispatchEvent({ type: 't_end', rotation: this.temp_rot, position: this.temp_pos});
    } 
    else if (this.isobjrotating) {
      this.isobjrotating = false;
      if( Math.abs(this.canvas.pivot_group.rotation.x) +
      Math.abs(this.canvas.pivot_group.rotation.y) +
      Math.abs(this.canvas.pivot_group.rotation.z) > 0.1){
        let tempQuaternion = new THREE.Quaternion();
        let tempVector = new THREE.Vector3();
        this.previousSelectedObjects.forEach(element => {
          element.getWorldQuaternion(tempQuaternion);
          element.getWorldPosition(tempVector);
          this.objects.add(element);
          element.setRotationFromQuaternion(tempQuaternion);

          if (this.spaceMode === spaceModes.View) {
            const viewMatrix = new THREE.Matrix4().copy(this.canvas.camera.matrixWorld);
            const viewQuat = new THREE.Quaternion().setFromRotationMatrix(viewMatrix);
          
            tempVector.applyMatrix4(viewMatrix);
            tempQuaternion.premultiply(viewQuat);
          }
          
          element.setRotationFromQuaternion(tempQuaternion);
          element.position.copy(tempVector);

          element.position.set(tempVector.x,tempVector.y ,tempVector.z);
          element.updateMatrixWorld();
        });


      }
      this.temp_pos = this.previousSelectedObjects.map(obj => obj.position.clone());
      this.temp_rot = this.previousSelectedObjects.map(obj => obj.rotation.clone());
      this.eventdispatcher.dispatchEvent({ type: 'r_end', rotation: this.temp_rot, position: this.temp_pos, object: this.previousSelectedObject });
    }
    this.interactive = true;
    this.state = modes.Cammode;
    this.eventdispatcher.dispatchEvent({ type: 'interactive' });

  }
  
  async setkey(event: any, keydown_coordinate_: any) {
    if(this.canvas.rotate_counter>0 || this.canvas.trans_counter>0)
    {
      this.canvas.outlinePass.selectedObjects.forEach((element) => 
      {
        let tempQuaternion = new THREE.Quaternion();
        let tempVector = new THREE.Vector3();
        element.getWorldQuaternion(tempQuaternion);
        element.getWorldPosition(tempVector);
        this.objects.add(element);
        if (this.spaceMode === spaceModes.View) {
          this.canvas.pivot_group.quaternion.copy(this.canvas.camera.quaternion);
          const viewMatrix = new THREE.Matrix4().copy(this.canvas.camera.matrixWorld);
          const viewQuat = new THREE.Quaternion().setFromRotationMatrix(viewMatrix);
        
          tempVector.applyMatrix4(viewMatrix);
          tempQuaternion.premultiply(viewQuat);
        }
        
        element.setRotationFromQuaternion(tempQuaternion);
        element.position.copy(tempVector);
        element.updateMatrixWorld();
        this.objects.add(element);

      });
    this.canvas.pivot_group.position.set(0,0,0);
    if(this.canvas.trans_counter>0)
      this.canvas.trans_counter = 0;
    if(this.canvas.rotate_counter>0)
      this.canvas.rotate_counter = 0;
    }
    switch (event.key.toLowerCase()) {
      case 't':
        if (!(window as any).istyping && this.previousSelectedObject && this.canvas.trans_counter === 0) {
          this.state = modes.Translation;
          this.temp_pos = this.previousSelectedObjects.map(obj => obj.position.clone());
      
          // Reset pivot group
          this.canvas.pivot_group.position.set(0, 0, 0);
          this.canvas.pivot_group.rotation.set(0, 0, 0);
      
          // Get bounding sphere to estimate offset distance
          const bbox = new THREE.Box3().setFromObject(this.previousSelectedObject);
          const sphere = bbox.getBoundingSphere(new THREE.Sphere());
      
          // Get camera-facing direction
          const cameraDir = new THREE.Vector3();
          this.canvas.camera.getWorldDirection(cameraDir);
      
          // Position the pivot slightly in front of the object's surface toward the camera
          const pivotPosition = sphere.center.clone().add(cameraDir.clone().multiplyScalar(-sphere.radius * 1.1));
          this.canvas.pivot_group.position.copy(pivotPosition);
      
          // Reparent selected objects
          this.previousSelectedObjects.forEach((obj) => {
            const worldPos = new THREE.Vector3();
            obj.getWorldPosition(worldPos);
            const localPos = worldPos.sub(pivotPosition); // make relative
            this.canvas.pivot_group.add(obj);
            obj.position.copy(localPos);
          });
      
          // Show gizmo
          this.canvas.mm.attach(this.canvas.pivot_group);
          this.canvas.mm.traverse((node) => {
            node.layers.enable(this.canvas.gizmoLayer.mask);
          }); 
          this.canvas.trans_counter++;
          this.eventdispatcher.dispatchEvent({ type: 'interactive' });
        }
        break;

      case 'r':
        if(!(window as any).istyping && this.previousSelectedObjects.length != 0){
          this.setUpRaycaster(keydown_coordinate_);
          const intersectInfo = this.raycaster.intersectObjects(this.previousSelectedObjects, false)?.[0];
          if (intersectInfo) {
            this.state = modes.Rotation;
            const { x, y, z } = intersectInfo.point;
            this.eventdispatcher.dispatchEvent({ type: 'interactive', intersect: new THREE.Vector3(x, y, z) });
          }
        }
        break;
      case 'c':
        this.state = modes.Cammode;
        break;
      // case 'a':
      //   if(!(window as any).istyping && !event.ctrlKey){
      //     this.state = modes.Annotationmode;
      //     const annotation_vector = this.setUpRaycaster(keydown_coordinate_);
      //     const annotation_intersect = this.raycaster.intersectObjects(this.objects.children);
      //     if(annotation_intersect.length != 0){
      //       updateModeDisplay('Annotation','');
      //       var annotationText = prompt("Enter the text for the annotation:");
      //       this.canvas.Annotation(annotationText, annotation_intersect, false);
      //     }
      //   }
      //   else
      //     this.state = modes.Cammode;
      //   break;
      // case 'Delete':
      //   this.state = modes.Delete;
      //   const annotation_vector = this.setUpRaycaster(keydown_coordinate_);
      //   const annotation_intersect = this.raycaster.intersectObjects(this.objects.children);
      //   if(annotation_intersect.length != 0){
      //     var annotationText = prompt("Enter the text for the annotation:");
      //     this.canvas.Annotation(annotationText, annotation_intersect, false);
      //   }
      //   break;
      case 'm':
        this.state = modes.Measure;
        const Measure_vector = this.setUpRaycaster(keydown_coordinate_);
        const Measure_intersect = this.raycaster.intersectObjects(this.objects.children);
        if(Measure_intersect.length != 0){
          await this.canvas.Measure(Measure_intersect, false);
        }
        break;
      case 'v':
        this.toggleSpaceMode();
        break;
      default:
        this.state = modes.Cammode;
        break;
    }
    
    this.eventdispatcher.dispatchEvent({ type: 'interactive' });
  }
  
  onMouseDoubleclick(intersection: THREE.Intersection, pointer: MouseEvent) {
    // this.eventdispatcher.dispatchEvent({ type: 'interactive' });
    let temparray = new Array();

    if (intersection !== undefined) {
      pointer.stopImmediatePropagation();
      this.pastSelectedObjects = [...this.previousSelectedObjects];
      if(intersection.object.type =='Sprite')
        intersection.object = intersection.object.parent;
      if(pointer.shiftKey){ 
        if(this.canvas.outlinePass.selectedObjects.indexOf(intersection.object) > -1)
          this.canvas.outlinePass.selectedObjects.splice(this.canvas.outlinePass.selectedObjects.indexOf(intersection.object),1);
        else
          this.canvas.outlinePass.selectedObjects.push(intersection.object);
      }
      else{
        if(this.canvas.outlinePass.selectedObjects.length > 1)
          this.canvas.outlinePass.selectedObjects = [intersection.object];
        else if (this.canvas.outlinePass.selectedObjects.indexOf(intersection.object) || this.canvas.outlinePass.selectedObjects.length == 0)
          this.canvas.outlinePass.selectedObjects = [intersection.object];
        else
          this.canvas.outlinePass.selectedObjects = [];
      } 
      temparray = this.canvas.outlinePass.selectedObjects;
      const asMesh = <THREE.Mesh>intersection.object;
      let asMeshPongMaterial = null;
      asMeshPongMaterial = asMesh.material as THREE.MeshLambertMaterial;
      this.pastSelectedObject = this.previousSelectedObject;
      this.previousSelectedObject = this.canvas.outlinePass.selectedObjects[0];
      
      this.previousSelectedObjects = [...temparray];
      this.canvas.selectedobj = this.previousSelectedObject;

      let prev_names = '';
      let past_names = '';
      this.previousSelectedObjects.map(obj => {prev_names = prev_names + ',' + obj.name});
      this.pastSelectedObjects.map(obj => {past_names = past_names + ',' + obj.name});
      prev_names = prev_names.substring(1);
      past_names = past_names.substring(1);
      if (!pointer.shiftKey) {

          if(this.pastSelectedObject==undefined){
            this.eventdispatcher.dispatchEvent({
              type: 'objectSelection',
              newObject: [this.previousSelectedObject.name, undefined, prev_names, past_names]
          });
          }
          else if(this.previousSelectedObject==undefined){
            this.eventdispatcher.dispatchEvent({
              type: 'objectSelection',
              newObject: [undefined, this.pastSelectedObject.name, prev_names, past_names]
          });
          }
          else{
            this.eventdispatcher.dispatchEvent({
              type: 'objectSelection',
              newObject: [this.previousSelectedObject.name, this.pastSelectedObject.name, prev_names, past_names]
          });
          }

      }
      }

  }
    
  changeControls_total(newPosition: THREE.Vector3, milliseconds: number , newRotation?: THREE.Euler, done?: () => void) {
    if (this.previousSelectedObject  === undefined || this.previousSelectedObject === undefined) {
      confirm('Graph is disrupted, please reload the page and try again');
    }
    try{
      let currentRotation = [];
      let targetRotation = [];
      for(let i=0;i<this.previousSelectedObjects.length;i++){
        currentRotation.push(new THREE.Quaternion().setFromEuler(this.previousSelectedObject.rotation));
        targetRotation.push(new THREE.Quaternion().setFromEuler(newRotation[0]));
      }
      if (this.previousSelectedObjects[0].position.equals(newPosition[0]) && currentRotation[0].equals(targetRotation[0])) {
        return;
      }
    
      if (milliseconds <= 0) {
        for(let i=0;i<this.previousSelectedObjects.length;i++){
          this.previousSelectedObjects[i].position.copy(newPosition[i]);
          this.previousSelectedObjects[i].rotation.copy(newRotation[i]);
        }
      } else {
        if (this.changeTimeout !== undefined) {
          clearInterval(this.changeTimeout);
          this.changeTimeout = undefined;
        }
        let changeTime = 0;
        const delta = 30 / milliseconds;
    
        this.changeTimeout = setInterval(() => {
          const t = changeTime;
          const interPolateTime = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          for(let i=0;i<this.previousSelectedObjects.length;i++){
            const nextPosition = this.previousSelectedObjects[i].position.clone().lerp(newPosition[i], interPolateTime);
            const nextQuaternion = currentRotation[i].clone().slerp(targetRotation[i], interPolateTime);
            const nextRotation = new THREE.Euler().setFromQuaternion(nextQuaternion);
            this.previousSelectedObjects[i].position.copy(nextPosition);
            this.previousSelectedObjects[i].rotation.set(nextRotation.x, nextRotation.y, nextRotation.z);
          }
          changeTime += delta;
    
          if (changeTime > 1.0) {
            for(let i=0;i<this.previousSelectedObjects.length;i++){
              this.previousSelectedObjects[i].position.copy(newPosition[i]);
              this.previousSelectedObjects[i].rotation.copy(newRotation[i]);
            }
            clearInterval(this.changeTimeout);
            this.changeTimeout = undefined;
            if (done) {
              done();
            }
          }
        }, 30);
      }
    } catch (e) {
      alert('Graph is disrupted. Please save the stories and reload the page.');
    };
  }
      


  toRadians(angle) {
      return angle * (Math.PI / 180);
  }
  settransobj(position) {
      this.previousSelectedObject.position.set(position[0],position[1],position[2]);
  } 

  setrotateobj(rotation) {
      this.previousSelectedObject.rotation.set(rotation.x,rotation.y,rotation.z);
  }
  toDegrees(angle) {
      return angle * (180 / Math.PI);
  }

  getpastcurrentobject() {
      return [this.previousSelectedObject,this.pastSelectedObject, this.previousColor, this.pastColor];
  }

  getObjects() {
      return this.objects.children;
  }
  gettranslateObject() {
      return this.previousSelectedObject;
  }

  getinteractive(){
      return this.interactive;
  }

  getmode(){
      return this.state;
  }

  getintersection_point(){
      return this.intersection_point;
  }

  getcurrobject(){
      return this.previousSelectedObject;
  }

  isEnabled() {
      return this.objects.visible;
  }

  setSelection(newSelection) {
      this.previousSelectedObject = this.objects.children.find(mesh => mesh.name === newSelection[0]); // new
      this.pastSelectedObject = this.objects.children.find(mesh => mesh.name === newSelection[1]); // old

      this.previousSelectedObjects = [];
      this.pastSelectedObjects = [];
      let temparr = [];
      let pasttemparr = [];
      if(newSelection[2] != '')
        temparr = newSelection[2].split(',');
      if(newSelection[3] != '')
        pasttemparr = newSelection[3].split(',');

      for (let i = 0; i < temparr.length; i++) {
        this.previousSelectedObjects.push(this.objects.children.find(mesh => mesh.name === temparr[i]));
      }

      for (let i = 0; i < pasttemparr.length; i++) {
        this.pastSelectedObjects.push(this.objects.children.find(mesh => mesh.name === pasttemparr[i]));
      }

      this.canvas.selectedobj = this.previousSelectedObject;
      if(this.previousSelectedObjects.length > 0)
        this.canvas.outlinePass.selectedObjects = this.previousSelectedObjects;
      else 
        this.canvas.outlinePass.selectedObjects = [];
  }
  setAnnotations(annotations) {
  }
  getAnnotations() {
    return '';
  }

}