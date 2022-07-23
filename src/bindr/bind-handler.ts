import {
  BindEventValues,
  BindHandlers,
  BindTypes,
  IHTMLBindHandler,
} from './bind-model';

/**
 * These type of binds don't need the original attribute definition, so we clear them from
 * the DOM as soon as we gather all the data we need from them
 */
const CleanAttribute = ['if', 'foreach', 'class', 'style'];

export class HTMLBindHandler {
  type: BindTypes;
  element: HTMLElement;
  result: unknown;
  previous: unknown;
  expression: string;
  HTML?: string;
  attribute: string | null;

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
        let errorAt = this.HTML ? this.HTML : this.element;
        throw new Error(
          `Couldn't compute HTMLBindHandler\n${errorAt}\n ${error.message} `
        );
      }
    }
  }

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
    this.HTML = this.element.outerHTML;
    this.element.replaceWith(markerStart);
    this.element = (markerStart as unknown as HTMLElement);
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
  class: (handler: HTMLBindHandler, context) => {
    let splitAttribute =
      (handler.attribute && handler.attribute.split(':')) || [];
    let isBooleanClass = splitAttribute.length > 2;
    // let apply: boolean = true;
    if (isBooleanClass) {
      // The class that we want to apply is in the second part of the attribute
      handler.result = splitAttribute[2];
      let className = String(handler.result);
      let truthy = Boolean(evaluateDOMExpression(handler.expression, context));
      let classList = handler.element.classList;
      // In this case the expression is a condition that should be evaluated for truth-ness
      // rather than as a class string
      if (truthy && !classList.contains(className)) {
        classList.add(className);
      } else if (classList.contains(className)) {
        classList.remove(className);
      }
    } else {
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

  if (handler.result && array.length !== (handler.result as Array<any>).length) {
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
   * match
   *   V
   * data.data
   *                    match
   *                      V
   * ${obj.data.count + data.count}
   * this RegExp is applied to interpolated strings and to bind type attributes
   */
  let findString = `(?<=\\s|^|"|{|\\()\\b(${localVar})\\b`;
  let localVarRegexp = new RegExp(findString, 'g');
  // Iterate it backwards so when we insert the resulting node after the marker
  // they end up in the right order
  for (let i = array.length - 1; i > -1; i--) {
    let nodeString = handler.HTML || '';
    let arrayAtIndex = `${arrayVar}[${i}]`;

    /**Find and replace all instances of the local variable name of the :foreach and
     * replace it with the array pointing to the index position
     */
    temp.innerHTML = `${nodeString.replace(InterpolationRegexp, a => {
      return a.replace(localVarRegexp, arrayAtIndex);
    })}\n`;

    let item = temp.children[0];
    rebind.push(item);
    handler.element.after(item);

    // Find and interpolate all attributes that need it
    recurseContainer(item as HTMLElement, el => {
      if (el.nodeType > 1) return;
      el.getAttributeNames()
        // Only iterate bind type attributes
        .filter(attr => attr.indexOf(':') === 0)
        .forEach(attr => {
          // Replace instances of local var name with array pointing to the index position
          el.setAttribute(
            attr,
            el.getAttribute(attr)?.replace(localVarRegexp, arrayAtIndex) || ''
          );
        });
    });
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

function recurseContainer(
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
    recurseContainer(child as HTMLElement, callback);
  }
}
