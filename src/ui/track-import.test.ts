// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTrackImport, enableFileDrop } from './track-import';

afterEach(() => {
  document.body.innerHTML = '';
});

const gpxFile = () => new File(['<gpx/>'], 'sortie.gpx', { type: 'application/gpx+xml' });

describe('createTrackImport', () => {
  it('offers a button that opens a GPX file picker', () => {
    const { element } = createTrackImport({ onFile: vi.fn() });
    document.body.append(element);
    const input = element.querySelector<HTMLInputElement>('input[type="file"]')!;
    const pick = vi.spyOn(input, 'click');

    element.querySelector('button')?.click();

    expect(element.querySelector('button')?.textContent).toBe('Importer un GPX');
    expect(input.accept).toBe('.gpx,application/gpx+xml');
    expect(input.hidden).toBe(true);
    expect(pick).toHaveBeenCalled();
  });

  it('hands over the chosen file', () => {
    const onFile = vi.fn();
    const { element } = createTrackImport({ onFile });
    const input = element.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = gpxFile();
    Object.defineProperty(input, 'files', { value: [file] });

    input.dispatchEvent(new Event('change'));

    expect(onFile).toHaveBeenCalledWith(file);
  });

  it('says that the file stays on the device', () => {
    const { element } = createTrackImport({ onFile: vi.fn() });

    expect(element.textContent).toContain('Le fichier reste sur votre appareil.');
  });

  it('shows the import status', () => {
    const importer = createTrackImport({ onFile: vi.fn() });

    importer.setStatus('Sortie, 12,4 km');

    expect(importer.element.querySelector('.track-import-status')?.textContent).toBe('Sortie, 12,4 km');
  });
});

describe('enableFileDrop', () => {
  const drop = (target: HTMLElement, files: File[]) => {
    const event = new Event('drop', { cancelable: true });
    Object.defineProperty(event, 'dataTransfer', { value: { files } });
    target.dispatchEvent(event);
    return event;
  };

  it('hands over a GPX file dropped on the target', () => {
    const target = document.createElement('div');
    const onFile = vi.fn();
    enableFileDrop(target, onFile);
    const file = gpxFile();

    const event = drop(target, [file]);

    expect(onFile).toHaveBeenCalledWith(file);
    expect(event.defaultPrevented).toBe(true);
  });

  it('ignores other dropped files', () => {
    const target = document.createElement('div');
    const onFile = vi.fn();
    enableFileDrop(target, onFile);

    drop(target, [new File(['x'], 'photo.jpg', { type: 'image/jpeg' })]);

    expect(onFile).not.toHaveBeenCalled();
  });

  it('highlights the target while a file is dragged over it', () => {
    const target = document.createElement('div');
    enableFileDrop(target, vi.fn());

    target.dispatchEvent(new Event('dragover', { cancelable: true }));
    expect(target.classList.contains('drop-active')).toBe(true);

    target.dispatchEvent(new Event('dragleave'));
    expect(target.classList.contains('drop-active')).toBe(false);
  });
});
