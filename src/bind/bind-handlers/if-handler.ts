import { evaluateDOMExpression } from "../../utils";
import { HTMLBindHandler } from "./bind-handler";

export function IfBindHandler(handler: HTMLBindHandler, context: unknown): any {
  let rebind: any = false;
  if (!handler.outerHTML) return rebind;

  handler.result = Boolean(evaluateDOMExpression(handler.expression, context));
  if (handler.result !== handler.previous) {
    if (handler.result) {
      let temp = document.createElement('div');
      temp.innerHTML = handler.outerHTML;
      handler.element.after(temp.children[0]);
      rebind = handler.element.nextElementSibling;
    } else if (typeof handler.previous === 'boolean') {
      handler.element.nextSibling?.remove();
    }
  }
  handler.previous = handler.result;
  return [rebind];
}