import {HTMLBindHandler, customHandlers} from './bind-handlers/bind-handler';
import {BindTypes, BindValues, IBind} from './bind-model';

import {recurseElementNodes} from '../utils';
import {BindingChar} from '../constants';
import {DataChanges, ReactiveData} from './reactive-data';

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
  private dataDependencies: {[key: string]: HTMLBindHandler[]} = {};

  private initTemplate() {
    this.templateRendered();
    this.defineBinds();
    setTimeout(() => {
      this.templateBinded();
      this.ready();
    });
  }

  private onDataChange(changes: DataChanges) {
    let dataPath = this.buildPathFromChanges(changes);

    if (changes.isNew) {
      let newPropRoot = changes.path += !isNaN(changes.property as any) ? `[${changes.property}]` : `.${changes.property}`; 
      let relatedProps = this._reactive.flatData.filter((path: string) => path.indexOf(newPropRoot) > -1);
      // Check for handlers that might require this new property and/or its children
      this.DOMBindHandlers.forEach(handler => {
        let originalLength = handler.dependencies.length;
        handler.assignDependencies(relatedProps, true);
        let newLength = handler.dependencies.length;
        if (originalLength < newLength) {
          this.computeAndRebind([handler]);
        }
      });
    }

    this.computeHandlersForData(dataPath);
  }

  private buildPathFromChanges(changes: DataChanges) {
    let pathArray = changes.pathArray;
    if (changes.pathArray.length === 1 || !isNaN(changes.pathArray[changes.pathArray.length - 1] as any)) {
      pathArray = changes.pathArray.concat(changes.property);
    }
    return pathArray.reduce((previous: any, current: any) => {
      // Number keys are array indexes
      return (previous += !isNaN(current) ? `[${current}]` : `.${current}`);
    });
  }

  private computeHandlersForData(path: string) {
    let affect = this.dataDependencies[path] || [];
    let deadHandlers: HTMLBindHandler[] = [];
    if (affect) {
      affect.forEach(handler => {
        if (handler.element.isConnected) {
          this.computeAndRebind([handler]);
        } else {
          deadHandlers.push(handler);
        }
      });
    }

    deadHandlers.forEach(deadHandler => {
      let index = this.dataDependencies[path].indexOf(deadHandler);
      this.dataDependencies[path].splice(index, 1);
    });
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

    // Compute handlers at the end to avoid DOM modifier binds to
    // modify the DOM as we iterate it
    this.computeAndRebind(htmlHandlers);
    // Concatenate new handlers to the existing ones
    return this.DOMBindHandlers.concat(htmlHandlers);
  }

  private computeAndRebind(handlers: HTMLBindHandler[]) {
    let rebinds: HTMLElement[] = [];
    handlers.forEach(handler => {
      let result = handler.compute(this.bind);
      let dependencies = handler.assignDependencies(
        this._reactive.flatData
      );

      dependencies.forEach(dep => {
        let dataHandlers = this.dataDependencies[dep] || [];
        if (dataHandlers.indexOf(handler) === -1) {
          dataHandlers.push(handler);
        }
        this.dataDependencies[dep] = dataHandlers;
      });

      if (result) {
        rebinds = rebinds.concat(result);
      }
    });

    // Some HTMLBindHandlers return new elements that might need computing of their
    // own, so we also check for those
    if (rebinds.length) {
      rebinds.forEach((el: HTMLElement) => this.defineBinds(el));
    }
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
