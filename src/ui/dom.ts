/** Creates an element with properties and children. Children strings are inserted as text, never as HTML. */
export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  properties: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: Array<Node | string>
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), properties);
  node.append(...children);
  return node;
}

/** YYYY-MM-DD → DD/MM/YYYY. */
export const frenchDay = (day: string) => day.split('-').reverse().join('/');

/** 12.4 → "12,4". */
export const frenchNumber = (value: number) => value.toLocaleString('fr-FR');
