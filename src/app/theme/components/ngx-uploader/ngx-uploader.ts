import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { UploadOutput, UploadInput, UploadFile, humanizeBytes, UploaderOptions, UploadStatus } from 'ngx-uploader';
import { UtilService } from '../../../services';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'uploader',
    templateUrl: './ngx-uploader.html',
    styleUrls: ['./ngx-uploader.scss'],
})

export class NgxUploader {
    private base64textString: String = "";

    @Input() start;
    @Input() descricao;
    @Input() upload = true;
    @Input() style = 'padrao';
    @Input() classe = 'd-inline-block';
    @Input() mostraNomeArquivo = false;
    @Input() container = false;
    @Input() extensao = ['', 'image/jpeg', 'image/png', 'application/pdf', 'application/zip', 'application/x-zip-compressed'];

    @Output() uploadPost: EventEmitter<any> = new EventEmitter();
    @Output() uploadInsert: EventEmitter<any> = new EventEmitter();

    url = ``;
    uploadInput: EventEmitter<UploadInput>;
    options: UploaderOptions;
    humanizeBytes: Function;
    files: UploadFile[];
    formData: FormData;
    dragOver: boolean;

    @ViewChild('output') inputUpload: ElementRef;

    constructor(
        private toastr: ToastrService,
        private serviceUtil: UtilService,
    ) {
        this.files = [];
        this.humanizeBytes = humanizeBytes;
        this.options = { concurrency: 1, maxUploads: 1, allowedContentTypes: this.extensao };
        this.uploadInput = new EventEmitter<UploadInput>();
    }

    handleFileSelect(evt, file = []){
        var fils = file.length ? file : evt.target.files;
        var fil = fils[0];

        if (fils && fil) {
            var reader = new FileReader();
            reader.onload = this._handleReaderLoaded.bind(this);
            reader.readAsBinaryString(fil);
        }
    }

    _handleReaderLoaded(readerEvt) {

        var binaryString = readerEvt.target.result;
        this.base64textString = btoa(binaryString);

        if( !this.upload ){

            if ( this.extensao && this.extensao.includes(this.files[0].type) && this.base64textString ) {

                let descricao = this.files[0].name.replace(/.[a-z]+$/, '');
                let extensao = this.files[0].name.replace(descricao, '');

                this.uploadPost.emit({ 
                    descricao: this.descricao || descricao, 
                    extensao: extensao, 
                    arquivoBase64: this.base64textString 
                });

            }else{
                this.toastr.warning("Extensão de arquivo não permitida");
            }
        }
    }

    drop(e) {
        e.preventDefault();
        this.handleFileSelect(null, e.dataTransfer.files);
    }

    nameFile
    onUploadOutput(output: UploadOutput): void {
        if (output.type === 'allAddedToQueue') {// Upload automatico
            // this.startUpload();
            // this.uploadInput.emit(event);

        } else if (output.type === 'addedToQueue' && typeof output.file !== 'undefined') {
            this.files.push(output.file);

        } else if (output.type === 'uploading' && typeof output.file !== 'undefined') {
            const index = this.files.findIndex(file => typeof output.file !== 'undefined' && file.id === output.file.id);
            this.files[index] = output.file;

        } else if (output.type === 'cancelled' || output.type === 'removed') {
            this.files = this.files.filter((file: UploadFile) => file !== output.file);
            this.uploadInsert.emit(false);
            this.nameFile = undefined;
            this.container = false;
            this.files = [];
            return;

        } else if (output.type === 'dragOver') {
            this.dragOver = true;

        } else if (output.type === 'dragOut') {
            this.dragOver = false;

        } else if (output.type === 'drop') {
            this.dragOver = false;

        } else if (output.type === 'rejected' && typeof output.file !== 'undefined') {
            this.toastr.error('Arquivo rejeitado');
            this.uploadInsert.emit(false);
            output.type = undefined;
            this.container = false;
            this.files = [];
            return;
        }

        this.files = this.files.filter(file => file.progress.status !== UploadStatus.Done);
        this.nameFile = this.files && this.files[0] ? this.files[0].name : undefined;
        this.uploadInsert.emit(this.files[0]);
    }

    startUpload(): void {
        let descricao = this.files[0].name.replace(/.[a-z]+$/, '');
        let extensao = this.files[0].name.replace(descricao, '');
 
        if (!this.base64textString) {
            this.handleFileSelect(null, this.files);
        }

        if ( this.extensao && this.extensao.includes(this.files[0].type) && this.base64textString ) {
            if (this.upload) {
                let request = { descricao: this.descricao || descricao, extensao: extensao, arquivoBase64: this.base64textString };
                this.serviceUtil.postArquivo(request).subscribe(
                    (arquivo) => {
                        this.uploadPost.emit({id: arquivo, file: request});
                        this.toastr.success("Arquivo salvo com sucesso.");
                        this.removeFile(this.files[0].id);
                    },
                    (erro) => {
                        this.uploadPost.emit(erro);
                        this.toastr.error("Erro salvar o Arquivo.");
                        this.removeFile(this.files[0].id);
                    }
                );
            } else {
                this.uploadPost.emit({ descricao: this.descricao || descricao, extensao: extensao, arquivoBase64: this.base64textString });
            }
        } else {
            this.onUploadOutput({ type: 'done' });
        }
    }

    cancelUpload(id: string): void {
        this.uploadInput.emit({ type: 'cancel', id: id });
        this.uploadInput.emit({ type: 'remove', id: id });
    }

    removeFile(id: string): void {
        this.uploadInput.emit({ type: 'remove', id: id });
    }

    teste(a,b) {
        console.log(a);
        console.log(b);
    }
}