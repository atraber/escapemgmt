import {enableProdMode} from '@angular/core';
import {platformBrowser} from '@angular/platform-browser';
import {AppModule} from './app/app.module';
import {environment} from './environment';

environment.production = true;
environment.apiEndpoint = window.location.origin + '/api';

enableProdMode();
platformBrowser().bootstrapModule(AppModule);
