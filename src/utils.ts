import { InterpolationRegexp } from "./constants";

// TODO: Look for a way to not need the 'this' keyword in the DOM maybe?
export function evaluateDOMExpression(expression: string, context?: any): unknown {
  // I probably need to sanitize this
  return new Function(`
      return ${expression};
    `).apply(context);
}

export function recurseElementNodes(
  element: HTMLElement,
  callback: (element: HTMLElement) => void,
  ignoreSelf?: boolean
): any {
  const root = element;
  const children = root.childNodes;
  if (!ignoreSelf) {
    callback(root);
  }
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    recurseElementNodes(child as HTMLElement, callback);
  }
}

export function interpolateText(text: string, context: any) {
  let matches = text.matchAll(InterpolationRegexp);
  let current = matches.next();
  let interpolated = text;
  while (!current.done) {
    let primitiveValue = String(
      evaluateDOMExpression(current.value[1], context)
    );
    interpolated = interpolated.replace(current.value[0], primitiveValue);
    current = matches.next();
  }
  return interpolated;
}