let CodeExample = `
new Bind({
    /**
    * Executed when the template has been appended but binds are still not processed
    * (useful with the template property)
    */
    templateRendered() {}
    
    /** 
    * Executed when the template has been rendered and binds have been processed
    */
    ready() {},
    
    /**
    * Executed when reactive data changes
    */
    onChange(changes) {}
});
`

const Hooks = new Bind({
    id: 'hooks',
    template: 'hooks-example/hooks-example.html',
    bind: {
        code: ''
    },
    ready: () => {
        Hooks.bind.code = Prism.highlight(CodeExample, Prism.languages.javascript, 'javascript');
    }
})