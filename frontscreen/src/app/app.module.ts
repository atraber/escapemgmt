import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MomentModule } from 'angular2-moment';
import { AppComponent } from './app.component';
import { HighscoreComponent } from './highscore.component';
import { RoomsService } from './rooms.service';

@NgModule({
    declarations: [
        AppComponent,
        HighscoreComponent,
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        MomentModule,
    ],
    providers: [
        RoomsService,
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
