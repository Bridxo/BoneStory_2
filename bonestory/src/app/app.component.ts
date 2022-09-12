import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ProvenanceService } from './provenance.service';
import { HttpClient } from '@angular/common/http';
import { BrainvisCanvasComponent } from './brainvis-canvas/brainvis-canvas.component';
import * as THREE from 'three';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  public upload_show: boolean = false;
  multipleImages = [];
  private eventdispatcher: THREE.EventDispatcher;
  @ViewChild('multipleInput', { static: false })
  multipleInput!: ElementRef;

  constructor(private provenance: ProvenanceService, private http: HttpClient) {
    // console.log(arg);
    this.eventdispatcher = new THREE.EventDispatcher();
    console.log('constructor');
  }
  top_button_Canvas() {
    // BrainvisCanvasComponent
    console.log('top_button');
    window.event

  }
 
  selectMultipleImage(event: any) {
    if (event.target.files.length > 0) {
      this.multipleImages = event.target.files;
    }
  }
 
  onMultipleSubmit() {
    const formdata = new FormData()
 
    for (let img of this.multipleImages) {
      formdata.append('files',img)
    }
 
    this.http.post<any>('http://localhost:3000/multipleFiles', formdata)
      .subscribe((res) => {
        console.log(res)
        this.multipleInput.nativeElement.value = ""
        console.log(res.path)        
    })
  }
  toggle_upload(){
    this.upload_show = !this.upload_show;
  }

  onselect_submit(event: any) {
    if (event.target.files.length > 0) {
      this.multipleImages = event.target.files;
      this.onMultipleSubmit();
    }
  }

  
  ngOnInit() {
    console.log('init?');
  }
}


