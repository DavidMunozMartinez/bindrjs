export interface DataChanges {
  path: string;
  pathArray: string[];
  oldValue: any;
  newValue: any;
  property: string,
  isNew: boolean,
}

/**
 * GETTER-BASED DEPENDENCY TRACKING (module-level)
 * -----------------------------------------------
 * When `activeCollector` is non-null, every property read flowing through a
 * proxy `get` trap records its full path into the Set. We turn it on, evaluate
 * an expression (which reads whatever it actually reads), and turn it off —
 * whatever landed in the Set is that expression's exact dependency list.
 *
 * It lives at module scope (not per-instance) because only one compute runs at
 * a time in JS, and this lets helpers like `untracked` be shared across modules
 * (e.g. the foreach handler suppresses tracking while it diffs keys).
 */
let activeCollector: Set<string> | null = null;

/**
 * Runs `fn` with read-collection enabled and returns the set of reactive paths
 * read during it. Save/restore makes nested collect() calls safe.
 */
export function collectReads(fn: () => void): string[] {
  const previous = activeCollector;
  const collector = new Set<string>();
  activeCollector = collector;
  try {
    fn();
  } finally {
    activeCollector = previous;
  }
  return [...collector];
}

/**
 * Runs `fn` with tracking temporarily disabled, so reads inside it do NOT
 * become dependencies. Used for bookkeeping reads (e.g. computing :foreach keys)
 * that shouldn't subscribe the handler to that data.
 */
export function untracked<T>(fn: () => T): T {
  const previous = activeCollector;
  activeCollector = null;
  try {
    return fn();
  } finally {
    activeCollector = previous;
  }
}

export class ReactiveData {
  constructor(target: any) {
    this.reactive = this._reactive(target, (changes: DataChanges) => {
      if (this._onUpdate) this._onUpdate(changes)
    });
  }

  public reactive: any;
  public flatData: string[] = [];
  private _onUpdate?: (changes: DataChanges) => void;

  onUpdate(fn: (changes: DataChanges) => void) {
    this._onUpdate = fn;
  }

  /**
   * Runs `fn` with read-collection enabled and returns the reactive paths read
   * during it, so the renderer learns which data should re-trigger a handler.
   * Delegates to the shared module-level collector (see `collectReads`).
   */
  collect(fn: () => void): string[] {
    return collectReads(fn);
  }

  private _reactive(target: any, onUpdate?: (change: DataChanges) => void) {
    return this._reactiveDeep(target, onUpdate);
  }

  private _reactiveDeep(target: any, callback?: (change: DataChanges) => void, path: string = 'this', pathArray: string[] = ['this']) {
    Object.defineProperty(target, '__isProxy', { value: true, enumerable: false, writable: true, configurable: true });

    if (target.length !== undefined) {
      this.flatData.push(path + '.length');
    }

    Object.keys(target)
    .forEach((propKey: any) => {
      const value = target[propKey];
      const currentPath = path + (!isNaN(propKey) ? `[${propKey}]` : `.${propKey}`);
      const currentPathArray = pathArray.concat(propKey);

      if (!isFunction(value) && this.flatData.indexOf(currentPath) === -1) {
        this.flatData.push(currentPath);
      }

      if (isObject(value)) {
        target[propKey] = this._reactiveDeep(value, callback, currentPath, currentPathArray);
      }
    });

    return new Proxy(target, this._handler(path, pathArray, callback));
  } 

  private _handler(
    path: string,
    pathArray: string[],
    callback?: (change: DataChanges) => void
  ): ProxyHandler<any> {
    return {
      get: (target: {[key: string]: any}, prop: string, receiver: any) => {
        const value = target[prop];
        // Record this read as a dependency, but only when:
        //  - a collector is active (we're inside collect()),
        //  - the key is a normal string (skip Symbols like Symbol.iterator),
        //  - it isn't our internal marker, and
        //  - the value isn't a function (methods like .forEach/.toFixed are not
        //    reactive data, so depending on them would just be noise).
        if (
          activeCollector &&
          typeof prop === 'string' &&
          prop !== '__isProxy' &&
          typeof value !== 'function'
        ) {
          // Build the same path shape used everywhere else: numeric keys are
          // array indexes ([0]), everything else is a dot property (.foo).
          const childPath = path + (!isNaN(prop as any) ? `[${prop}]` : `.${prop}`);
          activeCollector.add(childPath);
        }
        return value;
      },
      set: (target: {[key: string]: any}, prop: string, value: any) => {
        let oldValue = target[prop];
        let newValue = value;

        // Skip all custom logic if property being updated is from prototype
        if (target.__proto__ && prop in target.__proto__ as any && prop !== 'length') {
          target[prop] = value;
          return true;
        }
  
        let dataChanges: DataChanges = {
          path: path,
          pathArray: pathArray,
          property: prop,
          oldValue,
          newValue,
          isNew: oldValue === undefined
        };

        let properPath = path;
        let properPathArray = pathArray;

        // If is new we need to add it to the flat data array and create a new path
        if (dataChanges.isNew && typeof value !== 'function' && !isObject(value)) {
          properPath = path + (!isNaN(dataChanges.property as any) ? `[${prop}]` : `.${prop}`);
          properPathArray = pathArray.concat(prop);
          // this.flatData.push(properPath);
          if (this.flatData.indexOf(properPath) === -1) this.flatData.push(properPath);

        }

        // If value is an object we create new reactive object, including arrays
        if (isObject(value)) {
          properPath = path + (!isNaN(dataChanges.property as any) ? `[${prop}]` : `.${prop}`);
          properPathArray = pathArray.concat(prop);
          // this.flatData.push(properPath);
          if (this.flatData.indexOf(properPath) === -1) this.flatData.push(properPath);

          // Make sure we do clean objects to avoid making a proxy object out of a proxy
          value = value.__isProxy ? cloneObj(value) : value;
          // if (value && value.__proto__ && value.__isProxy) value = JSON.parse(JSON.stringify(value));
          target[prop] = this._reactiveDeep(value, callback, properPath, properPathArray);

        } else {
          target[prop] = value;
        }
  
        if (callback) callback(dataChanges);
  
        return true;
      },
      deleteProperty: (target: any, prop: string) => {
        let oldValue = target[prop];
        let newValue = undefined;  
        let dataChanges: DataChanges = {
          path: path,
          pathArray: pathArray,
          property: prop,
          oldValue,
          newValue,
          isNew: oldValue === undefined
        };

        let properPath = path + (!isNaN(dataChanges.property as any) ? `[${prop}]` : `.${prop}`);
        // Remove the path itself and every descendant path, regardless of where
        // they sit in flatData (children are not guaranteed to be contiguous,
        // so a positional splice would corrupt unrelated entries).
        this.flatData = this.flatData.filter(p =>
          p !== properPath &&
          !p.startsWith(properPath + '.') &&
          !p.startsWith(properPath + '[')
        );

        // For arrays, `delete arr[i]` already adjusts length semantics; manually
        // decrementing length here would truncate the tail element instead of
        // leaving a hole, so we only delete the property.
        if (prop in target) delete target[prop];

        if (callback) callback(dataChanges);
  
        return true;
      }
    };
  }
}

function isObject(value: any) {
  return typeof value === 'object' && value !== null && typeof value !== 'function';
}

function isFunction(value: any) {
  return typeof value === 'function';
}

function cloneObj(obj: any) {
  if (obj.length !== undefined) {
    return Object.assign([], obj);
  }
  return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
}
