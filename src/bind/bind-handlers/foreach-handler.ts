import {HTMLBindHandler} from './bind-handler';
import {
  evaluateDOMExpression,
  findAndReplaceVariable,
  recurseElementNodes,
} from '../../utils';
import {BindingChar, InterpolationRegexp} from '../../constants';

export function ForEachBindHandler(
  handler: HTMLBindHandler,
  context: unknown
): any {
  let rebind: any = false;
  if (!handler.outerHTML) return rebind;

  let temp = document.createElement('div');
  let expressionVars = handler.expression.split(' in ').map(val => val.trim());
  let localVar = expressionVars[0];
  let arrayVar = expressionVars[1];
  let array: any = evaluateDOMExpression(arrayVar, context) || [];

  // This bind handler should only compute when the length of the array changes
  if (handler.result && handler.result.length === array.length) return false;

  // Clean the previous elements before creating new ones
  // TODO: Create a solution to update existing DOM elements instead of re-creating
  // all of them
  if (array.length) {
    while (
      handler.element.nextSibling?.textContent !==
      `${handler.type}:${handler.expression} end`
    ) {
      handler.element.nextElementSibling?.remove();
    }
  }

  rebind = [];
  // Iterate it backwards so when we insert the resulting node after the marker
  // they end up in the right order
  for (let i = array.length - 1; i > -1; i--) {
    let nodeString = handler.outerHTML || '';
    let arrayAtIndex = `${arrayVar}[${i}]`;

    /**
     * Find and replace all instances of the local variable name used in string
     * interpolation within the HTML string of the :foreach and replace it with
     * the array pointing to the index position
     */
    temp.innerHTML = nodeString.replace(InterpolationRegexp, (a, b) => {
      return `\${${findAndReplaceVariable(b, localVar, arrayAtIndex)}}`;
    });
    let item = temp.children[0];

    /**
     * Find and replace all instances of local variable name in attributes that
     * might need it
     */
    handler.element.after(item);
    recurseElementNodes(item as HTMLElement, (el: Element) => {
      if (el.nodeType > 1) return;
      el.getAttributeNames()
        // Only iterate bind type attributes
        .filter(attr => attr.indexOf(BindingChar) === 0)
        .forEach(attr => {
          let value = findAndReplaceVariable(
            el.getAttribute(attr) || '',
            localVar,
            arrayAtIndex
          );
          // Replace instances of local var name with array pointing to the index position
          el.setAttribute(attr, value);
        });
    });

    rebind.push(item);
  }

  handler.result = array;
  return rebind;
}
