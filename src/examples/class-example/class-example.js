let ClassExample = new Bind({
  id: 'class-example',
  template: 'class-example/class-example.html',
  bind: {
    // Class example
    className: '',
    booleanClass: true,
    tickle: () => {
      ClassExample.bind.className = 'tickle-tickle';
      setTimeout(() => {
        ClassExample.bind.className = '';
      }, 500);
    },
    // Styles example
    following: null,
    followerStyles: {
      height: '50px',
      width: '50px',
      borderRadius: '50%',
      transform: 'translate(225px,175px)',
      backgroundColor: 'black',
      position: 'absolute',
      pointerEvents: 'none',
      transition: 'transform 2000ms cubic-bezier(.17,.67,.26,.92)',
    },
    onMouseMove: (event) => {
      let styles = ClassExample.bind.followerStyles;
      styles.transform = `translate(${event.offsetX - 50}px, ${event.offsetY - 50}px)`;
      ClassExample.bind.following = true;
    },
    onMouseLeave: (event) => {
      let styles = ClassExample.bind.followerStyles;
      styles.transform = 'translate(225px,175px)';
      ClassExample.bind.following = false;
    },
    onClick: () => {
      let max = 255;
      let r = Math.floor(Math.random() * max);
      let g = Math.floor(Math.random() * max);
      let b = Math.floor(Math.random() * max);
      ClassExample.bind.followerStyles.backgroundColor = `rgba(${r}, ${g}, ${b})`;
    }
  }
});