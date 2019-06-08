/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CommonModule} from '../common.module';

import {BookingsComponent} from './bookings.component';
import {BookingsDashComponent} from './dash.component';

const routes: Routes = [
  { path: 'bookings', component: BookingsComponent },
  { path: 'bookings/dash', component: BookingsDashComponent },
];

@NgModule({
  declarations: [
    BookingsComponent,
    BookingsDashComponent,
  ],
  entryComponents: [
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ],
  exports: [
    RouterModule
  ]
})
export class BookingsModule { }
