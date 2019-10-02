import {Component, OnInit, Input, Output, ViewChild, EventEmitter, Renderer2, forwardRef} from '@angular/core';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';

import {CommandExecutorService} from './common/services/command-executor.service';
import {MessageService} from './common/services/message.service';

import {ngxEditorConfig} from './common/ngx-editor.defaults';
import * as Utils from './common/utils/ngx-editor.utils';

@Component({
    selector: 'app-ngx-editor',
    templateUrl: './ngx-editor.component.html',
    styleUrls: ['./ngx-editor.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => NgxEditorComponent),
            multi: true
        }
    ]
}) 

export class NgxEditorComponent implements OnInit, ControlValueAccessor {
    @Input() editable: boolean;
    @Input() spellcheck: boolean;
    @Input() placeholder: string;

    @Input() translate: string;
    @Input() height: string;
    @Input() minHeight: string;
    @Input() width: string;
    @Input() minWidth: string;
    @Input() toolbar: Object;
    @Input() resizer = 'stack';
    @Input() config = ngxEditorConfig;
    @Input() showToolbar: boolean;
    @Input() enableToolbar: boolean;
    @Input() imageEndPoint: string;

    @Output() blur: EventEmitter<string> = new EventEmitter<string>();
    @Output() focus: EventEmitter<string> = new EventEmitter<string>();
    @Output() innerHeight = new EventEmitter();

    @ViewChild('ngxTextArea') textArea: any;
    @ViewChild('ngxWrapper') ngxWrapper: any;

    Utils: any = Utils;

    private onChange: (value: string) => void;
    private onTouched: () => void;

    constructor(
        private _messageService: MessageService,
        private _commandExecutor: CommandExecutorService,
        private _renderer: Renderer2
        ) { }

    onTextAreaFocus(): void {
        this.focus.emit('focus');
        return;
    }

    onEditorFocus() {
        this.textArea.nativeElement.focus();
    }

    onContentChange(html: string): void {
        if (typeof this.onChange === 'function') {
            this.onChange(html);
            this.togglePlaceholder(html);
        }

        return;
    }

    onTextAreaBlur(html: string): void {
        this._commandExecutor.savedSelection = Utils.saveSelection();

        if (typeof this.onTouched === 'function') {
            this.onTouched();
        }
        this.blur.emit('blur');
        this.innerHeight.emit(html);

        return;
    }

    resizeTextArea(offsetY: number): void {
        let newHeight = parseInt(this.height, 10);
        newHeight += offsetY;
        this.height = newHeight + 'px';
        this.textArea.nativeElement.style.height = this.height;
        return;
    }

    executeCommand(commandName: string): void {
        if (commandName == 'print') {
            this.imprimir()
            return;
        }
        
        try {
            this._commandExecutor.execute(commandName);
        } catch (error) {
            this._messageService.sendMessage(error.message);
        }

        return;
    }

    writeValue(value: any): void {
        this.togglePlaceholder(value);

        if (value === null || value === undefined || value === '' || value === '<br>') {
            value = null;
        }

        this.refreshView(value);
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    refreshView(value: string): void {
        const normalizedValue = value === null ? '' : value;
        this._renderer.setProperty(this.textArea.nativeElement, 'innerHTML', normalizedValue);
        return;
    }

    togglePlaceholder(value: any): void {
        if (!value || value === '<br>' || value === '') {
            this._renderer.addClass(this.ngxWrapper.nativeElement, 'show-placeholder');
        } else {
            this._renderer.removeClass(this.ngxWrapper.nativeElement, 'show-placeholder');
        }
        return;
    }

    getCollectiveParams(): any {
        return {
            editable: this.editable,
            spellcheck: this.spellcheck,
            placeholder: this.placeholder,
            translate: this.translate,
            height: this.height,
            minHeight: this.minHeight,
            width: this.width,
            minWidth: (this.minWidth ? this.minWidth : '60px'),
            enableToolbar: this.enableToolbar,
            showToolbar: this.showToolbar,
            imageEndPoint: this.imageEndPoint,
            toolbar: this.toolbar
        };
    }

    ngOnInit() {
        this.config = this.Utils.getEditorConfiguration(this.config, ngxEditorConfig, this.getCollectiveParams());
        this.height = this.height || this.textArea.nativeElement.offsetHeight;
        this.executeCommand('enableObjectResizing');
    }

    imprimir() {
        let printContents, popupWin;
        printContents = document.getElementById('print').innerHTML;
        popupWin = window.open('', '_blank');
        popupWin.document.open();
        popupWin.document.write(`
            <html>
                <style type="text/css" media="print">
                </style>
                <body onload="window.print();window.close()">${printContents}</body>
            </html>
        `);
        popupWin.document.close();
    }
}