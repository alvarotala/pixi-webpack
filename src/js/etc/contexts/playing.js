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


let canPlay = false;
let spining = false;

let activityTimeoutRef = null;
let activityIntervalRef = null;

const startActivityInterval = () => {
  // if (debugLevel == 1) return;

  if (activityIntervalRef != null) return;

  if (activityTimeoutRef != null) {
    clearHandledTimeout(activityTimeoutRef);
    activityTimeoutRef = null;
  }

  // console.log("> starting activity checker");

  activityIntervalRef = setHandledInterval(() => {
    if (currentContext != 'playing') return; // check..
    if (spining) return;

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
    activityTimeoutRef = setHandledTimeout(async () => {
      activityTimeoutRef = null;
      if (currentContext != 'playing') return;
      canPlay = false;

      ui.components.bets.animateDismiss();
      ui.components.score.animateDismiss();

      setContext('idle');
    }, config.idle_timeout * 1000);
  }, 5000);
}

const cancelActivityTimeout = () => {
  // console.log("> cancel activity checker");

  if (activityTimeoutRef != null) {
    clearHandledTimeout(activityTimeoutRef);
    activityTimeoutRef = null;
  }

  if (activityIntervalRef != null) {
    clearHandledInterval(activityIntervalRef);
    activityIntervalRef = null;
  }
};

const updateState = async () => {
  if (debugLevel == 1) return;
  if (currentContext != 'playing') return;

  const csf = ui.components.score.fields;
  const btotal = ui.components.bets.total();

  // set session value
  file.setnumber('/cfsession.data', csf.credits.value + csf.wins.value + btotal);

  const keys = [0,0,0, 0,0,0, 0,0,0,0,0,0,0,0];

  if (spining) {
    for(let i=0;i<8;++i) keys[i+6]=(ui.components.bets.fields[i].value>0?1:0);
    gpio.send.keyledAnimation(animations.keyled.keyboard(keys));
    return;
  }

  // if credits..
  if (csf.wins.value > 0) {
    keys[0] = 2;
    keys[2] = 2;
  }

  // if credits..
  if (csf.credits.value > 0) {
    keys[1] = 2;
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

    if (csf.credits.value > 0) {
      for(let i=0;i<8;++i) keys[i+6]=2;
    }
  }

  if (updateStateLazyTimer != null) {
    clearHandledTimeout(updateStateLazyTimer)
    updateStateLazyTimer = null;
  }

  updateStateLazyTimer = setHandledTimeout(() => updateStateLazy(keys), 200);
}

let updateStateLazyTimer = null;
const updateStateLazy = (keys) => {
  updateStateLazyTimer = null

  if (keys.reduce((a, b) => (a + b), 0) == 0) {
    gpio.send.keyledAnimation(animations.keyled.waiting());
    return;
  }

  gpio.send.keyledAnimation(animations.keyled.keyboard(keys));
};

const cantPlayLastGame = () => {
  const credits = ui.components.score.fields.credits.value;
  if (credits <= 0) return false; // not enougth credits..

  // play previous bet..
  const total = ui.components.bets.getLastPlayedTotal();
  if (total <= 0 || credits < total) return false; // no valid previous bets..

  return true;
};


const spin = async () => {
  if (currentContext != 'playing') return;
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

  const asteps  = RTPCalc.currentAlgorithm({from: current, bets: bets, total: btotal}); // steps

  const pos     = RTPCalc.r.poswithdistance(current, asteps);

  const tile    = config.roullete_tiles[pos];
  const points  = RTPCalc.r.getpoints(tile, asteps);
  const pay     = points * bets[tile.bet];

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

  await pause(200);

  playSound(0, 'roulletespin');
  getSound('roulletemain').volume = 1.0;

  const animator = new RoulleteSpinAnimatorSimple();
  await animator.run(steps);

  // next(500, () => completed(pay));

  completed(pay)
};


const completed = async (pay) => {
  if (currentContext != 'playing') return;
  if (!canPlay) return;
  if (!spining) return;

  const i = ui.components.roullete.current;
  const selected = config.roullete_tiles[i];

  // re-enable coiner
  gpio.send.setCoinerState(true);

  ui.components.bets.animatePlayReset();
  ui.components.bets.showLastValues();

  ui.components.bets.select(selected.bet);

  gpio.send.ledstripAnimation(animations.ledstrip.playing_default());


  file.audit('GAME', 'SPINCOMP');

  getSound('roulletemain').volume = 0.5;


  // TODO: Jackpot
  // if (selected.jackpot != undefined) {
  //   setContext('jackpot', {mode: selected.jackpot});
  //   return;
  // }

  // Workaround: instead of Jackpot, users get a "free spin"..
  if (selected.jackpot != undefined) {
    file.audit('GAME', 'FREESP');
    playSound(0, 'roulletelucky');
    updateState();

    await pause(300);
    spining = false;
    return; // nothing happens.. just a free spin
  }

  ui.components.bets.reset();

  if (pay > 0) {
    if (selected.bonus == true) {
      canPlay = false;
      spining = false;

      await pause(300);
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

  await pause(300);
  spining = false;
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

    pay: () => {
      if (debugLevel == 1) return;
      if (!canPlay) return;
      if (spining) return;

      // check for wins before..
      if (ui.components.score.fields.wins.value <= 0) return;

      setContext('cashout');
    },

    option: () => {
      if (!canPlay) return;
      if (spining) return;

      setContext('menu');
    },

    left: () => {
      if (spining) return;
      const credits = ui.components.score.fields.credits.value;
      if (credits < 1) return;

      ui.components.score.addAtField('wins', 1)
      ui.components.score.addAtField('credits', -1)
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
