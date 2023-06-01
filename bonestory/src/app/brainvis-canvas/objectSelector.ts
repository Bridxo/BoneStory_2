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

export default class ObjectSelector  implements IIntersectionListener  {
    private objects = new THREE.Object3D;
    private canvas: BrainvisCanvasComponent;
    private previousSelectedObject: THREE.Mesh = undefined;
    public previousSelectedObjects: THREE.Mesh[] = [];
    private pastSelectedObject: THREE.Mesh = undefined;
    public pastSelectedObjects: THREE.Mesh[] = [];

    private pastColor: number = 0;
    private previousColor: number = 0;
    public isdragging = false;
    private interactive = true;
    private isobjmoving = false;
    private isobjrotating = false;
    private state = modes.Cammode;
    private camera: THREE.Camera;
    private domElement: Element;
    public raycaster = new THREE.Raycaster();
    private eventdispatcher: THREE.EventDispatcher;
    private original_objcolor = {};

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
            this.temp_pos = this.previousSelectedObject.position.clone();
            this.temp_rot = this.previousSelectedObject.rotation.clone();
            this.eventdispatcher.dispatchEvent({type:'t_start',rotation: this.temp_rot, position: this.temp_pos});
        }
        else if(this.previousSelectedObject != undefined && this.state == modes.Rotation){
            this.interactive = false;
            this.isobjrotating = true;
            this.temp_pos = this.previousSelectedObject.position.clone();
            this.temp_rot = this.previousSelectedObject.rotation.clone();
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
    //     // save the trajectory & animate the move, rotation
    //     if(pointer.buttons== 1 && this.previousSelectedObject.name != undefined && this.state == modes.Translation){ // moving the object
    //         if (this.isdragging && !this.interactive)
    //         {
    //             this.isobjmoving = true;
    //             this.interactive = false;
    //         }
    //         // console.log(this.previousSelectedObject.position);
    //         // this.eventdispatcher.dispatchEvent({type:'transEnd_origin', position: this.previousSelectedObject.position});
    //     }
    //     // dragging, Rotation the MESH --- quaternion rotation (angle)
    //     else if(pointer.buttons==1 && this.previousSelectedObject.name != undefined && this.state == modes.Rotation){
    //         // window.console.log('right_click: object-' + this._selected + 'interactive-' + this.interactive);
    //         if(this.isdragging && !this.interactive)
    //         {
    //             this.isobjrotating = true;
    //             this.interactive = false;
    //         }
    //         // this.eventdispatcher.dispatchEvent({type:'rotateEnd_origin', rotation_x: this.previousSelectedObject.rotateX, rotation_y: this.previousSelectedObject.rotateY, rotation_z: this.previousSelectedObject.rotateZ});
    //     }
    }
onMouseUp(intersection: THREE.Intersection, pointer: MouseEvent) {
    this.isdragging = false;
    
    if (this.isobjmoving) {
      this.isobjmoving = false;
      this.eventdispatcher.dispatchEvent({ type: 't_end', position: this.previousSelectedObject.position.clone() });
    } 
    if (this.isobjrotating) {
      this.isobjrotating = false;
      if( Math.abs(this.canvas.pivot_group.rotation.x) +
      Math.abs(this.canvas.pivot_group.rotation.y) +
      Math.abs(this.canvas.pivot_group.rotation.z) > 0.1){
        let tempQuaternion = new THREE.Quaternion();
        let tempVector = new THREE.Vector3();
        this.previousSelectedObject.getWorldQuaternion(tempQuaternion);
        this.previousSelectedObject.getWorldPosition(tempVector);
        this.objects.add(this.previousSelectedObject);
        this.previousSelectedObject.setRotationFromQuaternion(tempQuaternion);
        this.previousSelectedObject.position.set(tempVector.x,tempVector.y ,tempVector.z);
        this.previousSelectedObject.updateMatrixWorld();
      }
      this.temp_pos = this.previousSelectedObject.position.clone();
      this.temp_rot = this.previousSelectedObject.rotation.clone();
      this.eventdispatcher.dispatchEvent({ type: 'r_end', rotation: this.temp_rot, position: this.temp_pos, object: this.previousSelectedObject });
    }
    this.interactive = true;
    this.state = modes.Cammode;
    this.eventdispatcher.dispatchEvent({ type: 'interactive' });

  }
  
  async setkey(event: any, keydown_coordinate_: any) {
    switch (event.key) {
      case 't':
        if(!(window as any).istyping && this.previousSelectedObject != undefined){
          this.state = modes.Translation;
          this.eventdispatcher.dispatchEvent({ type: 'interactive' });
        }
        break;
      case 'r':
        if(!(window as any).istyping && this.previousSelectedObject != undefined){
          this.setUpRaycaster(keydown_coordinate_);
          const intersectInfo = this.raycaster.intersectObject(this.previousSelectedObject, false)?.[0];
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
      default:
        this.state = modes.Cammode;
        break;
    }
    
    this.eventdispatcher.dispatchEvent({ type: 'interactive' });
  }
  
  onMouseDoubleclick(intersection: THREE.Intersection, pointer: MouseEvent) {
    // this.eventdispatcher.dispatchEvent({ type: 'interactive' });

    if (intersection !== undefined) {
          pointer.stopImmediatePropagation();
      }
      //case 1 -- Intersect object != previous object
      if (intersection !== undefined &&
          this.previousSelectedObject !== intersection.object &&
          intersection.object instanceof THREE.Mesh) { // Intersection object != previous selected
          if(this.canvas.ctrl_down)
            this.canvas.outlinePass.selectedObjects.push(intersection.object);
          else
            this.canvas.outlinePass.selectedObjects = [intersection.object];
          this.canvas.render();
          const asMesh = <THREE.Mesh>intersection.object;
          if (asMesh.material instanceof THREE.MeshLambertMaterial) {
              let asMeshPongMaterial = null;
              asMeshPongMaterial = asMesh.material as THREE.MeshLambertMaterial;
              this.pastSelectedObject = this.previousSelectedObject;
              this.previousSelectedObject = asMesh;
              this.canvas.selectedobj = this.previousSelectedObject;
              if(this.pastSelectedObject==undefined){
                this.eventdispatcher.dispatchEvent({
                  type: 'objectSelection',
                  newObject: [this.previousSelectedObject.name, undefined, this.previousColor, this.pastColor]
              });
              }
              else{
                this.eventdispatcher.dispatchEvent({
                  type: 'objectSelection',
                  newObject: [this.previousSelectedObject.name, this.pastSelectedObject.name, this.previousColor, this.pastColor]
              });
              }

          }
      } 
      //case 2 -- selected object == previous object
      else if (intersection !== undefined &&
          this.previousSelectedObject == intersection.object &&
          intersection.object instanceof THREE.Mesh) {
            let index = this.canvas.outlinePass.selectedObjects.indexOf(intersection.object);

            this.canvas.outlinePass.selectedObjects.splice(index, 1);
            this.pastColor = this.previousColor;
            this.previousColor = undefined;
            this.pastSelectedObject = this.previousSelectedObject;
            this.previousSelectedObject = undefined;
            this.canvas.selectedobj = this.previousSelectedObject;
            if(!this.canvas.ctrl_down){
              this.eventdispatcher.dispatchEvent({
                type: 'objectSelection',
                newObject: [undefined, this.pastSelectedObject.name, this.previousColor, this.pastColor]
            });
            }
      }

  }
    
  changeControls_total(newPosition: THREE.Vector3, milliseconds: number , newRotation?: THREE.Euler, done?: () => void) {
    if (this.previousSelectedObject.position === undefined || this.previousSelectedObject.rotation === undefined) {
      return;
    }
    try{
      const currentRotation = new THREE.Quaternion().setFromEuler(this.previousSelectedObject.rotation);
      const targetRotation = new THREE.Quaternion().setFromEuler(newRotation);
    
      if (this.previousSelectedObject.position.equals(newPosition) && currentRotation.equals(targetRotation)) {
        return;
      }
    
      if (milliseconds <= 0) {
        this.previousSelectedObject.position.copy(newPosition);
        this.previousSelectedObject.rotation.copy(newRotation);
      } else {
        if (this.changeTimeout !== undefined) {
          clearInterval(this.changeTimeout);
          this.changeTimeout = undefined;
        }
    
        this.toPosition = newPosition;
        this.toRotation = targetRotation;
        let changeTime = 0;
        const delta = 30 / milliseconds;
    
        this.changeTimeout = setInterval(() => {
          const t = changeTime;
          const interPolateTime = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    
          const nextPosition = this.previousSelectedObject.position.clone().lerp(newPosition, interPolateTime);
          const nextQuaternion = currentRotation.clone().slerp(targetRotation, interPolateTime);
          const nextRotation = new THREE.Euler().setFromQuaternion(nextQuaternion);
    
          this.previousSelectedObject.position.copy(nextPosition);
          this.previousSelectedObject.rotation.set(nextRotation.x, nextRotation.y, nextRotation.z);
    
          changeTime += delta;
    
          if (changeTime > 1.0) {
            this.previousSelectedObject.position.copy(newPosition);
            this.previousSelectedObject.rotation.copy(newRotation);
            clearInterval(this.changeTimeout);
            this.changeTimeout = undefined;
            if (done) {
              done();
            }
          }
        }, 30);
      }
    } catch (e) {
      alert('Load Objects before loading the Provenance Graph');
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
        this.previousSelectedObject = this.objects.children.find(mesh => mesh.name ===newSelection[0]); // new
        this.pastSelectedObject = this.objects.children.find(mesh => mesh.name ===newSelection[1]); // old
        this.previousColor = newSelection[2]; // color
        this.pastColor = newSelection[3]; //color past
        this.canvas.selectedobj = this.previousSelectedObject;

        // console.log(this.previousSelectedObject);
        // console.log(this.pastSelectedObject);
        // console.log(this.previousColor);
        // console.log(this.pastColor);

        // if (this.pastSelectedObject && this.pastSelectedObject.name != undefined) { // original one into original color object
            
        //     const asMesh = <THREE.Mesh>this.pastSelectedObject;
        //     if (asMesh.material instanceof THREE.MeshPhongMaterial) {
        //         const asMeshPongMaterial = <THREE.MeshPhongMaterial>asMesh.material;
        //         asMeshPongMaterial.color.setHex(this.previousColor); // roll back to previous color
        //     }
        // }

        if (this.previousSelectedObject && this.pastSelectedObject) { // Change into BLUE color
            const asMesh = <THREE.Mesh>this.previousSelectedObject;
            const asMesh2 = <THREE.Mesh>this.pastSelectedObject;
            if (asMesh.material instanceof THREE.MeshLambertMaterial) {
                if(this.previousSelectedObject == this.pastSelectedObject)
                {
                  this.canvas.outlinePass.selectedObjects = [];
                }
                else{
                  this.canvas.outlinePass.selectedObjects = [this.previousSelectedObject];
                }

            }
        }
        else if (this.pastSelectedObject){

            this.pastSelectedObject = this.previousSelectedObject;
            this.previousSelectedObject = undefined;
            this.pastColor = this.previousColor;
            this.previousColor = undefined;
            this.canvas.outlinePass.selectedObjects = [];
        }
        else if(this.previousSelectedObject){ // go to root node
            this.canvas.outlinePass.selectedObjects = [this.previousSelectedObject];
        }
        else{
            this.canvas.outlinePass.selectedObjects = [];
        }
        // this.state = modes.Cammode;
    }
    setAnnotations(annotations) {
    }
    getAnnotations() {
      return '';
    }

}