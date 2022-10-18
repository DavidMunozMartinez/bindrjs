import { Bind } from "../../bind.class";

describe('Foreach bind handler', () => {
  describe('Elements count', () => {
    document.body.innerHTML = '<div id="test-node"></div>'
    const { bind } = new Bind<{items: number[]}>({
      id: 'test-node',
      template: `
        <div :foreach="item in this.items" class="find-me"></div>
      `,
      bind: {
        items: []
      }
    });
    it('Should have 0 elements', () => {
      expect(find()).toBe(0);
    });
  
    it('Should find 5 elements (re-assign array)', () => {
      bind.items = [0,1,2,3,4];
      expect(find()).toBe(5);
    });

    it('Should find 4 elements (splice array)', () => {
      bind.items.splice(0, 1);
      expect(find()).toBe(4);
    });

    it('Should find 3 elements (shift array)', () => {
      bind.items.shift();
      expect(find()).toBe(3);
    });

    it('Should find 4 elements (push array)', () => {
      bind.items.push(bind.items.length);
      expect(find()).toBe(4);
    });

    it('Should find 5 elements (unshift array)', () => {
      bind.items.unshift(-1);
      expect(find()).toBe(5);
    });
  
    function find() {
      return document.getElementsByClassName('find-me').length || 0;
    }
  });

  describe('Elements reactivity', () => {
    // 
  });
});