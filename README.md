# bindrJS
My attempt at a !framework for efficient HTML data binding

Don't mind me just re-inventing the wheel.
This is my attempt at creating a simple enough HTML render engine similar to what ALL popular front-end frameworks/libraries already do perfectly, AKA data binding, except "cheaper" and without the extra fancy features.
This is targeted to smaller "simpler" projects that only want to bind data to the HTML with as
minimum configuration or setup as possible, keeping it all as performant as possible, the end goal here is to have minimum extra knowledge outside HTML and JavaScript and be able
to empower your templates. if you know vanilla JavaScript and basic HTML you should already know how this library works.

## Bind examples
 
### String interpolation

#### HTML
```html
<div id="main-content">
  <div>${this.test}<div>
<div>
<script>
  // Instanciate new Bindr context
  let renderer = new Bind({
    // id of the element that will benefit fron the Bindr context
    id: 'main-content',
    // Properties that will be accesible within the element with the selected id
    bind: {
      test: 'Hello world!'
    }
  });
</script>
  
```
#### Output:
 
```html
<div id="main-content">
  <div>Hello world!<div>
<div>
```

### Conditional HTML

#### HTML
```html
<div id="main-content">
  <div :if="this.counter > 5">Counter is greater than 5<div>
  <div :if="this.counter < 5">Counter is smaller than 5<div>
<div>
<script>
  // Instanciate new Bindr context
  let renderer = new Bind({
    // id of the element that will benefit fron the Bindr context
    id: 'main-content',
    // Properties that will be accesible within the element with the selected id
    bind: {
      counter: 6
    }
  });
</script>
```

#### Output:

```html
<div id="main-content"><div>
  <div :if="this.counter > 5">Counter is greater than 5</div>
</div>
```


