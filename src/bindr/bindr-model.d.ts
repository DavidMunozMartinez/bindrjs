import { HTMLBindHandler } from './bind-handler';
export declare const BindMouseEventValues: readonly ["onclick", "ondblclick", "ondrag", "ondragend", "ondragenter", "ondragleave", "ondragover", "ondragstart", "ondrop", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onscroll"];
export declare type BindMouseEventTypes = typeof BindMouseEventValues[number];
export declare const BindKeyboardEventValues: readonly ["onkeydown", "onkeypress", "oninput"];
export declare type BindKeyboardEventTypes = typeof BindKeyboardEventValues[number];
export declare const BindFocusEventValues: readonly ["onblur", "onfocus"];
export declare type BindFocusEventTypes = typeof BindFocusEventValues[number];
export declare const BindableEventValues: ("onclick" | "ondblclick" | "ondrag" | "ondragend" | "ondragenter" | "ondragleave" | "ondragover" | "ondragstart" | "ondrop" | "onmousedown" | "onmousemove" | "onmouseout" | "onmouseover" | "onmouseup" | "onscroll" | "onkeydown" | "onkeypress" | "oninput" | "onblur" | "onfocus")[];
/**
 * These are 'custom' bind types that imitate structural directive/components in other frameworks
 */
export declare const BindCodeTypeValues: readonly ["if", "forEach"];
export declare type BindCodeTypes = typeof BindCodeTypeValues[number];
export declare const BindHTMLValues: readonly ["innerHTML", "innerText", "class", "style", "attr"];
export declare type BindHTMLTypes = typeof BindHTMLValues[number];
export declare const BindValues: readonly ["innerHTML", "innerText", "class", "style", "attr", "if", "forEach", "onclick", "ondblclick", "ondrag", "ondragend", "ondragenter", "ondragleave", "ondragover", "ondragstart", "ondrop", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onscroll", "onkeydown", "onkeypress", "oninput", "onblur", "onfocus"];
export declare type BindTypes = typeof BindValues[number];
export declare const LowerCasedBindValues: string[];
export declare type BindHandlers = {
    [key in BindTypes]: (bind: ITemplateBind) => void;
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
export interface ITemplateBind {
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
