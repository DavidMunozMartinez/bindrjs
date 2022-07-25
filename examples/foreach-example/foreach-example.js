let ForEachJS = `
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
});`

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
  },
  templateRendered: () => {
    let html = ForEachExample.container.getElementsByClassName('example')[0].innerHTML;
    ForEachExample.bind.PreBindHTMLCode = Prism.highlight(html, Prism.languages.markup, 'markup');
    ForEachExample.bind.JSCode = Prism.highlight(ForEachJS, Prism.languages.javascript, 'javascript');
  }
});