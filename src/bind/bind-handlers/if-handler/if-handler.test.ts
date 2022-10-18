import { Bind } from "../../bind.class";

describe('If bind handler', () => {
  document.body.innerHTML = '<div id="test-node"></div>'
  const { bind } = new Bind({
    id: 'test-node',
    template: `
      <div :if="this.render" id="find-me"></div>
    `,
    bind: {
      render: false
    }
  });

  it('Shouldn\'t render the element', () => {
    let element = document.getElementById("find-me");
    expect(element).toBeNull();
  });

  it('Should render the element', () => {
    bind.render = true;
    let element = document.getElementById("find-me");
    expect(element).toBeDefined();
  })
});