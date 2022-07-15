import { BindTypes, BindCodeTypes, BindHTMLTypes, BindKeyboardEventTypes, BindMouseEventTypes, BindFocusEventTypes, IRenderer } from './bindr-model';
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
    private DataBindHandlers;
    private DOMBindHandlers;
    private primitiveValues;
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
    /**
     * Does a check in the renderer container to look for tempalte bindings and properly create the renderer
     * bind mapings
     */
    updateBinds(): void;
    /**
     * This is a somewhat expensive function in an attempt to keep the data/DOM updates as quick as possible,
     * we iterate over all found bindings and create a helper object with enough references to perform quick
     * updates whenever a binded property is updated
     * TODO: Make is so it only checks the new element for bind data connections instead of re-mapping everything
     */
    private defineBinds;
    private recurseContainer;
    private getTemplateBinds;
    isMouseEventType(keyInput: BindTypes): keyInput is BindMouseEventTypes;
    isKeyboardEventType(keyInput: BindTypes): keyInput is BindKeyboardEventTypes;
    isFocusEventType(keyInput: BindTypes): keyInput is BindFocusEventTypes;
    isCodeBindType(keyInput: BindTypes): keyInput is BindCodeTypes;
    isHTMLBindType(keyInput: BindTypes): keyInput is BindHTMLTypes;
    shouldComputeWhenFound(type: BindTypes): boolean;
}
