import { BindTypes, IHTMLBindHandler } from './bind-model';
export declare class HTMLBindHandler {
    type: BindTypes;
    element: HTMLElement;
    result: unknown;
    previous: unknown;
    isAffectedBy: any[];
    expression: string;
    HTML?: string;
    computed?: boolean;
    constructor(templateBind: IHTMLBindHandler);
    /**
     * Can return an element or part of element that needs rebinding
     * @param context Context that will be given to the template
     */
    compute(context: any): HTMLElement[] | void;
    /**
     * Hear me out:
     * All ':if' binds are replaced by a comment marker and the actual HTML is stored in the HTMLBindHandler
     * The ':if' bind type could entirely remove the element from the DOM so we need to always have an anchor point
     * to the DOM to know where this HTMLBindHandler should apply modifications, because the nature of recursing the DOM
     * the contents of the ':if' bind won't be checked (because its replaced by a comment marker), which is expected.
     * Only when the condition is true, and the content rendered, we validate its content for more HTMLBindHandlers
     */
    private replaceForMarker;
}
