# BindrJS

The lightest of libraries for good solid HTML data binding.

## Why?

If you are like me and often want to spin up a quick project that uses just plain JavaScript.
 - No compilation process
 - No bundle bigger than my actual project
 - No complex setup or strict framework "rules"

Just... Data... Binding... This is for you

## How?

Data updates have direct effect on DOM updates thanks to native JavaScript Proxy API, which gets rid of the need for expensive dirty checking or setter functions.

Using the Proxy API along-side internal HTML Bind Handlers, anytime a property is updated in JavaScript, all and ONLY the HTML DOM elements that are related to that Data are updated accordingly.

This library requires no configuration, or setup, just include the js bundle into your page and you are ready to start binding reactive data to your HTML

## Not buying it?

This library is also built thinking about how YOU might want to scale it up to your specific needs.
Chances are you DO need data reactivity, but you want it to affect your DOM in your very own specific way, with this library you can create you own HTML Bind Handlers which can interact and take full advantage of the internal data reactivity implementation.

Don't be shy and take a look at the demo: https://bindrjs.vercel.app/

## Real talk here

Do not use this library if you intend to scale your app into a full enterprise product with huge room for scalability.

This is a library written and maintained by a single developer at the moment (if you are interested in helping you are more than welcome!) and its not intended for large enterprise size projects (right now), it will still work, but you might wanna consider other options with scalability in mind like React/Vue/Svelte/Angular.

I am a hobbyist who likes to create and fiddle with IOT a lot so this library is built thinking about the small amount of space and processing power available in devices like RaspberryPI's/Arduino's/ESP32's etc


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

This will run the examples page (https://bindrjs.vercel.app/) locally

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


