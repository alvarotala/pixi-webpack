import * as PIXI from 'pixi.js'
import config from '../../config.js'

import { log, file, playSound, next } from '../../core/utils.js'
import { setContext } from '../../core/contexts.js'

import { animations } from '../gpio_animations.js'

import { Actions, Interpolations } from 'pixi-actions';

const animateRelease = () => {
  gpio.send.keyledAnimation([[[1,1,1, 1,1,1, 1,1,1,1,1,1,1,1], 50]]);
  gpio.send.ledstripAnimation([[0,1,0,50]]);

  const field = ui.components.score.fields.wins.text;

  f.tick = 0;
  f.ticker = (delta) => {
    f.tick+=0.2;
    const scale = 0.8 + (Math.sin(f.tick) * 0.3);
    field.scale.set(scale, scale);
  };
  app.ticker.add(f.ticker);
};

const removeAnimation = () => {
  app.ticker.remove(f.ticker);
  const field = ui.components.score.fields.wins.text;
  Actions.scaleTo(field, 1, 1, 0.5, Interpolations.linear).play();
};


const hopperSuccess = () => {
  file.setnumber('/cfcashout.data', 0);
  ui.components.score.resetField('wins');

  next(1000, () => setContext('playing'));
};

const hopperErrorFallback = (params) => {
  ui.components.score.resetField('wins');
  setContext('error', params); // fallback to error context to propper handle..
};


const f = {

  init: () => {
    const csf = ui.components.score.fields;
    const wins = csf.wins.value;

    const btotal = ui.components.bets.total();

    file.audit('GAME', 'CASHOUT', wins, csf.credits.value, btotal);

    file.setnumber('/cfcashout.data', wins);
    file.setnumber('/cfsession.data', csf.credits.value + btotal);

    animateRelease();

    // TODO: Timeout...
    // check for cfgpio errors..
    // f.timeout = setHandledTimeout(() => timeoutHandler(), (5 * 1000 * 60)); // 5 mins

    next(500, () => gpio.send.hopperReleaseCoins(wins));
  },

  dealloc: () => removeAnimation(),

  inputs: {
    hopper: () => hopperSuccess(),
    error: (params) => hopperErrorFallback(params)
  }
};

export const ContextCashout = f;
