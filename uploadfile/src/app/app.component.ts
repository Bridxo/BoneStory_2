import { Component, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
 
 
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'uploadfile';
  public show: Boolean = false;

 
  displaySingleImage!: Boolean;
  displayMultipleImages!: Boolean;
  displayMultipleImageArray!: Array<any>;
  displaySingleImageArray!: Array<any>;
 
  @ViewChild('singleInput', { static: false })
  singleInput!: ElementRef;
 
  @ViewChild('multipleInput', { static: false })
  multipleInput!: ElementRef;
 
  images: any;
  multipleImages = [];
 
  constructor(private http: HttpClient) {
    this.displaySingleImage = false;
    this.displayMultipleImageArray = [];
    this.displayMultipleImages = false;
    this.displaySingleImageArray = [];
  }
 
  selectImage(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      console.log(file);
      this.images = file;
    }
  }
 
  onSubmit() {
    // construct formdata
 
    const formdata = new FormData();
 
    formdata.append('file', this.images);
 
    // post request to express backend
 
    this.http.post<any>('http://localhost:3000/file', formdata).subscribe(
      (res) => {
        console.log(res);
        this.singleInput.nativeElement.value = '';
        this.displaySingleImage = true;
        this.displaySingleImageArray.push(res.path);
      },
      (err) => {
        console.log(err);
      }
    );
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
        this.displayMultipleImages=true
        this.displayMultipleImageArray = res.path
        
    })
  }

  toggle() {
    this.show = !this.show;
  }
}