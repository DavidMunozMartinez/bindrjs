const JSCode = `
new Bind({
    id: 'main',
    bind: {
      bindClass: 'bind-class',
      bindValue: 'Bind value'
    }
});
`;

const HTMLCode = `
<div id="main" :class="this.bindClass">
    This is a regular text node
    \${this.bindValue}
</div>
`;

const Introduction = new Bind({
    id: 'introduction',
    template: 'introduction/introduction.html',
    bind: {
        html: '',
        js: '',
        interpolateText: '${}',
        interpolateStart: '${',
        interpolateEnd: '}'
    },
    ready: () => {
        Introduction.bind.js = Prism.highlight(JSCode, Prism.languages.javascript, 'javascript');
        Introduction.bind.html = Prism.highlight(HTMLCode, Prism.languages.markup, 'markup');
    }
})