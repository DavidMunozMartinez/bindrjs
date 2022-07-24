let IfJs = `
let IfExampleBind = new Bind({
  id: 'if-example',
  template: 'if-example/if-example.html',
  bind: {
    text: '',
  }
});
`

let IfExampleBind = new Bind({
  id: 'if-example',
  template: 'if-example/if-example.html',
  bind: {
    text: '',
  },
  templateRendered: () => {
    let html = IfExampleBind.container.getElementsByClassName('example')[0].innerHTML;
    IfExampleBind.bind.PreBindHTMLCode = Prism.highlight(html, Prism.languages.markup, 'markup');
    IfExampleBind.bind.JSCode = Prism.highlight(IfJs, Prism.languages.javascript, 'javascript');
  }
});