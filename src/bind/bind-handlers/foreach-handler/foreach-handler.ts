import {HTMLBindHandler} from '../bind-handler';
import {
  clearMarkerContents,
  evaluateDOMExpression,
  findAndReplaceVariable,
  recurseElementNodes,
} from '../../../utils';
import {BindingChar, InterpolationRegexp} from '../../../constants';

interface IArrayAction {
  action: 'add' | 'remove' | 're-render' | null,
  atIndexes: number[]
}

interface ILocalVars {
  localVar: string,
  arrayVar: string,
  usesIndex: boolean,
  indexToken: string,
}

// This bind handler should only compute when the length of the array changes
export function ForEachBindHandler(
  handler: HTMLBindHandler,
  context: unknown
): any {
  let rebind: any = false;
  if (!handler.outerHTML) return rebind;
  if (!handler.tracking) handler.tracking = [];

  let vars = getVarsFromExpression(handler);
  handler.result = evaluateDOMExpression(vars.arrayVar, context) || [];
  let actionData: IArrayAction = getActionData(handler); 

  // If null do nothing
  if (actionData.action === null) return rebind;

  // These elements will be checked for new binds to compute
  rebind = [];
  switch (actionData.action) {
    case 're-render':
      // Re-render the entire array
      clearMarkerContents(handler);
      rebind = renderAll(handler, vars, context);
      break;
    case 'add':
      // Just add at index
      rebind = renderAtIndex(handler, vars, context, actionData.atIndexes);
      break;
    case 'remove':
      // Just remove at index
      rebind = removeAtIndex(handler, vars, context, actionData.atIndexes);
      break;
  }

  return rebind;
}

export function IndexHandler() {
  throw new Error('Invalid use of :index handler, can only be used in an element which uses :foreach handler')
}

function getActionData(handler: HTMLBindHandler): IArrayAction {
  // Re-render as default
  let action: 'add' | 'remove' | 're-render' | null = 're-render';
  let atIndexes: number[] = [];
  let actionData: IArrayAction = { action, atIndexes };

  /**
   * In the name of stability and sacrificing performance, we always
   * re-render when an array changes, this IS temporary while the track
   * system is under development
   */
  return actionData;

  // // No array set in result, or tracker re-render all
  // if (!handler.result || !handler.tracking?.length) return actionData;
  // // No changes, do nothing
  // if (handler.result && handler.tracking && handler.result.length === handler.tracking?.length) {
  //   actionData.action = null;
  //   return actionData;
  // }

  // let difference = handler.result.length - handler.tracking?.length;
  // actionData.action = difference > 0 ? 'add' : 'remove';
  // handler.result.forEach((item: any, index: number) => {
  //   if (handler.tracking && handler.tracking.indexOf(item) === -1) {
  //     atIndexes.push(index);
  //   } 
  // });

  // return actionData;
}

function getVarsFromExpression(handler: HTMLBindHandler): ILocalVars {
  let expressionVars = handler.expression.split(' in ').map(val => val.trim());
  let localVar = expressionVars[0];
  let arrayVar = expressionVars[1];
  let usesIndex = Boolean(handler.helperHTML);
  let indexToken = handler.helperHTML === 'true' ? ':index' : handler.helperHTML || ':index';
  if (indexToken !== ':index' && indexToken.indexOf('@') !== 0) {
    throw new Error('Invalid custom index name for ' + ':index="'+indexToken+'", index name must start with "@",\ntry :index="@'+indexToken+'" instead');
  }
  return { localVar, arrayVar, usesIndex, indexToken };
}

function renderAll(handler: HTMLBindHandler, vars: ILocalVars, context: any): HTMLElement[] {
  let array: any = evaluateDOMExpression(vars.arrayVar, context) || [];
  let rebinds: HTMLElement[] = [];
  handler.tracking = [];

  array.forEach((item: any, index: number) => {
    let domItem = makeDOMItem(handler, vars, index);
    rebinds.push(domItem);
    handler.markerEnd?.before(domItem);
    handler.tracking?.push(item);
  });

  return rebinds;
}

function renderAtIndex(handler: HTMLBindHandler, vars: ILocalVars, context: any, indexes: number[]) {
  let rebinds = [];
  // This is basically a push, so just make one new element and return it for rebinding
  if (indexes.length === 1 && indexes[0] === handler.result.length - 1) {
    let item = makeDOMItem(handler, vars, indexes[0]); 
    rebinds = [item];
    handler.markerEnd?.before(item);
    if (handler.tracking) {
      handler.tracking.push(handler.result[indexes[0]]);
    }
  } else {
    // Any other case re-render all because still no track-by implemented
    clearMarkerContents(handler);
    rebinds = renderAll(handler, vars, context);
  }

  return rebinds;

}

// Not implemented yet so we just duplicate re-render logic
function removeAtIndex(handler: HTMLBindHandler, vars: ILocalVars, context: any, indexes: number[]) {
  let rebinds = [];
  clearMarkerContents(handler);
  rebinds = renderAll(handler, vars, context);
  return rebinds;
}

function makeDOMItem(handler: HTMLBindHandler, vars: ILocalVars, index: number) {
  let item: HTMLElement = handler.originalNode?.cloneNode(true) as HTMLElement;
  recurseElementNodes(item, (node: HTMLElement) => {
    switch (node.nodeType) {
      // Element
      case 1:
        node
          .getAttributeNames()
          .filter(attribute => attribute.indexOf(BindingChar) === 0)
          .forEach(attribute => {
            let value: any = node.getAttribute(attribute) || '';
            if (value.indexOf(vars.localVar) > -1) {
              value = parseLocalVar(value, vars, index);
            }
            if (vars.usesIndex && value.indexOf(vars.indexToken) > -1) {
              value = value.replaceAll(vars.indexToken, index);
            };
            node.setAttribute(attribute, value);
          });
        break;
      // Text node
      case 3:
        node.textContent = node.textContent?.replace(InterpolationRegexp, (a, b) => {
          let value: any = parseLocalVar(b, vars, index);
          if (vars.usesIndex && value.indexOf(vars.indexToken) > -1) {
            value = value.replaceAll(vars.indexToken, index);
          }
          return `\${${value}}`;
        }) || null;
        break;
    }
  });
  return item;
}

function parseLocalVar(text: string, vars: ILocalVars, index: number) {
  let arrayAtIndex = `${vars.arrayVar}[${index}]`
  let result = findAndReplaceVariable(text, vars.localVar, arrayAtIndex);
  return result;
}
