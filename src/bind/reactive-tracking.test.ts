import {Bind} from './bind.class';

/**
 * These tests exercise getter-based dependency tracking end-to-end through a
 * real Bind instance (jsdom). They cover the scenarios the old static
 * string-matching couldn't reliably handle:
 *   - deep nested property updates
 *   - bracket-notation keys (a['b'])
 *   - dynamic index access (a[i])
 *   - properties that didn't exist at bind time (progressive reveal)
 *
 * The render happens via text interpolation, so we assert by reading the
 * container's textContent after each data mutation.
 */
describe('Getter-based dependency tracking', () => {
  // Rendering is async (template resolves on a microtask, `ready` fires after),
  // so we resolve once the first bind pass has completed. Data mutations after
  // that point trigger compute synchronously, so they need no awaiting.
  function mount<T extends object>(template: string, data: T) {
    const id = 'tracking-' + Math.random().toString(36).slice(2);
    const host = document.createElement('div');
    host.id = id;
    document.body.appendChild(host);
    return new Promise<{bind: T; text: () => string}>(resolve => {
      const {bind} = new Bind<T>({
        id,
        template,
        bind: data,
        ready: () =>
          resolve({bind, text: () => (host.textContent || '').trim()}),
      });
    });
  }

  it('reacts to a deep nested property change', async () => {
    const {bind, text} = await mount('<span>${this.user.profile.name}</span>', {
      user: {profile: {name: 'Ada'}},
    });
    expect(text()).toBe('Ada');
    bind.user.profile.name = 'Grace';
    expect(text()).toBe('Grace');
  });

  it('reacts to bracket-notation keys (a[\'b\'])', async () => {
    const {bind, text} = await mount(`<span>\${this.data['my-key']}</span>`, {
      data: {'my-key': 'hello'} as {[k: string]: string},
    });
    expect(text()).toBe('hello');
    bind.data['my-key'] = 'world';
    expect(text()).toBe('world');
  });

  it('reacts to dynamic index access (a[i])', async () => {
    const {bind, text} = await mount('<span>${this.items[this.idx]}</span>', {
      items: ['a', 'b', 'c'],
      idx: 0,
    });
    expect(text()).toBe('a');
    // Changing the index re-renders to the new slot...
    bind.idx = 2;
    expect(text()).toBe('c');
    // ...and changing the item currently pointed at re-renders too.
    bind.items[2] = 'C';
    expect(text()).toBe('C');
  });

  it('reacts to a property that did not exist at bind time', async () => {
    // `greeting` is undefined initially: reading it still records the path as a
    // dependency, so setting it later triggers a re-render (this is what made
    // the old `isNew` special-case unnecessary).
    const {bind, text} = await mount('<span>${this.greeting || "none"}</span>', {} as {
      greeting?: string;
    });
    expect(text()).toBe('none');
    bind.greeting = 'hi';
    expect(text()).toBe('hi');
  });

  it('reacts to a nested property added after bind time', async () => {
    const {bind, text} = await mount(
      '<span>${this.config.theme || "default"}</span>',
      {config: {} as {theme?: string}}
    );
    expect(text()).toBe('default');
    bind.config.theme = 'dark';
    expect(text()).toBe('dark');
  });
});
