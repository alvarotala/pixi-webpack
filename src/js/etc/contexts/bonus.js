import config from '../../config.js'

import { log, file, next, pause, getSound, playSound, stopSound, runsequencial } from '../../core/utils.js'
import { setContext } from '../../core/contexts.js'

import { animations } from '../gpio_animations.js'

let isPlaying = false;
let currentSelection = null;

const dismiss = () => {
  if (currentContext != 'bonus') return;
  if (isPlaying) return;

  const bonus = ui.components.bonus;

  if (bonus.amount > 0) {
    ui.components.score.setPoints(bonus.amount);
    ui.components.score.addAtField('wins', bonus.amount);
  }

  ui.components.bonus.animateDismiss();
  next(600, () => setContext('playing'));
};

const completed = (result) => {
  if (currentContext != 'bonus') return;

  const csf = ui.components.score.fields;

  const bonus = ui.components.bonus;
  isPlaying = false;

  // winner winner chicken dinner
  if (result == currentSelection) {
    bonus.amount *= 2;
    bonus.field.setText(bonus.amount);

    file.setsession(csf.credits.value + csf.wins.value + bonus.amount);

    runsequencial(100,
      () => gpio.send.ledstripAnimation(animations.ledstrip.fade(200)),
      () => gpio.send.keyledAnimation(animations.keyled.bonuschoise())
    );

    playSound(0, 'bonuswin');
    getSound('bonusmain').volume = 1.0;

    return; // win.. play again?
  }


  bonus.amount = 0; // lose all
  bonus.field.setText(bonus.amount);

  file.setsession(csf.credits.value + csf.wins.value);

  // TODO: play loser sound..
  next(2000, dismiss);

  runsequencial(100,
    () => gpio.send.ledstripAnimation(animations.ledstrip.fade(300)),
    () => gpio.send.keyledOff()
  );

  playSound(0, 'bonuslos');
}

const playWithSelection = async (selection) => {
  if (isPlaying) return;
  if (ui.components.bonus.amount == 0) return;

  getSound('bonusmain').volume = 0.3;

  isPlaying = true;
  currentSelection = selection;


  const num = Math.random() < (config.bonus_rate * 0.01) ? 1 : 0; // 1 = change selection, 0 = user wins
  const target = Math.abs(selection - num);


  const cbonus = ui.components.bonus;
  const csf = ui.components.score.fields;
  file.audit('GAME', 'BONUS', selection, target, cbonus.amount, csf.credits.value, csf.wins.value);

  if (!ui.components.roullete.isDismissed())
    ui.components.roullete.animateDismiss();

  runsequencial(100,
    () => gpio.send.ledstripAnimation(animations.ledstrip.fade(35)),
    () => gpio.send.keyledAnimation(animations.keyled.waiting(25))
  );

  await pause(200);

  ui.components.bets.animateDismiss();
  await pause(100);

  ui.components.score.animateDismiss();
  await pause(300);

  ui.components.bonus.play(selection, target, completed);
  playSound(0, 'bonusinitspin', { volume: 0.4 })
};

export const ContextBonus = {
  coineractive: false,

  init: (params) => {
    currentSelection = null;

    const csf = ui.components.score.fields;
    file.setsession(csf.credits.value + csf.wins.value + params.amount);

    ui.components.bonus.amount = params.amount;
    ui.components.bonus.animateShow();

    runsequencial(100,
      () => gpio.send.ledstripAnimation(animations.ledstrip.fade(200)),
      () => gpio.send.keyledAnimation(animations.keyled.bonuschoise())
    );

    playSound(0, 'bonusintro');
    playSound(1, 'bonusmain', { loop: true, volume: 0.7 });
  },

  dealloc: () => {
    stopSound('bonusmain');
  },

  inputs: {

    cancel: () => dismiss(),
    left:  () => playWithSelection(0), // purple
    right: () => playWithSelection(1), // yellow

  }
}
