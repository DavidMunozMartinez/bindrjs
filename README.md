# BindrJS

The lightest of libraries for good solid HTML data binding.

## Why?

If you are like me and often want to spin up a quick project that uses just plain JavaScript.
 - No compilation process
 - No bundle bigger than my actual project
 - No complex setup or strict framework "rules"

Just... Data... Binding... This is for you

## How?

Data updates have direct effect on DOM updates thanks to native JavaScript Proxy API, which gets rid of the need for expensive dirty checking or setter functions, using the Proxy API alongside some internal HTML Bind Handlers, anytime a property is updated in JavaScript, all and ONLY the HTML DOM elements that are related to that Data are updated accordingly

This library requires no configuration, or setup, just include the js bundle into your page and you are ready to start binding reactive data to your HTML

## Not buying it?

This library is also built thinking about how YOU might want to scale it up to your specific needs, chances are you DO need data reactivity, but you want it to affect your DOM in your very own specific way, you can create you own HTML Bind Handlers which can interact and take full advantage of the internal data reactivity implementation, don't be shy and take a look at the demo.

Docs/Showcase:
https://bindrjs.vercel.app/


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

Thanks for passing by, more things are under active development.


