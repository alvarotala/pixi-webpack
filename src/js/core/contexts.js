import { setInputListener } from '../core/inputs.js'
import { log } from '../core/utils.js'

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
    setInputListener(context.inputs);
  }
};

export const dispatchError = (code, data = {}) => {
  setContext('error', {code: code, data: data});
};
