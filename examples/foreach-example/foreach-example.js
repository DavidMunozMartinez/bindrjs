let ForEachExample = new Bind({
  id: 'foreach-example',
  template: 'foreach-example/foreach-example.html',
  bind: {
    complex: [
      {
        text: 'Hello world',
        childArray: [
          {
            data: 'text',
            childTwoArray:  [
              'One'
            ]
          }
        ]
      }
    ]
  }
});