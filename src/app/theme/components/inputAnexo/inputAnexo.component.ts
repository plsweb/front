import { Component, Input, Output, ElementRef, EventEmitter } from '@angular/core';

@Component({
    selector: 'inputAnexo',
    templateUrl: './inputAnexo.html',
    styleUrls: ['./inputAnexo.scss'],
    providers: []
})
export class InputAnexo {
    @Input() name: string;
    @Input() placeholder: string;
    @Input() arquivo: boolean;
    @Input() ocultaNomeArquivo = false;
    @Input() ocultaCampoArquivo = false;
    @Input() uploadIcon = 'attach_file';
    @Input() nomeArquivo  = '[Nenhum arquivo selecionado]';;
    @Output() onFileUploadCompleted: EventEmitter<any> = new EventEmitter();
    
    constructor() { 
    }

    ngOnInit() {
        let elFile = document.getElementById('file');

        if (elFile) {
            elFile.onchange = (event) => {
                this.nomeArquivo = '';
                let arquivos = document.getElementById('file')['files'];
                for (let i = 0, len = arquivos.length; i < len; i++){
                    this.nomeArquivo = this.nomeArquivo + `${arquivos[i].name} `;
                }
                
                if (this.onFileUploadCompleted){
                    this.onFileUploadCompleted.emit(document.getElementById('file')['files']);
                }
            }
        }
    }
}