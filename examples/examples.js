CustomBindHandler('test', (handler, context) => {
  console.log('Hello from custom handler');
});

let LeftNavbar = new Bind({
  id: 'navbar',
  bind: {
    bindTypes: [
      {
        id: 'interpolation-example',
        name: 'Interpolation',
        anchor: '#interpolation-example',
        codeRef: '${string}',
        testData: 'something'
      },
      {
        id: 'class-example',
        name: 'Class',
        anchor: '#class-example',
        codeRef: ':class',
      },
      {
        id: 'style-example',
        name: 'Styles',
        anchor: '#style-example',
        codeRef: ':style',
      },
      {
        id: 'if-example',
        name: 'If',
        anchor: '#if-example',
        codeRef: ':if',
      },
      {
        id: 'foreach-example',
        name: 'ForEach',
        anchor: '#foreach-example',
        codeRef: ':foreach',
      },
      {
        id: 'attribute-example',
        name: 'Attribute',
        anchor: '#attribute-example',
        codeRef: ':[attr]',
      },
      {
        id: 'custom-example',
        name: 'Custom',
        anchor: '#custom-example',
        codeRef: 'Custom'
      }
    ],
  },
});

setTimeout(() => {
  LeftNavbar.bind.bindTypes[0].testData = 'Something else!';
}, 2000);