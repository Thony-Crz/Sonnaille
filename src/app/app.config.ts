import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

/** Composition root of the Angular front: the adapters behind each port. */
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners()],
};
