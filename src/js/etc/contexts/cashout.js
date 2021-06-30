import * as PIXI from 'pixi.js'
import config from '../../config.js'

import { log, file, playSound, next } from '../../core/utils.js'
import { setContext } from '../../core/contexts.js'

import { animations } from '../gpio_animations.js'

import { Actions, Interpolations } from 'pixi-actions';

const animateRelease = () => {
  gpio.send.keyledAnimation(animations.keyled.flash(100));
  gpio.send.ledstripAnimation(animations.ledstrip.flash(100));

  const field = ui.components.score.fields.wins.text;

  f.tick = 0;
  f.ticker = (delta) => {
    f.tick+=0.2;
    const scale = 0.8 + (Math.sin(f.tick) * 0.3);
    field.scale.set(scale, scale);
  };
  app.ticker.add(f.ticker);


  // TODO: Timeout...
  // check for cfgpio errors..
  // f.timeout = setHandledTimeout(() => timeoutHandler(), (5 * 1000 * 60)); // 5 mins
};


const saveDataAndClear = () => {
  ui.components.score.resetField('wins');

  const csf = ui.components.score.fields;
  const btotal = ui.components.bets.total();

  // set session value
  // !important - must be after reset wins field..
  file.setsession(csf.credits.value + btotal);
  app.ticker.remove(f.ticker);
}


const hopperSuccess = () => {
  saveDataAndClear();

  const field = ui.components.score.fields.wins.text;
  Actions.scaleTo(field, 1, 1, 0.5, Interpolations.linear).play();

  next(1000, () => setContext('playing'));
};

const hopperErrorFallback = (params) => {
  saveDataAndClear();

  // fallback to error context to propper handle..
  setContext('error', params);
};


const f = {

  init: () => {
    const csf = ui.components.score.fields;
    const wins = csf.wins.value;

    const btotal = ui.components.bets.total();

    file.audit('GAME', 'CASHOUT', wins, csf.credits.value, btotal);
    file.setsession(wins + csf.credits.value + btotal);

    gpio.send.hopperReleaseCoins(wins);

    animateRelease();
  },

  inputs: {
    hopper: () => hopperSuccess(),
    error: (params) => hopperErrorFallback(params)
  }
};

export const ContextCashout = f;
