/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';

import {FileBuffer} from './filebuffer';

@Component({
  selector : 'file-upload',
  templateUrl : 'fileupload.component.html',
  styleUrls : [ 'fileupload.component.scss' ],
})
export class FileUploadComponent {
  @Input() label: string;
  @Output() onLoad = new EventEmitter<File>();
  filename: string = "";

  constructor(private snackBar: MatSnackBar) {}

  onChange(event: Event): void {
    if (event.target) {
      let files = (event.target as HTMLInputElement).files;
      if (files.length > 0) {
        this.fileRead(files[0]);
      }
    }
  }

  fileRead(file: File): void {
    this.filename = file.name;

    this.onLoad.emit(file)
  }
}
