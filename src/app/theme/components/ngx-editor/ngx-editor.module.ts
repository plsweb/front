import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { PopoverModule } from 'ngx-bootstrap';

import { NgxEditorComponent } from './ngx-editor.component';
import { NgxGrippieComponent } from './ngx-grippie/ngx-grippie.component';
import { NgxEditorMessageComponent } from './ngx-editor-message/ngx-editor-message.component';
import { NgxEditorToolbarComponent } from './ngx-editor-toolbar/ngx-editor-toolbar.component';
import { CommandExecutorService } from './common/services/command-executor.service';
import { MessageService } from './common/services/message.service';
import { NgaModule } from '../../nga.module';
import { ColorPicker } from '../colorPicker/colorPicker';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule/*, NgaModule*/, PopoverModule.forRoot()],
  declarations: [NgxEditorComponent, NgxGrippieComponent, NgxEditorMessageComponent, NgxEditorToolbarComponent/*, ColorPicker*/],
  exports: [NgxEditorComponent/*, NgaModule*/, PopoverModule],
  providers: [CommandExecutorService, MessageService],
  bootstrap: [NgxEditorComponent, NgxGrippieComponent, NgxEditorMessageComponent, NgxEditorToolbarComponent/*, ColorPicker*/]
})

export class NgxEditorModule { }