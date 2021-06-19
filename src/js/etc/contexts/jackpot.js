import config from '../../config.js'

import { log, next, pause } from '../../core/utils.js'
import { setContext } from '../../core/contexts.js'

var isPlaying = false;
var firstSpin = true;

const dismiss = (force = false) => {
  if (isPlaying) return;
  if (!firstSpin && !force) return;

  ui.components.jackpot.animateDismiss();
  setContext('playing');
};

const completed = () => {
  isPlaying = false;
  if (ui.components.jackpot.spins == 0) dismiss(true);
}

const freespin = (num) => {
  ui.components.jackpot.addFreeSpin(num);
};

const play = () => {
  if (isPlaying) return;
  isPlaying = true;

  if (firstSpin) {
    firstSpin = false;

    // reset all bets values..
    ui.components.bets.reset();
  }

  // setTimeout(() => {
  //   ui.components.jackpot.play(completed);
  // }, 100);

  ui.components.jackpot.play();
};


export const ContextJackpot = {
  coineractive: true, /// FREE SPIN!!

  init: (params) => {
    ui.components.roullete.animateDismiss();
    // await pause(300);

    ui.components.bets.animateDismiss();
    // await pause(100);

    ui.components.score.animateDismiss();
    // await pause(200);

    firstSpin = true;
    if (!params.spins) {
      params.spins = ui.components.bets.total();
    }

    ui.components.jackpot.oncompleted = completed.bind(this);
    ui.components.jackpot.animateShow(params);
  },

  inputs: {

    cancel: () => dismiss(false),
    play: () => play(),
    addcoins: (num) => freespin(num),

  }
}
