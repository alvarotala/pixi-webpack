import config from '../../config.js'

import { log, next, pause, playSound } from '../../core/utils.js'

import RoulleteSpinAnimatorSimple from '../RoulleteSpinAnimatorSimple.js';
import { setContext } from '../../core/contexts.js'

import { animations } from '../gpio_animations.js'


const audit = {

  roullete: {
    spins: 0
  }

}

let activityTimeoutRef = null;
let activityIntervalRef = null;

const startActivityInterval = () => {
  if (activityIntervalRef != null) return;

  if (activityTimeoutRef != null) {
    clearTimeout(activityTimeoutRef);
    activityTimeoutRef = null;
  }

  // ignore if in debug mode..
  if (debugLevel == 1) return;

  activityIntervalRef = setInterval(() => {
    var foundedActivity = false;

    // check for winnings to pay..
    if (ui.components.score.fields.wins.value > 0) foundedActivity = true;

    // check if credits left..
    if (ui.components.score.fields.credits.value > 0) foundedActivity = true;

    // check any bet is placed..
    if (ui.components.bets.total() > 0) foundedActivity = true;

    // if activity founded, do nothing...
    if (foundedActivity) return;

    // no activity, stop interval..
    clearInterval(activityIntervalRef);
    activityIntervalRef = null;

    // start timeout callback..
    activityTimeoutRef = setTimeout(gotoIdleContext, config.idle_timeout * 1000);
  }, 5000);
}

const cancelActivityTimeout = () => {
  if (activityTimeoutRef != null) {
    clearTimeout(activityTimeoutRef);
    activityTimeoutRef = null;
  }

  if (activityIntervalRef != null) {
    clearInterval(activityIntervalRef);
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

const updateState = () => {
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
    if (getLucky()) {
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

const getLucky = () => {
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
    const credits = ui.components.score.fields.credits.value;
    if (credits <= 0) return; // not enougth credits..

    // play previous bet..
    const total = ui.components.bets.getLastPlayedTotal();
    if (total <= 0 || credits < total) return; // no valid previous bets..

    ui.components.bets.setLastPlayedFields();
    ui.components.score.addAtField('credits', -total);
  }

  // disable coiner
  gpio.send.setCoinerState(false);


  const cases = analyze();

  const len = config.roullete_tiles.length;
  const num = Math.floor(Math.random() * len);

  // DEV: Test

  // simulate for video recording..
  // var num = 1;                             // bell - ignore bonus
  // if (audit.roullete.spins == 1) num = 3;  // strawberry - play bonus
  // if (audit.roullete.spins == 2) num = 10; // 772
  // if (audit.roullete.spins == 3) num = 7;  // jackpot - ignore
  // if (audit.roullete.spins == 4) num = 18; // 77
  // if (audit.roullete.spins == 5) num = 6;  // jackpot - play

  // only jackpot..
  // var num = 9;
  // if (audit.roullete.spins > 0) num = 12;

  const steps = ((2 + Math.floor(Math.random() * 2)) * len) + num;
  const pay = cases[num];

  log(num, pay, cases, steps);

  spining = true;
  audit.roullete.spins++;

  ui.components.bets.updateLastValues()
  ui.components.bets.animatePlaySelecteds()

  updateState();

  playSound('roulletespin');

  const animator = new RoulleteSpinAnimatorSimple();
  await animator.run(steps);

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

  log("> selected:", selected);

  gpio.send.ledstripAnimation(animations.ledstrip.playing_default());

  // TODO: Jackpot
  // if (selected.jackpot != undefined) {
  //   setContext('jackpot', {mode: selected.jackpot});
  //   return;
  // }

  // Workaround: instead of Jackpot, users get a "free spin"..
  if (selected.jackpot != undefined) {
    playSound('roulletelucky');
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
