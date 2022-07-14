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
  'class',
  'style',
  'attr',
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
