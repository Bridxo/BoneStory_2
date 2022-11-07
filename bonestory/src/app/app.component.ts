import { Component, OnInit, ElementRef, ViewChild, EventEmitter, Output } from '@angular/core';
import { ProvenanceService } from './provenance.service';
import { HttpClient, HttpRequest, HttpEvent } from '@angular/common/http';
import { BrainvisCanvasComponent } from './brainvis-canvas/brainvis-canvas.component';
import * as THREE from 'three';
import { Observable, ReplaySubject } from 'rxjs';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  public formdata: any;
  public upload_show: boolean = false;
  public multipleImages = [];
  public imgspath = [];
  private BCC: BrainvisCanvasComponent;
  fileinfos: Observable<any> | null = null;
  private eventdispatcher: THREE.EventDispatcher;

  @Output() Keyup = new EventEmitter<string>();
  
  @ViewChild('multipleInput', { static: false })
  multipleInput!: ElementRef;

  private _data$ = new ReplaySubject(1);
  public data$ = this._data$.asObservable();
  

  constructor(private provenance: ProvenanceService, private http: HttpClient) {
    // console.log(arg);
    this.eventdispatcher = new THREE.EventDispatcher();
    console.log('constructor');
  }
  addEventListener(type, listener){
    this.eventdispatcher.addEventListener(type,listener);
  }

  top_button_Canvas() {
    this.BCC.top_button_press;
  }
 
  selectMultipleImage(event: any) {
    if (event.target.files.length > 0) {
      this.multipleImages = event.target.files;
    }
  }
 
  async onMultipleSubmit(cb) {
    this.formdata = new FormData();
 
    for (let img of this.multipleImages) {
      //store form name as files with file data
      this.formdata.append('files',img)
    }
 
    this.http.post<any>('http://localhost:3000/multipleFiles', this.formdata)
      .subscribe((res) => {
        this.imgspath = res.path;
        console.log(this.imgspath);
        this.multipleInput.nativeElement.value = "";
        cb(this.imgspath);
    }
    
    )

  }
  toggle_upload(){
    this.upload_show = !this.upload_show;
  }

  onselect_submit = (event: any, cb: any) => {
    if (event.target.files.length > 0) {
      this.multipleImages = event.target.files;
      this.onMultipleSubmit(cb);
    }

    
  }
  get_STLfiles() {
    return this.imgspath;
  }
  
  ngOnInit() {
    console.log('init?');
  }


}


