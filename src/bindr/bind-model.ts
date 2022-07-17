import {HTMLBindHandler} from './bind-handler';

export const BindMouseEventValues = [
  'onclick',
  'ondblclick',
  'ondrag',
  'ondragend',
  'ondragenter',
  'ondragleave',
  'ondragover',
  'ondragstart',
  'ondrop',
  'onmousedown',
  'onmousemove',
  'onmouseout',
  'onmouseover',
  'onmouseup',
  'onscroll',
] as const;
export type BindMouseEventTypes = typeof BindMouseEventValues[number];

export const BindKeyboardEventValues = [
  'onkeydown',
  'onkeypress',
  'oninput',
] as const;
export type BindKeyboardEventTypes = typeof BindKeyboardEventValues[number];

export const BindFocusEventValues = ['onblur', 'onfocus'] as const;
export type BindFocusEventTypes = typeof BindFocusEventValues[number];

export const BindableEventValues = [
  ...BindMouseEventValues,
  ...BindKeyboardEventValues,
  ...BindFocusEventValues,
];

/**
 * These are 'custom' bind types that imitate structural directive/components in other frameworks
 */
export const BindCodeTypeValues = ['if', 'forEach'] as const;
export type BindCodeTypes = typeof BindCodeTypeValues[number];

export const BindHTMLValues = [
  'innerHTML',
  'innerText',
  'interpolation',
  'class',
  // 'style',
  // 'attr',
] as const;
export type BindHTMLTypes = typeof BindHTMLValues[number];

// To add more binding types/logic first add them to this array then, for behavior add its function to the BindHandlers Object
export const BindValues = [
  // HTMLElement binds
  ...BindHTMLValues,
  // Code like binds
  ...BindCodeTypeValues,
  // Mouse event binds
  ...BindMouseEventValues,
  // Keyboard event binds
  ...BindKeyboardEventValues,
  // Focus event binds
  ...BindFocusEventValues,
] as const;
export type BindTypes = typeof BindValues[number];
export const LowerCasedBindValues = BindValues.map(value =>
  value.toLowerCase()
);

export type BindHandlers = {
  [key in BindTypes]: (bind: IHTMLBindHandler, context: any) => void;
};

export interface IRenderer {
  /**
   * Id of the element that will benefit from the context of this renderer
   */
  id: string;
  /**
   * If exist, it will replace the innerHTML content of the container, can be a path or a NodeRequire statement
   * if the string contains valid HTML it will be attached as is, if the string ends with .html, it will attempt
   * to do a fetch to the file
   */
  template?: string;
  /**
   * This object will be attached to the container (found by the id property) and it will make the
   * data accessible to the entire container and its children trough the 'this' keyword
   */
  bind?: any;
  /**
   * Alias that will be used within the template context, so you can use that alias instead of the 'this' keyword
   */
  bindAs?: string | null;
}

export interface IHTMLBindHandler {
  element: HTMLElement;
  type: BindTypes;
  previous?: unknown;
  result?: unknown;
  expression: string;
  /**
   * Array of property keys that are in the binds property
   */
  isAffectedBy: string[];
  childBinds?: HTMLBindHandler[];
}

export interface IRendererBindMaps {
  [key: string]: IRendererBind;
}

export interface IRendererBind {
  affects: HTMLBindHandler[];
}
