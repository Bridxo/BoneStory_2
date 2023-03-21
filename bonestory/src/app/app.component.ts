import { Component, OnInit, ElementRef, ViewChild, EventEmitter, Output } from '@angular/core';
import { ProvenanceService } from './provenance.service';
import { HttpClient} from '@angular/common/http';
import * as THREE from 'three';
import { Observable, ReplaySubject } from 'rxjs';
import { MatSidenav } from '@angular/material/sidenav';
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
  public slider_value = 0;
  fileinfos: Observable<any> | null = null;
  private eventdispatcher: THREE.EventDispatcher;

  @Output() Keyup = new EventEmitter<string>();
  
  @ViewChild('multipleInput', { static: false })
  multipleInput!: ElementRef;

  private _data$ = new ReplaySubject(1);
  public data$ = this._data$.asObservable();
  

  constructor(private provenance: ProvenanceService, private http: HttpClient) {
    this.eventdispatcher = new THREE.EventDispatcher();
    console.log('constructor');
  }
  // addEventListener(type, listener){
  //   this.eventdispatcher.addEventListener(type,listener);
  // }

 
  selectMultipleImage(event: any) {
    if (event.target.files.length > 0) {
      this.multipleImages = event.target.files;
    }
  }
 
  async onMultipleSubmit(cb) {
    this.formdata = new FormData();
        // files is not a regular Array
        return Promise.all([].map.call(this.multipleImages, function (file) {
          return new Promise(function (resolve, reject) {
              var reader = new FileReader();
              reader.onloadend = function () {
                  resolve({ result: reader.result, file: file });
              };
              reader.readAsArrayBuffer(file);
          });
      })).then(function (results) {
          results.forEach(function (result) {
          });
          cb(results);
          return results;
      });
  }
    // for (let img of this.multipleImages) {
    //   //store form name as files with file data
    //   var reader = new FileReader();
    //   reader.readAsArrayBuffer(img);

    //   reader.addEventListener("load", () => {
    //     console.log(reader.result);
    //     cb(reader.result);
    //   }, false);
    // }

    // this.http.post<any>('gs://radiant-voyage-171301.appspot.com/multiplefiles', this.formdata)
    //   .subscribe((res) => {
    //     this.imgspath = res.path;
    //     console.log(this.imgspath);
    //     this.multipleInput.nativeElement.value = "";
    //     cb(this.imgspath);
    // }
    
    // )

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

  onSidenavToggle() {
    const button = document.getElementById('sidenav-trigger');
    const button2 = document.getElementById('upload_btn');
    const button3 = document.getElementById('saveprov_btn');
    const button4 = document.getElementById('demo_btn');
    const slide = document.getElementById('bottom-container');
    const prov = document.getElementById('side-container');
    const slideDisplay = window.getComputedStyle(slide).getPropertyValue("display");
    const actionDisplay = document.getElementById('modewidget');
    
    
    if (slideDisplay === 'block') {
      button.style.right = '0%';
      actionDisplay.style.right = '1%';
      button2.style.right = `2%`;
      button3.style.right = `4.5%`;
      button4.style.right = `7%`;
      slide.style.display = 'none';
      prov.style.display = 'none';
      

    } else {
      button.style.right = `20%`;
      actionDisplay.style.right = '21%';
      button2.style.right = `22%`;
      button3.style.right = `24.5%`;
      button4.style.right = `27%`;
      slide.style.display = 'block';
      prov.style.display = 'block';
    }
  }

}


