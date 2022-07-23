let ClassExample = new Bind({
  id: 'class-example',
  template: 'class-example/class-example.html',
  bind: {
    className: '',
    booleanClass: true,
    animateClickedItem: () => {
      ClassExample.bind.className = 'tickle-tickle';
      setTimeout(() => {
        ClassExample.bind.className = '';
      }, 500);
    }
  }
});