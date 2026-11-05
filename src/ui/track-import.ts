export interface TrackImport {
  element: HTMLElement;
  setStatus(text: string): void;
}

const isGpx = (file: File) => /\.gpx$/i.test(file.name) || file.type === 'application/gpx+xml';

/** "Importer un GPX" panel: a button opening a file picker, and the import status. */
export function createTrackImport({ onFile }: { onFile: (file: File) => void }): TrackImport {
  const panel = document.createElement('div');
  panel.className = 'map-panel track-import';

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.gpx,application/gpx+xml';
  input.hidden = true;
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) onFile(file);
    input.value = '';
  });

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Importer un GPX';
  button.addEventListener('click', () => input.click());

  const privacy = document.createElement('p');
  privacy.className = 'track-import-privacy';
  privacy.textContent = 'Le fichier reste sur votre appareil.';

  const status = document.createElement('p');
  status.className = 'track-import-status';
  status.setAttribute('aria-live', 'polite');

  panel.append(button, input, privacy, status);
  return {
    element: panel,
    setStatus: (text) => {
      status.textContent = text;
    },
  };
}

/** Lets the user drop a GPX file on the target (the map). */
export function enableFileDrop(target: HTMLElement, onFile: (file: File) => void): void {
  target.addEventListener('dragover', (event) => {
    event.preventDefault();
    target.classList.add('drop-active');
  });
  target.addEventListener('dragleave', () => target.classList.remove('drop-active'));
  target.addEventListener('drop', (event) => {
    event.preventDefault();
    target.classList.remove('drop-active');
    const file = [...((event as DragEvent).dataTransfer?.files ?? [])].find(isGpx);
    if (file) onFile(file);
  });
}
