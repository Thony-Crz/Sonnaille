import type { Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';

/** Renders a component with its inputs, attached to the document (some events need it). */
export function render<T>(component: Type<T>, inputs: Record<string, unknown> = {}) {
  const fixture: ComponentFixture<T> = TestBed.createComponent(component);
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  document.body.append(host);
  const $ = <E extends Element = HTMLElement>(selector: string) => host.querySelector<E>(selector)!;
  const update = (more: Record<string, unknown>) => {
    for (const [name, value] of Object.entries(more)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  };
  return { fixture, host, $, update, instance: fixture.componentInstance };
}
