# bindrJS
My attempt at not a framework for HTML data binding

 Don't mind me just re-inventing the wheel.
 This is my attempt at creating a simple enough HTML render engine similar to what ALL popular front-end frameworks/libraries already do perfectly, AKA data binding
 except "cheaper" and without the extra fancy features, this is targeted to smaller "simpler" projects that only want to bind data to the HTML with as
 minimum configuration or setup as possible, keeping it all as performant as possible, the end goal here is to have minimum extra knowledge outside HTML and JavaScript and be able
 to empower your templates. if you know vanilla javascript and basic HTML you should already know how this library works.

 ## Bind examples

 ```html
 <div id="main-content">
  <div bind:innerText="this.test"><div>
 <div>
 ```

 ```js
 let renderer = new Bindr({
  id: 'main-content',
  bind: {
    test: 'Hello world!'
  }
 });
 ```

 #### HTML renders:
 ```html
 <div id="main-content">
  <div bind:innerText="this.test">Hello world!<div>
 <div>
 ```
