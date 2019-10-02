import { Component, ViewChild, Input, Output, EventEmitter, ElementRef, Renderer } from '@angular/core';
import { NgxUploaderModule } from 'ngx-uploader';

@Component({
  selector: 'ba-picture-uploader',
  styleUrls: ['./baPictureUploader.scss'],
  templateUrl: './baPictureUploader.html',
})
export class BaPictureUploader {

  @Input() defaultPicture: string = '/assets/img/no-photo.png';
  @Input() picture: string = '';

  @Input() tipo : string;
  @Input() ableTakePhoto = false;

  @Input() uploaderOptions: NgxUploaderModule = { url: '' };
  @Input() canDelete: boolean = true;

  @Output() onUpload = new EventEmitter<any>();
  @Output() onUploadCompleted = new EventEmitter<any>();

  @Output() setImage = new EventEmitter();

  @ViewChild('fileUpload') public _fileUpload: ElementRef;

  public uploadInProgress: boolean;
  public cameroOn: boolean = false;

  constructor(private renderer: Renderer) {
  }

  beforeUpload(uploadingFile): void {
    let files = this._fileUpload.nativeElement.files;

    if (files.length) {
      const file = files[0];
      this._changePicture(file);

      if (!this._canUploadOnServer()) {
        uploadingFile.setAbort();
      } else {
        this.uploadInProgress = true;
      }
    }
  }

  bringTakePhotoSelector(): boolean {
    this.cameroOn = true;

    setTimeout(()=>{
      var video = document.getElementById('bgvid');

      // Get access to the camera!
      if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          // Not adding `{ audio: true }` since we only want video now
          navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
              window['localStream'] = stream;
              video['src'] = window.URL.createObjectURL(stream);
              video['play']();
          });
      }
    },500);

    return false;
  }

  cancelAPhoto(): boolean {
    this.cameroOn = false;

    /*var video = document.getElementById('bgvid');
    video['pause']();*/

    window['localStream'].getTracks().forEach( (track) => {
      track.stop();
    });

    return false;
  }

  takeAPhoto(): boolean {
    var video = document.getElementById('bgvid') as HTMLVideoElement;
    var canvas = document.createElement("canvas")  as HTMLCanvasElement;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    var img_b64 = canvas.toDataURL();
    var arr = img_b64.split(','), mime = arr[0].match(/:(.*?);/)[1];
    var bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);

    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    this._changePicture(new File([u8arr], 'photo.png', {type:mime}));

    return false;
  }

  bringFileSelector(): boolean {
    this.renderer.invokeElementMethod(this._fileUpload.nativeElement, 'click');
    return false;
  }

  removePicture(): boolean {
    this.picture = '';
    return false;
  }

  _changePicture(file: File): void {
    const reader = new FileReader();
    reader.addEventListener('load', (event: Event) => {
      this.picture = (<any>event.target).result;
      this.setImage.emit( { "image" : this.picture.split(",")[1], "tipo" : this.tipo } );
      this.cancelAPhoto();
    }, false);
    reader.readAsDataURL(file);
  }

  _onUpload(data): void {
    if (data['done'] || data['abort'] || data['error']) {
      this._onUploadCompleted(data);
    } else {
      this.onUpload.emit(data);
    }
  }

  _onUploadCompleted(data): void {
    this.uploadInProgress = false;
    this.onUploadCompleted.emit(data);
  }

  _canUploadOnServer(): boolean {
    return !!this.uploaderOptions['url'];
  }
}
