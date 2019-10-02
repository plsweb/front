import { Component, Input, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpResponse } from '@angular/common/http';
import { PopoverConfig } from 'ngx-bootstrap';
import { CommandExecutorService } from '../common/services/command-executor.service';
import { MessageService } from '../common/services/message.service';
import * as Utils from '../common/utils/ngx-editor.utils';
import { ColorPicker } from '../../colorPicker/colorPicker';

@Component({
  selector: 'app-ngx-editor-toolbar',
  templateUrl: './ngx-editor-toolbar.component.html',
  styleUrls: ['./ngx-editor-toolbar.component.scss'],
  providers: [PopoverConfig, ColorPicker]
})

export class NgxEditorToolbarComponent implements OnInit {

  /** holds values of the insert link form */
  urlForm: FormGroup;
  /** holds values of the insert image form */
  imageForm: FormGroup;
  /** holds values of the insert video form */
  videoForm: FormGroup;
  /** set to false when image is being uploaded */
  uploadComplete = true;
  /** upload percentage */
  updloadPercentage = 0;
  /** set to true when the image is being uploaded */
  isUploading = false;
  /** which tab to active for color insetion */
  selectedColorTab = 'textColor';
  /** font family name */
  fontName = '';
  /** font size */
  fontSize = '';
  /** hex color code */
  hexColor = '';
  /** ColorPicket */
  novoTexto = new Object();
  cor;
  /** show/hide image uploader */
  isImageUploader = false;

  /**
   * Editor configuration
   */
  @Input() config: any;
  @ViewChild('urlPopover') urlPopover;
  @ViewChild('imagePopover') imagePopover;
  @ViewChild('videoPopover') videoPopover;
  @ViewChild('fontSizePopover') fontSizePopover;
  @ViewChild('colorPopover') colorPopover;
  @ViewChild('colorPopoverText') colorPopoverText;
  @ViewChild('colorPopoverBack') colorPopoverBack;
  @ViewChild('picket') picket;
  /**
   * Emits an event when a toolbar button is clicked
   */
  @Output() execute: EventEmitter<string> = new EventEmitter<string>();

  constructor(private _popOverConfig: PopoverConfig,
    private _formBuilder: FormBuilder,
    private _messageService: MessageService,
    private _commandExecutorService: CommandExecutorService,
    private colorPicker: ColorPicker) {
    this._popOverConfig.outsideClick = true;
    this._popOverConfig.placement = 'bottom';
    this._popOverConfig.container = 'body';
  }

  /**
   * enable or diable toolbar based on configuration
   *
   * @param value name of the toolbar buttons
   */
  canEnableToolbarOptions(value): boolean {
    return Utils.canEnableToolbarOptions(value, this.config['toolbar']);
  }

  /**
   * triggers command from the toolbar to be executed and emits an event
   *
   * @param command name of the command to be executed
   */
  triggerCommand(command: string): void {console.log(command)
    this.execute.emit(command);
  }

  /**
   * create URL insert form
   */
  buildUrlForm(): void {

    this.urlForm = this._formBuilder.group({
      urlLink: ['', [Validators.required]],
      urlText: ['', [Validators.required]],
      urlNewTab: [true]
    });

    return;
  }

  /**
   * inserts link in the editor
   */
  insertLink(): void {

    try {
      this._commandExecutorService.createLink(this.urlForm.value);
    } catch (error) {
      this._messageService.sendMessage(error.message);
    }

    /** reset form to default */
    this.buildUrlForm();
    /** close inset URL pop up */
    this.urlPopover.hide();

    return;
  }

  /**
   * create insert image form
   */
  buildImageForm(): void {

    this.imageForm = this._formBuilder.group({
      imageUrl: ['', [Validators.required]]
    });

    return;
  }

  /**
   * create insert image form
   */
  buildVideoForm(): void {

    this.videoForm = this._formBuilder.group({
      videoUrl: ['', [Validators.required]],
      height: [''],
      width: ['']
    });

    return;
  }

  /**
   * Executed when file is selected
   *
   * @param e onChange event
   */
  onFileChange(e): void {

    this.uploadComplete = false;
    this.isUploading = true;

    if (e.target.files.length > 0) {
      const file = e.target.files[0];

      try {
        this._commandExecutorService.uploadImage(file, this.config.imageEndPoint).subscribe(event => {

          if (event.type) {
            this.updloadPercentage = Math.round(100 * event.loaded / event.total);
          }

          if (event instanceof HttpResponse) {
            try {
              this._commandExecutorService.insertImage(event.body.url);
            } catch (error) {
              this._messageService.sendMessage(error.message);
            }
            this.uploadComplete = true;
            this.isUploading = false;
          }
        });
      } catch (error) {
        this._messageService.sendMessage(error.message);
        this.uploadComplete = true;
        this.isUploading = false;
      }

    }

    return;
  }

  /** insert image in the editor */
  insertImage(): void {
    try {
      this._commandExecutorService.insertImage(this.imageForm.value.imageUrl);
    } catch (error) {
      this._messageService.sendMessage(error.message);
    }

    /** reset form to default */
    this.buildImageForm();
    /** close inset URL pop up */
    this.imagePopover.hide();

    return;
  }

  /** insert image in the editor */
  insertVideo(): void {
    try {
      this._commandExecutorService.insertVideo(this.videoForm.value);
    } catch (error) {
      this._messageService.sendMessage(error.message);
    }

    /** reset form to default */
    this.buildVideoForm();
    /** close inset URL pop up */
    this.videoPopover.hide();

    return;
  }
  
  //** ColorPicket */
  setObjColorPicker(color) {console.log(color)
    this['colorPicker'] = color;
  }

  trocaCor(event, valor) {console.log(this.colorPicker)
    this.colorPicker.corSelecionada = valor;
    this.cor = valor;
    if (valor) {console.log(valor);console.log(this['where'])
      this.insertColor(valor, this['where']);
    }
  }

  /** inser text/background color */
  insertColor(color: string, where: string): void {console.log("insertColor")

    try {
      this._commandExecutorService.insertColor(color, where);
    } catch (error) {
      this._messageService.sendMessage(error.message);
    }

    this.colorPopover.hide();
    this.colorPopoverText.hide();
    this.colorPopoverBack.hide();
    return;
  }

  /** set font size */
  setFontSize(fontSize: string): void {

    try {
      this._commandExecutorService.setFontSize(fontSize);
    } catch (error) {
      this._messageService.sendMessage(error.message);
    }

    this.fontSizePopover.hide();
    return;
  }

  /** set font Name/family */
  setFontName(fontName: string): void {

    try {
      this._commandExecutorService.setFontName(fontName);
    } catch (error) {
      this._messageService.sendMessage(error.message);
    }

    this.fontSizePopover.hide();
    return;
  }

  /**
   * allow only numbers
   *
   * @param event keypress event
   */
  onlyNumbers(event: KeyboardEvent): boolean {
    return event.charCode >= 48 && event.charCode <= 57;
  }

  ngOnInit() {
    this.buildUrlForm();
    this.buildImageForm();
    this.buildVideoForm();
  }

  editorColor = {
    start: 127,
    connect: [true, false],
    orientation: "vertical",
    range: {
      'min': 0,
      'max': 255
    },
    // format: wNumb({
    //   decimals: 0
    // })
  }
}