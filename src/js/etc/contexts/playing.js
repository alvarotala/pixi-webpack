import config from '../../config.js'

import {
  log,
  file,
  next,
  pause,
  playSound,
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

  // if anny placed bet..
  if (ui.components.bets.total() > 0) {
    keys[4] = 2;
    keys[5] = 2;

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
    await pause(100)
    gpio.send.keyledAnimation(animations.keyled.waiting());
    return;
  }

  await pause(100)
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


const simulate = (from, distance) => {
  const pos    = ui.components.roullete.simulate(from, distance);
  const tile   = config.roullete_tiles[pos];

  if (tile.jackpot != undefined) return -1;

  let points   = tile.points;

  if (tile.multiplier != undefined) {
    points*= ui.components.bets.multipliers.simulate(distance, tile.multiplier);
  }

  const bet = ui.components.bets.fields[tile.bet].value;
  return (points * bet);
};

const analyze = () => {
  const steps = config.roullete_tiles.length;
  const current = ui.components.roullete.current;

  const cases = [];

  for (let i = 0; i<steps; i++) {
    cases.push(simulate(current, i));
  }

  return cases;
}

let spining = false;

const spin = async () => {
  if (spining) return;

  // check if bets are set..
  // if enougth credits, try to play last played bet.
  if (ui.components.bets.total() <= 0) {
    if (!cantPlayLastGame()) return;

    ui.components.bets.setLastPlayedFields();
    ui.components.score.addAtField('credits', -ui.components.bets.total());
  }

  // disable coiner
  gpio.send.setCoinerState(false);


  const len = config.roullete_tiles.length;
  const cases = analyze();

  console.log(cases);

  let num =  Math.floor(Math.random() * len);


  const totalbets = ui.components.bets.total();
  const a = Math.random() < 0.6 ? false : true;
  if (a == true) {
    console.log(">>>>> TRUE random");
  }
  else {
    console.log(">> pseudo random");

    const indexes = [];
    cases.forEach((c, i) => {
      if (c <= totalbets) indexes.push(i);
    });

    const sel = Math.floor(Math.random() * indexes.length);
    num = indexes[sel];
  }

  const pay = cases[num];
  const ref = (ui.components.roullete.current + num) % len;

  console.log('tot', totalbets);
  console.log('num', num);
  console.log('pay', pay);
  console.log('ref', ref);
  console.log('tex', config.roullete_tiles[ref].texture);


  //
  // let times   = 0;
  // let people  = 10;
  // let bets    = 100;
  //
  // for (var a = 0; a < people; a++) {
  //
  //   for (var i = 0; i < bets; i++) {
  //     const rate = Math.random() < 0.8 ? false : true;
  //
  //     if (rate) {
  //       const num = Math.floor(Math.random() * len);
  //       if (num == 2) {
  //           times++;
  //       }
  //     }
  //   }
  //
  // }
  //
  // const total_played = (people * (bets * 1000));
  // const total_payed  = (times * 100) * 1000
  //
  // console.log("times:", times, total_played - total_payed);

  const steps = ((2 + Math.floor(Math.random() * 2)) * len) + num;

  spining = true;

  const csf = ui.components.score.fields;
  const betsva = ui.components.bets.getValues().join(',')
  file.audit('GAME', 'SPIN', ref, pay, totalbets, betsva, csf.credits.value, csf.wins.value);

  ui.components.bets.updateLastValues()
  ui.components.bets.animatePlaySelecteds()

  updateState();

  playSound('roulletespin');

  const animator = new RoulleteSpinAnimatorSimple();
  await animator.run(steps);

  // if context error, do nothing..
  if (currentContext != 'playing') return;

  next(500, () => spincompleted(pay));
};

const spincompleted = (pay) => {
  spining = false;

  // re-enable coiner
  gpio.send.setCoinerState(true);

  ui.components.bets.animatePlayReset();
  ui.components.bets.showLastValues();

  const i = ui.components.roullete.current;
  const selected = config.roullete_tiles[i];

  // log("> selected:", selected);

  gpio.send.ledstripAnimation(animations.ledstrip.playing_default());

  file.audit('GAME', 'SPINCOMP');

  // TODO: Jackpot
  // if (selected.jackpot != undefined) {
  //   setContext('jackpot', {mode: selected.jackpot});
  //   return;
  // }

  // Workaround: instead of Jackpot, users get a "free spin"..
  if (selected.jackpot != undefined) {
    playSound('roulletelucky');
    file.audit('GAME', 'FREESP');
    updateState();
    return; // nothing happens.. just a free spin
  }

  ui.components.bets.reset();

  if (pay == 0) playSound('roulletelos');
  if (pay > 0) {
    if (selected.bonus == true) {
      setContext('bonus', {amount: pay});
      return;
    }

    ui.components.score.addAtField('wins', pay);
    playSound('roulletewin');
  }

  updateState();
}


export const ContextPlaying = {
  coineractive: true,

  init: async () => {
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

    playSound('playingintro');
  },

  dealloc: () => {
    cancelActivityTimeout();
  },

  inputs: {

    before: startActivityInterval,
    after: updateState,

    play: () => spin(),

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

      // DEV: Test
      if (num == 0) {
        gpio.send.hopperReleaseCoins(1);
        return;
      }

      const csf = ui.components.score.fields;
      file.audit('GAME', 'PAYOUT', csf.credits.value, num);

      ui.components.score.resetField('wins');
      gpio.send.hopperReleaseCoins(num);
    },

    numpad: (index) => {
      if (spining) return;
      if (ui.components.score.fields.credits.value <= 0) return;

      ui.components.bets.addAtPosition(index, 1);
      ui.components.score.addAtField('credits', -1);
      playSound('addbet');
    },

    addcoins: (num) => {
      ui.components.score.addAtField('credits', num);
      gpio.send.ledstripAnimation(animations.ledstrip.playing_default());
      playSound('addcoins');
    }
  }
};
