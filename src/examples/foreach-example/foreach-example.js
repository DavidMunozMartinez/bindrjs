let ForEachExample = new Bind({
  id: 'foreach-example',
  template: 'foreach-example/foreach-example.html',
  bind: {
    test: [{
      message: 'Hola',
      author: 'me'
    }, {
      message: 'Bay',
      author: 'you'
    }, {
      message: 'Ok',
      author: 'me'
    }, {
      message: 'Bye',
      author: 'me'
    }]
  },
  // ready: () => {
  //   ForEachExample.bind.test.push({
  //     data: 'Added after the fact'
  //   });

  //   console.log(ForEachExample.bind.test);
  // }
});