import {HTMLBindHandler} from './bind-handler';
import {
  BindTypes,
  BindCodeTypes,
  BindHTMLTypes,
  BindKeyboardEventTypes,
  BindValues,
  // BindableEventValues,
  BindKeyboardEventValues,
  BindMouseEventTypes,
  BindMouseEventValues,
  BindFocusEventTypes,
  BindFocusEventValues,
  BindCodeTypeValues,
  BindHTMLValues,
  // BindHandlers,
  IRenderer,
  IRendererBindMaps,
  LowerCasedBindValues,
} from './bindr-model';

export default class Bindr {
  id: string;
  template?: string;
  bind: any = {};
  container!: HTMLElement;
  bindAs?: string | null;

  /**
   * Holds all bind data and the templateBinds that it affects so when its data os updated
   * we can quickly update all the binds that depend on it
   */
  private DataBindHandlers: IRendererBindMaps = {};
  private DOMBindHandlers: HTMLBindHandler[] = [];

  private primitiveValues: {[key: string]: unknown} = {};

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

    if (data.bind) {
      this.bind = this.objectProxy(data.bind, 'this');
      this.defineBinds();
    }
  }

  private objectProxy(data: any, path: string) {
    const result = new Proxy(data, this.objectProxyHandler(path));

    Object.keys(data).forEach(key => {
      const value = data[key];
      const fullPath = path + '.' + key;
      this.primitiveValues[fullPath] =
        typeof value === 'object'
          ? this.objectProxy(value, path + '.' + key)
          : data[key];
    });

    return result;
  }

  private objectProxyHandler(path: string) {
    return {
      get: (target: {[x: string]: unknown}, prop: string) => {
        const fullPath = path + '.' + prop;
        return this.primitiveValues[fullPath] || target[prop];
      },
      set: (target: {[x: string]: unknown}, prop: string, value: unknown) => {
        const fullPath = path + '.' + prop;
        // Update stored primitive value
        this.primitiveValues[fullPath] = value;
        // Update target value
        target[prop] = value;
        this.update(target, prop, value);
        return true;
      },
    };
  }

  // TODO: This will change, we want to run an array of functions for each dom bind that this property affects
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
    if (this.DataBindHandlers[key]) {
      const rendererBind = this.DataBindHandlers[key];
      if (rendererBind.affects) {
        // Update all DOM connections to this data
        rendererBind.affects.forEach((handler: HTMLBindHandler) => {
          handler.compute(this.bind);
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

  // TODO: Binds will be defined differently moving forwards
  /**
   * Does a check in the renderer container to look for tempalte bindings and properly create the renderer
   * bind mapings
   */
  updateBinds() {
    this.defineBinds();
  }

  /**
   * This is a somewhat expensive function in an attempt to keep the data/DOM updates as quick as possible,
   * we iterate over all found bindings and create a helper object with enough references to perform quick
   * updates whenever a binded property is updated
   * TODO: Make is so it only checks the new element for bind data connections instead of re-mapping everything
   */
  private defineBinds() {
    // Functions are event driven not data driven, so we filter them out of this process
    const bindsPropertyKeys = Object.keys(this.bind).filter(
      key => typeof this.bind[key] !== 'function'
    );
    this.DOMBindHandlers = this.getTemplateBinds();

    bindsPropertyKeys.forEach(propKey => {
      const affects: HTMLBindHandler[] = [];
      this.DOMBindHandlers.forEach((handler: HTMLBindHandler) => {
        if (
          // Expression in this template bind requires this bind property
          handler.expression.indexOf(propKey) > -1 &&
          // Bindable mouse event should not be reactive to changes
          !this.isMouseEventType(handler.type)
        ) {
          affects.push(handler);
          handler.isAffectedBy.push(propKey);
        }
      });
      this.DataBindHandlers[propKey] = {affects};
    });
  }

  private recurseContainer(
    element: HTMLElement,
    callback: (element: HTMLElement) => void
  ): any {
    const root = element;
    const children = root.children;
    callback(root);
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      this.recurseContainer(<HTMLElement>child, callback);
    }
  }

  private getTemplateBinds(container?: HTMLElement): HTMLBindHandler[] {
    container = (container ? container : this.container) || null;
    const handlers: HTMLBindHandler[] = [];
    this.recurseContainer(container, element => {
      // Interpolated binds
      Array.from(element.childNodes)
        .filter(
          node => node.nodeType === 3 && node.nodeValue && node.nodeValue.trim()
        )
        .forEach(node => {
          if (
            node.nodeValue &&
            node.nodeValue.indexOf('{{') > -1 &&
            node.nodeValue.indexOf('}}') > -1
          ) {
            console.warn('Data interpolation is coming I promise (づ ᴗ _ᴗ)づ♡');
          }
        });

      // Attribute binds
      element
        .getAttributeNames()
        .filter(attrName => attrName.indexOf('bind:') > -1)
        .forEach(attrName => {
          const type: BindTypes =
            BindValues[LowerCasedBindValues.indexOf(attrName.split(':')[1])];
          const handler = new HTMLBindHandler({
            type: type,
            element: element,
            expression: element.getAttribute(attrName) || '',
            isAffectedBy: [],
          });
          // Compute the bind as we find them
          handler.compute(this.bind);
          handlers.push(handler);
        });
    });
    return handlers;
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

  shouldComputeWhenFound(type: BindTypes) {
    return this.isCodeBindType(type) || this.isHTMLBindType(type);
  }
}
