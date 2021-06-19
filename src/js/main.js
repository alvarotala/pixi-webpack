import * as PIXI from 'pixi.js'
import config, { game } from './config.js'
import storage from './core/storage.js'

// check raspi temp
// cat /sys/class/thermal/thermal_zone0/temp

// DEV: Test
// storage.clear();

// https://pixijs.download/dev/docs/PIXI.settings.html#RENDER_OPTIONS

PIXI.settings.PRECISION_VERTEX = PIXI.PRECISION.LOW; // PIXI.PRECISION.HIGH /// MEDIUM
PIXI.settings.STRICT_TEXTURE_CACHE = false;
PIXI.settings.GC_MAX_IDLE = 20000; // 3600
PIXI.settings.GC_MAX_CHECK_COUNT = 2000; // 600
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL_LEGACY; // PIXI.ENV.WEBGL2;
PIXI.settings.SORTABLE_CHILDREN = false;
PIXI.settings.SPRITE_BATCH_SIZE = 2048; // 4096;
PIXI.settings.TARGET_FPMS = 0.03; // 0.06

// PIXI.settings.GC_MODE = PIXI.GC_MODES.MANUAL; // PIXI.GC_MODES.AUTO

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

app.renderer = new PIXI.Renderer({ width: config.width, height: config.height, backgroundColor: 0x000000 });
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
    log("Tickers: " + tickers.length);
  },

  remove: (delegate) => {
    if (tickers.includes(delegate))
      tickers.splice(tickers.indexOf(delegate), 1);
    log("Tickers: " + tickers.length);
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
global.debugLevel = 0;

if(window.location.search == '?1') debugLevel = 1;
if(window.location.search == '?2') debugLevel = 2;

import { log } from './core/utils.js'

import { startGPIOInterface, mapGPIOtoInputs, setGPIOInterface } from './core/cfgpio.js'
import { inputsWithKeyboard } from './core/keyboard.js' // add keyboard support
import { bootloader } from './core/bootloader.js'


// log(PIXI.settings);
// log("IsMobile:", PIXI.isMobile.any);

// load game
// TODO: move specific game files to folder to make dynamic..

import './core/contexts.js'
import UIManager from './ui.js'

const loadGameEngine = () => {
  log("-- game engine started --");

  ui = new UIManager();
  app.stage.addChild(ui.view);

  ui.load();
}

const boot = (host) => {
  startGPIOInterface(host, (success) => {
    if (success) return bootloader(loadGameEngine);

    // TODO: check errors and pause machine..
    log('Error initializing gpio device');
  });
};

(function() {
  log('-- starting --');

  setGPIOInterface();
  app.ticker.start()

  if (debugLevel > 0) {
    log('-- debug mode --');

    inputsWithKeyboard();

    // enable remote gpio debug..
    if (debugLevel == 2) {
      log('-- gpio mapped to remote --');

      boot(config.cfgpio_remote_debug);
      return 0;
    }

    loadGameEngine();
    return 0;
  }

  boot(config.cfgpio_url);
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
//
//
//
//
//
