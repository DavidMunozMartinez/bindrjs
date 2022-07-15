/**
 * Dynamically created all bindHandler functions for Mouse/Keyboard Events
 */
import { BindTypes, ITemplateBind } from './bindr-model';
export declare class HTMLBindHandler {
    type: BindTypes;
    element: HTMLElement;
    result: unknown;
    isAffectedBy: any[];
    expression: string;
    constructor(templateBind: ITemplateBind);
    compute(context: any): void;
}
