import { IHTMLBindHandler } from "./../bind-model";
import { HTMLBindHandler } from "./bind-handler";

describe('Class bind handler', () => {
  let classes: string[] = [];
  let element = {
    isConnected: true,
    classList: {
      add: (className: string) => classes.push(className),
      remove: (className: string) => {
        let index = classes.indexOf(className);
        index > -1 ? classes.splice(index, 0) : null;
      },
      contains: (className: string) => classes.indexOf(className) > -1 
    },
  } as unknown as HTMLElement;

  let data: IHTMLBindHandler = {
    element: element,
    type: 'class',
    expression: 'false',
    attribute: ':class'
  };

  describe('Boolean classes test', () => {
    
    beforeEach(() => {
      classes = [];
    })
    
    it('Should apply the class', () => {
      data.attribute = ':class:test';
      data.expression = 'true';
      let handler = new HTMLBindHandler(data);
      handler.compute({});
      expect(classes.length).toBe(1);
      handler.compute({});
      expect(classes.length).toBe(1);
    });

    it('Should NOT apply boolean class', () => {
      data.expression = 'false';
      let handler = new HTMLBindHandler(data);
      handler.compute({});
      expect(classes.length).toBe(0);
      handler.compute({});
      expect(classes.length).toBe(0);
    });

    it('Should keep boolean class as is (applied)', () => {
      data.expression = 'true';
      data.attribute = ':class:test'
      classes = ['test'];
      let handler = new HTMLBindHandler(data);
      handler.compute({});
      expect(classes.length).toBe(1);
      handler.compute({});
      expect(classes.length).toBe(1);
    });
  });
});