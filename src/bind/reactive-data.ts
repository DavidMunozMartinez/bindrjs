export interface DataChanges {
  path: string;
  pathArray: string[];
  oldValue: any;
  newValue: any;
  property: string,
  isNew: boolean,
}

/**
 * GETTER-BASED DEPENDENCY TRACKING (module-level)
 * -----------------------------------------------
 * When `activeCollector` is non-null, every property read flowing through a
 * proxy `get` trap records its full path into the Set. We turn it on, evaluate
 * an expression (which reads whatever it actually reads), and turn it off —
 * whatever landed in the Set is that expression's exact dependency list.
 *
 * It lives at module scope (not per-instance) because only one compute runs at
 * a time in JS, and this lets helpers like `untracked` be shared across modules
 * (e.g. the foreach handler suppresses tracking while it diffs keys).
 */
let activeCollector: Set<string> | null = null;

/**
 * Runs `fn` with read-collection enabled and returns the set of reactive paths
 * read during it. Save/restore makes nested collect() calls safe.
 */
export function collectReads(fn: () => void): string[] {
  const previous = activeCollector;
  const collector = new Set<string>();
  activeCollector = collector;
  try {
    fn();
  } finally {
    activeCollector = previous;
  }
  return [...collector];
}

/**
 * Runs `fn` with tracking temporarily disabled, so reads inside it do NOT
 * become dependencies. Used for bookkeeping reads (e.g. computing :foreach keys)
 * that shouldn't subscribe the handler to that data.
 */
export function untracked<T>(fn: () => T): T {
  const previous = activeCollector;
  activeCollector = null;
  try {
    return fn();
  } finally {
    activeCollector = previous;
  }
}

/**
 * PROXY IDENTITY (module-level)
 * -----------------------------
 * Maps every proxy created by any ReactiveData instance back to the raw object
 * it wraps. Unwrapping through this at assignment boundaries is what keeps
 * proxy depth at exactly 1 no matter how often a value is reassigned or how
 * many Bind instances share the same underlying object: an incoming value is
 * always reduced to its raw target before being stored or wrapped again.
 * (Before this existed, every reassignment of an ancestor stacked one more
 * Proxy layer onto each nested child that survived by reference, making
 * repeated reassignment — the documented re-render idiom — superquadratic.)
 *
 * The reverse direction (raw -> proxy) is deliberately NOT module-level:
 * which proxy represents a raw object depends on which ReactiveData instance
 * is asking, since each instance must fire its own update callback through
 * its own wrappers. That cache lives per-instance (see `proxyCache`).
 */
const PROXY_TO_RAW = new WeakMap<object, object>();

/**
 * Returns the raw (unproxied) object behind a bindrjs proxy; non-proxy values
 * are returned as-is. Useful for consumers that need to hand reactive data to
 * non-reactive code (cloning, serialization, identity checks).
 */
export function toRaw<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    return (PROXY_TO_RAW.get(value as any) as any) || value;
  }
  return value;
}

export class ReactiveData {
  constructor(target: any) {
    this._ingest(target, 'this');
    this.reactive = this._proxyFor(target, 'this', [], 'this');
  }

  public reactive: any;
  /**
   * Every reactive path currently known to this instance. A set of strings,
   * stored as an array for API stability (`flatSet` mirrors it for O(1)
   * membership checks). Paths are PRUNED when the object/array that owned
   * them is replaced or deleted, so this tracks the CURRENT data shape
   * instead of growing monotonically with every reassignment.
   */
  public flatData: string[] = [];
  private flatSet = new Set<string>();
  /**
   * raw object -> (path -> proxy), for THIS instance only. Reusing the proxy
   * for a (raw, path) pair is what makes wrapping idempotent: reassigning
   * `arms = [...arms, x]` hands back the SAME proxy for each surviving item
   * instead of stacking another layer on it, and item identity stays stable
   * across reassignment (which keyless :foreach relies on). Keyed by path as
   * well as raw because one raw object can be reachable through several
   * paths (e.g. targets[0].device and arms[2].device) and each proxy bakes
   * its path into the changes it reports.
   */
  private proxyCache = new WeakMap<object, Map<string, any>>();
  private _onUpdate?: (changes: DataChanges) => void;

  onUpdate(fn: (changes: DataChanges) => void) {
    this._onUpdate = fn;
  }

  /**
   * Runs `fn` with read-collection enabled and returns the reactive paths read
   * during it, so the renderer learns which data should re-trigger a handler.
   * Delegates to the shared module-level collector (see `collectReads`).
   */
  collect(fn: () => void): string[] {
    return collectReads(fn);
  }

  /**
   * Registers the reactive paths of `target`'s whole subtree and normalizes
   * it to raw values: any child that is a bindrjs proxy (ours or another
   * instance's) is replaced in place with its raw target. Stored trees hold
   * ONLY raw values — wrapping happens lazily, per read, in the `get` trap —
   * so objects handed to us are never rewired into proxy chains and never
   * gain marker properties. The same raw shared by several instances stays a
   * plain object; each instance reads it through its own wrappers.
   */
  private _ingest(target: any, path: string) {
    if (target.length !== undefined) {
      this.registerPath(path + '.length');
    }
    Object.keys(target).forEach((propKey: any) => {
      let value = target[propKey];
      if (isObject(value)) {
        const raw = toRaw(value);
        if (raw !== value) target[propKey] = raw;
        value = raw;
      }
      const currentPath = path + (!isNaN(propKey) ? `[${propKey}]` : `.${propKey}`);
      if (!isFunction(value)) this.registerPath(currentPath);
      if (isObject(value)) this._ingest(value, currentPath);
    });
  }

  private registerPath(path: string) {
    if (!this.flatSet.has(path)) {
      this.flatSet.add(path);
      this.flatData.push(path);
    }
  }

  /**
   * Drops every known path under `path` (and, for deletions, the path
   * itself). Called when an object/array property is replaced or deleted so
   * flatData follows the live shape. Descendants are matched anywhere in the
   * array (children are not guaranteed to be contiguous, so a positional
   * splice would corrupt unrelated entries).
   */
  private prunePaths(path: string, includeSelf: boolean) {
    const dot = path + '.';
    const bracket = path + '[';
    const keep: string[] = [];
    for (const p of this.flatData) {
      if ((includeSelf && p === path) || p.startsWith(dot) || p.startsWith(bracket)) {
        this.flatSet.delete(p);
      } else {
        keep.push(p);
      }
    }
    this.flatData = keep;
  }

  /**
   * Returns THE proxy representing `raw` at `path` for this instance,
   * creating it once and reusing it afterwards. The path array is only
   * materialized (parent + prop) on a cache miss, so the hot cache-hit
   * path allocates nothing.
   */
  private _proxyFor(raw: any, path: string, parentPathArray: string[], prop: string) {
    let byPath = this.proxyCache.get(raw);
    if (!byPath) {
      byPath = new Map<string, any>();
      this.proxyCache.set(raw, byPath);
    }
    let proxy = byPath.get(path);
    if (!proxy) {
      proxy = new Proxy(raw, this._handler(path, parentPathArray.concat(prop)));
      PROXY_TO_RAW.set(proxy, raw);
      byPath.set(path, proxy);
    }
    return proxy;
  }

  private _handler(path: string, pathArray: string[]): ProxyHandler<any> {
    return {
      get: (target: {[key: string]: any}, prop: any) => {
        // Proxies used to be detected via a stamped `__isProxy` property on
        // the target; the marker is now virtual so raw objects stay unmarked.
        if (prop === '__isProxy') return true;
        const value = target[prop];
        // Symbols (e.g. Symbol.iterator) and methods (.forEach/.toFixed/...)
        // are not reactive data: return them untouched.
        if (typeof prop !== 'string' || typeof value === 'function') {
          return value;
        }
        const wrap = isObject(value);
        if (!activeCollector && !wrap) return value;
        // Build the same path shape used everywhere else: numeric keys are
        // array indexes ([0]), everything else is a dot property (.foo).
        const childPath = path + (!isNaN(prop as any) ? `[${prop}]` : `.${prop}`);
        // Record this read as a dependency when we're inside collect().
        if (activeCollector) activeCollector.add(childPath);
        if (wrap) {
          // Objects are wrapped on read (never stored wrapped): same raw +
          // same path -> same proxy, every time.
          return this._proxyFor(toRaw(value), childPath, pathArray, prop);
        }
        return value;
      },
      set: (target: {[key: string]: any}, prop: string, value: any) => {
        const oldValue = target[prop];

        // Skip all custom logic if property being updated is from prototype
        if (target.__proto__ && prop in target.__proto__ as any && prop !== 'length') {
          target[prop] = value;
          return true;
        }

        // Normalize the incoming value: a bindrjs proxy (from any instance)
        // is reduced to raw so stored trees never nest proxies. Assigning a
        // proxy still makes a shallow working copy (pre-existing contract),
        // but the copy is now taken from the raw, so it is clean all the way
        // down instead of carrying proxied children.
        let newValue = value;
        if (isObject(value) && PROXY_TO_RAW.has(value)) {
          newValue = cloneObj(PROXY_TO_RAW.get(value));
        }

        // An identical primitive write skips the whole change pipeline.
        // `length` is exempt: array index writes grow `length` before its own
        // set arrives, so an "unchanged" length write is exactly how
        // push/splice/unshift announce a resize.
        if (
          !isObject(newValue) &&
          newValue === oldValue &&
          prop !== 'length' &&
          Object.prototype.hasOwnProperty.call(target, prop)
        ) {
          return true;
        }

        const dataChanges: DataChanges = {
          path: path,
          pathArray: pathArray,
          property: prop,
          oldValue,
          newValue,
          isNew: oldValue === undefined
        };

        const properPath = path + (!isNaN(dataChanges.property as any) ? `[${prop}]` : `.${prop}`);

        if (isObject(newValue)) {
          this.registerPath(properPath);
          // The replaced subtree's paths die with it; the new subtree then
          // registers its own (and is normalized to raw values on the way).
          this.prunePaths(properPath, false);
          this._ingest(newValue, properPath);
          target[prop] = newValue;
        } else {
          if (dataChanges.isNew && typeof newValue !== 'function') {
            this.registerPath(properPath);
          }
          // A primitive overwriting an object kills that subtree's paths too.
          if (isObject(oldValue)) this.prunePaths(properPath, false);
          target[prop] = newValue;
        }

        if (this._onUpdate) this._onUpdate(dataChanges);

        return true;
      },
      deleteProperty: (target: any, prop: string) => {
        const oldValue = target[prop];
        const dataChanges: DataChanges = {
          path: path,
          pathArray: pathArray,
          property: prop,
          oldValue,
          newValue: undefined,
          isNew: oldValue === undefined
        };

        const properPath = path + (!isNaN(dataChanges.property as any) ? `[${prop}]` : `.${prop}`);
        // Remove the path itself and every descendant path.
        this.prunePaths(properPath, true);

        // For arrays, `delete arr[i]` already adjusts length semantics; manually
        // decrementing length here would truncate the tail element instead of
        // leaving a hole, so we only delete the property.
        if (prop in target) delete target[prop];

        if (this._onUpdate) this._onUpdate(dataChanges);

        return true;
      }
    };
  }
}

function isObject(value: any) {
  return typeof value === 'object' && value !== null && typeof value !== 'function';
}

function isFunction(value: any) {
  return typeof value === 'function';
}

function cloneObj(obj: any) {
  if (obj.length !== undefined) {
    return Object.assign([], obj);
  }
  return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
}
