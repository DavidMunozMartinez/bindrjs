import { HTMLBindHandler } from './bind-handler';
import { IHTMLBindHandler } from '../bind-model';

describe('Test bind handlers', () => {
  describe('HTML class bind handler', () => {

    document.body.innerHTML = `
      <div :class:visible="true">
      </div>
    `

    let classHandler = new HTMLBindHandler({
      type: 'class',
      attribute: ':class:visible',
      expression: 'true',
      element: document.body.firstChild as HTMLElement
    });

    console.log(classHandler);
  });
});