import {
  BindableEventValues,
  BindHandlers,
  BindTypes,
  ITemplateBind,
} from './bindr-model';

export class HTMLBindHandler {
  type: BindTypes;
  element: HTMLElement;
  result: unknown;
  isAffectedBy: any[];
  expression: string;

  constructor(templateBind: ITemplateBind) {
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
  innerHTML: (handler: HTMLBindHandler, context: any) => {
    handler.result = evaluateDOMExpression(handler.expression, context);
    handler.element.innerHTML = String(handler.result);
  },
  innerText: (handler: HTMLBindHandler, context: any) => {
    handler.result = evaluateDOMExpression(handler.expression, context);
    handler.element.innerText = String(handler.result);
  },
  interpolation: (handler: HTMLBindHandler, context: any) => {
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
  class: (bind: ITemplateBind) => {
    // bind.result = this.evaluateDOMExpression(bind.expression);
    // const current = String(bind.result);
    // const previous = String(bind.previous);
    // if (
    //   previous &&
    //   current !== previous &&
    //   bind.element.classList.contains(previous)
    // ) {
    //   bind.element.classList.remove(previous);
    // }
    // if (current) {
    //   bind.element.classList.add(current);
    //   bind.previous = current;
    // }
  },
  style: (bind: ITemplateBind) => {
    throw new Error('style binding not implemented yet.');
  },
  attr: (bind: ITemplateBind) => {
    throw new Error('attr binding not implemented yet.');
  },
  if: (bind: ITemplateBind) => {
    throw new Error('if binding not implemented yet.');
  },
  forEach: (bind: ITemplateBind) => {
    throw new Error('forEach binding not implemented yet.');
  },
  // Append all mouse event handlers, which work all the same for the most part
  ...eventBindHandlers,
};

function evaluateDOMExpression(expression: string, context?: any): unknown {
  // const alias = this.bindAs ? `let ${this.bindAs}=this;` : '';
  // const bindDefs = Object.keys(context)
  //   .map(key => {
  //     return `window.${key} = this.${key};`;
  //   })
  //   .reduce((prev, current) => {
  //     return (prev += current);
  //   });

  // console.log(bindDefs);

  // I probably need to sanitize this
  return Function(`
  return ${expression};
  `).apply(context);
}
