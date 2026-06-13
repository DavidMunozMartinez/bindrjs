---
name: bindrjs
description: Full reference for using BindrJS — a tiny, dependency-free, no-build reactive HTML data-binding library. Read this before writing any BindrJS template or wiring up a Bind instance.
---

# BindrJS — Complete LLM Reference

BindrJS is a minimal reactive UI library (no Virtual DOM, no compiler, no build
step). It wraps a plain JS object in a `Proxy`, and updates **only** the exact
DOM nodes whose expressions read the data that changed. Dependencies are
discovered at runtime by observing which properties an expression reads while it
evaluates ("getter-based tracking") — so you never declare dependencies.

This document is the authoritative guide. If you follow it exactly, BindrJS code
will work. Where a behavior is surprising, it is called out under **Gotcha**.

---

## 1. Install & load

```bash
npm install bindrjs
```

**TypeScript / bundler:**
```ts
import { Bind, CustomBindHandler } from 'bindrjs';
```

**Plain HTML (no build):** include the bundle; `Bind` and `CustomBindHandler`
become globals on `window`.
```html
<script src="node_modules/bindrjs/dist/index.js"></script>
```

---

## 2. Mental model (read this first)

- A **Bind instance** owns one container element (by `id`) and a reactive data
  object (`bind`).
- Inside that container, two things become reactive:
  - **`${ expression }`** inside **text nodes** → interpolation.
  - **`:` attributes** (colon-prefixed) → bind handlers.
- Every expression is plain JavaScript and accesses your data through the
  **`this`** keyword. `this` IS the bind object.
- When you mutate the data (`bind.x = ...`), every expression that read `x`
  (or `x.y`, `x[i]`, etc.) re-runs and patches its DOM node. Nothing else runs.

```ts
const view = new Bind<{ name: string }>({
  id: 'app',                              // <div id="app"></div> must exist
  template: '<h1>Hello ${this.name}</h1>',
  bind: { name: 'World' },
});

view.bind.name = 'BindrJS';  // the <h1> text updates automatically
```

---

## 3. The `Bind` constructor

```ts
new Bind<T>({
  id: string,            // REQUIRED. id of an existing DOM element (the container)
  template?: string,     // optional. raw HTML string, OR a path ending in ".html"
  bind?: T,              // optional. initial reactive state + methods
  ready?: () => void,        // fires once after the first full bind pass
  templateRendered?: () => void, // fires after template HTML is in the DOM
  templateBinded?: () => void,   // fires after all binds processed once
  onChange?: (changes) => void,  // fires on every reactive data change
})
```

- Access reactive state via the instance: `view.bind` (this is the `Proxy`).
- `template`:
  - A **raw HTML string** is injected as-is into the container.
  - A string **ending in `.html`** is `fetch`ed (works only over http(s), not
    `file://`).
  - If omitted, BindrJS binds against the container's existing innerHTML.
- Lifecycle callbacks: inside `ready`, `this` is bound to the data object.
- The container element (`document.getElementById(id)`) **must already exist**
  when you call `new Bind`, or it throws.

**TypeScript generics** give you type-safe state and editor intellisense:
```ts
interface HomeState { count: number; toggle: () => void; }
const home = new Bind<HomeState>({ id: 'home', bind: { count: 0, toggle: () => {} } });
home.bind.count;  // typed as number
```

---

## 4. Binding syntax — every handler

Notation: the binding character is `:`. Text interpolation is `${ ... }`.
All expressions use `this.` to reach data.

### 4.1 Text interpolation — `${ expr }`
Only inside **text nodes**. Sets `textContent`.
```html
<span>${this.user.name}</span>
<p>Total: ${this.price * this.qty}</p>
<li>${this.active ? 'On' : 'Off'}</li>
```

### 4.2 Attributes — `:<attr>="expr"`
Any non-special attribute becomes an attribute bind. The result is **stringified**
and set with `setAttribute`.
```html
<img :src="this.url" />
<a :href="this.link">go</a>
<input :value="this.text + ''" :checked="this.isOn" />
<div :data-id="this.item.id"></div>
```
Gotcha: results are strings. For numeric/boolean attributes coerce as needed
(`this.n + ''`).

### 4.3 Events — `:on<event>="expr"`
Assigns the DOM `on*` property; the expression runs on each event.
```html
<button :onclick="this.save()">Save</button>
<input :oninput="this.setName(event.target.value)" />
<div :onmouseup="this.pick(item, event)"></div>
```
- `event` is available inside the expression (browser global event).
- Methods live on your bind object: `bind: { save: () => {...} }`.
- Event expressions do **not** create data dependencies (they run on the event,
  not on data change).

### 4.4 Classes — two forms
**Dynamic class name** — expression returns a class string; the old one is
removed when it changes:
```html
<div :class="this.theme"></div>           <!-- adds the value of this.theme -->
<i :class="'iconoir-' + this.icon"></i>
```
**Conditional class** — `:class:<name>="expr"` toggles `name` by truthiness:
```html
<li :class:active="this.id === this.selectedId"></li>
<i :class:on="this.value" :class:off="!this.value"></i>
```

### 4.5 Styles — two forms
**Object form** — expression returns an object of **camelCase** CSS props:
```html
<div :style="{ backgroundColor: this.color, width: this.w + 'px' }"></div>
```
**Specific property** — `:style:<prop>="expr"` (prop may be kebab-case, it's
camelCased):
```html
<div :style:width="this.percent + '%'"></div>
<div :style:background-color="this.color"></div>
```

### 4.6 `:if` / `:else`
Renders/removes the element from the DOM by truthiness. `:else` must be on the
element **immediately following** the `:if` element.
```html
<div :if="this.loggedIn">Welcome</div>
<div :else>Please log in</div>
```
Gotcha: when false the element is fully removed (replaced by comment markers),
not hidden.

### 4.7 `:foreach` (+ `:key`, `:index`)
Renders one clone of the element per array item.
```html
<li :foreach="item in this.items">${item}</li>
```
- The **local variable** (`item` above) is usable in that element's expressions
  and text, including nested children.
- The array expression uses `this.`: `device in this.devices`.

**`:key="expr"` (recommended for object arrays)** — gives each item a stable
identity so updates are diffed instead of fully re-rendered. Cheap append, skip,
and tail edits; preserves DOM nodes whose key is unchanged.
```html
<div :foreach="device in this.devices" :key="device.id">
  ${device.name}
</div>
```
- For **primitive arrays** (`string[]`, `number[]`) omit `:key` — value identity
  is automatic. Do NOT write `:key="item"` for primitives (it boxes the value
  and breaks identity).
- Without `:key`, object arrays still work but re-render fully on any change.

**`:index`** — exposes the item index.
```html
<li :foreach="item in this.items" :index>${item} (#:index)</li>
<!-- custom token name, must start with @ -->
<li :foreach="item in this.items" :index="@i">${item} (#@i)</li>
```

### 4.8 `:innerText="expr"` and `:innerHTML="expr"`
```html
<span :innerText="this.label"></span>     <!-- reactive -->
<div :innerHTML="this.htmlString"></div>  <!-- one-shot, see gotcha -->
```
- `:innerText` is reactive (re-runs on change).
- **Gotcha:** `:innerHTML` is evaluated **once** at bind time (the injected HTML
  is then scanned for more binds). It does **not** re-render on later changes.
  It is also unsanitized — never feed it untrusted data (XSS).

### 4.9 `:reanimate="expr"`
When the expression's result changes, the element's CSS `animation` is reset
(`none` then restored) so the animation replays.
```html
<div :reanimate="this.counter" class="pulse"></div>
```

---

## 5. Reactivity rules (how tracking actually works)

- Dependencies are the properties an expression **reads while it runs**. You
  never declare them. This makes the following all work automatically:
  - nested paths: `this.a.b.c`
  - bracket / dynamic keys: `this.map['k']`, `this.items[this.idx]`
  - branches: in `this.flag ? this.a : this.b`, only the branch actually taken
    is a dependency this run (re-evaluated each time).
- Mutations that trigger updates:
  - assignment: `bind.x = v`, nested `bind.a.b = v`
  - arrays: `push`, `pop`, `shift`, `unshift`, `splice`, index set, reassign
  - adding a brand-new property that an expression already referenced (it was
    read as `undefined`, so it's tracked) — setting it later updates the DOM.
- Arrays + `:foreach`: the loop reacts to the array reference and its `length`;
  changing one item's property updates that item's own bindings, not the list.
- **Gotcha — undefined intermediates throw.** `this.a.b` throws if `this.a` is
  `undefined`. Guard with `:if="this.a"` or `this.a && this.a.b`.
- **Gotcha — functions/methods are not reactive.** They're just callable.
- Performance: identical expression strings are compiled once and cached.

---

## 6. Custom bind handlers

Register your own `:` handler globally. Use for DOM behavior the built-ins don't
cover while still riding the reactivity system.

```ts
import { CustomBindHandler } from 'bindrjs';

// :tooltip="this.message"
CustomBindHandler('tooltip', (handler, context) => {
  // handler.result already holds the evaluated expression value
  // handler.element is the DOM node
  handler.element.setAttribute('title', String(handler.result ?? ''));
});
```
```html
<button :tooltip="this.helpText">?</button>
```
- The expression is evaluated for you before your function runs; read it from
  `handler.result`.
- `handler.element` is the target node. The handler re-runs whenever the data
  the expression read changes.
- Handler names must be unique; reusing a built-in name throws.

---

## 7. Common patterns

**List with keys, events, and conditional classes:**
```html
<div id="devices"></div>
```
```ts
new Bind({
  id: 'devices',
  template: `
    <div :foreach="d in this.devices" :key="d.id"
         :class:on="d.value"
         :onclick="this.toggle(d)">
      <span :class="'iconoir-' + d.icon"></span>
      ${d.name}: ${d.value ? 'ON' : 'OFF'}
    </div>
    <div :else>No devices</div>`,    // pair with :if on the foreach if needed
  bind: {
    devices: [{ id: 'a', name: 'Lamp', icon: 'bulb', value: false }],
    toggle(d) { d.value = !d.value; },   // mutate item -> only that row updates
  },
});
```

**Live update from outside (e.g. WebSocket):**
```ts
socket.on('update', (msg) => {
  const d = view.bind.devices.find(x => x.id === msg.id);
  if (d) d.value = msg.value;   // patches just that node
});
```

**Add/remove items efficiently:**
```ts
view.bind.devices.push(newDevice);   // with :key, only the new row is built
view.bind.devices = freshList;       // with :key, unchanged rows are reused
```

---

## 8. Pitfalls checklist (scan before finishing)

- [ ] Every expression accesses data through `this.` (`this.count`, not `count`).
- [ ] The container `<div id="...">` exists in the DOM before `new Bind`.
- [ ] Object `:foreach` lists have `:key="item.id"`; primitive lists have **no** `:key`.
- [ ] Nested access is guarded (`:if` or `&&`) where an intermediate may be undefined.
- [ ] `${}` is only used in text nodes; `:` bindings only on attributes.
- [ ] `:innerHTML` is only used for trusted, one-shot HTML (not reactive, not safe for user input).
- [ ] Attribute binds that need non-string values coerce explicitly (`+ ''`).
- [ ] `.html` template paths are served over http(s), not opened from disk.
- [ ] Methods used in templates live on the `bind` object.

---

## 9. Quick reference table

| Syntax | Type | Reactive | Notes |
|---|---|---|---|
| `${expr}` | interpolation | yes | text nodes only → `textContent` |
| `:attr="expr"` | attribute | yes | result stringified |
| `:on*="expr"` | event | n/a | `event` global available |
| `:class="expr"` | class (dynamic) | yes | result is the class name |
| `:class:name="expr"` | class (toggle) | yes | toggles `name` by truthiness |
| `:style="expr"` | style (object) | yes | camelCase keys |
| `:style:prop="expr"` | style (one prop) | yes | prop may be kebab-case |
| `:if="expr"` / `:else` | conditional | yes | removes/inserts element |
| `:foreach="x in this.arr"` | list | yes | local var `x` in scope |
| `:key="expr"` | foreach identity | — | object arrays; omit for primitives |
| `:index` / `:index="@n"` | foreach index | — | exposes index token |
| `:innerText="expr"` | text | yes | sets `innerText` |
| `:innerHTML="expr"` | html | **no** | one-shot; unsanitized |
| `:reanimate="expr"` | animation | yes | replays CSS animation on change |
| `:custom="expr"` | custom | yes | via `CustomBindHandler(name, fn)` |
