export interface DataChanges {
  path: string;
  pathArray: string[];
  oldValue: any;
  newValue: any;
  property: string
}

export function reactive(target: any, onUpdate?: (change: DataChanges) => void) {
  return reactiveData(target, onUpdate);
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
  Object.keys(target).forEach(propertyKey => {
    const value = target[propertyKey];
    const currentPath = path + '.' + propertyKey;
    const currentPathArray = pathArray.concat(propertyKey);

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
      console.log('Getting prop: ', prop);
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
      };

      if (isObject(value)) {
        // If value is an object we create new reactive object, including arrays
        target[prop] = reactiveData(value, callback, path, pathArray)
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

function isArray(value: any) {
  return typeof value === 'object' && value.length !== undefined;
}

