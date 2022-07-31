import Bind from './bind/bind.class';
import { AddCustomHandler } from './bind/bind-handlers/bind-handler';

((w: any) => {
  w['Bind'] = Bind;
  w['CustomBindHandler'] = AddCustomHandler;
})(window);
