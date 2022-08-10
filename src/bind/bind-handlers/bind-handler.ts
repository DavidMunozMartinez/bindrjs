import {
  BindEventValues,
  BindHandlers,
  BindTypes,
  IHTMLBindHandler,
} from '../bind-model';
import {evaluateDOMExpression, interpolateText} from '../../utils';
import {ForEachBindHandler} from './foreach-handler';
import {IfBindHandler} from './if-handler';
import { BindingChar } from '../../constants';
import { ClassBindHandler } from './class-handler';

/**
 * These type of binds don't need the original attribute definition, so we clear them from
 * the DOM as soon as we gather all the data we need from them
 */
const CleanAttribute = ['if', 'foreach', 'class', 'style', 'attr'];

export class HTMLBindHandler {
  type: BindTypes;
  element: HTMLElement;
  result: any;
  previous: any;
  expression: string;
  outerHTML?: string;
  attribute: string | null;
  isCustom: string | null = null;

  constructor(templateBind: IHTMLBindHandler) {
    this.type = templateBind.type;
    this.element = templateBind.element;
    this.result = null;
    this.expression = templateBind.expression;
    this.attribute = templateBind.attribute;

    switch (this.type) {
      case 'if':
      case 'foreach':
        this.replaceForMarker(this.type, this.expression);
        break;
    }

    if (
      !this.RequiresAttr(this.type) &&
      this.element.getAttribute &&
      this.attribute &&
      this.element.getAttribute(this.attribute)
    ) {
      this.element.removeAttribute(this.attribute);
    }
  }

  /**
   * Can return an array of elements or nothing, if it contains elements
   * then we need to re-bind them
   * @param context Context that will be given to the template
   */
  compute(context: any): HTMLElement[] | void {
    if (this.element.isConnected) {
      try {
        return bindHandlers[this.type](this, context);
      } catch (error: any) {
        let errorAt = this.outerHTML ? this.outerHTML : this.element;
        throw new Error(
          `Couldn't compute HTMLBindHandler\n${errorAt}\n ${error.message} `
        );
      }
    }
  }

  /**
   * There are bind types that don't require they attribute in the DOM
   * after it's been computed, we remove those to keep the DOM clean
   * and avoid duplicating HTMLBindHandlers in some cases that new
   * elements are created
   */
  private RequiresAttr(type: BindTypes): boolean {
    return CleanAttribute.indexOf(type) === -1;
  }

  /**
   * Hear me out:
   * All ':if | :foreach' binds are replaced by a comment marker and the actual HTML is stored in the HTMLBindHandler
   * these bind types could entirely remove elements from the DOM so we need to always have an anchor point to know
   * where this HTMLBindHandler should append or remove elements, because the nature of recursing the DOM the
   * contents of these binds won't be checked (because its replaced by a comment marker), which is expected. Only
   * when they are computed, and the content is actually rendered, we validate its content for more HTMLBindHandlers
   */
  private replaceForMarker(type: string, expression: string) {
    let markerStart = new Comment(`${type}:${expression} start`);
    let markerEnd = new Comment(`${type}:${expression} end`);
    /**
     * Remove attribute to keep a clean DOM and to avoid
     * re-binding the same HTMLBindHandler when these type
     * of handlers get evaluates/re-attached to DOM
     */
    this.element.removeAttribute(`:${type}`);
    this.outerHTML = this.element.outerHTML;
    this.element.replaceWith(markerStart);
    this.element = markerStart as unknown as HTMLElement;
    this.element.after(markerEnd);
  }
}

/**
 * Dynamically create all bindHandler functions for HTML Events, since they all behave the same
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
  class: ClassBindHandler,
  style: (handler: HTMLBindHandler, context: any) => {
    handler.result = evaluateDOMExpression(handler.expression, context) || {};
    handler.element;
    let styleProps = Object.keys(handler.result); 
    styleProps.forEach((key: any) => {
      if (handler.element.style && handler.element.style[key] !== undefined) {
        handler.element.style[key] = handler.result[key];
      }
    });
  },
  attr: (handler: HTMLBindHandler, context: any) => {
    // let value = handler.element.getAttribute(handler.attribute || '');
    let actualAttr = handler.attribute?.split(BindingChar)[1] || '';
    if (actualAttr) {
      handler.result = evaluateDOMExpression(handler.expression, context);
      handler.element.setAttribute(actualAttr, String(handler.result || ''));
    }
    // Custom handlers are user defined
    if (handler.isCustom) {
      return customHandlers[handler.isCustom](handler, context);
    }
  },
  if: IfBindHandler,
  foreach: ForEachBindHandler,
  // Append all mouse event handlers, which work all the same for the most part
  ...eventBindHandlers,
};

export const customHandlers: {[key: string]: (handler: HTMLBindHandler, context: any) => void} = {};
export function CustomBindHandler(name: string, compute: (handler: HTMLBindHandler, context: any) => void) {
  if (bindHandlers[name as BindTypes]) {
    throw new Error(`Can't add custom bind handler name: "${name}" since it already exists :(\n
    If you feel like the bind handler doesn't do what you need, feel free to add a pull/feature request at: \n
    https://github.com/DavidMunozMartinez/bindrjs/issues\n`)
  } else {
    customHandlers[name] = compute;
  }
}
