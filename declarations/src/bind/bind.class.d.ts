import { HTMLBindHandler } from './bind-handlers/bind-handler';
import { BindTypes, BindCodeTypes, BindHTMLTypes, BindKeyboardEventTypes, BindMouseEventTypes, IBind } from './bind-model';
export default class Bind {
    bind: object;
    bindAs?: string | null;
    ready: () => void;
    templateRendered: () => void;
    templateBinded: () => void;
    private id;
    private container;
    /**
     * Holds all bind data and the HTMLBindHandlers that it affects so when its data is updated
     * we can quickly update all the DOM binds that depend on it
     */
    private DataBindHandlers;
    /**
     * Holds all the DOM Handlers found in the container, these are referenced in the
     * DataBindHandlers when any value in the bind object is updated
     */
    private DOMBindHandlers;
    /**
     * This is a flattened map of all our values in the bind object, all keys are strings that represent
     * the path to the value and all values in this object are primitive values strings, numbers, booleans
     * or arrays, arrays are still tricky, will revisit soon
     */
    private values;
    /**
     * This is a flattened map of all proxies created to handle data reactivity, there should always be
     * ONE proxy per object found in the bind passed from the user (including the bind itself).
     */
    private proxies;
    constructor(data: IBind);
    private objectProxy;
    private isArray;
    private needsProxy;
    private objectProxyHandler;
    private initTemplate;
    /**
     * Finds the BindHandlers that are affected by the updated property and
     * re-computes any necessary DOM changes
     * @param path Path to the property being updated
     */
    private update;
    /**
     * This is a somewhat expensive function in an attempt to keep the data/DOM updates as quick as possible,
     * we iterate over all nodes in the container and create a BindHandler which holds a reference of the element
     * and the necessary data to compute DOM changes when a property that concerns the handler is updated
     * TODO: Make is so it only checks the new element for bind data connections instead of re-mapping everything
     * when we add more elements
     */
    private defineBinds;
    private propKeyUsedInExpression;
    private getTemplateBinds;
    private getAttrBindsFromElement;
    /**Maybe execute this in the entire container once to allow for string interpolation anywhere? */
    private getInterpolationBindsFromElement;
    private validateTemplate;
    private cleanHandlers;
    isMouseEventType(keyInput: BindTypes): keyInput is BindMouseEventTypes;
    isKeyboardEventType(keyInput: BindTypes): keyInput is BindKeyboardEventTypes;
    isCodeBindType(keyInput: BindTypes): keyInput is BindCodeTypes;
    isHTMLBindType(keyInput: BindTypes): keyInput is BindHTMLTypes;
    CustomHandler(name: string, compute: (handler: HTMLBindHandler, context: any) => HTMLElement[] | null): void;
}
