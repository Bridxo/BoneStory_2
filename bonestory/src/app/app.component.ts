import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ProvenanceService } from './provenance.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  multipleImages = [];

  @ViewChild('multipleInput', { static: false })
  multipleInput!: ElementRef;

  constructor(private provenance: ProvenanceService, private http: HttpClient) {
    // console.log(arg);
    console.log('constructor');
  }
  top_button_Canvas() {
    console.log('top_button');
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

  
  ngOnInit() {
    console.log('init?');
  }
}


