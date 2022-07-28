import {findAndReplaceVariable} from './utils';

interface example {
  text: string;
  expected: string;
}

describe('Find and replace local variable', () => {
  let localVarName = 'data';
  let arrayPointingAtIndex = 'array[0]';

  let examples: Array<example> = [
    {
      text: 'data',
      expected: 'array[0]',
    },
    {
      text: 'test.data + data.counter',
      expected: 'test.data + array[0].counter',
    },
    {
      text: 'testdata + data',
      expected: 'testdata + array[0]',
    },
    {
      text: '"data text" + data',
      expected: '"data text" + array[0]',
    },
    {
      text: "'data' + data",
      expected: "'data' + array[0]",
    },
    {
      text: 'data+data',
      expected: 'array[0]+array[0]',
    },
    {
      text: '" data + data "',
      expected: '" data + data "',
    },
    {
      text: '',
      expected: '',
    },
    {
      text: 'dataTest + data',
      expected: 'dataTest + array[0]',
    },
  ];

  examples.forEach(test => {
    it(`Works for example ${test.text}`, () => {
      expect(
        findAndReplaceVariable(test.text, localVarName, arrayPointingAtIndex)
      ).toBe(test.expected);
    });
  });
});
