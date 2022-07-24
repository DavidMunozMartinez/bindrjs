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
  }
});