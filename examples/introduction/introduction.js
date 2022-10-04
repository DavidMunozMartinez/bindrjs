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

const TypeSafety = `
interface IHomeView {
    header: string
}
  
let HomeBind = new Bind<IHomeView>({
    id: 'home',
    bind: {
        header: 0 // This will error out because IHomeView interface requests a string
    }
});

let bind = HomeBind.bind // The reactive bind object will follow the IHomeView interface,
// and provide any intellisense available from your IDE
`

const Introduction = new Bind({
    id: 'introduction',
    template: 'introduction/introduction.html',
    bind: {
        html: '',
        js: '',
        typeSafety: '',
        interpolateText: '${}',
        interpolateStart: '${',
        interpolateEnd: '}'
    },
    ready: () => {
        Introduction.bind.js = Prism.highlight(JSCode, Prism.languages.javascript, 'javascript');
        Introduction.bind.html = Prism.highlight(HTMLCode, Prism.languages.markup, 'markup');
        Introduction.bind.typeSafety = Prism.highlight(TypeSafety, Prism.languages.javascript, 'javascript');
    }
})