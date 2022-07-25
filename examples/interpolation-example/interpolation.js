let InterpolationBind = new Bind({
  id: 'interpolation-example',
  template: 'interpolation-example/interpolation.html',
  bind: {
    usage: '${string}',
    text: 'Hello from interpolation.js',
    counter: 0,
    multiplier: 1,
  }
});
