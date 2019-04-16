/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import { ViewChild } from '@angular/core';
import { Component } from '@angular/core';
import { MatSidenavModule } from '@angular/material';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';

  @ViewChild('MatSidenavModule')
  snav: MatSidenavModule;

}
