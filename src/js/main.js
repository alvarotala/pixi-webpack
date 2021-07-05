
// check enviroment level..
global.debugLevel = 0;

if(window.location.search == '?1') debugLevel = 1;
if(window.location.search == '?2') debugLevel = 2;

import * as PIXI from 'pixi.js'



// DEMO WEB ONLY!!!!
// import { dispatch } from './core/inputs.js'
// window.touchbar = (input) => {
//   RTPCalc.addentropy(input);
//
//   const com = input.split(':')
//   dispatch(com[0], (com.length > 1 ? com[1] : null));
// };
//
// debugLevel = 1;
// PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL2;// PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL2;



console.log("***** global.debugLevel", global.debugLevel);


import config from './config.js'
import './core/prototypes.js'

import storage from './core/storage.js'


// load settings from internal storage..
config.local = storage.getObject('local');
if (config.local == null) {
  config.local = { master_volume: 1, music: 1 };
  storage.setObject('local', config.local);
}


// check raspi temp
// cat /sys/class/thermal/thermal_zone0/temp

// DEV: Test
// storage.clear();

// https://pixijs.download/dev/docs/PIXI.settings.html#RENDER_OPTIONS

PIXI.settings.PRECISION_VERTEX = PIXI.PRECISION.LOW; // PIXI.PRECISION.HIGH /// MEDIUM
PIXI.settings.STRICT_TEXTURE_CACHE = false;
// PIXI.settings.GC_MAX_IDLE = 20000; // 3600
// PIXI.settings.GC_MAX_CHECK_COUNT = 2000; // 600
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL_LEGACY;
// PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL2;

PIXI.settings.SORTABLE_CHILDREN = false;
// PIXI.settings.SPRITE_BATCH_SIZE = 2048; // 4096;
PIXI.settings.TARGET_FPMS = 0.03; // 0.06

// PIXI.settings.GC_MODE = PIXI.GC_MODES.MANUAL; // PIXI.GC_MODES.AUTO



// log(PIXI.settings);
// log("IsMobile:", PIXI.isMobile.any);


/*
global.app = new PIXI.Application({
  width: config.width,
  height: config.height,
  backgroundColor: 0x000000,
  view: document.querySelector('#scene'),

  transparent: false,
  useContextAlpha: false,
  // antialias: true,
  powerPreference: 'high-performance',
  sharedTicker: false, // true
  legacy: true,
  // resolution: window.devicePixelRatio || 1
});
*/


global.app = {};

app.renderer = new PIXI.Renderer({
  width: config.width,
  height: config.height,
  backgroundColor: 0x000000,
  legacy: true,
  antialias: true,
  // powerPreference: 'high-performance',
  // transparent: false,
  // useContextAlpha: false,
  // view: document.querySelector('#scene')
});

document.body.appendChild(app.renderer.view);

app.stage = new PIXI.Container();

/// Custom ticker..
/// so we can control FPS better

const fps = 30;
const tickers = [], delay = 1000 / fps;
let time = null,                                      // start time
    frame = -1,                                       // frame count
    tref = null,
    last = 0;                                         // rAF time reference

app.ticker = {
  fps: fps,

  add: (delegate) => {
    if (!tickers.includes(delegate))
      tickers.push(delegate);
  },

  remove: (delegate) => {
    if (tickers.includes(delegate))
      tickers.splice(tickers.indexOf(delegate), 1);
  },

  clear: () => {
    tickers.splice(0, tickers.length);
  },

  animate: (timestamp) => {
    const diff = timestamp - last;
    last = timestamp;

    if (time === null) time = timestamp;
    const seg = Math.floor((timestamp - time) / delay);
    if (seg > frame) {
        frame = seg;

        app.renderer.render(app.stage);
        tickers.forEach((delegate) => delegate(diff, frame));
    }

    tref = requestAnimationFrame(app.ticker.animate)
  },

  start: () => {
    if (tref == null)
      tref = requestAnimationFrame(app.ticker.animate);
  }
}


global.ui = null;
global.gpio = {};

import { setGPIOInterface } from './core/cfgpio.js'
import { inputsWithKeyboard } from './core/keyboard.js' // add keyboard support
import { bootloader } from './core/bootloader.js'
import { log, file, set_basepath, promise } from './core/utils.js'

const cfdata_dir = (debugLevel == 0) ? config.base_path : config.debug_base_path
set_basepath(cfdata_dir);



if (config.loaded == undefined) {
  config.loaded = config.defaults;
  file.readjson(cfdata_dir + '/cfload.conf', (data) => {
    console.log('config.loaded', cfdata_dir, data);

    if (data != null) {
      config.loaded = data;
    }
  });
}

import './core/RTPCalc.js'

RTPCalc.currentAlgorithm = RTPCalc.r.algorithms.test5;
RTPCalc.r.preheat(10000, RTPCalc.currentAlgorithm);

// RTPCalc.r.simulate(RTPCalc.r.algorithms.test5, 8, 8, 10000);

// load game
// TODO: move specific game files to folder to make dynamic..

import './core/contexts.js'
import UIManager from './ui.js'


const loadGameEngine = async () => {
  log("-- game engine started --");
  file.audit('GAME', 'INI', debugLevel);

  ui = new UIManager();
  app.stage.addChild(ui.view);

  await ui.load();
}


(function() {
  log('-- starting --');

  setGPIOInterface();
  app.ticker.start();

  if (debugLevel == 1) {
    log('-- debug mode 1 --');

    inputsWithKeyboard();
    loadGameEngine();
    return;
  }

  // enable remote gpio debug..
  if (debugLevel == 2) {
    log('-- debug mode 2 - gpio mapped to remote --');

    inputsWithKeyboard();
    bootloader(config.cfgpio_remote_debug, loadGameEngine);
    return;
  }

  bootloader(config.cfgpio_url, loadGameEngine);
})();


// TODOs:

// - Jackpot: finalize for next release..
//   aparently.. there is a memory problem.
//   I don't know if my code is creating a leak, or its just a raspberry - mir thing..
//
// - Coin particles:
//   https://pixijs.io/pixi-particles/docs/
//   https://pixijs.io/pixi-particles/examples/coins.html
//
// - seedrandom
//   https://github.com/davidbau/seedrandom
//
//
//
//
