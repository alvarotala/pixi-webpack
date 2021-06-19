import * as PIXI from 'pixi.js'

export const promise = (callback) => {
  return new Promise(callback);
};


export const next = (ms, callback) => {
  return promise((resolve) => {
    setTimeout(() => {
      callback();
      resolve(true);
    }, ms);
  });
};

export const pause = (ms) => {
  return promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, ms);
  });
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

export const playSound = (name, options = null) => {
  if (debugLevel == 0) return;
  getSound(name).play(options);
};

export const stopSound = (name) => {
  getSound(name).stop();
};

export const fadeOutSound = (name, speed = 0.1, ms = 50) => {
  const sound = getSound(name);

  const interval = setInterval(() => {
    if (sound.volume > 0) {
      let nv = sound.volume - speed;
      if (nv < 0) nv = 0;
      sound.volume = nv;

      if (sound.volume == 0) {
        sound.stop();
        clearInterval(interval);
      }
    }
  }, ms);
}
