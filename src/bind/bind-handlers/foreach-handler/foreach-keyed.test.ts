import {Bind} from '../../bind.class';

/**
 * Keyed :foreach (:key="...") tests. These verify the common-prefix diff:
 *   - unchanged key lists reuse existing DOM nodes (no teardown)
 *   - appends only build the new tail (prefix nodes preserved)
 *   - middle/reorder edits rebuild the affected suffix correctly
 *
 * DOM-node reuse is checked by stamping a live element with a custom property
 * and asserting the same element is still in place after a mutation.
 */
interface Row {
  id: number;
  label: string;
}

describe('Keyed :foreach', () => {
  function mount(list: Row[]) {
    const id = 'keyed-' + Math.random().toString(36).slice(2);
    const host = document.createElement('div');
    host.id = id;
    document.body.appendChild(host);
    return new Promise<{
      bind: {list: Row[]};
      rows: () => HTMLElement[];
      labels: () => string[];
    }>(resolve => {
      const {bind} = new Bind<{list: Row[]}>({
        id,
        template:
          '<span :foreach="item in this.list" :key="item.id" class="row">${item.label}</span>',
        bind: {list},
        ready: () => {
          const rows = () =>
            Array.from(host.getElementsByClassName('row')) as HTMLElement[];
          const labels = () => rows().map(r => (r.textContent || '').trim());
          resolve({bind, rows, labels});
        },
      });
    });
  }

  it('reuses existing DOM nodes when the key list is unchanged', async () => {
    const {bind, rows} = await mount([
      {id: 1, label: 'a'},
      {id: 2, label: 'b'},
    ]);
    expect(rows().length).toBe(2);
    (rows()[0] as any).__stamp = 'KEEP';

    // Re-assign to a structurally-identical list (new objects, same ids).
    bind.list = [
      {id: 1, label: 'a'},
      {id: 2, label: 'b'},
    ];

    expect(rows().length).toBe(2);
    // Same key sequence => no rebuild => the stamped node survives.
    expect((rows()[0] as any).__stamp).toBe('KEEP');
  });

  it('only builds the appended tail, preserving prefix nodes', async () => {
    const {bind, rows, labels} = await mount([
      {id: 1, label: 'a'},
      {id: 2, label: 'b'},
    ]);
    (rows()[0] as any).__stamp = 'KEEP';

    bind.list.push({id: 3, label: 'c'});

    expect(labels()).toEqual(['a', 'b', 'c']);
    expect((rows()[0] as any).__stamp).toBe('KEEP');
  });

  it('removes only the truncated tail', async () => {
    const {bind, rows, labels} = await mount([
      {id: 1, label: 'a'},
      {id: 2, label: 'b'},
      {id: 3, label: 'c'},
    ]);
    (rows()[0] as any).__stamp = 'KEEP';

    bind.list.pop();

    expect(labels()).toEqual(['a', 'b']);
    expect((rows()[0] as any).__stamp).toBe('KEEP');
  });

  it('rebuilds the suffix correctly on a middle insert', async () => {
    const {bind, labels} = await mount([
      {id: 1, label: 'a'},
      {id: 2, label: 'b'},
      {id: 3, label: 'c'},
    ]);

    bind.list.splice(1, 0, {id: 9, label: 'z'});

    expect(labels()).toEqual(['a', 'z', 'b', 'c']);
  });

  it('stays correct after a reorder', async () => {
    const {bind, labels} = await mount([
      {id: 1, label: 'a'},
      {id: 2, label: 'b'},
      {id: 3, label: 'c'},
    ]);

    bind.list = [
      {id: 3, label: 'c'},
      {id: 2, label: 'b'},
      {id: 1, label: 'a'},
    ];

    expect(labels()).toEqual(['c', 'b', 'a']);
  });

  it('reacts to an item property change without rebuilding the node', async () => {
    const {bind, rows, labels} = await mount([
      {id: 1, label: 'a'},
      {id: 2, label: 'b'},
    ]);
    (rows()[1] as any).__stamp = 'KEEP';

    bind.list[1].label = 'B';

    expect(labels()).toEqual(['a', 'B']);
    // Item-property change must not re-run :foreach, so the node is preserved.
    expect((rows()[1] as any).__stamp).toBe('KEEP');
  });
});
