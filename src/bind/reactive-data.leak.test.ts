import {ReactiveData} from './reactive-data';

/**
 * Regression test for the unbounded `flatData` growth leak.
 *
 * `flatData` is a *set* of reactive dependency paths — every push site dedups
 * with `indexOf(...) === -1`. One site (the array `.length` path in
 * `_reactiveDeep`) originally skipped that guard, so every time an array was
 * (re)made reactive it re-appended `<path>.length`. Reassigning a reactive
 * array (a common render pattern) therefore grew `flatData` without bound —
 * millions of duplicate strings over a long-lived session, and `indexOf`
 * scans turned each update O(n²).
 *
 * These tests assert the path set stays bounded across repeated array
 * reassignment. Before the fix, `flatData.length` grew by the number of
 * arrays remade on every assignment.
 */
describe('flatData does not leak on array reassignment', () => {
  it('keeps the path set bounded across many array reassignments', () => {
    const rd = new ReactiveData({
      items: [1, 2, 3],
      nested: {list: ['a', 'b']},
    });
    const baseline = rd.flatData.length;

    for (let i = 0; i < 500; i++) {
      rd.reactive.items = [i, i + 1, i + 2]; // new array each time
      rd.reactive.nested = {list: [String(i), String(i + 1)]}; // new nested array
    }

    // Same shape in, same shape out — the path set must not have grown.
    expect(rd.flatData.length).toBe(baseline);
  });

  it("registers each array's .length path exactly once", () => {
    const rd = new ReactiveData({items: [1, 2, 3]});
    rd.reactive.items = [4, 5, 6];
    rd.reactive.items = [7, 8, 9];

    const lengthPaths = rd.flatData.filter(p => p === 'this.items.length');
    expect(lengthPaths).toEqual(['this.items.length']);
  });
});
