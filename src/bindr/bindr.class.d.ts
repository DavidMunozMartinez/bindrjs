import { BindTypes, BindCodeTypes, BindHTMLTypes, BindKeyboardEventTypes, BindMouseEventTypes, BindFocusEventTypes, IRenderer } from './bindr-model';
export default class Bind {
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
    /**
     * This is a flattened map of all our values in the bind object, all keys are strings that represent
     * the path to the value and all values in this object are primitive values strings, numbers, booleans
     * or arrays, arrays are still tricky, will revisit soon
     */
    private values;
    private proxies;
    constructor(data: IRenderer);
    private objectProxy;
    private objectProxyHandler;
    /**
     * Finds the BindHandlers that are affected by the updated property and
     * re-computes any necessary DOM changes
     * @param path Path to the property being updated
     */
    update(path: string): void;
    /**
     * This is a somewhat expensive function in an attempt to keep the data/DOM updates as quick as possible,
     * we iterate over all nodes in the container and create a BindHandler which holds a reference of the element
     * and the necessary data to compute DOM changes when a property that concerns the handler is updated
     * TODO: Make is so it only checks the new element for bind data connections instead of re-mapping everything
     * when we add more elements
     */
    private defineBinds;
    private recurseContainer;
    private getTemplateBinds;
    private getAttrBindsFromElement;
    /**Maybe execute this in the entire container once to allow for string interpolation anywhere? */
    private getInterpolationBindsFromElement;
    isMouseEventType(keyInput: BindTypes): keyInput is BindMouseEventTypes;
    isKeyboardEventType(keyInput: BindTypes): keyInput is BindKeyboardEventTypes;
    isFocusEventType(keyInput: BindTypes): keyInput is BindFocusEventTypes;
    isCodeBindType(keyInput: BindTypes): keyInput is BindCodeTypes;
    isHTMLBindType(keyInput: BindTypes): keyInput is BindHTMLTypes;
}
