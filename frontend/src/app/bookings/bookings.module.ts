/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {CommonModule} from '../common.module';

import {BookingCreateDialog} from './booking-create.dialog';
import {BookingsCard} from './bookings-card.component';
import {BookingsComponent} from './bookings.component';
import {BookingsDashComponent} from './dash.component';
import {PaymentSnackGalleryDialog} from './payment-snack-gallery.dialog';
import {PaymentValueDialog} from './payment-value.dialog';
import {PaymentVoucherDialog} from './payment-voucher.dialog';
import {PaymentsComponent} from './payments.component';

const routes: Routes = [
  {path : 'bookings', component : BookingsComponent},
  {path : 'bookings/dash', component : BookingsDashComponent},
  {path : 'bookings/payments', component : PaymentsComponent},
];

@NgModule({
  declarations : [
    BookingCreateDialog,
    BookingsCard,
    BookingsComponent,
    BookingsDashComponent,
    PaymentSnackGalleryDialog,
    PaymentValueDialog,
    PaymentVoucherDialog,
    PaymentsComponent,
  ],
  entryComponents : [
    BookingsCard,
    BookingCreateDialog,
  ],
  imports : [
    CommonModule,
    RouterModule.forChild(routes),
  ],
  exports : [ RouterModule ]
})
export class BookingsModule {
}
