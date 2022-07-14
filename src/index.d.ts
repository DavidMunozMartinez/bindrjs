/**
 * Bindable mouse events (This should only contains valid HTML event keywords for ease of use)
 */
import { BindTypes, BindCodeTypes, BindHTMLTypes, BindKeyboardEventTypes, BindMouseEventTypes, BindFocusEventTypes } from './bindr-model';
export default class Bindr {
    id: string;
    template?: string;
    bind: any;
    container: HTMLElement;
    bindAs?: string | null;
    /**
     * Holds all bind data and the templateBinds that it affects so when its data os updated
     * we can quickly update all the binds that depend on it
     */
    private rendererBinds;
    private templateBinds;
    /**
     * Dynamically created all bindHandler functions for Mouse/Keyboard Events
     */
    private eventBindHandlers;
    /**
     * These functions are the core functionality of this library, each bind type ends up executing one of these functions which
     * each manipulates a referenced HTMLElement or DOM in a very specific way that should react to the data changes or events
     * These are executed when data changes and there is a DOM bind that depends on that data
     */
    private bindHandlers;
    values: any;
    constructor(data: IRenderer);
    private objectProxy;
    private objectProxyHandler;
    /**
     * Executed each time one of the bind properties is updated by the use or JS Proxy API
     * this is a intermediate process between the setters and getters of the bind properties sent
     * trough the Renderer class
     * @param target
     * @param key
     * @param value
     */
    update(target: any, key: string | symbol, value: any): boolean;
    private defineBinds;
    /**
     * This is to validate that the binds object contains valid values
     * @param bins Object containing all the data that will be binded
     * @returns
     */
    private validateBindProps;
    private evaluateDOMExpression;
    private getTemplateBinds;
    private getTemplateBindingData;
    isMouseEventType(keyInput: BindTypes): keyInput is BindMouseEventTypes;
    isKeyboardEventType(keyInput: BindTypes): keyInput is BindKeyboardEventTypes;
    isFocusEventType(keyInput: BindTypes): keyInput is BindFocusEventTypes;
    isCodeBindType(keyInput: BindTypes): keyInput is BindCodeTypes;
    isHTMLBindType(keyInput: BindTypes): keyInput is BindHTMLTypes;
}
interface IRenderer {
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
export {};
