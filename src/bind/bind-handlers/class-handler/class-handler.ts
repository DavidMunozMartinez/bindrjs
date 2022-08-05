import {HTMLBindHandler} from '../bind-handler';
import {evaluateDOMExpression} from '../../../utils';
import {BindingChar} from '../../../constants';

export function ClassBindHandler(
  handler: HTMLBindHandler,
  context: unknown
): any {
  let splitAttribute =
    (handler.attribute && handler.attribute.split(BindingChar)) || [];
  let isBooleanClass = splitAttribute.length > 2;
  if (isBooleanClass) {
    // The class that we want to apply is in the second part of the attribute
    handler.result = splitAttribute[2];
    let className = String(handler.result);
    let truthy = Boolean(evaluateDOMExpression(handler.expression, context));
    let classList = handler.element.classList;
    // In this case the expression is a condition that should be evaluated for truth-ness
    // rather than as a class string
    if (truthy) {
      if (!classList.contains(className)) {
        classList.add(className);
      }
    } else {
      if (classList.contains(className)) {
        classList.remove(className);
      }
    }
  } else {
    handler.result = evaluateDOMExpression(handler.expression, context);
    const current = String(handler.result);
    const previous = String(handler.previous);
    if (
      previous &&
      current !== previous &&
      handler.element.classList.contains(previous)
    ) {
      handler.element.classList.remove(previous);
    }
    if (current) {
      handler.element.classList.add(current);
      handler.previous = current;
    }
  }
}
