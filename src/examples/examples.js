let LeftNavbar = new Bind({
  id: 'navbar',
  bind: {
    testLink: 'https://randomwordgenerator.com/img/picture-generator/52e5d0454b55ac14f1dc8460962e33791c3ad6e04e507441722a72dd904dc6_640.jpg',
    bindTypes: [{
      name: 'Interpolation',
      anchor: '#interpolation-example',
      codeRef: '${string}'
    }, {
      name: 'Class',
      anchor: '#class-example',
      codeRef: ':class'
    }, {
      name: 'Styles',
      anchor: '#styles-example',
      codeRef: ':style'
    }, {
      name: 'If',
      anchor: '#if-example',
      codeRef: ':if'
    }, {
      name: 'ForEach',
      anchor: '#foreach-example',
      codeRef: ':foreach'
    }, {
      name: 'Attribute',
      anchor: '#attribute-example',
      codeRef: ':[any]'
    }]
  }
});