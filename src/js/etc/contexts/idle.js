import * as PIXI from 'pixi.js'
import config from '../../config.js'

import { log, next, pause, playSound, fadeOutSound, runsequencial, setHandledTimeout, clearHandledTimeout } from '../../core/utils.js'
import { setContext } from '../../core/contexts.js'

import { animations } from '../gpio_animations.js'
import geom from '../geom.js'

import { Actions, Interpolations } from 'pixi-actions';
import Easing from '../easing.js'

import * as particles from 'pixi-particles'


const enterLoopAnimation = (delta) => {
  if (f.emitter == undefined) return;

  f.emitter.update(delta*0.0015); // 0.005
  if (f.emitter.emit != true) return;

  f.ticker+=0.2; // 0.1 // 0.06

  const sin = Math.sin(f.ticker);

  const lscale = 0.8 + sin * 0.3;
  const tscale = 0.9 + sin * 0.1;

  const center = ui.components.roullete.size / 2;
  const len = (-20 + sin * 30) + 10;

  const total = ui.components.roullete.tiles.length;
  const ticker2 = Math.floor(f.ticker * 4);

  const cursors = [
    Math.floor(ticker2 % total),
    Math.floor((ticker2 + total / 2) % total)
  ];

  f.logo.scale.set(lscale, lscale);

  ui.components.roullete.tiles.forEach((tile, i) => {
    const angle = geom.angle(center, center, tile.ox, tile.oy);
    const point = geom.point(tile.ox, tile.oy, len, angle);

    tile.x = point.x;
    tile.y = point.y;

    tile.scale.set(tscale, tscale);

    tile.hover.visible = cursors.includes(i);
  });
};

const startParticles = () => {
  if (f.emitter == undefined) {
    const particle = [PIXI.Loader.shared.resources.particle_coin.texture]
    f.emitter = new particles.Emitter(ui.particles, particle, _particle_coin);
    f.emitter.updateOwnerPos(config.width + 50, -50);

    app.ticker.add(enterLoopAnimation);

    // f.filter = new PIXI.filters.ColorMatrixFilter();
    // f.filter.saturate(true);
  }

  // app.stage.filters = [f.filter];
  f.emitter.emit = true;
};

const stopParticles = () => {
  f.emitter.emit = false;
  // app.stage.filters = [];
};

const f = {
  coineractive: true,

  init: () => {
    f.logo = ui.components.background.logo;
    f.ticker = 3.4; // down the sine hill

    const roullete = ui.components.roullete;

    roullete.resetCursor();
    ui.components.bets.clearLastValues();
    ui.components.bets.deselect();

    roullete.animateReset();

    // app.ticker.add(enterLoopAnimation);

    runsequencial(100,
      () => gpio.send.ledstripAnimation(animations.ledstrip.idle(200)),
      () => gpio.send.keyledAnimation(animations.keyled.idle(50))
    );

    playSound(1, 'chiptronical', { loop: true });
    startParticles();
  },

  dealloc: () => {
    // app.ticker.remove(enterLoopAnimation);

    ui.components.roullete.tiles.forEach((tile, i) => {
      tile.hover.visible = false;
    });

    Actions.scaleTo(f.logo, 0.7, 0.7, 0.5, Easing.easeInQuad).play();

    f.option_pressed = undefined;
    fadeOutSound('chiptronical');

    stopParticles()
  },

  inputs: {
    default: () => {
      setContext('playing');
    },

    option: () => {
      if (f.option_pressed) return;
      f.option_pressed = true;
      fadeOutSound('chiptronical', 0.02);
    },

    addcoins: (num) => {
      ui.components.score.addAtField('credits', num);
      setContext('playing');
    }
  }
};

export const ContextIdle = f;

const _particle_coin = {alpha:{start:1,end:0.8},scale:{start:0.3,end:1.38,minimumScaleMultiplier:0.5},color:{start:"#ffffff",end:"#ffffff"},speed:{start:600,end:200,minimumSpeedMultiplier:1},acceleration:{x:0,y:0},maxSpeed:0,startRotation:{min:90,max:180},noRotation:true,rotationSpeed:{min:0,max:0},lifetime:{min:1.8,max:4},blendMode:"normal",frequency:0.1,emitterLifetime:-1,maxParticles:500,pos:{x:0,y:0},addAtBack:false,spawnType:"point"};
