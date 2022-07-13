# bindrJS
My attempt at a !framework for HTML data binding

Don't mind me just re-inventing the wheel.
This is my attempt at creating a simple enough HTML render engine similar to what ALL popular front-end frameworks/libraries already do perfectly, AKA data binding, except "cheaper" and without the extra fancy features.
This is targeted to smaller "simpler" projects that only want to bind data to the HTML with as
minimum configuration or setup as possible, keeping it all as performant as possible, the end goal here is to have minimum extra knowledge outside HTML and JavaScript and be able
to empower your templates. if you know vanilla JavaScript and basic HTML you should already know how this library works.

## Bind examples
 
### Bind to element.innerText

#### HTML
```html
<div id="main-content">
  <div bind:innerText="test"><div>
<div>
<script>
  // Instanciate new Bindr context
  let renderer = new Bindr({
    // id of the element that will benefit fron the Bindr context
    id: 'main-content',
    // Properties that will be accesible within the element with the selected id
    bind: {
      test: 'Hello world!'
    }
  });
</script>
  
```
#### HTML renders as:
 
```html
<div id="main-content">
  <div bind:innerText="this.test">Hello world!<div>
<div>
```
