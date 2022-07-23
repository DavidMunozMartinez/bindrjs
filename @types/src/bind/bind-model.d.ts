import { HTMLBindHandler } from './bind-handlers/bind-handler';
/**
 * Events triggered for the window object (applies to the <body> tag):
 */
export declare const BindWindowEventAttributeValues: readonly ["onafterprint", "onbeforeprint", "onbeforeunload", "onerror", "onhashchange", "onload", "onmessage", "onoffline", "ononline", "onpagehide", "onpageshow", "onpopstate", "onresize", "onstorage", "onunload"];
export declare type BindWindowEventAttributeTypes = typeof BindWindowEventAttributeValues[number];
/**
 * Events triggered by actions inside a HTML form (applies to almost all HTML elements, but is most used in form elements):
 */
export declare const BindFormEventValues: readonly ["onblur", "onchange", "oncontextmenu", "onfocus", "oninput", "oninvalid", "onreset", "onsearch", "onselect", "onsubmit"];
export declare type BindFormEventTypes = typeof BindFormEventValues[number];
export declare const BindKeyboardEventValues: readonly ["onkeydown", "onkeypress", "onkeyup"];
export declare type BindKeyboardEventTypes = typeof BindKeyboardEventValues[number];
export declare const BindMouseEventValues: readonly ["onclick", "ondblclick", "onmousedown", "onmousemove", "onmouseleave", "onmouseout", "onmouseover", "onmouseup", "onmousewheel", "onwheel"];
export declare type BindMouseEventTypes = typeof BindMouseEventValues[number];
export declare const BindDragEventValues: readonly ["ondrag", "ondragend", "ondragenter", "ondragleave", "ondragover", "ondragstart", "ondrop", "onscroll"];
export declare type BindDragEventTypes = typeof BindDragEventValues[number];
export declare const BindClipboardEventValues: readonly ["oncopy", "oncut", "onpaste"];
export declare type BindClipboardEventTypes = typeof BindClipboardEventValues[number];
export declare const BindEventValues: ("onafterprint" | "onbeforeprint" | "onbeforeunload" | "onerror" | "onhashchange" | "onload" | "onmessage" | "onoffline" | "ononline" | "onpagehide" | "onpageshow" | "onpopstate" | "onresize" | "onstorage" | "onunload" | "onblur" | "onchange" | "oncontextmenu" | "onfocus" | "oninput" | "oninvalid" | "onreset" | "onsearch" | "onselect" | "onsubmit" | "onkeydown" | "onkeypress" | "onkeyup" | "onclick" | "ondblclick" | "onmousedown" | "onmousemove" | "onmouseleave" | "onmouseout" | "onmouseover" | "onmouseup" | "onmousewheel" | "onwheel" | "ondrag" | "ondragend" | "ondragenter" | "ondragleave" | "ondragover" | "ondragstart" | "ondrop" | "onscroll" | "oncopy" | "oncut" | "onpaste")[];
/**
 * These are 'custom' bind types that imitate structural directive/components in other frameworks
 */
export declare const BindCodeTypeValues: readonly ["if", "foreach"];
export declare type BindCodeTypes = typeof BindCodeTypeValues[number];
export declare const BindHTMLValues: readonly ["innerhtml", "innertext", "interpolation", "class", "attr", "style"];
export declare type BindHTMLTypes = typeof BindHTMLValues[number];
export declare const BindValues: readonly ["innerhtml", "innertext", "interpolation", "class", "attr", "style", "if", "foreach", ...("onafterprint" | "onbeforeprint" | "onbeforeunload" | "onerror" | "onhashchange" | "onload" | "onmessage" | "onoffline" | "ononline" | "onpagehide" | "onpageshow" | "onpopstate" | "onresize" | "onstorage" | "onunload" | "onblur" | "onchange" | "oncontextmenu" | "onfocus" | "oninput" | "oninvalid" | "onreset" | "onsearch" | "onselect" | "onsubmit" | "onkeydown" | "onkeypress" | "onkeyup" | "onclick" | "ondblclick" | "onmousedown" | "onmousemove" | "onmouseleave" | "onmouseout" | "onmouseover" | "onmouseup" | "onmousewheel" | "onwheel" | "ondrag" | "ondragend" | "ondragenter" | "ondragleave" | "ondragover" | "ondragstart" | "ondrop" | "onscroll" | "oncopy" | "oncut" | "onpaste")[]];
export declare type BindTypes = typeof BindValues[number];
export declare type BindHandlers = {
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
    attribute: string | null;
}
export interface IRendererBindMaps {
    [key: string]: IRendererBind;
}
export interface IRendererBind {
    affects: HTMLBindHandler[];
}
