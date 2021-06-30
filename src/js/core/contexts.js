import { setInputListener } from '../core/inputs.js'
import { log, file } from '../core/utils.js'

global.context = null;
global.currentContext = null;
global.contextsDescriptor = null;

export const setContextsDescriptor = (descriptor) => {
  contextsDescriptor = descriptor;
};

export const setContext = (name, params = null) => {
  if (contextsDescriptor == null) return;
  if (currentContext == 'error') return;

  if (currentContext != null) {
    const ctx = contextsDescriptor[currentContext];
    if (ctx.dealloc) ctx.dealloc();
  }

  context = contextsDescriptor[name];
  currentContext = name;

  log("> current context:", name);

  gpio.send.setCoinerState(context.coineractive);
  context.init(params);

  if (context.inputs) {
    if (context.inputs.error == undefined) {
      context.inputs.error = errorContextHandler;
    }

    setInputListener(context.inputs);
  }
};

// default error context..
const errorContextHandler = (params) => {
  if (params == null) params = { code: 404 };
  if (params.data == undefined) params.data = 0;

  file.audit('ERR', params.code, params.data);
  setContext('error', params);
};
