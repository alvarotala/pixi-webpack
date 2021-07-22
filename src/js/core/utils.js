import * as PIXI from 'pixi.js'
import { sound } from '@pixi/sound';

import config from '../config.js'

global.timeouts   = [];
global.intervals  = [];

export const lerp2 = ( x, a1, a2, b1, b2 ) => {
  return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );
}

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

export const playSound = (group, name, options = {}) => {
  // if (debugLevel == 1) return;
  // sound.volumeAll = config.local.master_volume;
  if (options.volume == undefined) {
     options.volume = 1;
  }

  // check if can play music..
  if (group == 1 && config.local.music == 0) return;

  options.volume = Math.min(options.volume, config.local.master_volume);
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

export const file = {

  w: (path, data, mode = 'w') => {
    if (!window.electron) return;
    window.electron.file.write(config.base_path + path, data, {flag: mode});
  },

  r: (path, callback) => {
    if (!window.electron) return callback(null);
    window.electron.file.read(config.base_path + path, (success, data) => {
      if (!success) return callback(null);
      callback(data);
    });
  },

  writejson: (path, data) => {
    file.w(path, JSON.stringify(data), 'w')
  },

  readjson: (path, callback) => {
    file.r(path, (data) => {
      if (!data) callback(null);
      callback(JSON.parse(data));
    });
  },

  audit: (...args) => {
    if (!window.electron) return;
    if (args == null) args = ['ERR', 708];
    args.unshift(Date.now())
    args.push('\r\n')
    file.w('/cfaudit.log', args.join(':'), 'a');
  },

  getberror: (callback) => {
    file.r('/cfgpio_error.data', (data) => {
      if (data == null) {
        return callback(null);
      }
      const parts = data.split(':');
      if (parts[0] != 'E' && parts.length == 3) {
        return callback(null);
      }

      if (parts[1] == '0') {
        return callback(null);
      }

      callback({code: parseInt(parts[1]), data: parseInt(parts[2])})
    });
  },

  clearberror: () => {
    file.w('/cfgpio_error.data', 'E:0:0', 'w');
  },

  getnumber: (path, callback) => {
    file.r(path, (num) => {
      if (num == null || num == undefined) return callback(0);
      const inum = parseInt(num);
      if (isNaN(inum)) return callback(0);
      callback(inum);
    });
  },

  setnumber: (path, num) => {
    if (isNaN(num) || num == null || num == undefined) return;
    file.w(path, num.toString());
  },

  updatenumber: (path, num) => {
    file.getnumber(path, (i) => file.setnumber(path, i + num));
  }

};


/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
export const hslToRgb = (h=0, s=1, l=0.5) => {
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        const hue2rgb = (p, q, t) => {
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return {r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255)};
};


export const hslToHex = (h, s, l) => {
  const hsl = hslToRgb(h, s, l);
  const toHex = (c) => {
    const hex = c.toString(16);
    return hex.length == 1 ? '0' + hex : hex;
  };

  return '0x' + toHex(hsl.r) + toHex(hsl.g) + toHex(hsl.b);
};
