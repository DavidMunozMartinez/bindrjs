let LeftNavbar = new Bind({
  id: 'navbar',
  bind: {
    testLink: 'https://randomwordgenerator.com/img/picture-generator/52e5d0454b55ac14f1dc8460962e33791c3ad6e04e507441722a72dd904dc6_640.jpg',
    bindTypes: [{
      id: 'interpolation-example',
      name: 'Interpolation',
      anchor: '#interpolation-example',
      codeRef: '${string}'
    }, {
      id: 'class-example',
      name: 'Class',
      anchor: '#class-example',
      codeRef: ':class'
    }, {
      id: 'styles-example',
      name: 'Styles',
      anchor: '#styles-example',
      codeRef: ':style'
    }, {
      id: 'if-example',
      name: 'If',
      anchor: '#if-example',
      codeRef: ':if'
    }, {
      id: 'foreach-example',
      name: 'ForEach',
      anchor: '#foreach-example',
      codeRef: ':foreach'
    }, {
      id: 'attribute-example',
      name: 'Attribute',
      anchor: '#attribute-example',
      codeRef: ':[any]'
    }]
  }
});