// import { elementStart } from '@angular/core/src/render3/instructions';
import * as THREE from 'three';
import { MeshPhongMaterial } from 'three/src/Three';
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
    private previousSelectedObject: THREE.Mesh = <THREE.Mesh>{};
    private pastSelectedObject: THREE.Mesh = <THREE.Mesh>{};

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

    private _offset = new THREE.Vector3();
    private _selected;
    private _selected_normal;
    private _control;
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
        if(this.previousSelectedObject.name != undefined && this.state == modes.Translation){ //left click with translation
            this.interactive = false;
            this.isobjmoving = true;
            const temp_pos = this.previousSelectedObject.position.clone();
            this.sposition = temp_pos;
            this.eventdispatcher.dispatchEvent({type:'t_start', position: this.previousSelectedObject.position});
        }
        else if(this.previousSelectedObject.name != undefined && this.state == modes.Rotation){
            this.interactive = false;
            this.isobjrotating = true;
            const temp_pos = this.previousSelectedObject.position.clone();
            const temp_rot = this.previousSelectedObject.rotation.clone();
            this.eventdispatcher.dispatchEvent({type:'r_start', rotation: temp_rot, position: temp_pos});
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
      let tempQuaternion = new THREE.Quaternion();
      let tempVector = new THREE.Vector3();
      this.previousSelectedObject.getWorldQuaternion(tempQuaternion);
      this.previousSelectedObject.getWorldPosition(tempVector);
      this.objects.add(this.previousSelectedObject);
      this.previousSelectedObject.setRotationFromQuaternion(tempQuaternion);
      this.previousSelectedObject.position.set(tempVector.x,tempVector.y ,tempVector.z);
      this.previousSelectedObject.updateMatrixWorld();
      const temp_pos = this.previousSelectedObject.position.clone();
      const temp_rot = this.previousSelectedObject.rotation.clone();
      this.eventdispatcher.dispatchEvent({ type: 'r_end', rotation: temp_rot, position: temp_pos, object: this.previousSelectedObject });
    }
    this.interactive = true;
    this.state = modes.Cammode;
    this.eventdispatcher.dispatchEvent({ type: 'interactive' });

  }
  
  setkey(event: any, keydown_coordinate_: any) {
    switch (event.key) {
      case 't':
        if(this.previousSelectedObject.name != undefined && (this.previousSelectedObject.material as MeshPhongMaterial).color.getHex() == 0x0000ff){
          this.state = modes.Translation;
          this.eventdispatcher.dispatchEvent({ type: 'interactive' });
        }
        break;
      case 'r':
        if(this.previousSelectedObject.name != undefined && (this.previousSelectedObject.material as MeshPhongMaterial).color.getHex() == 0x0000ff){
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
      case 'a':
        if(!(window as any).istyping){
          this.state = modes.Annotationmode;
          const annotation_vector = this.setUpRaycaster(keydown_coordinate_);
          const annotation_intersect = this.raycaster.intersectObjects(this.objects.children);
          if(annotation_intersect.length != 0){
            var annotationText = prompt("Enter the text for the annotation:");
            this.canvas.Annotation(annotationText, annotation_intersect, false);
          }
        }
        else
          this.state = modes.Cammode;
        break;
      case 'Delete':
        this.state = modes.Delete;
        const annotation_vector = this.setUpRaycaster(keydown_coordinate_);
        const annotation_intersect = this.raycaster.intersectObjects(this.objects.children);
        if(annotation_intersect.length != 0){
          var annotationText = prompt("Enter the text for the annotation:");
          this.canvas.Annotation(annotationText, annotation_intersect, false);
        }
        break;
      case 'm':
        this.state = modes.Measure;
        const Measure_vector = this.setUpRaycaster(keydown_coordinate_);
        const Measure_intersect = this.raycaster.intersectObjects(this.objects.children);
        if(Measure_intersect.length != 0){
          this.canvas.Measure(Measure_intersect, false);
        }
      default:
        this.state = modes.Cammode;
        break;
    }
    
    this.eventdispatcher.dispatchEvent({ type: 'interactive' });
  }
  
  onMouseDoubleclick(intersection: THREE.Intersection, pointer: MouseEvent) {
      if (intersection !== undefined) {
          pointer.stopImmediatePropagation();
      }
      //case 1 -- Intersect object != previous object
      if (intersection !== undefined &&
          this.previousSelectedObject !== intersection.object &&
          intersection.object instanceof THREE.Mesh) { // Intersection object != previous selected

          const asMesh = <THREE.Mesh>intersection.object;
          if (asMesh.material instanceof THREE.MeshPhongMaterial) {
              let previousName = '';
              let asMeshPongMaterial = null;

              if (this.previousSelectedObject.name != undefined) {
                  asMeshPongMaterial = this.previousSelectedObject.material as THREE.MeshPhongMaterial;
                  asMeshPongMaterial.color.setHex(this.previousColor);
                  previousName = this.previousSelectedObject.name;
              }
              asMeshPongMaterial = asMesh.material as THREE.MeshPhongMaterial;
              this.pastColor = this.previousColor;
              this.previousColor = asMeshPongMaterial.color.getHex();
              this.pastSelectedObject = this.previousSelectedObject;
              this.previousSelectedObject = asMesh;

              this.eventdispatcher.dispatchEvent({
                  type: 'objectSelection',
                  newObject: [this.previousSelectedObject, this.pastSelectedObject, this.previousColor, this.pastColor]
              });
          }
      } 
      //case 2 -- selected object == previous object
      else if (intersection !== undefined &&
          this.previousSelectedObject == intersection.object &&
          intersection.object instanceof THREE.Mesh) {
            this.pastColor = this.previousColor;
            this.previousColor = intersection.object.material.color.getHex();
            this.pastSelectedObject = this.previousSelectedObject;
            this.previousSelectedObject = intersection.object;
            // const asMeshPongMaterial = <THREE.MeshPhongMaterial>this.previousSelectedObject.material;       
          // asMeshPongMaterial.color.setHex(this.pastColor); // return to original color
          
          this.eventdispatcher.dispatchEvent({
              type: 'objectSelection',
              newObject: [this.previousSelectedObject, this.pastSelectedObject, this.previousColor, this.pastColor]
          });
      }

  }
    // changecontrols(newPosition: THREE.Vector3, milliseconds: number, done?: () => void, newRotation?: THREE.Vector3) {
    //   if (this.previousSelectedObject.position == undefined){
    //       return;
    //   }
    //   if (this.previousSelectedObject.position.equals(newPosition)) {
    //       return;
    //     }
    //   if (milliseconds <= 0) {
    //     this.previousSelectedObject.position.copy(newPosition);
    //     if(newRotation !== undefined)
    //       this.previousSelectedObject.rotation.toVector3().equals(newRotation);
    //   } 
    //   else {
    //     // cancel previous animation
    //     if (this.changeTimeout !== undefined) {
    //       clearInterval(this.changeTimeout);
    //       this.changeTimeout = undefined;
    //     }
    //     this.toPosition = newPosition;
    //     if(newRotation !== undefined)
    //       this.toRotation = newRotation;
    //     let changeTime = 0;
    //     const delta = 30 / milliseconds;
    //     this.changeTimeout = setInterval((fromPosition: THREE.Vector3, toPosition: THREE.Vector3, fromRotation: THREE.Vector3, toRotation: THREE.Vector3) => {
    //       const t = changeTime;
    //       const interPolateTime = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; //  ease in/out function
    //       const nextPosition = fromPosition.clone();
    //       const distancePosition = toPosition.clone();
    //       distancePosition.sub(fromPosition);
    //       nextPosition.addScaledVector(distancePosition, interPolateTime);
    //       if(newRotation !== undefined){
    //         const nextRotation = fromRotation.clone() as THREE.Vector3;
    //         const distanceRotation = toRotation.clone() as THREE.Vector3;
    //         distanceRotation.sub(fromRotation as THREE.Vector3);
    //         nextRotation.addScaledVector(distanceRotation, interPolateTime);
    //         this.changecontrols(nextPosition, 0,undefined,nextRotation);
    //         changeTime += delta;
    //         if (changeTime > 1.0) {
    //           this.changecontrols(toPosition, 0,undefined,toRotation);
    //           clearInterval(this.changeTimeout);
    //           this.changeTimeout = undefined;
    //           if (done) {
    //             done();
    //           }
    //         }
    //       }
    //       else{
    //         this.changecontrols(nextPosition, 0);
    //         changeTime += delta;
    //         if (changeTime > 1.0) {
    //           this.changecontrols(toPosition, 0);
    //           clearInterval(this.changeTimeout);
    //           this.changeTimeout = undefined;
    //           if (done) {
    //             done();
    //           }
    //         }
    //       }
    //     }, 30, this.previousSelectedObject.position.clone(), newPosition.clone(), new THREE.Vector3(this.previousSelectedObject.rotation.x,this.previousSelectedObject.rotation.y, this.previousSelectedObject.rotation.z ), newRotation.clone());
    //   }
    // }
    changecontrols(newPosition: THREE.Vector3, milliseconds: number, done?: () => void, newRotation?: THREE.Vector3) {
        if (this.previousSelectedObject.position == undefined){
            return;
        }
        if (this.previousSelectedObject.position.equals(newPosition)) {
            return;
          }
        if (milliseconds <= 0) {
          this.previousSelectedObject.position.copy(newPosition);
        } 
        else {
          // cancel previous animation
          if (this.changeTimeout !== undefined) {
            clearInterval(this.changeTimeout);
            this.changeTimeout = undefined;
          }
          this.toPosition = newPosition;
          let changeTime = 0;
          const delta = 30 / milliseconds;
          this.changeTimeout = setInterval((fromPosition, toPosition) => {
            const t = changeTime;
            const interPolateTime = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; //  ease in/out function
            const nextPosition = fromPosition.clone();
            const distancePosition = toPosition.clone();
            distancePosition.sub(fromPosition);
            nextPosition.addScaledVector(distancePosition, interPolateTime);
            this.changecontrols(nextPosition, 0);
            changeTime += delta;
            if (changeTime > 1.0) {
              this.changecontrols(toPosition, 0);
              clearInterval(this.changeTimeout);
              this.changeTimeout = undefined;
              if (done) {
                done();
              }
            }
          }, 30, this.previousSelectedObject.position.clone(), newPosition.clone());
        }
      }

    changecontrols_rotation(newrotation: THREE.Vector3, milliseconds: number, done?: () => void) {
        if (this.previousSelectedObject == <THREE.Mesh>{}){
            return;
        }
        if (this.previousSelectedObject.rotation.toVector3().equals(newrotation)) {
            return;
          }
        if (milliseconds <= 0) {
          this.previousSelectedObject.rotation.set(newrotation.x,newrotation.y,newrotation.z);
        } 
        else {
          // cancel previous animation
          if (this.changeTimeout !== undefined) {
            clearInterval(this.changeTimeout);
            this.changeTimeout = undefined;
          }
          this.toRotation = newrotation;
          let changeTime = 0;
          const delta = 30 / milliseconds;
          this.changeTimeout = setInterval((fromPosition, toPosition) => {
            const t = changeTime;
            const interPolateTime = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; //  ease in/out function
            const nextPosition = fromPosition.clone();
            const distancePosition = toPosition.clone();
            distancePosition.sub(fromPosition);
            nextPosition.addScaledVector(distancePosition, interPolateTime);
    
            this.changecontrols_rotation(nextPosition, 0);
            changeTime += delta;
            if (changeTime > 1.0) {
              this.changecontrols_rotation(toPosition, 0);
              clearInterval(this.changeTimeout);
              this.changeTimeout = undefined;
              if (done) {
                done();
              }
            }
          }, 30, this.previousSelectedObject.rotation.toVector3().clone(), newrotation.clone());
        }
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

        this.previousSelectedObject = newSelection[0]; // new
        this.pastSelectedObject = newSelection[1]; // old
        this.previousColor = newSelection[2]; // color
        this.pastColor = newSelection[3]; //color past

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

        if (this.previousSelectedObject && this.previousSelectedObject.name != undefined) { // Change into BLUE color
            const asMesh = <THREE.Mesh>this.previousSelectedObject;
            const asMesh2 = <THREE.Mesh>this.pastSelectedObject;
            if (asMesh.material instanceof THREE.MeshPhongMaterial) {
                const asMeshPongMaterial = <THREE.MeshPhongMaterial>asMesh.material;
                const asMeshPongMaterial2 = <THREE.MeshPhongMaterial>asMesh2.material;
                if(asMeshPongMaterial.color.getHex() != 0x0000ff )
                {
                    if(this.pastSelectedObject.name != undefined){
                        asMeshPongMaterial2.color.setHex(this.pastColor); 
                        this.pastColor = this.previousColor;
                    }

                    this.previousColor = asMeshPongMaterial.color.getHex();
                    this.pastSelectedObject = this.previousSelectedObject;
                    asMeshPongMaterial.color.setHex(0x0000ff); // blue
                    // asMeshPongMaterial2.color.setHex(this.previousColor);
                }
                else if(this.previousSelectedObject == this.pastSelectedObject)
                {
                    if(asMeshPongMaterial.color.getHex() == 0x0000ff){
                      asMeshPongMaterial.color.setHex(this.pastColor);
                      this.previousColor = this.pastColor;
                      this.pastColor = this.previousColor;

                      this.pastSelectedObject = this.previousSelectedObject;
                    }
                    else{
                      asMeshPongMaterial.color.setHex(0x0000ff);
                      
                    }
                        
                }
                else
                {
                    asMeshPongMaterial.color.setHex(0x0000ff);
                    const asMeshPongMaterial2 = <THREE.MeshPhongMaterial>this.pastSelectedObject.material;
                    asMeshPongMaterial2.color.setHex(this.previousColor);
                }

            }
        }
        else{ // go to root node
            const asMesh2 = <THREE.Mesh>this.pastSelectedObject;
            const asMeshPongMaterial2 = <THREE.MeshPhongMaterial>asMesh2.material;
            asMeshPongMaterial2.color.setHex(this.pastColor);
            this.pastSelectedObject = this.previousSelectedObject;
            this.pastColor = this.previousColor;
        }
        // this.state = modes.Cammode;
    }
    setAnnotations(annotations) {
    }
    getAnnotations() {
      return '';
    }

}