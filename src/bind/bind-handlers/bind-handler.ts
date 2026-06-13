import {
  BindHandlers,
  BindTypes,
  IHTMLBindHandler,
} from '../bind-model';
import {evaluateDOMExpression, interpolateText, snakeToCamel} from '../../utils';
import {ForEachBindHandler, IndexHandler} from './foreach-handler/foreach-handler';
import {ElseHandler, IfBindHandler} from './if-handler/if-handler';
import { BindingChar } from '../../constants';
import { ClassBindHandler } from './class-handler/class-handler';

/**
 * These type of binds don't need the original attribute definition, so we clear them from
 * the DOM as soon as we gather all the data we need from them
 */
const CleanAttribute = ['if', 'foreach', 'class', 'style', 'attr', 'else', 'reanimate', 'event'];

export class HTMLBindHandler {
  type: BindTypes;
  element: HTMLElement;
  result: any;
  previous: any;
  expression: string;
  attribute: string | null;

  /**
   * Original node refers to the original HTML element that makes use of
   * this bind handler, we only use this property in if/foreach bind
   * handlers to use cloneNode for performance reasons
   */
  originalNode?: HTMLElement;
  outerHTML?: string;
  helperHTML?: string;

  /**
   * Defines if this is a custom handler, meaning its compute function
   * is user defined
   */
  isCustom?: string;

  /**
   * Array of reactive property paths that, when changed, re-trigger this
   * handler's compute. This list is now populated by the renderer
   * (Bind.updateHandlerDependencies) from paths observed during compute via
   * getter-based tracking — not derived from the expression text.
   */
  dependencies: string[] = [];

  // Delimits the start and end for if/foreach bind handlers
  markerStart?: Comment;
  markerEnd?: Comment;

  /**
   * The most recently rendered set of :foreach keys (one per item, in order).
   * Used to diff against the next render to decide what actually changed.
   */
  tracking?: any[]

  /**
   * Optional :key="expr" for :foreach. When present, an item's identity is the
   * value of this expression (e.g. device.id) instead of the item itself. This
   * is what lets a re-assigned array with the same ids be recognised as
   * unchanged (skip) or appended-to (partial render) rather than rebuilt.
   */
  keyExpression?: string;

  constructor(templateBind: IHTMLBindHandler) {
    this.type = templateBind.type;
    this.element = templateBind.element;
    this.result = null;
    this.expression = templateBind.expression;
    this.attribute = templateBind.attribute;

    switch (this.type) {
      case 'if':
        this.replaceForMarker(this.type);
        this.checkIfElse();
        break;
      case 'foreach':
        this.checkIndex();
        // Capture :key BEFORE replaceForMarker snapshots outerHTML, so the
        // attribute isn't baked into the per-item template clones.
        this.checkKey();
        this.replaceForMarker(this.type);
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
   * Can return either nothing, or an array of elements that where created
   * as a consequence of the HTMLBindHandler being computed, :if handler can
   * return an array with one element, and :foreach can return n number of
   * elements
   * @param context Context that will be given to the template
   */
  compute(context: any): HTMLElement[] | void {
    if (this.element.isConnected) {
      try {
        return bindHandlers[this.type](this, context);
      } catch (error: any) {
        let errorAt = this.outerHTML ? this.outerHTML : this.element.outerHTML;
        throw new Error(`\nCouldn't compute HTMLBindHandler(${this.type}).\n\nexpression: ${this.expression}\n\n${errorAt.trim()}\n\n${error.message}\n`);
      }
    }
  }

  private checkIfElse() {
    // This if statement uses else statement too
    if (this.element.nextElementSibling && this.element.nextElementSibling.hasAttribute(':else')) {
      let elseElement = this.element.nextElementSibling;
      elseElement.removeAttribute(':else');
      this.helperHTML = elseElement.outerHTML;
      this.element.nextElementSibling.remove();
    }
  }

  private checkKey() {
    if (this.element.hasAttribute(':key')) {
      this.keyExpression = this.element.getAttribute(':key') || '';
      this.element.removeAttribute(':key');
    }
  }

  private checkIndex() {
    if (this.element.hasAttribute(':index')) {
      this.helperHTML = this.element.getAttribute(':index') || 'true';
      this.element.removeAttribute(':index');
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
  private replaceForMarker(type: string) {
    this.markerStart = new Comment(`${type}: start`);
    this.markerEnd = new Comment(`${type}: end`);
    /**
     * Remove attribute to keep a clean DOM and to avoid
     * re-binding the same HTMLBindHandler when these type
     * of handlers get evaluates/re-attached to DOM
     */
    this.element.removeAttribute(`:${type}`);
    this.outerHTML = this.element.outerHTML;
    this.originalNode = this.element.cloneNode(true) as HTMLElement;
    this.element.replaceWith(this.markerStart);
    this.element = this.markerStart as unknown as HTMLElement;
    this.element.after(this.markerEnd);
  }
}

/**
 * These functions are the core functionality of this library, each bind type ends up executing one of these functions which
 * each manipulates a referenced HTMLElement or DOM in a very specific way that should react to the data changes or events
 * These are executed when data changes and there is a DOM bind that depends on that data
 */
const bindHandlers: BindHandlers = {
  event: (handler: any, context: any) => {
    if (handler.attribute in handler.element) {
      handler.element[handler.attribute] = () => {
        evaluateDOMExpression(handler.expression, context);
      };
    }
  },
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
    
    let splitAttribute = handler.attribute && handler.attribute.split(BindingChar) || [];
    let isSpecificStyle = splitAttribute.length > 2;
    
    if (isSpecificStyle) {
      handler.result = evaluateDOMExpression(handler.expression, context);
      let key: any = snakeToCamel(splitAttribute[2]);
      handler.element.style[key] = String(handler.result);
    } else {
      handler.result = evaluateDOMExpression(handler.expression, context) || {};
      let styleProps = Object.keys(handler.result); 
      styleProps.forEach((key: any) => {
        if (handler.element.style && handler.element.style[key] !== undefined) {
          handler.element.style[key] = handler.result[key];
        }
      });
    }
  },
  attr: (handler: HTMLBindHandler, context: any) => {
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
  reanimate: (handler: HTMLBindHandler, context: any) => {
    handler.result = evaluateDOMExpression(handler.expression, context);
    if (handler.result !== handler.previous) {
      handler.element.style.animation = 'none';
      setTimeout(() => handler.element.style.animation = '');
      handler.previous = handler.result;  
    }
  },
  if: IfBindHandler,
  else: ElseHandler,
  foreach: ForEachBindHandler,
  index: IndexHandler,
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
