export declare function evaluateDOMExpression(expression: string, context?: any): unknown;
export declare function recurseElementNodes(element: HTMLElement, callback: (element: HTMLElement) => void, ignoreSelf?: boolean): any;
export declare function interpolateText(text: string, context: any): string;
