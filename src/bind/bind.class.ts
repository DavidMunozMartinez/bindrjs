import {HTMLBindHandler, customHandlers} from './bind-handlers/bind-handler';
import {BindTypes, BindValues, IBind} from './bind-model';

import {recurseElementNodes} from '../utils';
import {BindingChar} from '../constants';
import {DataChanges, ReactiveData} from './reactive-data';


export class Bind<T> {
  /**
   * Reference to reactive data with type safety
   */
  bind: T;

  ready: (() => void) | undefined;
  /**
   * Template has been renderer/appended to the DOM
   */
  templateRendered: () => void;
  /**
   * Template has been processed and all binds have been triggered once
   */
  templateBinded: () => void;
  /**
   * Reactive data has changes
   */
  onChange?: (changes: DataChanges) => void;

  constructor(data: IBind<T>) {
    this.id = data.id;
    this.ready = data.ready;
    this.templateRendered = data.templateRendered || (() => {});
    this.templateBinded = data.templateBinded || (() => {});
    if (data.onChange) this.onChange = data.onChange;

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
        this.initTemplate.apply(this);
      });
    } else {
      this.initTemplate.apply(this);
    }
  }

  private id: string;
  private container!: HTMLElement;
  private DOMBindHandlers: HTMLBindHandler[] = [];

  private _reactive: any;
  private dataDependencies: {[key: string]: HTMLBindHandler[]} = {};

  private initTemplate() {
    const that = this;
    this.templateRendered();
    this.defineBinds();
    setTimeout(() => {
      this.templateBinded();
      if (this.ready) {
        this.ready.apply(that.bind)
      }
    });
  }

  private onDataChange(changes: DataChanges) {
    let dataPath = this.buildPathFromChanges(changes);
    // Make sure to also trigger child data updates
    let childData = this._reactive.flatData.filter(
      (data: string) => (data.startsWith(dataPath + '.') || data.startsWith(dataPath + '[')) && data !== dataPath
    );

    // NOTE: There used to be a special `changes.isNew` block here that scanned
    // every handler to see if a brand-new property matched its expression
    // (via string matching). With getter-based tracking this is unnecessary:
    // when a handler first computed, reading the (then-undefined) property
    // already recorded its path as a dependency, so the handler is ALREADY
    // subscribed and the normal computeHandlersForData call below re-runs it
    // once the property is set. Each re-run re-collects deps, so it also
    // self-heals once intermediate objects come into existence.
    this.computeHandlersForData(dataPath);
    childData.forEach((path: string) => this.computeHandlersForData(path));

    if (this.onChange) this.onChange(changes);
  }

  private buildPathFromChanges(changes: DataChanges) {
    let pathArray = changes.pathArray;
    if (
      changes.pathArray.length === 1 ||
      !isNaN(changes.pathArray[changes.pathArray.length - 1] as any) ||
      changes.property === 'length'
    ) {
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

  private defineBinds(element?: HTMLElement) {
    this.DOMBindHandlers = this.getTemplateBinds(element);
  }

  private getTemplateBinds(container?: HTMLElement): HTMLBindHandler[] {
    container = container ? container : this.container;

    /**
     * Store our current DOMBindHandlers in a map so we can later
     * check and avoid repeating handlers
     */
    const CurrentDOMHandlers = this.getConnectedHandlers();
    const attributeHandlers: HTMLBindHandler[] = [];
    const interpolationHandlers: HTMLBindHandler[] = [];

    recurseElementNodes(container, node => {
      if (CurrentDOMHandlers.get(node) || !node.isConnected) return;
      switch (node.nodeType) {
        // Element
        case 1:
          this.getAttrBindsFromElement(node, handler => {
            // This guy adds to the HTML, so we make sure to compute it immediately in case
            // the HTML being added contains more attributes that need to be processed
            if (handler.attribute === ':innerhtml') {
              // We don't worry about rebinding because the HTML being added
              // is being recursed in this function, so it will eventually pass trough it
              handler.compute(this.bind);
              interpolationHandlers.push(handler);
            } else {
              attributeHandlers.push(handler);
            }
          });
          break;
        // Text
        case 3:
          this.getInterpolationBindsFromElement(node, handler => {
            // Compute this when found to avoid having visual expression in the HTML
            // longer than necessary
            this.computeAndRebind([handler]);
            interpolationHandlers.push(handler);
          });
          break;
      }
    });

    // Compute the handlers that might modify the DOM at the end
    this.computeAndRebind(attributeHandlers);
    const handlers = interpolationHandlers.concat(attributeHandlers);
    // Concatenate new handlers to the existing ones
    return this.DOMBindHandlers.concat(handlers);
  }

  private getConnectedHandlers(): Map<HTMLElement, boolean> {
    /**
     * Store our current DOMBindHandlers in a map so we can later
     * check and avoid repeating handlers
     */
    const CurrentDOMHandlers = new Map<HTMLElement, boolean>();
    // Iterate backwards because we might remove elements from the array
    let i = this.DOMBindHandlers.length - 1;
    while (i >= 0) {
      let handler = this.DOMBindHandlers[i];
      let element = handler.element;
      // Also check if its still connected, otherwise delete it
      if (element.isConnected) {
        CurrentDOMHandlers.set(element, true);
      } else {
        this.DOMBindHandlers.splice(i, 1);
        // Purge the dead handler from every dependency bucket so it can be
        // garbage collected. Otherwise handlers from removed elements (e.g.
        // every :foreach re-render) accumulate in dataDependencies for paths
        // that may never change again, leaking memory in long-running apps.
        this.purgeHandlerDependencies(handler);
      }
      i--;
    }

    return CurrentDOMHandlers;
  }

  private purgeHandlerDependencies(handler: HTMLBindHandler) {
    handler.dependencies.forEach(dep => {
      let bucket = this.dataDependencies[dep];
      if (!bucket) return;
      let index = bucket.indexOf(handler);
      if (index > -1) bucket.splice(index, 1);
      if (bucket.length === 0) delete this.dataDependencies[dep];
    });
  }

  private computeAndRebind(handlers: HTMLBindHandler[]) {
    let rebinds: HTMLElement[] = [];
    handlers.forEach(handler => {
      let result: HTMLElement[] | undefined;
      // Compute the handler INSIDE a collection window. Every reactive path the
      // expression reads while computing is captured and becomes this handler's
      // dependency set. This is the heart of getter-based tracking: deps are
      // observed from actual reads instead of guessed from the expression text.
      const dependencies = this._reactive.collect(() => {
        result = handler.compute(this.bind) || undefined;
      });

      // Dependencies can change between runs (e.g. a ternary or :if that reads
      // different paths depending on the data), so we re-sync subscriptions
      // every compute rather than only appending.
      this.updateHandlerDependencies(handler, dependencies);

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

  /**
   * Re-syncs a handler's subscriptions in `dataDependencies` to match the paths
   * it just read. Removes it from buckets it no longer depends on and adds it to
   * the new ones, then stores the fresh list on the handler. Keeping this in
   * sync each compute is what makes dynamic/branchy dependencies correct and
   * prevents stale subscriptions from piling up.
   */
  private updateHandlerDependencies(
    handler: HTMLBindHandler,
    nextDeps: string[]
  ) {
    const previousDeps = handler.dependencies;
    const nextSet = new Set(nextDeps);

    // Unsubscribe from paths that are no longer read by this handler.
    previousDeps.forEach(dep => {
      if (nextSet.has(dep)) return;
      const bucket = this.dataDependencies[dep];
      if (!bucket) return;
      const index = bucket.indexOf(handler);
      if (index > -1) bucket.splice(index, 1);
      if (bucket.length === 0) delete this.dataDependencies[dep];
    });

    // Subscribe to the paths this handler now reads.
    nextDeps.forEach(dep => {
      const bucket = this.dataDependencies[dep] || [];
      if (bucket.indexOf(handler) === -1) bucket.push(handler);
      this.dataDependencies[dep] = bucket;
    });

    handler.dependencies = nextDeps;
  }

  private getAttrBindsFromElement(
    element: HTMLElement,
    callback: (handler: HTMLBindHandler) => void
  ): HTMLBindHandler[] {
    /**
     * IF the element contains an if/foreach handler, we only compute the first one
     * of these we encounter since it will remove itself from the DOM and re-compute
     * itself once we are done recursing the DOM, we do this because all the
     * handlers created before an if/foreach handler are immediately disconnected
     * from the DOM and basically "dead"
     */
    let hasIf = element.hasAttribute(':if');
    let hasForeach = element.hasAttribute(':foreach');
    let modifiesDOM = hasIf || hasForeach;

    return element
      .getAttributeNames()
      .filter(attrName => {
        let isBindHandler = attrName.indexOf(BindingChar) > -1;
        return (
          (isBindHandler && !modifiesDOM) ||
          (modifiesDOM && attrName === ':if') ||
          attrName === ':foreach'
        );
      })
      .map(attrName => {
        let cleanAttrName = attrName.split(BindingChar)[1];
        // Check if is known binding type
        let type: BindTypes =
          BindValues[BindValues.indexOf(cleanAttrName as BindTypes)];
        // Check if is event type
        if (!type && cleanAttrName.indexOf('on') === 0) {
          type = 'event';
        }

        let handler: HTMLBindHandler = new HTMLBindHandler({
          // If not found, threat it as an attribute type
          type: type ? type : 'attr',
          element: element,
          expression: element.getAttribute(attrName) || '',
          attribute: type === 'event' ? cleanAttrName : attrName,
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
    const regexp = /\${(.*?)}/gm;
    if (element.nodeValue && element.nodeValue.trim() && regexp.test(element.nodeValue)) {
      const handler = new HTMLBindHandler({
        type: 'interpolation',
        element: element,
        expression: element.nodeValue,
        attribute: null,
      });
      callback(handler);
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
