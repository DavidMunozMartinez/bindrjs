export interface DataChanges {
  path: string;
  pathArray: string[];
  oldValue: any;
  newValue: any;
  property: string,
  isNew: boolean,
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

  private _reactive(target: any, onUpdate?: (change: DataChanges) => void) {
    return this._reactiveDeep(target, onUpdate);
  }

  private _reactiveDeep(target: any, callback?: (change: DataChanges) => void, path: string = 'this', pathArray: string[] = ['this']) {
    target.__proto__.__isProxy = true;

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
        return target[prop];
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
        let index = this.flatData.indexOf(properPath);
        if (index > -1) {
          let deleteCount = Object.values(target[prop]).length;
          this.flatData.splice(index, deleteCount + 1);
        }

        if (prop in target) delete target[prop];
        if (target.length !== undefined) target.length -= 1; 

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
