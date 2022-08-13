import { callbackify } from "util";

export interface DataChanges {
  path: string;
  pathArray: string[];
  oldValue: any;
  newValue: any;
  property: string,
  isNew: boolean,
}

/**
 * Flatten version of the reactive object
 */
export const flattenData: string[] = [];

export function reactive(target: any, onUpdate?: (change: DataChanges) => void) {
  // let flatten = [];
  return reactiveData(target, onUpdate);
}

export class ReactiveData {

  reactive: any;
  flatData: string[] = [];

  private _onUpdate?: (changes: DataChanges) => void;

  constructor(target: any) {
    this.reactive = this._reactive(target, (changes: DataChanges) => {
      if (this._onUpdate) this._onUpdate(changes)
    });
  }

  onUpdate(fn: (changes: DataChanges) => void) {
    this._onUpdate = fn;
  }

  private _reactive(target: any, onUpdate?: (change: DataChanges) => void) {
    return this._reactiveDeep(target, onUpdate);
  }

  private _reactiveDeep(target: any, callback?: (change: DataChanges) => void, path: string = 'this', pathArray: string[] = ['this']) {
    Object.keys(target).forEach((propKey: any) => {
      const value = target[propKey];
      const currentPath = path + (!isNaN(propKey) ? `[${propKey}]` : `.${propKey}`);
      const currentPathArray = pathArray.concat(propKey);

      this.flatData.push(currentPath);

      if (isObject(value)) {
        target[propKey] = this._reactiveDeep(value, callback, currentPath, currentPathArray);
      }
    });

    return new Proxy(target, handler(path, pathArray, callback));
  } 
}

/**
 * Takes an object and created a deep reactive Proxy representation of it
 * @param target Object that will be used as reference for reactivity
 * @param callback Function to execute each time data is updated
 * @param path current path in object
 * @param pathArray current path represented by an array
 * @returns Proxy object
 */
function reactiveData(
  target: any,
  callback?: (change: DataChanges) => void,
  path: string = 'this',
  pathArray: string[] = ['this']
) {
  Object.keys(target).forEach((propertyKey: any) => {
    const value = target[propertyKey];
    const currentPath = path + (!isNaN(propertyKey) ? `[${propertyKey}]` : `.${propertyKey}`);
    const currentPathArray = pathArray.concat(propertyKey);

    // const flattenPath =  path + ;
    flattenData.push(currentPath);

    if (isObject(value)) {
      target[propertyKey] = reactiveData(
        value,
        callback,
        currentPath,
        currentPathArray
      );
    }
  });

  return new Proxy(target, handler(path, pathArray, callback));
}

function handler(
  path: string,
  pathArray: string[],
  callback?: (change: DataChanges) => void
): ProxyHandler<any> {
  return {
    get: (target: {[key: string]: unknown}, prop: string, receiver: any) => {
      return target[prop];
    },
    set: (target: {[key: string]: unknown}, prop: string, value: any) => {
      let oldValue = target[prop];
      let newValue = value;

      let dataChanges: DataChanges = {
        path: path,
        pathArray: pathArray,
        property: prop,
        oldValue,
        newValue,
        isNew: oldValue === undefined
      };

      if (isObject(value)) {
        // If value is an object we create new reactive object, including arrays
        let properPath = path += `.${prop}`;
        let properPathArray = pathArray.concat(prop);
        target[prop] = reactiveData(value, callback, properPath, properPathArray)
      } else {
        target[prop] = value;
      }

      if (callback) callback(dataChanges);

      return true;
    },
  };
}

function isObject(value: any) {
  return typeof value === 'object' && value !== null;
}