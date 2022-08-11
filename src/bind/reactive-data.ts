export interface DataChanges {
  path: string;
  pathArray: string[];
  oldValue: any;
  newValue: any;
  property: string
}

export function reactive(target: any, callback?: (change: DataChanges) => void) {
  return makeReactive(target, callback);
}

function makeReactive(
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
      target[propertyKey] = makeReactive(
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

      target[prop] = value;
      if (callback) {
        callback(dataChanges);
      }

      return true;
    },
  };
}

function isObject(value: any) {
  return typeof value === 'object' && value !== null && !isArray(value);
}

function isArray(value: any) {
  return typeof value === 'object' && value.length !== undefined;
}

