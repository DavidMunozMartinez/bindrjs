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
