import config from '../config.js'
import { log } from './utils.js'

const inputs = {
  pay: null,
  left: null,
  right: null,
  option: null,
  cancel: null,
  play: null,
  numpad: null,
  addcoins: null,

  before: (name, object) => {},
  after: (name, object) => {},

  default: () => {},
  foo: null
}

global.inputsListener = null;

export const dispatch = (name, object) => {
  if (inputsListener == null) return;
  log(">> dispatch:", name, object);

  // if defined.. executes before all..
  if (inputsListener.before != null && inputsListener.before != undefined) {
    inputsListener.before(name, object);
  }

  const method = inputsListener[name];
  if (method != null && method != undefined) {
    method(object);
  }

  // if no handler.. go to default
  else {
    if (inputsListener.default != null && inputsListener.default != undefined) {
      inputsListener.default();
    }
  }

  if (inputsListener.after != null && inputsListener.after != undefined) {
    inputsListener.after(name, object);
  }
};

export const setInputListener = (object) => {
  inputsListener = object;
};
