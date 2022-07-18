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

    if (this.type === 'if') this.BindIfType();
  }

  /**
   * Can return an element or part of element that needs rebinding
   * @param context Context that will be given to the template
   */
  compute(context: any): HTMLElement | void {
    if (this.element.isConnected) {
      try {
        return bindHandlers[this.type](this, context);
      } catch (error: any) {
        let errorAt = this.HTML ? this.HTML : this.element;
        throw new Error(`Couldn't compute HTMLBindHandler\n${errorAt}\n ${error.message} `)
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
  private BindIfType() {
    let marker = new Comment(`if:${this.expression}`);
    this.HTML = this.element.outerHTML;
    this.element.replaceWith(marker);
    this.element = <HTMLElement>(<unknown>marker);
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
  return rebind;
}

function BindForEachHandler() {}

function interpolateText(text: string, context: any) {
  let regexp = /\${(.*?)}/gm;
  let matches = text.matchAll(regexp);
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
