import { BindTypes, IHTMLBindHandler } from './bind-model';
export declare class HTMLBindHandler {
    type: BindTypes;
    element: HTMLElement;
    result: unknown;
    previous: unknown;
    isAffectedBy: any[];
    expression: string;
    constructor(templateBind: IHTMLBindHandler);
    compute(context: any): void;
}
