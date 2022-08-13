import {HTMLBindHandler, customHandlers} from './bind-handlers/bind-handler';
import {BindTypes, BindValues, IBind} from './bind-model';

import {recurseElementNodes} from '../utils';
import {BindingChar} from '../constants';
import {DataChanges, reactive, ReactiveData} from './reactive-data';

export class Bind {
  bind: any;
  bindAs?: string | null;
  ready: () => void;
  templateRendered: () => void;
  templateBinded: () => void;

  constructor(data: IBind) {
    this.id = data.id;
    // this.bindAs = data.bindAs || null;
    this.ready = data.ready || (() => {});
    this.templateRendered = data.templateRendered || (() => {});
    this.templateBinded = data.templateBinded || (() => {});
    const container = document.getElementById(this.id);
    let template;
    if (data.template) {
      template = this.validateTemplate(data.template);
    }

    this._reactive = new ReactiveData(data.bind || {});

    this._reactive.onUpdate((changes: DataChanges) => {
      this.onDataChange(changes);
    });

    this.bind = this._reactive.reactive;

    if (container) {
      this.container = container;
    } else {
      throw new Error('Could not initialize renderer, container not found');
    }

    if (template) {
      template.then((templateString: string) => {
        this.container.innerHTML = templateString;
        this.initTemplate();
      });
    } else {
      this.initTemplate();
    }
  }

  private id: string;
  private container!: HTMLElement;
  private DOMBindHandlers: HTMLBindHandler[] = [];

  private _reactive: any;
  private _data_affects: {[key: string]: HTMLBindHandler[]} = {};

  private initTemplate() {
    this.templateRendered();
    this.defineBinds();
    setTimeout(() => {
      this.templateBinded();
      this.ready();
    });
  }

  private onDataChange(changes: DataChanges) {
    let pathArray = changes.pathArray;
    if (changes.pathArray.length === 1) {
      pathArray = changes.pathArray.concat(changes.property);
    }
    let curatedPath = pathArray.reduce((previous: any, current: any) => {
      // Number keys are usually array indexes
      return (previous += !isNaN(current) ? `[${current}]` : `.${current}`);
    });

    // Array of HTMLBindHandlers affected by this property change
    let affect = this._data_affects[curatedPath] || [];
    // Elements that could come from the result of re-computing handlers
    let rebind: HTMLElement[] = [];
    // Handlers which their anchor element is disconnected, so we need to
    // delete them
    let isLive: HTMLBindHandler[] = [];
  
    affect.forEach(handler => {
      if (handler.element.isConnected) {
        isLive.push(handler);
        let result = handler.compute(this.bind);
        if (result) rebind = rebind.concat(result);
      }
    });
    this._data_affects[curatedPath] = isLive;

    rebind.forEach(el => this.defineBinds(el));
  }

  private computeHandlerForData(path: string) {

  }

  private defineBinds(element?: HTMLElement, props?: string[]) {
    this.DOMBindHandlers = this.getTemplateBinds(element);
  }

  private getTemplateBinds(container?: HTMLElement): HTMLBindHandler[] {
    container = container ? container : this.container;

    /**
     * Store our current DOMBindHandlers in a map so we can later
     * check and avoid repeating handlers
     */
    const CurrentDOMHandlers = new Map<HTMLElement, boolean>();
    // Iterate backwards because we might remove elements from the array
    let i = this.DOMBindHandlers.length - 1;
    while (i >= 0) {
      let element = this.DOMBindHandlers[i].element;
      // Also check if its still connected, otherwise delete it
      if (element.isConnected) {
        CurrentDOMHandlers.set(element, true);
      } else {
        this.DOMBindHandlers.splice(i, 1);
      }
      i--;
    }

    const htmlHandlers: HTMLBindHandler[] = [];
    recurseElementNodes(container, node => {
      if (CurrentDOMHandlers.get(node) || !node.isConnected) return;
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
    });

    let rebinds: HTMLElement[] = [];
    // Compute handlers at the end to avoid DOM modifier binds to
    // modify the DOM as we iterate it
    htmlHandlers.forEach(handler => {
      let result = handler.compute(this.bind);
      let dependencies = handler.getExpressionDependencies(
        this._reactive.flatData
      );
      dependencies.forEach(dep =>
        this._data_affects[dep]
          ? this._data_affects[dep].push(handler)
          : (this._data_affects[dep] = [handler])
      );
      if (result) {
        rebinds = rebinds.concat(result);
      }
    });

    // Some HTMLBindHandlers return new elements that could need computing of their
    // own, so we also check for those
    if (rebinds.length) {
      rebinds.forEach((el: HTMLElement) => this.defineBinds(el));
    }

    // Concatenate new handlers to the existing ones
    return this.DOMBindHandlers.concat(htmlHandlers);
  }

  private getAttrBindsFromElement(
    element: HTMLElement,
    callback: (handler: HTMLBindHandler) => void
  ): HTMLBindHandler[] {
    return element
      .getAttributeNames()
      .filter(attrName => attrName.indexOf(BindingChar) > -1)
      .map(attrName => {
        let cleanAttrName = attrName.split(BindingChar)[1];
        const type: BindTypes =
          BindValues[BindValues.indexOf(cleanAttrName as BindTypes)];

        let handler: HTMLBindHandler = new HTMLBindHandler({
          type: type ? type : 'attr',
          element: element,
          expression: element.getAttribute(attrName) || '',
          attribute: attrName,
        });
        if (customHandlers[cleanAttrName]) handler.isCustom = cleanAttrName;

        callback(handler);
        return handler;
      });
  }

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
          attribute: null,
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
}
