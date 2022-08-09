import { Bind } from './bind/bind.class';
import { CustomBindHandler } from './bind/bind-handlers/bind-handler';

// For  vanilla JS projects
((w: any) => {
  w['Bind'] = Bind;
  w['CustomBindHandler'] = CustomBindHandler;
})(window);

// For TS projects
export {
  Bind,
  CustomBindHandler
}

