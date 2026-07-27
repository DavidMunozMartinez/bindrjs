import {Bind} from './bind.class';
import {toRaw} from './reactive-data';

const {isProxy} = require('util').types;

/**
 * Regression test for re-proxy compounding (the automation-builder freeze).
 *
 * Pre-1.5.1, every object reassignment stacked one more Proxy layer onto each
 * nested child that survived by reference (`_reactiveDeep` never unwrapped
 * already-proxied children, and the set trap's clone was shallow). Repeated
 * reassignment — the library's own documented re-render idiom — was therefore
 * superquadratic: over 24 staged "arms" the per-add cost grew ~500× and
 * re-reading the SAME field of the SAME object got ~30× slower.
 *
 * The workload below mirrors the dashboard automation builder's state shape:
 * shared device objects in `targets`, each staged arm capturing a device ref,
 * each stage doing `arms = [...arms, arm]`. See
 * docs/plans/BINDRJS_REPROXY_PERF_HANDOFF.md in the home-hub workspace.
 */

function device(i: number) {
  return {
    id: 'dev' + i, name: 'Device ' + i, type: 'value', deviceCategory: 'dimmable-light',
    value: 0, manual: false, zone: 'zone' + i, operationalRanges: [] as any[],
    channels: [{ key: 'brightness', role: 'actuator', kind: 'number', writable: true }],
  };
}

test('arms reassign must not compound proxy depth', async () => {
  document.body.innerHTML = '<div id="bench"></div>';
  const b = await new Promise<Bind<any>>(resolve => {
    const instance: Bind<any> = new Bind<any>({
      id: 'bench',
      template: `
        <div :foreach="arm in this.data.arms" :key="arm.label"><span>\${arm.label}</span></div>
        <p>\${this.data.arms ? this.data.arms.length : 0} staged — \${this.data.device ? this.data.device.name : ''}</p>`,
      bind: { data: {} },
      ready: () => resolve(instance),
    });
  });
  const bind: any = b.bind;
  bind.data = {
    targets: Array.from({ length: 6 }, (_, i) => ({ device: device(i), label: 'Device ' + i })),
    arms: [], device: null, setTo: null,
  };
  const d = bind.data;
  const rows: {i: number; addMs: number; readMs: number; flat: number}[] = [];
  for (let i = 0; i < 24; i++) {
    const t0 = performance.now();
    d.device = d.targets[i % 6].device;          // pick through reactive targets
    d.setTo = i;
    d.arms = [...d.arms, { device: d.device, setTo: i, label: 'arm-' + i }]; // stage
    d.device = null; d.setTo = null;             // editor reset
    const addMs = performance.now() - t0;
    const r0 = performance.now();
    for (let k = 0; k < 2000; k++) void d.arms[0].device.name;   // depth probe
    const readMs = performance.now() - r0;
    rows.push({ i, addMs: +addMs.toFixed(2), readMs: +readMs.toFixed(2), flat: (b as any)._reactive.flatData.length });
  }
  console.table(rows);

  // Depth stays 1: what an item proxy wraps is a raw object, not another proxy.
  expect(isProxy(d.arms[0].device)).toBe(true);
  expect(isProxy(toRaw(d.arms[0].device))).toBe(false);

  // Reassigning the same shape must not grow the path set (prune-on-reassign).
  const flatBefore = (b as any)._reactive.flatData.length;
  d.arms = [...d.arms];
  d.arms = [...d.arms];
  expect((b as any)._reactive.flatData.length).toBe(flatBefore);

  // DOM sanity: all 24 rows rendered.
  expect(document.querySelectorAll('#bench div span').length).toBe(24);

  // Growth assertions (see handoff §8): last-3-average vs first-3-average.
  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
  const addGrowth = avg(rows.slice(-3).map(r => r.addMs)) / Math.max(0.1, avg(rows.slice(0, 3).map(r => r.addMs)));
  const readGrowth = avg(rows.slice(-3).map(r => r.readMs)) / Math.max(0.1, avg(rows.slice(0, 3).map(r => r.readMs)));
  expect(addGrowth).toBeLessThan(3);   // was ~200× pre-fix
  expect(readGrowth).toBeLessThan(2);  // was ~30× pre-fix
}, 300000);
