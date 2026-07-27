import {Bind} from './bind.class';

const {isProxy} = require('util').types;

/**
 * Multi-instance sharing semantics (see handoff §4d / §6):
 *
 * The dashboard binds the SAME underlying store objects into several Bind
 * instances at once. The contract is per-instance isolation:
 *   - each instance reacts to writes made through its OWN proxies,
 *   - one instance (re)assigning the shared object must not steal or silence
 *     another instance's subscriptions,
 *   - and the shared raw object itself must stay a plain object — no marker
 *     properties, no proxies planted inside it (pre-1.5.1 both happened,
 *     which kept every historical Bind + its detached DOM alive forever and
 *     fired all of their pipelines on every write).
 */
describe('two Bind instances sharing one object', () => {
  function mount(id: string, shared: any) {
    const host = document.createElement('div');
    host.id = id;
    document.body.appendChild(host);
    let fired = 0;
    return new Promise<{b: Bind<any>; fired: () => number; text: () => string}>(resolve => {
      const b: Bind<any> = new Bind<any>({
        id,
        template: `<span>\${this.user.profile.name}</span>`,
        bind: {user: shared},
        ready: () => resolve({b, fired: () => fired, text: () => (host.textContent || '').trim()}),
      });
      b.onChange = () => fired++;
    });
  }

  it('each instance keeps firing through its own proxy; the raw stays clean', async () => {
    document.body.innerHTML = '';
    const shared = {profile: {name: 'Ada'}};
    const a = await mount('shared-a', shared);
    const c = await mount('shared-b', shared);
    expect(a.text()).toBe('Ada');
    expect(c.text()).toBe('Ada');

    // The shared raw is not contaminated: no marker, no planted proxies.
    expect(Object.prototype.hasOwnProperty.call(shared, '__isProxy')).toBe(false);
    expect(isProxy(shared.profile)).toBe(false);

    // A write through A fires A (and only A — no cross-instance stacking),
    // and A's own DOM re-renders.
    const aBefore = a.fired(), cBefore = c.fired();
    a.b.bind.user.profile.name = 'Grace';
    expect(a.fired()).toBe(aBefore + 1);
    expect(c.fired()).toBe(cBefore);
    expect(a.text()).toBe('Grace');
    expect(shared.profile.name).toBe('Grace');

    // B still reacts through its own wrappers: reassigning the shared object
    // into B re-renders it with the current data...
    c.b.bind.user = shared;
    expect(c.text()).toBe('Grace');

    // ...and after that reassignment, A's subscriptions are still intact.
    const aAfter = a.fired();
    a.b.bind.user.profile.name = 'Hopper';
    expect(a.fired()).toBe(aAfter + 1);
    expect(a.text()).toBe('Hopper');
    expect(shared.profile.name).toBe('Hopper');

    // And writes through B's own proxy fire B + update B's DOM.
    const cAfter = c.fired();
    c.b.bind.user.profile.name = 'Lovelace';
    expect(c.fired()).toBe(cAfter + 1);
    expect(c.text()).toBe('Lovelace');
    expect(shared.profile.name).toBe('Lovelace');

    // Stable identity: reading the same path twice yields the same proxy
    // (no re-wrap per read).
    expect(a.b.bind.user.profile).toBe(a.b.bind.user.profile);
  });
});

describe('one raw object mounted at two paths in one Bind', () => {
  /**
   * The dashboard grid renders device tiles through `this.groups[g].devices[j]`
   * while services write display fields through `this.devices[i]` — the same
   * raw object mounted at two paths. A write through either mount point must
   * re-render handlers that read through the other (pre-1.5.1 this worked by
   * accident, via stacked proxy layers double-recording dependencies).
   */
  it('a write through one mount point re-renders reads through the other', async () => {
    document.body.innerHTML = '';
    const device = {id: 'd1', camHealth: 'live'};
    const host = document.createElement('div');
    host.id = 'alias-host';
    document.body.appendChild(host);
    const b = await new Promise<Bind<any>>(resolve => {
      const inst: Bind<any> = new Bind<any>({
        id: 'alias-host',
        template: '<span>${this.groups[0].devices[0].camHealth}</span>',
        bind: {devices: [device], groups: [{zone: 'entrance', devices: [device]}]},
        ready: () => resolve(inst),
      });
    });
    expect((host.textContent || '').trim()).toBe('live');

    // The template reads ONLY through this.groups[0].devices[0]; write through
    // the this.devices[0] mount point instead.
    b.bind.devices[0].camHealth = 'privacy';
    expect((host.textContent || '').trim()).toBe('privacy');
    expect(device.camHealth).toBe('privacy');
  });
});
