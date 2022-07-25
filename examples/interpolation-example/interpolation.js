let js = `
let InterpolationBind = new Bind({
  id: 'interpolation-example',
  template: 'interpolation-example/interpolation.html',
  bind: {
    text: 'Hello from interpolation.js',
    counter: 0,
    multiplier: 1,
  },
});`;

let InterpolationBind = new Bind({
  id: 'interpolation-example',
  template: 'interpolation-example/interpolation.html',
  bind: {
    text: 'Hello from interpolation.js',
    counter: 0,
    multiplier: 1,
    PreBindHTMLCode: '',
    JSCode: js,
  },
  templateRendered: () => {
    let html =
      InterpolationBind.container.getElementsByClassName('example')[0]
        .innerHTML;
    InterpolationBind.bind.PreBindHTMLCode = Prism.highlight(
      html,
      Prism.languages.markup,
      'markup'
    );
    InterpolationBind.bind.JSCode = Prism.highlight(
      js,
      Prism.languages.javascript,
      'javascript'
    );
  },
});
