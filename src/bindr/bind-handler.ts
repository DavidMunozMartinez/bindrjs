import {
  BindableEventValues,
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
  // context: unknown;

  constructor(templateBind: IHTMLBindHandler) {
    this.type = templateBind.type;
    this.element = templateBind.element;
    this.result = null;
    this.isAffectedBy = templateBind.isAffectedBy;
    this.expression = templateBind.expression;
  }

  compute(context: any) {
    bindHandlers[this.type](this, context);
  }
}

/**
 * Dynamically created all bindHandler functions for Mouse/Keyboard Events
 */
const eventBindHandlers = BindableEventValues.reduce(
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
  innerHTML: (handler: HTMLBindHandler, context: unknown) => {
    handler.result = evaluateDOMExpression(handler.expression, context);
    handler.element.innerHTML = String(handler.result);
  },
  innerText: (handler: HTMLBindHandler, context: unknown) => {
    handler.result = evaluateDOMExpression(handler.expression, context);
    handler.element.innerText = String(handler.result);
  },
  interpolation: (handler: HTMLBindHandler, context: unknown) => {
    let node = handler.element;
    let regexp = /\${(.*?)}/gm;

    let matches = handler.expression.matchAll(regexp);
    let current = matches.next();
    let interpolated = handler.expression;
    while (!current.done) {
      let primitiveValue = String(
        evaluateDOMExpression(current.value[1], context)
      );
      interpolated = interpolated.replace(current.value[0], primitiveValue);
      // node.textContent = interpolated;
      current = matches.next();
    }
    node.textContent = interpolated;
  },
  class: (bind: HTMLBindHandler, context) => {
    bind.result = evaluateDOMExpression(bind.expression, context);
    const current = String(bind.result);
    const previous = String(bind.previous);
    if (
      previous &&
      current !== previous &&
      bind.element.classList.contains(previous)
    ) {
      bind.element.classList.remove(previous);
    }
    if (current) {
      bind.element.classList.add(current);
      bind.previous = current;
    }
  },
  style: (bind: HTMLBindHandler) => {
    throw new Error('style binding not implemented yet.');
  },
  attr: (bind: HTMLBindHandler) => {
    throw new Error('attr binding not implemented yet.');
  },
  if: (bind: HTMLBindHandler, context: unknown) => {
    bind.result = Boolean(evaluateDOMExpression(bind.expression, context));
    if (bind.result !== bind.previous) {
      bind.element = (bind.result ? uncommentHTML(bind.element) : commentHTML(bind.element)) 
    }
    bind.previous = bind.result;
  },
  forEach: (bind: HTMLBindHandler) => {
  },
  // Append all mouse event handlers, which work all the same for the most part
  ...eventBindHandlers,
};

function commentHTML(element: HTMLElement): HTMLElement {
  // This is already a comment
  if (element.nodeType === 8) {
    return element;
  }

  let commented = document.createComment(element.outerHTML);
  element.replaceWith(commented);
  return <HTMLElement><unknown>commented;
}

function uncommentHTML(element: HTMLElement): HTMLElement {
  // This is not a comment
  if (element.nodeType !== 8) {
    return element;
  }
  let temp = document.createElement('div');
  temp.innerHTML = element.textContent || '';
  let uncommented = temp.childNodes[0];
  element.replaceWith(uncommented);
  return <HTMLElement>uncommented;
}

function evaluateDOMExpression(expression: string, context?: any): unknown {
  // I probably need to sanitize this
  return Function(`
  return ${expression};
  `).apply(context);
}
