import { clearMarkerContents, evaluateDOMExpression } from "../../utils";
import { HTMLBindHandler } from "./bind-handler";

export function IfBindHandler(handler: HTMLBindHandler, context: unknown): any {
  let rebind: any = false;
  if (!handler.outerHTML) return rebind;

  handler.result = Boolean(evaluateDOMExpression(handler.expression, context));
  let toRender = handler.result ? handler.outerHTML : handler.helperHTML;

  if (handler.result !== handler.previous) {
    clearMarkerContents(handler);  
    if (toRender) {
      let temp = document.createElement('div');
      temp.innerHTML = toRender;
      handler.element.after(temp.children[0]);
      rebind = handler.element.nextElementSibling;
    }
  }

  handler.previous = handler.result;

  return rebind ? [rebind] : rebind;
}

// This is here just in case the else handler is miss-used, the else handler
// can only be used right after an if handler and the if handler is responsible of
// rendering it
export function ElseHandler() {
  throw new Error('Invalid use of :else handler, can only be used next to an :if handler');
}