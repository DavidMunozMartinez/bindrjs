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
      },
      {
        id: 'life-cycle-hooks',
        name: 'Hooks',
        anchor: '#hooks',
        codeRef: 'Hooks' 
      }
    ],
    totalDownloads: 0
  },
  ready: () => {
    fetch('https://api.npmjs.org/downloads/point/2021-03-17:2022-09-17/bindrjs')
      .then((response) => response.json())
      .then(data => {
        const formatter = Intl.NumberFormat('en', { notation: 'standard' });
        let increment = 1;
        let current = 0;
        let interval = setInterval(() => {
          if (current < data.downloads) {
            current = current + increment
            let val = formatter.format(current);
            LeftNavbar.bind.totalDownloads = val;
            increment = increment + 31;
          } else {
            if (current > data.downloads) {
              LeftNavbar.bind.totalDownloads = formatter.format(data.downloads)
            }
            clearInterval(interval);
          }
        }, 89);
      });
  }
});

setTimeout(() => {
  LeftNavbar.bind.bindTypes[0].testData = 'Something else!';
}, 2000);