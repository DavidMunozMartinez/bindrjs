/**
 * Dynamically created all bindHandler functions for Mouse/Keyboard Events
 */

import {BindableEventValues, BindTypes, ITemplateBind} from './bindr-model';

export class HTMLBindHandler {
  // templateBind;

  type: BindTypes;
  element: HTMLElement;
  result: unknown;
  isAffectedBy: any[];
  expression: string;

  constructor(templateBind: ITemplateBind) {
    this.type = templateBind.type;
    this.element = templateBind.element;
    this.result = null; /** = Eval here maybe */
    this.isAffectedBy = templateBind.isAffectedBy;
    this.expression = templateBind.expression;
  }

  compute(context: any) {
    bindHandlers[this.type](this, context);
  }
}

// export class InperpolationBindHandler {

//   element: HTMLElement;
//   result: string;
//   isAffectedBy: any[];
//   expression: string;

//   constructor(data: any) {

//   }
// }

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
const bindHandlers: any = {
  // Probably shouldn't use this, since seems unsafe
  innerHTML: (handler: HTMLBindHandler, context: any) => {
    handler.result = evaluateDOMExpression(handler.expression, context);
    handler.element.innerHTML = String(handler.result);
  },
  innerText: (handler: HTMLBindHandler, context: any) => {
    handler.result = evaluateDOMExpression(handler.expression, context);
    handler.element.innerText = String(handler.result);
  },
  // class: (bind: ITemplateBind) => {
  //   // bind.result = this.evaluateDOMExpression(bind.expression);
  //   // const current = String(bind.result);
  //   // const previous = String(bind.previous);
  //   // if (
  //   //   previous &&
  //   //   current !== previous &&
  //   //   bind.element.classList.contains(previous)
  //   // ) {
  //   //   bind.element.classList.remove(previous);
  //   // }
  //   // if (current) {
  //   //   bind.element.classList.add(current);
  //   //   bind.previous = current;
  //   // }
  // },
  // style: (bind: ITemplateBind) => {
  //   throw new Error('style binding not implemented yet.');
  // },
  // attr: (bind: ITemplateBind) => {
  //   throw new Error('attr binding not implemented yet.');
  // },
  // if: (bind: ITemplateBind) => {
  //   throw new Error('if binding not implemented yet.');
  // },
  // forEach: (bind: ITemplateBind) => {
  //   throw new Error('forEach binding not implemented yet.');
  // },
  // Append all mouse event handlers, which work all the same for the most part
  ...eventBindHandlers,
};

function evaluateDOMExpression(expression: string, context?: any): unknown {
  // const alias = this.bindAs ? `let ${this.bindAs}=this;` : '';
  // I probably need to sanitize this
  return Function(`return ${expression};`).apply(context);
}
