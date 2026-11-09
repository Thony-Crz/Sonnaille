import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

// Composition root: app.config.ts gives the adapters behind each port.
bootstrapApplication(App, appConfig).catch((error: unknown) => console.error(error));
