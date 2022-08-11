import { reactive } from "./reactive-data";

describe('reactive data tests', () => {
  describe('Shallow tests', () => {
    it('Should update shallow object', () => {
      let data = { key: 'value'};
      let updatedPath = null;
      let reactiveData = reactive(data);

      reactiveData.key = 'new value';
  
      expect(updatedPath).toBe('this');
      expect(data.key).toBe('new value');
    });

    it('Should update deep objects', () => {
      let data = {
        nestedData: {
          key: 'value' 
        }
      }
      let reactiveData = reactive(data);
      reactiveData.nestedData.key = 'new value';

      expect(reactiveData.nestedData.key).toBe('new value');
      expect(data.nestedData.key).toBe('new value');
    });
  });
});