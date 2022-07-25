let StyleJs = `
let StyleExample = new Bind({
  id: 'style-example',
  template: 'style-example/style-example.html',
  bind: {
    following: null,
    followerStyles: {
      height: '20px',
      width: '20px',
      borderRadius: '50%',
      transform: 'translate(225px,175px)',
      backgroundColor: 'lightgray',
      position: 'absolute',
      pointerEvents: 'none',
      transition: 'all 2000ms cubic-bezier(.17,.67,.26,.92)',
    },
    onMouseMove: event => {
      let styles = StyleExample.bind.followerStyles;
      styles.transform = \`translate(\${event.offsetX - 50}px, \${
        event.offsetY - 50
      }px)\`;
      StyleExample.bind.following = true;
      let max = 255;
      let r = Math.floor(Math.random() * max);
      let g = Math.floor(Math.random() * max);
      let b = Math.floor(Math.random() * max);
      StyleExample.bind.followerStyles.backgroundColor = \`rgba(\${r}, \${g}, \${b})\`;
    },
    onMouseLeave: event => {
      let styles = StyleExample.bind.followerStyles;
      styles.transform = 'translate(225px,175px)';
      StyleExample.bind.following = false;
    },
  },
});
`

let StyleExample = new Bind({
  id: 'style-example',
  template: 'style-example/style-example.html',
  bind: {
    following: null,
    followerStyles: {
      height: '20px',
      width: '20px',
      borderRadius: '50%',
      transform: 'translate(225px,175px)',
      backgroundColor: 'lightgray',
      position: 'absolute',
      pointerEvents: 'none',
      transition: 'all 2000ms cubic-bezier(.17,.67,.26,.92)',
    },
    onMouseMove: event => {
      let styles = StyleExample.bind.followerStyles;
      styles.transform = `translate(${event.offsetX - 50}px, ${
        event.offsetY - 50
      }px)`;
      StyleExample.bind.following = true;
      let max = 255;
      let r = Math.floor(Math.random() * max);
      let g = Math.floor(Math.random() * max);
      let b = Math.floor(Math.random() * max);
      StyleExample.bind.followerStyles.backgroundColor = `rgba(${r}, ${g}, ${b})`;
    },
    onMouseLeave: event => {
      let styles = StyleExample.bind.followerStyles;
      styles.transform = 'translate(225px,175px)';
      StyleExample.bind.following = false;
    },
    PreBindHTMLCode: '',
    JSCode: classJs,
  },
  templateRendered: () => {
    let html = StyleExample.container.getElementsByClassName('example')[0].innerHTML;
    StyleExample.bind.PreBindHTMLCode = Prism.highlight(html, Prism.languages.markup, 'markup');
    StyleExample.bind.JSCode = Prism.highlight(StyleJs, Prism.languages.javascript, 'javascript');
  }
});
