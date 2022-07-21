let ForEachExample = new Bind({
  id: 'foreach-example',
  template: 'foreach-example/foreach-example.html',
  bind: {
    simpleArray: [
      'One',
    ],
    objArray: [
      {data: 'one'},
    ],
    nestedArrays: [{
      data: 'First data object',
      children: ['one']
    }, {
      data: 'Second data object',
      children: ['one']
    }, {
      data: 'Third data object',
      children: ['one']
    }],
    add: () => {
      ForEachExample.bind.simpleArray.push('Added trough button');
    },
    addObj: () => {
      ForEachExample.bind.objArray.push({
        data: 'Added trough button',
        timestamp: new Date().toLocaleTimeString()
      })
    },
    addToReference: (ref) => {
      ref.push('Added trough button');
    }
  },
  ready: () => {
    ForEachExample.bind.simpleArray.push('Two');
  }
});