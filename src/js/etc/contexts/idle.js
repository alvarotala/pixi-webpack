import * as PIXI from 'pixi.js'
import config from '../../config.js'

import { log, next, pause, playSound, fadeOutSound } from '../../core/utils.js'
import { setContext } from '../../core/contexts.js'

import { animations } from '../gpio_animations.js'
import geom from '../geom.js'

import { Actions, Interpolations } from 'pixi-actions';
import Easing from '../easing.js'

let idle_video = null;

const dismiss = () => {
  if (isPlaying) return;

  ui.components.score.addAtField('wins', ui.components.bonus.amount);
  ui.components.bonus.animateDismiss();

  setContext('playing');
};

const enterLoopAnimation = () => {
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

const f = {
  coineractive: true,

  init: () => {
    f.logo = ui.components.background.logo;
    f.ticker = 3.4; // down the sine hill

    const roullete = ui.components.roullete;

    roullete.resetCursor();
    ui.components.bets.clearLastValues();

    roullete.animateReset();

    app.ticker.add(enterLoopAnimation);

    gpio.send.ledstripAnimation(animations.ledstrip.idle(200));
    gpio.send.keyledAnimation(animations.keyled.idle(50));

    playSound('chiptronical', { volume: 0.05, loop: true });
  },

  dealloc: () => {
    app.ticker.remove(enterLoopAnimation);

    ui.components.roullete.tiles.forEach((tile, i) => {
      tile.hover.visible = false;
    });

    Actions.scaleTo(f.logo, 0.7, 0.7, 0.5, Easing.easeInQuad).play();

    fadeOutSound('chiptronical');
  },

  inputs: {
    default: () => {
      setContext('playing');
    },

    addcoins: (num) => {
      ui.components.score.addAtField('credits', num);
      setContext('playing');
    }
  }
};

export const ContextIdle = f;
