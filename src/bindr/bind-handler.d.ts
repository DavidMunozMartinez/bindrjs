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
