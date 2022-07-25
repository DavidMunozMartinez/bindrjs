# bindrJS
My attempt at a !framework for efficient HTML data binding

Don't mind me just re-inventing the wheel.
This is my attempt at creating a simple enough HTML render engine similar to what ALL popular front-end frameworks/libraries already do perfectly, AKA data binding, except "cheaper" and without the extra fancy features.

This is mainly a learning experience to get a feel for the kind of problems modern web development has and how different frameworks solve them.

You may be interested in this library if you ONLY want to add data binding to your web app, in the end this is just a javascript library, without project structures or design patterns.

This library requires no configuration, or setup, just include the js bundle into your page and you are ready to start binding data to your HTML

## Add to your project

### With npm:

Install:
```
npm i bindrjs
```
Add to ```index.html```:
```html
<script src="<path_to_node_modules>/dist/index.js"></script> 
```

### Or add stript tag from unpkg cdn provider:
```html
<script src="https://unpkg.com/bindrjs@1.0.0/dist/index.js"></script> 
```


### Download the code

```
// Clone repository
git clone https://github.com/DavidMunozMartinez/bindrJS.git
// Go to directory
cd bindrjs
// Install dependencies
npm run install
```
### Compile
```
npm run compile
```
### Run examples
```
npm run examples
```

This will open a local browser with an instance of live server running index.html in the examples folder.
Mind you the examples page looks like 💩 at the moment and more than an examples page is my testing
environment.


## How to use

```javascript
// New instance of Bind
let MainContent = new Bind({
  // Id of the element that will benefit from the Bind context
  id: 'main-content', // (Required)
  // HTML template string or path to HTML file, if provided it will replace
  // the content of the container found with the id (paths only work when running the app in a live server)
  template: '', // (Optional)
  // Reactive properties that will be provided in the template 
  bind: { // (Optional)
    // These are accessible in the template trough the "this" keyword
    text: 'Hello world!'
  }
});

// This is 100% reactive!
MainContent.bind

// You can access the properties of the Bind instance
console.log(MainContent.bind.text);
// > Hello world!

// And reassign them
MainContent.bind.text = 'Changing reactive data';
// Now any part of the template that depends on "this.text" property WILL automatically be updated accordingly
```

NOTE: If you add new properties to the bind object after it's been instantiated, those will not be reactive, if you need more reactive properties you
should add all the properties that the template will need with null values when the Bind class is being instantiated

## Examples
 
### String interpolation ```${string}```

#### HTML
```html
<div id="main-content">
  <div>${this.test}<div>
<div>
<script>
  let renderer = new Bind({
    id: 'main-content',
    bind: {
      test: 'Hello world!'
    }
  });

  setTimeout(() => {
    renderer.bind.test = 'Updated after 5 seconds';
  }, 5000);
</script>
```
#### Output:
 
```html
<div id="main-content">
  <div>Hello world!<div>
<div>
```
After 5 seconds:
```html
<div id="main-content">
  <div>Updated Text!<div>
<div>
```

### Conditional HTML ```:if```

#### HTML
```html
<div id="main-content">
  <div :if="this.counter > 5">Counter is greater than 5<div>
  <div :if="this.counter < 5">Counter is smaller than 5<div>
<div>
<script>
  let renderer = new Bind({
    id: 'main-content',
    bind: {
      counter: 6
    }
  });

  setTimeout(() => {
    renderer.bind.counter--;
  }, 5000)
</script>
```

#### Output:

```html
<div id="main-content"><div>
  <div :if="this.counter > 5">Counter is greater than 5</div>
</div>
```
After 5 seconds
```html
<div id="main-content"><div>
</div>
```

### Bind Class ```:class```

#### HTML
```html
<div id="main-content">
  <div :class="this.dynamicClass" :class:show="this.isVisible"></div>
<div>
<script>
  let renderer = new Bind({
    id: 'main-content',
    bind: {
      dynamicClass: 'test-class',
      isVisible: true
    }
  });
</script>
```
#### Output:

```html
<div id="main-content">
  <div class="test-class show"></div>
</div>
```

### Bind ForEach ```:foreach```

#### HTML
```html
<div id="main-content">
  <div :foreach="value in this.values">
    ${value}
  </div>
</div>
<script>
  let renderer = new Bind({
    id: 'main-content',
    bind: {
      values: ['One', 'Two', 'Tree']
    }
  });
</script>
```
#### Output:
```html
<div id=main-content>
  <div>One</div>
  <div>Two</div>
  <div>Tree</div>
</div>
```

### Bind HTML Events ```:<event>```

Supported Events: https://www.w3schools.com/tags/ref_eventattributes.asp

#### HTML
```html
<div id="main-content">
  <button :onclick="this.onBtnClick()">Click me!</button>
<div>
<script>
  let renderer = new Bind({
    id: 'main-content',
    bind: {
      onBtnClick: () => {
        console.log('Hello from the renderer!');
      }
    }
  });
</script>
```
Binded events can access any property provided by the Bind instance

Thanks for passing by, more things are under active development.


