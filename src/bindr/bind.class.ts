import {HTMLBindHandler} from './bind-handler';
import {
  BindTypes,
  BindCodeTypes,
  BindHTMLTypes,
  BindKeyboardEventTypes,
  BindValues,
  BindKeyboardEventValues,
  BindMouseEventTypes,
  BindMouseEventValues,
  BindCodeTypeValues,
  BindHTMLValues,
  IBind,
  IRendererBindMaps,
} from './bind-model';

export default class Bind {
  bind: object = {};
  bindAs?: string | null;
  ready: () => void;
  private id: string;
  private container!: HTMLElement;

  /**
   * Holds all bind data and the HTMLBindHandlers that it affects so when its data is updated
   * we can quickly update all the DOM binds that depend on it
   */
  private DataBindHandlers: IRendererBindMaps = {};
  /**
   * Holds all the DOM Handlers found in the container, these are referenced in the
   * DataBindHandlers when any value in the bind object is updated
   */
  private DOMBindHandlers: HTMLBindHandler[] = [];
  // private DOMBindHandlersMap: {[key: string]: HTMLBindHandler} = {};

  /**
   * This is a flattened map of all our values in the bind object, all keys are strings that represent
   * the path to the value and all values in this object are primitive values strings, numbers, booleans
   * or arrays, arrays are still tricky, will revisit soon
   */
  private values: {[key: string]: unknown} = {};
  /**
   * This is a flattened map of all proxies created to handle data reactivity, there should always be
   * ONE proxy per object found in the bind passed from the user (including the bind itself).
   */
  private proxies: any = {};

  constructor(data: IBind) {
    this.id = data.id;
    this.bindAs = data.bindAs || null;
    this.ready = data.ready || Function();
    const container = document.getElementById(this.id);
    let template;
    if (data.template) {
      template = this.validateTemplate(data.template);
    }

    if (container) {
      this.container = container;
    } else {
      throw new Error('Could not initialize renderer, container not found');
    }

    if (template) {
      template.then((templateString: string) => {
        this.container.innerHTML = templateString;
        this.bind = this.objectProxy(data.bind || {}, 'this');
        this.defineBinds();
        this.ready();
      });
    } else {
      this.bind = this.objectProxy(data.bind || {}, 'this');
      this.defineBinds();
      this.ready();
    }
  }

  private objectProxy(data: any, path: string) {
    this.proxies[path] = new Proxy(data, this.objectProxyHandler(path));
    Object.keys(data).forEach(key => {
      const value = data[key];
      const keyString = this.isArray(data) ? `[${key}]` : `.${key}`;
      const fullPath = `${path}${keyString}`;
      if (typeof value === 'object') {
        this.objectProxy(value, fullPath);
        // Arrays are still objects that need a proxy for their individual elements
        // but we also store it as value because certain Bind Types depend directly
        // on the array and not its values
        if (this.isArray(value)) this.values[fullPath] = value;
      } else {
        this.values[fullPath] = value;
      }
    });

    return this.proxies[path];
  }

  private isArray(value: any) {
    return typeof value === 'object' && value.length !== undefined;
  }

  private objectProxyHandler(path: string) {
    return {
      /**
       * When data is nested this should only return the proper Proxy object, instead its always
       * returning the root proxy then the nested proxy then the value, this is inefficient if we have
       * the opportunity to only return one Proxy object
       */
      get: (target: {[x: string]: unknown}, prop: string) => {
        const keyString = this.isArray(target) ? `[${prop}]` : `.${prop}`;
        const fullPath = path + keyString;
        // If path is a proxy, return the proxy so the getter of that proxy returns
        // the value
        return this.proxies[fullPath] || target[prop];
      },
      set: (target: {[x: string]: unknown}, prop: string, value: unknown) => {
        const keyString = this.isArray(target) ? `[${prop}]` : `.${prop}`;
        const fullPath = path + keyString;
        // Update stored primitive value
        this.values[fullPath] = value;
        let exists = Boolean(target[prop]);
        // Update target value
        target[prop] = value;
        // Execute update on DOM binds
        /**
         * The path is different if the property exists because this could be an array
         * which its getting a new value pushed, in which case we need to update the DOM
         * handlers to that array and not to the specific property (which doesn't exists
         * because its a new element in the array with a new index), array, even though
         * they are also objects, we store them as values for scenarios like this, so they
         * can also have their own array of affects
         */
        this.update(exists ? fullPath : path);

        return true;
      },
    };
  }

  /**
   * Finds the BindHandlers that are affected by the updated property and
   * re-computes any necessary DOM changes
   * @param path Path to the property being updated
   */
  private update(path: string) {
    if (this.DataBindHandlers[path]) {
      const rendererBind = this.DataBindHandlers[path];
      if (rendererBind.affects) {
        // Update all DOM connections to this data
        let rebinds: any = [];
        rendererBind.affects.forEach((handler: HTMLBindHandler) => {
          let res = handler.compute(this.bind);
          if (res && res.length) {
            rebinds = rebinds.concat(res);
          }
        });

        // If the affected handlers returned elements that need re-binding, we do
        // that here
        rebinds.forEach((el: any) => {
          this.defineBinds(el);
        });

        // If we got new binds we also need to cleanup old disconnected HTMLBindHandlers
        if (rebinds.length) {
          this.cleanHandlers(path);
        }
      }
    }
  }

  /**
   * This is a somewhat expensive function in an attempt to keep the data/DOM updates as quick as possible,
   * we iterate over all nodes in the container and create a BindHandler which holds a reference of the element
   * and the necessary data to compute DOM changes when a property that concerns the handler is updated
   * TODO: Make is so it only checks the new element for bind data connections instead of re-mapping everything
   * when we add more elements
   */
  private defineBinds(element?: HTMLElement) {
    // Functions are event driven not data driven, so we filter them out of this process
    const bindsPropertyKeys = Object.keys(this.values).filter(
      key => typeof this.values[key] !== 'function'
    );

    this.DOMBindHandlers = this.getTemplateBinds(element);

    bindsPropertyKeys.forEach(propKey => {
      const affects: HTMLBindHandler[] =
        (this.DataBindHandlers[propKey] &&
          this.DataBindHandlers[propKey].affects) ||
        [];

      this.DOMBindHandlers.forEach((handler: HTMLBindHandler) => {
        if (
          // Expression in this template bind requires this bind property
          handler.expression.indexOf(propKey) > -1 &&
          // Bindable mouse event should not be reactive to changes
          (this.isHTMLBindType(handler.type) ||
            this.isCodeBindType(handler.type))
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
      this.recurseContainer(<HTMLElement>child, callback);
    }
  }

  private getTemplateBinds(container?: HTMLElement): HTMLBindHandler[] {
    let ignoreRoot = !!container;
    container = (container ? container : this.container) || null;
    const htmlHandlers: HTMLBindHandler[] = [];
    this.recurseContainer(container, node => {
      switch (node.nodeType) {
        // Element
        case 1:
          this.getAttrBindsFromElement(node, handler => {
            htmlHandlers.push(handler);
          });
          break;
        // Text
        case 3:
          this.getInterpolationBindsFromElement(node, handler => {
            htmlHandlers.push(handler);
          });
          break;
      }
    }, ignoreRoot);

    let rebinds: HTMLElement[] = [];
    // Compute handlers at the end to avoid DOM modifier binds to
    // modify the DOM as we iterate it
    htmlHandlers.forEach((handler) => {
      let res = handler.compute(this.bind);
      if (res && res.length) {
        rebinds = rebinds.concat(res);
      }
    });

    // Some HTMLBindHandlers return new elements that could need computing of their
    // own, so we also check for those
    if (rebinds.length) {
      rebinds.forEach((el: HTMLElement) => this.defineBinds(el))
    }

    return htmlHandlers;
  }

  private getAttrBindsFromElement(
    element: HTMLElement,
    callback: (handler: HTMLBindHandler) => void
  ): HTMLBindHandler[] {
    return element
      .getAttributeNames()
      .filter(attrName => attrName.indexOf(':') > -1)
      .map(attrName => {
        const type: BindTypes =
          BindValues[BindValues.indexOf(<BindTypes>attrName.split(':')[1])];
        const handler = new HTMLBindHandler({
          type: type,
          element: element,
          expression: element.getAttribute(attrName) || '',
          isAffectedBy: [],
        });
        callback(handler);
        return handler;
      });
  }

  /**Maybe execute this in the entire container once to allow for string interpolation anywhere? */
  private getInterpolationBindsFromElement(
    element: HTMLElement,
    callback: (handler: HTMLBindHandler) => void
  ) {
    let regexp = /\${(.*?)}/gm;
    if (element.nodeValue && element.nodeValue.trim()) {
      let matches = element.nodeValue.matchAll(regexp);
      let current = matches.next();
      while (!current.done) {
        const handler = new HTMLBindHandler({
          type: 'interpolation',
          element: element,
          expression: current.value.input || '',
          isAffectedBy: [],
        });
        current = matches.next();
        callback(handler);
      }
    }
  }

  private validateTemplate(template: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let isURL = template.indexOf('.html') > -1;
      if (isURL) {
        fetch(template)
          .then(res => res.text())
          .then(content => {
            resolve(content);
          });
      } else {
        resolve(template);
      }
    });
  }

  private cleanHandlers(dataKey: string) {
    let DataHandler = this.DataBindHandlers[dataKey];
    let current = DataHandler.affects.length - 1;
    // Remove from end to start to avoid indexes shifting while
    // removing
    while (current >= 0) {
      let isConnected = DataHandler.affects[current].element.isConnected;
      if (!isConnected) DataHandler.affects.splice(current, 1);
      current--;
    }

    console.log(this.DataBindHandlers[dataKey]);
  }

  isMouseEventType(keyInput: BindTypes): keyInput is BindMouseEventTypes {
    const test = JSON.parse(JSON.stringify(BindMouseEventValues));
    return test.includes(keyInput);
  }

  isKeyboardEventType(keyInput: BindTypes): keyInput is BindKeyboardEventTypes {
    const test = JSON.parse(JSON.stringify(BindKeyboardEventValues));
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
