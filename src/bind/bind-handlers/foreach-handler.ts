import {HTMLBindHandler} from './bind-handler';
import {
  clearMarkerContents,
  evaluateDOMExpression,
  findAndReplaceVariable,
  recurseElementNodes,
} from '../../utils';
import {BindingChar, InterpolationRegexp} from '../../constants';

interface IArrayAction {
  action: 'add' | 'remove' | 're-render' | null,
  atIndexes: number[]
}

interface ILocalVars {
  localVar: string,
  arrayVar: string,
  usesIndex: boolean
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
  let array: any = evaluateDOMExpression(vars.arrayVar, context) || [];
  let actionData: IArrayAction = getActionData(handler); 

  // If null do nothing
  if (actionData.action === null) return rebind;

  // These elements will be checked for new binds to compute
  rebind = [];
  switch (actionData.action) {
    case 're-render':
      // Re-render the entire array
      clearMarkerContents(handler);
      rebind = renderAll(handler, context);
      break;
    case 'add':
      // Just add at index
    case 'remove':
      // Just remove at index
  }

  handler.result = array;
  return rebind;
}

export function IndexHandler() {
  throw new Error('Invalid use of :index handler, can only be used in an element which uses :foreach handler')
}

function getActionData(handler: HTMLBindHandler): IArrayAction {
  let action: 'add' | 'remove' | 're-render' | null = 're-render';
  let atIndexes: number[] = [];

  if (true) return { action, atIndexes };
}

function getVarsFromExpression(handler: HTMLBindHandler): ILocalVars {
  let expressionVars = handler.expression.split(' in ').map(val => val.trim());
  let localVar = expressionVars[0];
  let arrayVar = expressionVars[1];
  let usesIndex = Boolean(handler.helperHTML);
  return { localVar, arrayVar, usesIndex }
}

function renderAll(handler: HTMLBindHandler, context: any): HTMLElement[] {
  let vars = getVarsFromExpression(handler);
  let array: any = evaluateDOMExpression(vars.arrayVar, context) || [];
  let rebinds: HTMLElement[] = [];

  array.forEach((item: any, index: number) => {
    let domItem = makeDOMItem(handler, vars, index);
    rebinds.push(domItem);
    handler.markerEnd?.before(domItem);
  });

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
            if (vars.usesIndex && value.indexOf(':index') > -1) {
              value = value.replaceAll(':index', index);
            };
            node.setAttribute(attribute, value);
          });
        break;
      // Text node
      case 3:
        node.textContent = node.textContent?.replace(InterpolationRegexp, (a, b) => {
          let value: any = parseLocalVar(b, vars, index);
          if (vars.usesIndex && value.indexOf(':index') > -1) {
            value = value.replaceAll(':index', index);
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
