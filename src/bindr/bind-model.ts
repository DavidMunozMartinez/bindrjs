import {HTMLBindHandler} from './bind-handler';

/**
 * Events triggered for the window object (applies to the <body> tag):
 */
export const BindWindowEventAttributeValues = [
  'onafterprint',
  'onbeforeprint',
  'onbeforeunload',
  'onerror',
  'onhashchange',
  'onload',
  'onmessage',
  'onoffline',
  'ononline',
  'onpagehide',
  'onpageshow',
  'onpopstate',
  'onresize',
  'onstorage',
  'onunload',
] as const;
export type BindWindowEventAttributeTypes =
  typeof BindWindowEventAttributeValues[number];

/**
 * Events triggered by actions inside a HTML form (applies to almost all HTML elements, but is most used in form elements):
 */
export const BindFormEventValues = [
  'onblur',
  'onchange',
  'oncontextmenu',
  'onfocus',
  'oninput',
  'oninvalid',
  'onreset',
  'onsearch',
  'onselect',
  'onsubmit',
] as const;
export type BindFormEventTypes = typeof BindFormEventValues[number];

export const BindKeyboardEventValues = [
  'onkeydown',
  'onkeypress',
  'onkeyup',
] as const;
export type BindKeyboardEventTypes = typeof BindKeyboardEventValues[number];

export const BindMouseEventValues = [
  'onclick',
  'ondblclick',
  'onmousedown',
  'onmousemove',
  'onmouseout',
  'onmouseover',
  'onmouseup',
  'onmousewheel',
  'onwheel',
] as const;
export type BindMouseEventTypes = typeof BindMouseEventValues[number];

export const BindDragEventValues = [
  'ondrag',
  'ondragend',
  'ondragenter',
  'ondragleave',
  'ondragover',
  'ondragstart',
  'ondrop',
  'onscroll',
] as const;
export type BindDragEventTypes = typeof BindDragEventValues[number];

export const BindClipboardEventValues = [
  'oncopy',
  'oncut',
  'onpaste',
] as const;
export type BindClipboardEventTypes = typeof BindClipboardEventValues[number];

// export const BindFocusEventValues = ['onblur', 'onfocus'] as const;
// export type BindFocusEventTypes = typeof BindFocusEventValues[number];

export const BindEventValues = [
  ...BindWindowEventAttributeValues,
  ...BindFormEventValues,
  ...BindKeyboardEventValues,
  ...BindMouseEventValues,
  ...BindDragEventValues,
  ...BindClipboardEventValues,
];

/**
 * These are 'custom' bind types that imitate structural directive/components in other frameworks
 */
export const BindCodeTypeValues = ['if', 'foreach'] as const;
export type BindCodeTypes = typeof BindCodeTypeValues[number];

export const BindHTMLValues = [
  'innerhtml',
  'innertext',
  'interpolation',
  'class',
] as const;
export type BindHTMLTypes = typeof BindHTMLValues[number];

// To add more binding types/logic first add them to this array then, for behavior add its function to the BindHandlers Object
export const BindValues = [
  // HTMLElement binds
  ...BindHTMLValues,
  // Code like binds
  ...BindCodeTypeValues,
  // Event binds
  ...BindEventValues,
] as const;
export type BindTypes = typeof BindValues[number];
// export const LowerCasedBindValues = BindValues.map(value =>
//   value.toLowerCase()
// );

export type BindHandlers = {
  [key in BindTypes]: (bind: IHTMLBindHandler, context: any) => HTMLElement[] | void;
};

export interface IBind {
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
  bind?: object;
  /**
   * Alias that will be used within the template context, so you can use that alias instead of the 'this' keyword
   */
  bindAs?: string | null;
  /**
   * Executed once all bindings have been checked for the container
   */
  ready: () => void;
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
  // innerHTML?: string; 
}

export interface IRendererBindMaps {
  [key: string]: IRendererBind;
}

export interface IRendererBind {
  affects: HTMLBindHandler[];
}
