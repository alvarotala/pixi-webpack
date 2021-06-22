import * as PIXI from 'pixi.js'
import { sound } from '@pixi/sound';

import config from '../config.js'

global.timeouts   = [];
global.intervals  = [];

export const promise = (callback) => {
  return new Promise(callback);
};

export const setHandledTimeout = (f, ms) => {
  const id = setTimeout(f, ms);
  timeouts.push(id);
  return id;
};

export const clearHandledTimeout = (id) => {
  const i = timeouts.indexOf(id);
  if (i !== -1) timeouts.splice(i, 1);
  clearTimeout(id);
};

export const setHandledInterval = (f, ms) => {
  const id = setInterval(f, ms);
  intervals.push(id);
  return id;
};

export const clearHandledInterval = (id) => {
  const i = intervals.indexOf(id);
  if (i !== -1) intervals.splice(i, 1);
  clearInterval(id);
};


export const clearAllTasks = () => {
  timeouts.forEach((i) => clearTimeout(i));
  intervals.forEach((i) => clearInterval(i));
  global.timeouts = [];
  global.intervals = [];
};


export const next = (ms, callback = null) => {
  return promise((resolve) => {
    setHandledTimeout(() => {
      if (callback) callback();
      resolve(true);
    }, ms);
  });
};

export const pause = (ms) => {
  return promise((resolve) => {
    setHandledTimeout(() => {
      resolve(true);
    }, ms);
  });
};

export const runsequencial = async (ms, ...callbacks) => {
  for (let i=0; i<callbacks.length; i++) {
    await next(ms, callbacks[i]);
  }
};

export const log = (...args) => {
  if (debugLevel == 0) return;
  console.log(...args);
};

export const randomRange = (min, max) => {
  return (Math.random() * (max - min)) + min;
};

export const getSound = (name) => {
  return PIXI.Loader.shared.resources[name].sound;
}

export const playSound = (name, options = {}) => {
  // if (debugLevel == 1) return;
  // sound.volumeAll = config.master_volume;
  if (options.volume == undefined) {
     options.volume = 1;
  }

  options.volume = Math.min(options.volume, config.master_volume);
  getSound(name).play(options);
};

export const stopSound = (name) => {
  getSound(name).stop();
};

export const fadeOutSound = (name, speed = 0.1, ms = 50) => {
  const sound = getSound(name);
  const interval = setHandledInterval(() => {
    if (sound.volume > 0) {
      let nv = sound.volume - speed;
      if (nv < 0) nv = 0;
      sound.volume = nv;

      if (sound.volume == 0) {
        sound.stop();
        sound.volume = 1.0;
        clearHandledInterval(interval);
      }
    }
  }, ms);
};


let config_path, counters_path, audit_path, berror_path;
export const set_basepath = (path) => {
  config_path   = path + "/cfconfig.json";
  counters_path = path + "/cfcounters.json";
  audit_path    = path + "/cfaudit.log";
  berror_path   = path + "/cferrors.json";

  console.info("***** config.base_path", path);
};


export const file = {

  writejson: (path, data) => {
    if (!window.electron) return;
    window.electron.file.write(path, JSON.stringify(data), {flag: 'w'});
  },

  readjson: (path, callback) => {
    if (!window.electron) return;
    window.electron.file.read(path, (success, data) => {
      if (!success) callback(null);
      callback(JSON.parse(data));
    });
  },

  getconfig: (callback) => {
    file.readjson(config_path, callback);
  },

  setconfig: (data) => {
    file.writejson(config_path, data);
  },

  setcounters: (data) => {
    file.writejson(counters_path, data);
  },

  audit: (data) => {
    if (!window.electron) return;
    const line = Date.now() +':'+ data +'\r\n';
    window.electron.file.write(audit_path, line, {flag: 'a'});
  },

  setberror: (code, data) => {
    file.writejson(berror_path, {error: 1, code: code, data: data});
  },

  getberror: (callback) => {
    file.readjson(berror_path, callback);
  }

}
