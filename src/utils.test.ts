import {evaluateDOMExpression, findAndReplaceVariable} from './utils';

interface example {
  text: string;
  expected: string;
}

describe('Utils tests', () => {
  describe('findAndReplaceVariable', () => {
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
      {
        text: '!data.title',
        expected: '!array[0].title',
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

  describe('evaluateDOMExpression', () => {
    it('returns the value of a simple expression', () => {
      expect(evaluateDOMExpression('this.value', {value: 42})).toBe(42);
    });

    it('returns identifiers whose name merely contains "return"', () => {
      // Regression: indexOf('return') used to misfire here and yield undefined
      expect(
        evaluateDOMExpression('this.returnLabel', {returnLabel: 'ok'})
      ).toBe('ok');
    });

    it('still supports expressions with an explicit return keyword', () => {
      expect(
        evaluateDOMExpression('return this.a + this.b', {a: 1, b: 2})
      ).toBe(3);
    });

    it('reuses the same compiled function for identical expressions', () => {
      expect(evaluateDOMExpression('this.n * 2', {n: 5})).toBe(10);
      expect(evaluateDOMExpression('this.n * 2', {n: 6})).toBe(12);
    });
  });
});
