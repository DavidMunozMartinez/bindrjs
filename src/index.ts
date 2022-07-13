/**
 * Don't mind me just re-inventing the wheel
 * This is my attempt at creating a simple enough HTML render engine similar to what ALL popular front-end frameworks/libraries already do perfectly, AKA data binding
 * except "cheaper" and without the extra fancy features, this is targeted to smaller "simpler" projects that only want to bind data to the HTML with as
 * minimum configuration or setup as possible, keeping it all super performant, the end goal here is to have minimum extra knowledge outside HTML and JavaScript and be able
 * to empower your templates. if you know vanilla javascript and basic HTML you should already know how this library works.
 * HOPEFULLY once the actual project where this file is being used is done, I can move forward on this idea. for now its current state is enough for the project needs
 *
 * # Bind examples
 *
 * ```html
 * <div id="main-content">
 *  <div bind:innerText="this.test"><div>
 * <div>
 * ```
 *
 * ```js
 * let renderer = new Renderer({
 *  id: 'main-content',
 *  bind: {
 *    test: 'Hello world!'
 *  }
 * });
 * ```
 *
 * ## HTML outputs:
 * <div id="main-content">
 *  <div bind:innerText="this.test">Hello world!<div>
 * <div>
 */

/**
 * All the support bind types and values should become its own file eventually
 */

/**
 * Bindable mouse events (This should only contains valid HTML event keywords for ease of use)
 */
const BindMouseEventValues = [
  'onclick',
  'ondblclick',
  'ondrag',
  'ondragend',
  'ondragenter',
  'ondragleave',
  'ondragover',
  'ondragstart',
  'ondrop',
  'onmousedown',
  'onmousemove',
  'onmouseout',
  'onmouseover',
  'onmouseup',
  'onscroll',
] as const;
type BindMouseEventTypes = typeof BindMouseEventValues[number];

const BindKeyboardEventValues = ['onkeydown'] as const;
type BindKeyboardEventTypes = typeof BindKeyboardEventValues[number];

const BindFocusEventValues = ['onblur', 'onfocus'] as const;
type BindFocusEventTypes = typeof BindFocusEventValues[number];

const BindableEventValues = [
  ...BindMouseEventValues,
  ...BindKeyboardEventValues,
  ...BindFocusEventValues,
];

/**
 * These are 'custom' bind types that imitate structural directive/components in other frameworks
 */
const BindCodeTypeValues = ['if', 'forEach'] as const;
type BindCodeTypes = typeof BindCodeTypeValues[number];

const BindHTMLValues = [
  'innerHTML',
  'innerText',
  'class',
  'style',
  'attr',
] as const;
type BindHTMLTypes = typeof BindHTMLValues[number];

// To add more binding types/logic first add them to this array then, for behavior add its function to the BindHandlers Object
const BindValues = [
  // HTMLElement binds
  ...BindHTMLValues,
  // Code like binds
  ...BindCodeTypeValues,
  // Mouse event binds
  ...BindMouseEventValues,
  // Keyboard event binds
  ...BindKeyboardEventValues,
  // Focus event binds
  ...BindFocusEventValues,
] as const;
type BindTypes = typeof BindValues[number];

export default class Renderer {
  id: string;
  template?: string;
  bind: any = {};
  container!: HTMLElement;
  bindAs?: string | null;

  /**
   * Holds all bind data and the templateBinds that it affects so when its data os updated
   * we can quickly update all the binds that depend on it
   */
  private rendererBinds: IRendererBindMaps = {};
  private templateBinds: ITemplateBind[] = [];

  /**
   * Dynamically created all bindHandler functions for Mouse/Keyboard Events
   */

  private eventBindHandlers = BindableEventValues.reduce(
    (functions: any, event: string) => (
      (functions[event] = (bind: ITemplateBind) => {
        if (
          this.isMouseEventType(bind.type) ||
          this.isKeyboardEventType(bind.type) ||
          this.isFocusEventType(bind.type)
        ) {
          bind.element[bind.type] = () =>
            this.evaluateDOMExpression(bind.expression);
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
  private bindHandlers: BindHandlers = {
    // Probably shouldn't use this, since seems unsafe
    innerHTML: (bind: ITemplateBind) => {
      bind.result = this.evaluateDOMExpression(bind.expression);
      bind.element.innerHTML = String(bind.result);
    },
    innerText: (bind: ITemplateBind) => {
      bind.result = this.evaluateDOMExpression(bind.expression);
      bind.element.innerText = String(bind.result);
    },
    class: (bind: ITemplateBind) => {
      bind.result = this.evaluateDOMExpression(bind.expression);
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
    ...this.eventBindHandlers,
  };

  constructor(data: IRenderer) {
    this.id = data.id;
    this.template = data.template?.toString();
    this.bindAs = data.bindAs || null;
    const container = document.getElementById(this.id);
    if (container) {
      this.container = container;
    } else {
      new Error('Could not initialize renderer, container not found');
    }
    // if (this.container && this.template) {
    //   this.container.innerHTML = this.template;
    // }
    if (data.bind) {
      try {
        if (this.validateBindProps(data.bind)) {
          this.bind = new Proxy(data.bind, {set: this.update.bind(this)});
          this.defineBinds();
        } else {
          const err = new Error(
            'Cannot bind Objects, Arrays or Functions to the Renderer... Yet'
          );
          throw err;
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  /**
   * Executed each time one of the bind properties is updated by the use or JS Proxy API
   * this is a intermediate process between the setters and getters of the bind properties sent
   * trough the Renderer class
   * @param target
   * @param key
   * @param value
   */
  update(target: any, key: string | symbol, value: any): boolean {
    key = String(key);
    target[key] = value;
    if (!this.container) return true;
    if (this.rendererBinds[key]) {
      const rendererBind = this.rendererBinds[key];
      if (rendererBind.affects) {
        // Update all DOM connections to this data
        rendererBind.affects.forEach((templateBind: ITemplateBind) => {
          // Re-evaluate DOM expression
          templateBind.result = this.evaluateDOMExpression(
            templateBind.expression
          );
          // Execute bind handler
          this.bindHandlers[templateBind.type](templateBind);
        });
      }
    } else {
      // If we don't have this key, it means it was added before the renderer initialization
      // so we need to re-define our binds
      // TODO: Find a way to just re-define binds that concern this property
      this.defineBinds();
    }
    return true;
  }

  //   /**
  //    * Does a check in the renderer container to look for tempalte bindings and properly create the renderer
  //    * bind mapings
  //    */
  //   updateBinds() {
  //     this.defineBinds();
  //   }

  //   /**
  //    * This is a somewhat expensive function in an attempt to keep the data/DOM updates as quick as possible,
  //    * we iterate over all found bindings and create a helper object with enough references to perform quick
  //    * updates whenever a binded property is updated
  //    * TODO: Make is so it only checks the new element for bind data connections instead of re-mapping everything
  //    */
  private defineBinds() {
    // Functions are event driven not data driven, so we filter them out of this process
    const bindsPropertyKeys = Object.keys(this.bind).filter(
      key => typeof this.bind[key] !== 'function'
    );
    this.templateBinds = this.getTemplateBinds();

    // let root = this.recurseContainer(this.container, {});

    bindsPropertyKeys.forEach(propKey => {
      const affects: ITemplateBind[] = [];
      this.templateBinds.forEach((templateBind: ITemplateBind) => {
        if (
          // Expression in this template bind requires this bind property
          templateBind.expression.indexOf(propKey) > -1 &&
          // Bindable mouse event should not be reactive to changes
          !this.isMouseEventType(templateBind.type)
        ) {
          affects.push(templateBind);
          templateBind.isAffectedBy.push(propKey);
        }
      });
      this.rendererBinds[propKey] = {affects};
    });
  }

  // private recurseContainer(element?: HTMLElement, tree?: any): any {
  //   const children = element ? element.children : this.container.children;
  //   const root: any = [];
  //   for (let i = 0; i < children.length; i++) {
  //     const child = children[i];
  //     const data = {
  //       node: child,
  //       children: [],
  //     };

  //     if (child.children.length) {
  //       data.children = this.recurseContainer(<HTMLElement>child);
  //     }

  //     root.push(data);
  //   }

  //   return root;
  // }

  /**
   * This is to validate that the binds object contains valid values
   * @param bins Object containing all the data that will be binded
   * @returns
   */
  private validateBindProps(binds: any): boolean {
    // TODO: All data types are supported now, eventually remove this
    return true;
  }

  private evaluateDOMExpression(expression: string): unknown {
    const alias = this.bindAs ? `let ${this.bindAs}=this;` : '';
    // I probably need to sanitize this
    return Function(`${alias} return ${expression};`).apply(this.bind);
  }

  private getTemplateBinds(container?: HTMLElement): ITemplateBind[] {
    container = (container ? container : this.container) || null;
    return BindValues.map(type => {
      const result: ITemplateBind[] = [];
      const list = container?.querySelectorAll(`[bind\\:${type}]`);
      if (list && list.length) {
        list.forEach(current => {
          const element = <HTMLElement>current;
          const data = this.getTemplateBindingData(element, type);
          result.push(data);
        });
      }
      return result;
    }).reduce((prev: any, current: any) => {
      return (prev = prev.concat(current));
    });
  }

  private getTemplateBindingData(
    element: HTMLElement,
    type: BindTypes
  ): ITemplateBind {
    const expression = element.getAttribute(`bind:${type}`) || '';
    const data = {
      type: <BindTypes>type,
      element: element,
      expression: expression,
      result: null,
      isAffectedBy: [],
    };

    this.bindHandlers[type](data);

    return data;
  }

  isMouseEventType(keyInput: BindTypes): keyInput is BindMouseEventTypes {
    const test = JSON.parse(JSON.stringify(BindMouseEventValues));
    return test.includes(keyInput);
  }

  isKeyboardEventType(keyInput: BindTypes): keyInput is BindKeyboardEventTypes {
    const test = JSON.parse(JSON.stringify(BindKeyboardEventValues));
    return test.includes(keyInput);
  }

  isFocusEventType(keyInput: BindTypes): keyInput is BindFocusEventTypes {
    const test = JSON.parse(JSON.stringify(BindFocusEventValues));
    return test.includes(keyInput);
  }

  isCodeBindType(keyInput: BindTypes): keyInput is BindCodeTypes {
    const test = JSON.parse(JSON.stringify(BindCodeTypeValues));
    return test.includes(keyInput);
  }

  isHTMLBindType(keyInput: BindTypes): keyInput is BindHTMLTypes {
    const test = JSON.parse(JSON.stringify(BindHTMLValues));
    return test.includes(keyInput);
  }
}

type BindHandlers = {
  [key in BindTypes]: (bind: ITemplateBind) => void;
};

interface IRenderer {
  /**
   * Id of the element that will benefit from the context of this renderer
   */
  id: string;
  /**
   * If exist, it will replace the innerHTML content of the container, can be a path or a NodeRequire statement
   * if the string contains valid HTML it will be attached as is, if the string ends with .html, it will attempt
   * to do a fetch to the file
   */
  template?: string;
  /**
   * This object will be attached to the container (found by the id property) and it will make the
   * data accessible to the entire container and its children trough the 'this' keyword
   */
  bind?: any;
  /**
   * Alias that will be used within the template context, so you can use that alias instead of the 'this' keyword
   */
  bindAs?: string | null;
}

interface ITemplateBind {
  element: HTMLElement;
  type: BindTypes;
  previous?: unknown;
  result: unknown;
  expression: string;
  /**
   * Array of property keys that are in the binds property
   */
  isAffectedBy: string[];
  childBinds?: ITemplateBind[];
}

interface IRendererBindMaps {
  [key: string]: IRendererBind;
}

interface IRendererBind {
  affects: ITemplateBind[];
}
