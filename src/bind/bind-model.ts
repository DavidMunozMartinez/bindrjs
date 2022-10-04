import {DataChanges} from '../bind/reactive-data';
import {HTMLBindHandler} from './bind-handlers/bind-handler';

/**
 * These are 'custom' bind types that imitate structural directive/components in other frameworks
 */
export const BindCodeTypeValues = [
  'if',
  'else',
  'foreach',
  'index',
  'reanimate',
] as const;
export type BindCodeTypes = typeof BindCodeTypeValues[number];

export const BindHTMLValues = [
  'event',
  'innerhtml',
  'innertext',
  'interpolation',
  'class',
  'attr',
  'style',
] as const;
export type BindHTMLTypes = typeof BindHTMLValues[number];

// To add more binding types/logic first add them to this array then, for behavior add its function to the BindHandlers Object
export const BindValues = [
  // HTMLElement binds
  ...BindHTMLValues,
  // Code like binds
  ...BindCodeTypeValues,
] as const;
export type BindTypes = typeof BindValues[number];
// export const LowerCasedBindValues = BindValues.map(value =>
//   value.toLowerCase()
// );

export type BindHandlers = {
  [key in BindTypes]: (
    bind: HTMLBindHandler,
    context: any
  ) => void | HTMLElement[];
};

export interface IBind<T> {
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
  bind?: T;
  /**
   * Alias that will be used within the template context, so you can use that alias instead of the 'this' keyword
   */
  // bindAs?: string | null;
  /**
   * Executed once all bindings have been checked for the container
   */
  ready?: () => void;
  templateRendered?: () => void;
  templateBinded?: () => void;
  onChange?: (changes: DataChanges) => void;
}

export interface IHTMLBindHandler {
  element: HTMLElement;
  type: BindTypes;
  previous?: unknown;
  result?: unknown;
  expression: string;
  attribute: string | null;
}

export interface IRendererBindMaps {
  [key: string]: IRendererBind;
}

export interface IRendererBind {
  affects: HTMLBindHandler[];
}
