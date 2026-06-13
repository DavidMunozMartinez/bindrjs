import {HTMLBindHandler} from '../bind-handler';
import {
  evaluateDOMExpression,
  findAndReplaceVariable,
  recurseElementNodes,
} from '../../../utils';
import {untracked} from '../../reactive-data';
import {BindingChar, InterpolationRegexp} from '../../../constants';

interface ILocalVars {
  localVar: string,
  arrayVar: string,
  usesIndex: boolean,
  indexToken: string,
}

/**
 * KEYED :foreach (common-prefix diff)
 * -----------------------------------
 * Each rendered item bakes its array index into its handlers (item -> array[i]),
 * so a DOM node is only valid while it stays at its index. We exploit that with
 * a positional key diff:
 *
 *   1. Compute a key per item (`:key="expr"`, or the item itself as fallback).
 *   2. Find the first index where the previous and current key lists differ —
 *      the length of their common prefix.
 *   3. Items BEFORE that point are untouched (their indexes, and therefore their
 *      baked paths, are still correct). Items FROM that point on are dropped and
 *      re-rendered with fresh, correct indexes.
 *
 * This makes the common cases cheap:
 *   - identical lists            -> nothing happens (full skip)
 *   - append to the end          -> only the new tail is built
 *   - truncate from the end      -> only the tail is removed
 *   - insert/remove near the end -> only the affected suffix is rebuilt
 * Reorders / front-edits fall back to rebuilding the suffix from the change
 * point, which stays correct under index-based paths. (True move-with-reuse for
 * reorders would require identity-keyed dependencies — a deeper change.)
 */
export function ForEachBindHandler(
  handler: HTMLBindHandler,
  context: unknown
): any {
  if (!handler.outerHTML) return false;
  if (!handler.tracking) handler.tracking = [];

  let vars = getVarsFromExpression(handler);
  let array: any[] = (evaluateDOMExpression(vars.arrayVar, context) as any[]) || [];
  handler.result = array;

  // Establish this handler's dependencies on EVERY code path (including the
  // no-op skip below). Reading `array.length` here — while the dependency
  // collector is active and `array` is still the reactive proxy — guarantees a
  // subscription to `<array>.length`, so push/splice/pop/etc. always re-run us.
  // Without this, a skip-compute (which returns before any length read) would
  // drop the length subscription and we'd miss the next resize.
  let length: number = array.length;

  let oldKeys = handler.tracking;
  // newKeys is DENSE: it skips holes. Array.prototype.pop/shift/splice work as
  // Delete(i) followed by Set(length, ...), so reacting to the Delete we briefly
  // see a sparse array (length not yet shrunk, a hole at the tail). Skipping
  // holes means we never build a node for a slot that's about to disappear —
  // which would otherwise read `array[i].x` on `undefined` and throw.
  let newKeys = computeKeys(handler, vars, array, length);
  let count = newKeys.length;

  // Length of the common prefix == first index at which the lists diverge.
  let divergence = firstDivergence(oldKeys, newKeys);

  // Nothing changed: same keys, same order, same count -> no DOM work.
  if (divergence === oldKeys.length && divergence === count) {
    return false;
  }

  // Drop the now-stale suffix, then (re)build items from the divergence point on.
  removeItemsFromIndex(handler, divergence);
  let rebinds = renderRange(handler, vars, divergence, count);

  handler.tracking = newKeys;
  return rebinds;
}

export function IndexHandler() {
  throw new Error('Invalid use of :index handler, can only be used in an element which uses :foreach handler')
}

/**
 * Computes the identity key for every item. With :key the key is the value of
 * that expression evaluated with the item as `this` (so `device.id` -> this.id).
 * Without :key we use the item value itself (works for primitives and object
 * identity). Done UNTRACKED so key reads never become foreach dependencies.
 */
function computeKeys(handler: HTMLBindHandler, vars: ILocalVars, array: any[], length: number): any[] {
  return untracked(() => {
    // Rewrite the local var to `this` so the same compiled key function can be
    // reused for every item, evaluated against each item as its context.
    let keyExpr = handler.keyExpression
      ? findAndReplaceVariable(handler.keyExpression, vars.localVar, 'this')
      : null;
    let keys: any[] = [];
    for (let i = 0; i < length; i++) {
      // Skip holes (sparse slots) — see the dense-keys note in the caller.
      if (!(i in array)) continue;
      let item = array[i];
      keys.push(keyExpr ? evaluateDOMExpression(keyExpr, item) : item);
    }
    return keys;
  });
}

/** Index of the first position where the two key lists differ (or the length of
 * the shorter list if one is a prefix of the other). */
function firstDivergence(a: any[], b: any[]): number {
  let max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i++;
  return i;
}

/** Removes rendered item elements at position >= fromIndex (the stale suffix),
 * leaving the unchanged prefix and the end marker in place. */
function removeItemsFromIndex(handler: HTMLBindHandler, fromIndex: number) {
  // handler.element is the start marker comment; markerEnd closes the block.
  // Each item is exactly one element node between the two markers, in order.
  let node = handler.element.nextSibling;
  let count = 0;
  // Walk to the fromIndex-th item element.
  while (node && node !== handler.markerEnd && count < fromIndex) {
    if (node.nodeType === 1) count++;
    node = node.nextSibling;
  }
  // Remove it and everything after it up to (but not including) the end marker.
  while (node && node !== handler.markerEnd) {
    let next = node.nextSibling;
    node.remove();
    node = next;
  }
}

/** Builds and appends item elements for indexes [fromIndex, count), inserting
 * them in order just before the end marker. Returns them so the renderer can
 * recurse into each for nested binds. */
function renderRange(handler: HTMLBindHandler, vars: ILocalVars, fromIndex: number, count: number): HTMLElement[] {
  let rebinds: HTMLElement[] = [];
  for (let index = fromIndex; index < count; index++) {
    let domItem = makeDOMItem(handler, vars, index);
    rebinds.push(domItem);
    handler.markerEnd?.before(domItem);
  }
  return rebinds;
}

function getVarsFromExpression(handler: HTMLBindHandler): ILocalVars {
  let expressionVars = handler.expression.split(' in ').map(val => val.trim());
  let localVar = expressionVars[0];
  let arrayVar = expressionVars[1];
  let usesIndex = Boolean(handler.helperHTML);
  let indexToken = handler.helperHTML === 'true' ? ':index' : handler.helperHTML || ':index';
  indexToken = indexToken.trim();
  const errorText = 'Invalid custom index name for ' + ':index="'+indexToken+'"'
  if (indexToken !== ':index' && indexToken.indexOf('@') !== 0) {
    throw new Error(errorText + ', index name must start with "@",\ntry :index="@'+indexToken+'" instead');
  }
  if (indexToken.indexOf(' ') > -1) {
    throw new Error(errorText + ', index name can\'t contain inbetween spaces')
  }
  return { localVar, arrayVar, usesIndex, indexToken };
}

function makeDOMItem(handler: HTMLBindHandler, vars: ILocalVars, index: number) {
  let item: HTMLElement = handler.originalNode?.cloneNode(true) as HTMLElement;
  recurseElementNodes(item, (node: HTMLElement) => {
    switch (node.nodeType) {
      // Element
      case 1:
        node
          .getAttributeNames()
          .filter(attribute => attribute.indexOf(BindingChar) === 0)
          .forEach(attribute => {
            let value: any = node.getAttribute(attribute) || '';
            if (value.indexOf(vars.localVar) > -1) {
              value = parseLocalVar(value, vars, index);
            }
            if (vars.usesIndex && value.indexOf(vars.indexToken) > -1) {
              value = value.replaceAll(vars.indexToken, index);
            };
            node.setAttribute(attribute, value);
          });
        break;
      // Text node
      case 3:
        node.textContent = node.textContent?.replace(InterpolationRegexp, (a, b) => {
          let value: any = parseLocalVar(b, vars, index);
          if (vars.usesIndex && value.indexOf(vars.indexToken) > -1) {
            value = value.replaceAll(vars.indexToken, index);
          }
          return `\${${value}}`;
        }) || null;
        break;
    }
  });
  return item;
}

function parseLocalVar(text: string, vars: ILocalVars, index: number) {
  let arrayAtIndex = `${vars.arrayVar}[${index}]`
  let result = findAndReplaceVariable(text, vars.localVar, arrayAtIndex);
  return result;
}
