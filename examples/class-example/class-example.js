let classJs = `
let ClassExample = new Bind({
  id: 'class-example',
  template: 'class-example/class-example.html',
  bind: {
    // Class example
    className: '',
    booleanClass: true,
    tickle: () => {
      ClassExample.bind.className = 'tickle-tickle';
      setTimeout(() => {
        ClassExample.bind.className = '';
      }, 500);
    },
  }
});
`;

let ClassExample = new Bind({
  id: 'class-example',
  template: 'class-example/class-example.html',
  bind: {
    // Class example
    className: '',
    booleanClass: true,
    tickle: () => {
      ClassExample.bind.className = 'tickle-tickle';
      setTimeout(() => {
        ClassExample.bind.className = '';
      }, 500);
    },
    PreBindHTMLCode: '',
    JSCode: classJs,
  },
  templateRendered: () => {
    let html = ClassExample.container.getElementsByClassName('example')[0].innerHTML;
    ClassExample.bind.PreBindHTMLCode = Prism.highlight(html, Prism.languages.markup, 'markup');
    ClassExample.bind.JSCode = Prism.highlight(classJs, Prism.languages.javascript, 'javascript');
  }
});
