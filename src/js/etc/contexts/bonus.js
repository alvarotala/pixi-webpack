import config from '../../config.js'

import { log, next, pause, playSound } from '../../core/utils.js'
import { setContext } from '../../core/contexts.js'

import { animations } from '../gpio_animations.js'

var isPlaying = false;

const dismiss = () => {
  if (isPlaying) return;

  ui.components.score.addAtField('wins', ui.components.bonus.amount);
  ui.components.bonus.animateDismiss();

  setContext('playing');
};

const completed = () => {
  isPlaying = false;
  if (ui.components.bonus.amount == 0) {
    return dismiss();
  }

  gpio.send.ledstripAnimation(animations.ledstrip.fade(200));
  gpio.send.keyledAnimation(animations.keyled.keyboard([0,2,2, 0,2,0, 0,0,0,0,0,0,0,0]));
}

const playWithBet = async (color) => {
  if (isPlaying) return;
  isPlaying = true;

  ui.components.roullete.animateDismiss();

  gpio.send.ledstripAnimation(animations.ledstrip.fade(35));
  gpio.send.keyledAnimation(animations.keyled.waiting(25));
  await pause(200);

  ui.components.bets.animateDismiss();
  await pause(100);

  ui.components.score.animateDismiss();
  await pause(300);

  ui.components.bonus.play(color, completed); // purple
};


export const ContextBonus = {
  coineractive: false,

  init: (params) => {
    ui.components.bonus.animateShow(params);

    gpio.send.ledstripAnimation(animations.ledstrip.fade(200));
    gpio.send.keyledAnimation(animations.keyled.keyboard([0,2,2, 0,2,0, 0,0,0,0,0,0,0,0]));

    playSound('bonusintro');
  },

  inputs: {

    cancel: () => dismiss(),
    left: () => playWithBet(0), // purple
    right: () => playWithBet(1), // yellow

  }
}
