**English** · [Français](README.fr.md)

# app

The Angular 22 front (decision D5): standalone components, `OnPush`, signals, no zone.js.

- `app.config.ts`: composition root. It gives the adapters of `src/infrastructure` behind the ports (injection tokens in `tokens.ts`); the only file of `src/app` allowed to import the infrastructure.
- `sonnaille.store.ts`: the state and what the user can do, with signals. It only calls the `application` use cases and the ports.
- `map/`: the map, created by an injected factory (MapLibre in the app, a fake in tests).
- `panels/`, `sightings/`, `sheets/`: presentation components (inputs and outputs only), wired to the store by `app.ts`.
- `testing/`: fake ports and fake map for the tests.

```bash
npm run dev            # http://localhost:4200/Sonnaille/
npm run test:angular   # component tests (src/app/**/*.spec.ts)
```
