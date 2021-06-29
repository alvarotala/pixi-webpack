import config from '../../config.js'

import {
  log,
  file,
  next,
  pause,
  getSound,
  playSound,
  stopSound,
  setHandledTimeout,
  setHandledInterval,
  clearHandledInterval,
  clearHandledTimeout
} from '../../core/utils.js'

import RoulleteSpinAnimatorSimple from '../RoulleteSpinAnimatorSimple.js';
import { setContext } from '../../core/contexts.js'

import { animations } from '../gpio_animations.js'


let activityTimeoutRef = null;
let activityIntervalRef = null;

const startActivityInterval = () => {
  if (activityIntervalRef != null) return;

  if (activityTimeoutRef != null) {
    clearHandledTimeout(activityTimeoutRef);
    activityTimeoutRef = null;
  }

  // ignore if in debug mode..
  if (debugLevel == 1) return;
  if (currentContext != 'playing') return;

  activityIntervalRef = setHandledInterval(() => {
    if (currentContext != 'playing') return; // check..

    let foundedActivity = false;

    // check for winnings to pay..
    if (ui.components.score.fields.wins.value > 0) foundedActivity = true;

    // check if credits left..
    if (ui.components.score.fields.credits.value > 0) foundedActivity = true;

    // check any bet is placed..
    if (ui.components.bets.total() > 0) foundedActivity = true;

    // if activity founded, do nothing...
    if (foundedActivity) return;

    // no activity, stop interval..
    clearHandledInterval(activityIntervalRef);
    activityIntervalRef = null;

    // start timeout callback..
    activityTimeoutRef = setHandledTimeout(gotoIdleContext, config.idle_timeout * 1000);
  }, 5000);
}

const cancelActivityTimeout = () => {
  if (activityTimeoutRef != null) {
    clearHandledTimeout(activityTimeoutRef);
    activityTimeoutRef = null;
  }

  if (activityIntervalRef != null) {
    clearHandledInterval(activityIntervalRef);
    activityIntervalRef = null;
  }
};

const gotoIdleContext = async () => {
  activityTimeoutRef = null;

  ui.components.bets.animateDismiss();
  await pause(100);

  ui.components.score.animateDismiss();
  await pause(300);

  setContext('idle');
};

const updateState = async () => {
  const keys = [0,0,0, 0,0,0, 0,0,0,0,0,0,0,0];

  if (spining) {
    for(let i=0;i<8;++i) keys[i+6]=(ui.components.bets.fields[i].value>0?1:0);
    gpio.send.keyledAnimation(animations.keyled.keyboard(keys));
    return;
  }

  // if credits..
  if (ui.components.score.fields.wins.value > 0) {
    keys[0] = 2;
    keys[2] = 2;
  }

  // if any placed bet..
  if (ui.components.bets.total() > 0) {
    keys[4] = 2;
    keys[5] = 1;

    for(let i=0;i<8;++i) keys[i+6]=(ui.components.bets.fields[i].value>0?1:0);
  }

  else {
    if (cantPlayLastGame()) {
      keys[5] = 1; /// can play..
    }

    if (ui.components.score.fields.credits.value > 0) {
      for(let i=0;i<8;++i) keys[i+6]=2;
    }
  }

  if (keys.reduce((a, b) => (a + b), 0) == 0) {
    gpio.send.keyledAnimation(animations.keyled.waiting());
    return;
  }

  gpio.send.keyledAnimation(animations.keyled.keyboard(keys));
}

const cantPlayLastGame = () => {
  const credits = ui.components.score.fields.credits.value;
  if (credits <= 0) return false; // not enougth credits..

  // play previous bet..
  const total = ui.components.bets.getLastPlayedTotal();
  if (total <= 0 || credits < total) return false; // no valid previous bets..

  return true;
};


let canPlay = false;
let spining = false;

const spin = async () => {
  if (!canPlay) return;
  if (spining) return;

  // check if bets are set..
  // if enougth credits, try to play last played bet.
  if (ui.components.bets.total() <= 0) {
    if (!cantPlayLastGame()) return;

    ui.components.bets.setLastPlayedFields();
    ui.components.score.addAtField('credits', -ui.components.bets.total());
  }


  const len = config.roullete_tiles.length;

  const current = ui.components.roullete.current;
  const bets    = ui.components.bets.getValues();
  const btotal  = ui.components.bets.total();

  // const asteps  = RTPCalc.r.algorithms.test1(current, bets, btotal); // steps

  const asteps  = RTPCalc.r.algorithms.interpolate(current, bets, btotal); // steps

  const pos     = RTPCalc.r.poswithdistance(current, asteps);

  const tile    = config.roullete_tiles[pos];
  const pay     = RTPCalc.r.getpoints(tile, bets, asteps);

  // disable coiner

  // console.log('----------------------------');
  // console.log('current', current);
  // console.log('btotal', btotal);
  // console.log('asteps', asteps);
  // console.log('pos', pos);
  // console.log('tile', tile.texture);
  // console.log('pay', pay);


  const steps = ((1 + Math.floor(Math.random() * 2)) * len) + asteps;

  gpio.send.setCoinerState(false);
  spining = true;

  const csf = ui.components.score.fields;
  const betsva = bets.join(',')
  file.audit('GAME', 'SPIN', pos, pay, btotal, betsva, csf.credits.value, csf.wins.value);

  ui.components.score.setPoints(0);

  ui.components.bets.deselect();
  ui.components.bets.updateLastValues()
  ui.components.bets.animatePlaySelecteds()

  updateState();

  playSound(0, 'roulletespin');
  getSound('roulletemain').volume = 1.0;

  const animator = new RoulleteSpinAnimatorSimple();
  await animator.run(steps);

  // if context error, do nothing..
  if (currentContext != 'playing') return;

  next(500, () => spincompleted(pay));
};


const spincompleted = (pay) => {
  const i = ui.components.roullete.current;
  const selected = config.roullete_tiles[i];

  // re-enable coiner
  gpio.send.setCoinerState(true);

  ui.components.bets.animatePlayReset();
  ui.components.bets.showLastValues();

  ui.components.bets.select(selected.bet);


  // log("> selected:", selected);

  gpio.send.ledstripAnimation(animations.ledstrip.playing_default());

  file.audit('GAME', 'SPINCOMP');
  spining = false;

  getSound('roulletemain').volume = 0.5;

  // TODO: Jackpot
  // if (selected.jackpot != undefined) {
  //   setContext('jackpot', {mode: selected.jackpot});
  //   return;
  // }

  // Workaround: instead of Jackpot, users get a "free spin"..
  if (selected.jackpot != undefined) {
    playSound(0, 'roulletelucky');
    updateState();

    file.audit('GAME', 'FREESP');
    return; // nothing happens.. just a free spin
  }

  ui.components.bets.reset();

  if (pay > 0) {
    if (selected.bonus == true) {
      setContext('bonus', {amount: pay});
      return;
    }

    ui.components.score.setPoints(pay);
    ui.components.score.addAtField('wins', pay);
    playSound(0, 'roulletewin');
  }

  else {
    playSound(0, 'roulletelos');
  }

  updateState();
}

export const ContextPlaying = {
  coineractive: true,

  init: async () => {
    canPlay = false;
    ui.components.roullete.animateReset();

    gpio.send.ledstripAnimation(animations.ledstrip.playing_intro());
    await pause(100);

    ui.components.score.animateShow();
    ui.components.bets.animateShow();

    updateState();
    startActivityInterval();

    if (ui.components.score.fields.credits.value > 0) {
      gpio.send.ledstripAnimation(animations.ledstrip.playing_default());
    }

    playSound(0, 'playingintro');
    playSound(1, 'roulletemain', { loop: true, volume: 0.5 });

    next(1000, () => { canPlay = true; });
  },

  dealloc: () => {
    canPlay = false;
    cancelActivityTimeout();
    stopSound('roulletemain');
  },

  inputs: {

    before: startActivityInterval,
    after: updateState,

    play: () => spin(),

    left: () => {
      if (debugLevel >= 0)
        ui.components.score.addAtField('credits', 20);
    },

    option: () => {
      if (!canPlay) return;
      if (spining) return;

      setContext('menu');
    },

    right: () => {
      if (spining) return;
      const wins = ui.components.score.fields.wins.value;
      if (wins < 1) return;

      ui.components.score.addAtField('credits', 1)
      ui.components.score.addAtField('wins', -1)
    },

    cancel: () => {
      if (spining) return;

      const bets = ui.components.bets.total();
      if (bets == 0) return; // no bets to cancel..

      ui.components.bets.reset();
      ui.components.score.addAtField('credits', bets);
    },

    pay: () => {
      if (spining) return;
      const num = ui.components.score.fields.wins.value;
      if (num <= 0) return;

      // DEV: Test
      // if (num == 0) {
      //   gpio.send.hopperReleaseCoins(1);
      //   return;
      // }

      const csf = ui.components.score.fields;
      file.audit('GAME', 'PAYOUT', csf.credits.value, num);

      ui.components.score.resetField('wins');
      gpio.send.hopperReleaseCoins(num);
    },

    numpad: (index) => {
      if (spining) return;
      if (ui.components.score.fields.credits.value <= 0) return;
      const field = ui.components.bets.fields[index];
      if (field.value >= config.max_bet_per_tile) return;

      ui.components.bets.addAtPosition(index, 1);
      ui.components.score.addAtField('credits', -1);
      playSound(0, 'addbet');
    },

    addcoins: (num) => {
      ui.components.score.addAtField('credits', num);
      gpio.send.ledstripAnimation(animations.ledstrip.playing_default());
      playSound(0, 'addcoins');
    }
  }
};
