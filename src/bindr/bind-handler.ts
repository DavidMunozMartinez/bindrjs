import {
  BindEventValues,
  BindHandlers,
  BindTypes,
  IHTMLBindHandler,
} from './bind-model';

export class HTMLBindHandler {
  type: BindTypes;
  element: HTMLElement;
  result: unknown;
  previous: unknown;
  isAffectedBy: any[];
  expression: string;
  HTML?: string;
  computed?: boolean = false;

  constructor(templateBind: IHTMLBindHandler) {
    this.type = templateBind.type;
    this.element = templateBind.element;
    this.result = null;
    this.isAffectedBy = templateBind.isAffectedBy;
    this.expression = templateBind.expression;

    switch (this.type) {
      case 'if':
      case 'foreach':
        this.replaceForMarker(this.type, this.expression);
        break;
    }
  }

  /**
   * Can return an element or part of element that needs rebinding
   * @param context Context that will be given to the template
   */
  compute(context: any): HTMLElement[] | void {
    if (this.element.isConnected) {
      try {
        return bindHandlers[this.type](this, context);
      } catch (error: any) {
        let errorAt = this.HTML ? this.HTML : this.element;
        throw new Error(
          `Couldn't compute HTMLBindHandler\n${errorAt}\n ${error.message} `
        );
      }
    }
  }

  /**
   * Hear me out:
   * All ':if' binds are replaced by a comment marker and the actual HTML is stored in the HTMLBindHandler
   * The ':if' bind type could entirely remove the element from the DOM so we need to always have an anchor point
   * to the DOM to know where this HTMLBindHandler should apply modifications, because the nature of recursing the DOM
   * the contents of the ':if' bind won't be checked (because its replaced by a comment marker), which is expected.
   * Only when the condition is true, and the content rendered, we validate its content for more HTMLBindHandlers
   */
  private replaceForMarker(type: string, expression: string) {
    let markerStart = new Comment(`${type}:${expression} start`);
    let markerEnd = new Comment(`${type}:${expression} end`);
    // Remove the attribute for a cleaner DOM
    this.element.removeAttribute(`:${type}`);
    this.HTML = this.element.outerHTML;
    this.element.replaceWith(markerStart);
    this.element = <HTMLElement>(<unknown>markerStart);
    this.element.after(markerEnd);
  }
}

/**
 * Dynamically created all bindHandler functions for HTML Events
 */
const eventBindHandlers = BindEventValues.reduce(
  (functions: any, event: string) => (
    // Lets think of a way to not use 'any' here
    (functions[event] = (handler: any, context: any) => {
      if (handler.type in handler.element) {
        // handler.element.removeAttribute(`:${handler.type}`);
        handler.element[handler.type] = () => {
          evaluateDOMExpression(handler.expression, context);
        };
      }
    }),
    functions
  ),
  {}
);

/**
 * These functions are the core functionality of this library, each bind type ends up executing one of these functions which
 * each manipulates a referenced HTMLElement or DOM in a very specific way that should react to the data changes or events
 * These are executed when data changes and there is a DOM bind that depends on that data
 */
const bindHandlers: BindHandlers = {
  // Probably shouldn't use this, since seems unsafe
  innerhtml: (handler: HTMLBindHandler, context: unknown) => {
    handler.result = evaluateDOMExpression(handler.expression, context);
    handler.element.innerHTML = String(handler.result);
  },
  innertext: (handler: HTMLBindHandler, context: unknown) => {
    handler.result = evaluateDOMExpression(handler.expression, context);
    handler.element.innerText = String(handler.result);
  },
  interpolation: (handler: HTMLBindHandler, context: unknown) => {
    handler.element.textContent = interpolateText(handler.expression, context);
  },
  class: (handler: HTMLBindHandler, context) => {
    handler.result = evaluateDOMExpression(handler.expression, context);
    const current = String(handler.result);
    const previous = String(handler.previous);
    if (
      previous &&
      current !== previous &&
      handler.element.classList.contains(previous)
    ) {
      handler.element.classList.remove(previous);
    }
    if (current) {
      handler.element.classList.add(current);
      handler.previous = current;
    }
  },
  style: (bind: HTMLBindHandler) => {
    throw new Error('style binding not implemented yet.');
  },
  attr: (bind: HTMLBindHandler) => {
    throw new Error('attr binding not implemented yet.');
  },
  if: BindIfHandler,
  foreach: BindForEachHandler,
  // Append all mouse event handlers, which work all the same for the most part
  ...eventBindHandlers,
};

const InterpolationRegexp = /\${(.*?)}/gm;

function BindIfHandler(handler: HTMLBindHandler, context: unknown): any {
  let rebind: any = false;
  if (!handler.HTML) return rebind;

  handler.result = Boolean(evaluateDOMExpression(handler.expression, context));
  if (handler.result !== handler.previous) {
    if (handler.result) {
      let temp = document.createElement('div');
      temp.innerHTML = handler.HTML;
      handler.element.after(temp.children[0]);
      rebind = handler.element.nextElementSibling;
    } else if (typeof handler.previous === 'boolean') {
      handler.element.nextSibling?.remove();
    }
  }
  handler.previous = handler.result;
  return [rebind];
}

function BindForEachHandler(handler: HTMLBindHandler, context: unknown): any {
  let rebind: any = false;
  if (!handler.HTML) return rebind;

  let temp = document.createElement('div');
  let expressionVars = handler.expression.split('in').map(val => val.trim());
  let localVar = expressionVars[0];
  let arrayVar = expressionVars[1];
  let array: any = evaluateDOMExpression(arrayVar, context) || [];

  if (handler.result && array.length !== (<Array<any>>handler.result).length) {
    // Item could have been pushed, popped of spliced from the array, so
    // only compute the new element or remove the existing DOM ref
  } else {
    // In theory we should not land here if an element in the array was
    // modified, if that's the case, that specific node should have its own
    // HTMLBindHandler which should be independent from the :foreach bind
    // and should compute its own changes.
  }

  // Clean the previous elements before creating new ones
  // TODO: Create a solution to update existing DOM elements instead of re-creating
  // all of them
  if (array.length) {
    while (
      handler.element.nextSibling?.textContent !==
      `${handler.type}:${handler.expression} end`
    ) {
      handler.element.nextElementSibling?.remove();
    }
  }

  rebind = [];
  /**
   * Look for all instances of the localVar name without taking into account
   * nested object properties that could have the same name, IE:
   * localVar = 'data';
   * let regexp = new Regexp(`(?<=\\s|^|"|{|\\()\\b(data)\\b`, 'g');
   * match
   *   V
   * data.data
   *                    match
   *                      V
   * ${obj.data.count + data.count}
   */
  let findString = `(?<=\\s|^|"|{|\\()\\b(${localVar})\\b`;
  let localVarRegexp = new RegExp(findString, 'g');
  // Iterate it backwards so when we insert the resulting node after the marker
  // they end up in the right order
  for (let i = array.length - 1; i > -1; i--) {
    // TODO: This needs to change in the future to only find and replace in places where
    // we would actually need to replace, like within string interpolation and bind
    // attributes, to avoid replacing actual user defined content with the array name
    let nodeString = handler.HTML || '';
    nodeString = nodeString.replace(localVarRegexp, `${arrayVar}[${i}]`);
    temp.innerHTML += `${nodeString}\n`;
    let item = temp.children[0];
    rebind.push(item);
    handler.element.after(item);
  }

  handler.result = array;
  return rebind;
}

function interpolateText(text: string, context: any) {
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

// TODO: Look for a way to not need the 'this' keyword in the DOM maybe?
function evaluateDOMExpression(expression: string, context?: any): unknown {
  // I probably need to sanitize this
  return new Function(`
      return ${expression};
    `).apply(context);
}
