/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
export class FileBuffer {
  name: string;
  content: string;
  file: File;

  constructor () {
    this.name = "";
    this.content = "";
  }
}
