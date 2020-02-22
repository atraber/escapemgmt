import {platformBrowser} from '@angular/platform-browser';
import {AppModule} from './app/app.module';
import {environment} from './environment';

environment.production = false;
environment.apiEndpoint = 'http://localhost:5000';
environment.viewEndpoint = 'http://127.0.0.1:8080';

platformBrowser().bootstrapModule(AppModule);
