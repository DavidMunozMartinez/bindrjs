const formatter = new Intl.DateTimeFormat('en-GB');
getPackageData();
const LeftNavbar = new Bind({
  id: 'navbar',
  bind: {
    bindTypes: [
      {
        id: 'interpolation-example',
        name: 'Interpolation',
        anchor: '#interpolation-example',
        codeRef: '${string}',
        testData: 'something',
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
        codeRef: 'Custom',
      },
      {
        id: 'life-cycle-hooks',
        name: 'Hooks',
        anchor: '#hooks',
        codeRef: 'Hooks',
      },
    ],
    totalDownloads: 0,
    showMenu: false
  },
});

// Wait to initialize this Bind because some parts of it use PrismJS, and some DOM elements get
// removed, we wait for PrismJS to do its thing then we do our bindings
setTimeout(() => {
  const ContentBind = new Bind({
    id: 'install-example',
    bind: {
      latestVersion: '1.2.28',
    },
    ready: () => {
      fetch('https://registry.npmjs.org/bindrjs')
        .then(response => response.json())
        .then(data => {
          ContentBind.bind.latestVersion = data['dist-tags'].latest;
        });
    },
  });
}, 100);

function getPackageData() {
  // YEAR - MONTH - DAY
  let today = formatter.format().split('/').reverse().join('-');
  fetch(`https://api.npmjs.org/downloads/point/2021-03-17:${today}/bindrjs`)
    .then(response => response.json())
    .then(data => {
      const formatter = Intl.NumberFormat('en', {notation: 'standard'});
      let increment = 1;
      let current = 0;
      let interval = setInterval(() => {
        if (current < data.downloads) {
          current = current + increment;
          let val = formatter.format(current);
          LeftNavbar.bind.totalDownloads = val;
          increment = increment + 31;
        } else {
          if (current > data.downloads) {
            LeftNavbar.bind.totalDownloads = formatter.format(data.downloads);
          }
          clearInterval(interval);
        }
      }, 89);
    });
}

function setTextAnimation(
  delay,
  duration,
  strokeWidth,
  timingFunction,
  strokeColor,
  repeat
) {
  let title = document.querySelector('g#svgGroup');
  let paths = title.querySelectorAll('path');
  let mode = repeat ? 'infinite' : 'forwards';
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    const length = path.getTotalLength();
    path.style['stroke-dashoffset'] = `${length}px`;
    path.style['stroke-dasharray'] = `${length}px`;
    path.style['stroke-width'] = `${strokeWidth}px`;
    path.style['stroke'] = `${strokeColor}`;
    path.style[
      'animation'
    ] = `${duration}s svg-text-anim ${mode} ${timingFunction}`;
    path.style['animation-delay'] = `${i * delay}s`;
  }
}
setTextAnimation(0, 0, 2, 'ease-out', 'rgb(180, 180, 180)', false);
