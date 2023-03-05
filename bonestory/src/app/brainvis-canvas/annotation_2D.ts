import * as THREE from 'three';

interface AnnotationOptions {
  position: THREE.Vector3;
  text: string;
}

class Annotation_2d extends THREE.Object3D {
  private options: AnnotationOptions;
  private element: HTMLDivElement;
  private note: HTMLDivElement;
  private camera: THREE.Camera;

  constructor(options: AnnotationOptions, camera: THREE.Camera) {
    super();

    this.options = options;
    this.camera = camera;

    this.element = document.createElement('div');
    this.element.classList.add('annotation');

    // Create the note element and set its background color and size
    this.note = document.createElement('div');
    this.note.classList.add('note');
    this.note.style.backgroundColor = 'white';
    this.note.style.width = '300px';
    this.note.style.height = '300px';
    this.element.appendChild(this.note);

    // Create the text element and set its content
    const text = document.createElement('div');
    text.classList.add('text');
    text.innerHTML = options.text;
    this.element.appendChild(text);
    
    document.body.appendChild(this.element);


    this.update();
  }

  public update() {
    const position = this.getPosition();
    const { x, y } = this.getScreenPosition(position);

    this.element.style.transform = `translate(${x}px, ${y}px)`;
  }

  private getPosition(): THREE.Vector3 {
    const { x, y } = this.options.position;
    return new THREE.Vector3(x, y, 0);
  }

  private getScreenPosition(position: THREE.Vector3): { x: number; y: number } {
    const vector = position.project(this.camera);
    const widthHalf = window.innerWidth / 2;
    const heightHalf = window.innerHeight / 2;

    const x = vector.x * widthHalf + widthHalf;
    const y = -(vector.y * heightHalf) + heightHalf;

    return { x, y };
  }
}

export default Annotation_2d;