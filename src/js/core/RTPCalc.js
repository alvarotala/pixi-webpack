import config from '../config.js'

const f = {

  setup: () => {
    f.tiles   = config.roullete_tiles;
    f.len     = config.roullete_tiles.length;

    f.multipliers = {};
    Object.keys(config.multipliers).forEach((k) => {
      f.multipliers[k] = {cursor: 0, values: config.multipliers[k]}
    });
  },

  simulate: (algorithm, maxplaces, maxbet) => {
    console.log('***********************    RTP Simulated machine \n\n\n\n');
    let credits   = 0;
    let wins      = 0;
    let current   = 0;

    let i = 0;
    while(i < 100000000) { // Play spin.. 100 millones -> 100000000
      const bets = f.getrandombets(8, maxplaces, maxbet);
      const btotal = f.totalbets(bets);
      // const bets = {total: 4, values: [1,0,0,0,0,1,1,1]};

      const steps  = algorithm(current, bets, btotal); // steps

      const pos = f.poswithdistance(current, steps);
      const tile = f.tiles[pos];

      /// if jackpot, play again..
      if (tile.jackpot != undefined) {
        continue;
      }

      // sum used credits
      credits+=btotal;

      // sum earnings..
      wins+=f.getpoints(tile, bets, steps);

      current = pos;
      i++;
    }

    const diff = credits - wins;
    const rtp = Math.round((wins * 100) / credits);

    console.log('>> results:', credits, wins, diff);
    console.log(">> RTP:", rtp);
  },

  getrandombets: (total, maxplaces, maxbet) => {
    const t = Math.ceil(Math.random() * maxplaces);
    const bets = new Array(total).fill(0)
    for (let p=0; p<t; p++) {
      bets.fill(Math.ceil(Math.random() * maxbet), p, 1);
    }

    return bets.shuffle();
  },

  totalbets: (bets) => {
    return bets.reduce(((sum, a, i) => (sum + a)), 0);
  },

  poswithdistance: (from, steps) => {
    return (from + steps) % f.len;
  },

  getpoints: (tile, bets, steps) => {
    let points = tile.points;
    if (tile.multiplier != undefined) {
      points*= f.getmultiplier(steps, tile.multiplier);
    }

    return points * bets[tile.bet];
  },

  getmultiplier: (distance, k) => {
    const m = f.multipliers[k];
    const i = distance % m.values.length;
    return m.values[i];
  },

  getsimresult: (from, steps, bets) => {
    const pos = f.poswithdistance(from, steps);
    const tile = f.tiles[pos];

    /// if jackpot, play again..
    if (tile.jackpot != undefined) {
      return 0;
    }

    return f.getpoints(tile, bets, steps);
  },

  simulatecases: (from, bets) => {
    const cases = [];
    for (let i = 0; i<f.len; i++) {
      cases.push(f.getsimresult(from, i, bets));
    }

    return cases;
  },


  algorithms: {

    random: (from, bets, total) => {
      return Math.floor(Math.random() * f.len);
    },

    test1: (from, bets, total) => {
      const cases = f.simulatecases(from, bets);
      let num = 0;

      if (Math.random() >= 0.41) {
        const indexes = [];
        cases.forEach((c, i) => {
          if (c <= total) indexes.push(i);
        });

        const sel = Math.floor(Math.random() * indexes.length);
        num = indexes[sel];
      }
      else {
        num = Math.floor(Math.random() * f.len);
      }

      return num;
    },

  },

  foo: null
};

Array.prototype.shuffle = function() {
  var i = this.length, j, temp;
  if ( i == 0 ) return this;
  while ( --i ) {
     j = Math.floor( Math.random() * ( i + 1 ) );
     temp = this[i];
     this[i] = this[j];
     this[j] = temp;
  }
  return this;
}

f.setup();
global.RTPCalc = f;


RTPCalc.simulate(f.algorithms.test1, 8, 1);



/*

2, 1 =>


*/
