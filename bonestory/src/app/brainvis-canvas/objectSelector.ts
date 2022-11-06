// import { elementStart } from '@angular/core/src/render3/instructions';
import * as THREE from 'three';
const { Object3D } = THREE;
import { IIntersectionListener } from './intersectionManager';

enum modes {
    Translation = 0,
    Rotation = 1,
    Cammode = 2,
}

export default class ObjectSelector implements IIntersectionListener {
    private objects = new THREE.Object3D;
    private previousSelectedObject: THREE.Mesh = <THREE.Mesh>{};
    private pastSelectedObject: THREE.Mesh = <THREE.Mesh>{};

    private pastColor: number = 0;
    private previousColor: number = 0;
    private isdragging = false;
    private interactive = true;
    private isobjmoving = false;
    private isobjrotating = false;
    private state = modes.Cammode;
    private camera: THREE.Camera;
    private domElement: Element;
    private raycaster = new THREE.Raycaster();
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

    p3subp1 = new THREE.Vector3();
    targetposition = new THREE.Vector3();
    
    private previousMousePosition = {
        x: 0,
        y: 0
    };

    constructor(objects: THREE.Object3D,domElement,camera) {
        this.objects = objects;
        this.domElement = domElement;
        this.camera = camera;
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
        this.raycaster.setFromCamera(pointerVector, this.camera);
    }

    // intersectObjects(pointer: MouseEvent, objects: THREE.Object3D[]) {
    //     this.setUpRaycaster(pointer);

    //     const intersections = this.raycaster.intersectObjects(objects, true);
    //     return intersections[0] ? intersections[0] : false;
    // }
    // getClosestObject(event: MouseEvent): [IIntersectionListener, THREE.Intersection] {
    //     this.setUpRaycaster(event);
    //     let closestListener: IIntersectionListener;
    //     let closestIntersection: THREE.Intersection;
    //     for (const listener of this.listeners) {
    //         if (listener.isEnabled()) {
    //             const intersection = this.intersectObjects(event, listener.getObjects());
    //             if (intersection !== false) {
    //                 if (closestIntersection === undefined || (intersection.distance < closestIntersection.distance)) {
    //                     closestIntersection = intersection;
    //                     closestListener = listener;
    //                 }
    //             }
    //         }
    //     }
    //     return [closestListener, closestIntersection];
    // }
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

            const temp_rot = this.previousSelectedObject.rotation.clone();
            this.srotation = temp_rot.toVector3();
            this.eventdispatcher.dispatchEvent({type:'r_start', rotation: temp_rot});
            // this.eventdispatcher.dispatchEvent({type:t'rotateStart_origin', rotation_x: this.previousSelectedObject.rotateX, rotation_y: this.previousSelectedObject.rotateY, rotation_z: this.previousSelectedObject.rotateZ});
        }
        else{
            this.interactive = true;
        }
        this.eventdispatcher.dispatchEvent({
            type: 'interactive'
            // newObject: this.previousSelectedObject
        });
    }
    onMouseMove(intersection: THREE.Intersection, pointer: MouseEvent) {
        // save the trajectory & animate the move, rotation
        if(pointer.buttons== 1 && this.previousSelectedObject.name != undefined && this.state == modes.Translation){ // moving the object
            if (this.isdragging && !this.interactive)
            {
                this.isobjmoving = true;
                this.interactive = false;
            }
            // console.log(this.previousSelectedObject.position);
            // this.eventdispatcher.dispatchEvent({type:'transEnd_origin', position: this.previousSelectedObject.position});
        }
        // dragging, Rotation the MESH --- quaternion rotation (angle)
        else if(pointer.buttons==1 && this.previousSelectedObject.name != undefined && this.state == modes.Rotation){
            // window.console.log('right_click: object-' + this._selected + 'interactive-' + this.interactive);
            if(this.isdragging && !this.interactive)
            {
                this.isobjrotating = true;
                this.interactive = false;
            }
            // this.eventdispatcher.dispatchEvent({type:'rotateEnd_origin', rotation_x: this.previousSelectedObject.rotateX, rotation_y: this.previousSelectedObject.rotateY, rotation_z: this.previousSelectedObject.rotateZ});
        }
    }
    rotateAroundObjectAxis(object, axis, radians) {
        let rotationMatrix = new THREE.Matrix4();

        rotationMatrix.makeRotationAxis(axis.normalize(), radians);
        object.matrix.multiply(rotationMatrix);
        object.rotation.setFromRotationMatrix( object.matrix );

    }

    rotateAroundWorldAxis( object, axis, radians ) {

      let rotationMatrix = new THREE.Matrix4();

      rotationMatrix.makeRotationAxis( axis.normalize(), radians );
      rotationMatrix.multiply( object.matrix );                       // pre-multiply
      object.matrix = rotationMatrix;
      object.rotation.setFromRotationMatrix( object.matrix );
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
            this.pastSelectedObject = this.previousSelectedObject;
            const asMeshPongMaterial = <THREE.MeshPhongMaterial>this.previousSelectedObject.material;
            // asMeshPongMaterial.color.setHex(this.previousColor); // return to original color
            
            this.eventdispatcher.dispatchEvent({
                type: 'objectSelection',
                newObject: [this.previousSelectedObject, this.pastSelectedObject, this.previousColor, this.pastColor]
            });
        }

    }
    
    onMouseUp(intersection: THREE.Intersection, pointer: MouseEvent) {
        //
        if(this.isdragging){
            this.isdragging = false;
            if(this.isobjmoving){
                this.isobjmoving = false;
                if(this.previousSelectedObject.position.distanceTo(this.sposition)>=1)
                    this.eventdispatcher.dispatchEvent({type:'t_end', position: this.previousSelectedObject.position});
            }
            else if(this.isobjrotating){
                const rot_remp = this.previousSelectedObject.rotation.clone();
                this.isobjrotating = false;
                if(rot_remp.toVector3().distanceTo(this.srotation)>=1)
                    this.eventdispatcher.dispatchEvent({type:'r_end', rotation: rot_remp});

            }
        }
        if(this.interactive){
            this.interactive = true;
        }
        this.state = modes.Cammode;
        this.eventdispatcher.dispatchEvent({
            type: 'interactive'
            // newObject: this.previousSelectedObject
        });
    }
    setkey(event: any) {
        if (event.key == 't') {
          this.state = modes.Translation; //Translation

        } else if (event.key == 'r') {
            this.state = modes.Rotation; //Rotation
        } else if (event.key == 'c'){
          this.state = modes.Cammode; // camera
        }
        else{
            this.state = modes.Cammode; // camera as idle
        }
        // window.console.log(pointer.key);
        this.eventdispatcher.dispatchEvent({
            type: 'interactive'
            // newObject: this.previousSelectedObject
        });
    }
    changecontrols(newPosition: THREE.Vector3, milliseconds: number, done?: () => void) {
        console.log(this.previousSelectedObject);
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
              // console.log('end anim');
              clearInterval(this.changeTimeout);
              this.changeTimeout = undefined;
              if (done) {
                done();
              }
            }
          }, 0, this.previousSelectedObject.position, newPosition);
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
          }, 0, this.previousSelectedObject.rotation.toVector3(), newrotation);
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
                    asMeshPongMaterial.color.setHex(0x0000ff); // blue
                }
                else if(this.previousSelectedObject == this.pastSelectedObject)
                {
                    if(asMeshPongMaterial.color.getHex() == 0x0000ff)
                        asMeshPongMaterial.color.setHex(this.previousColor);
                    else
                        asMeshPongMaterial.color.setHex(0x0000ff);
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

}