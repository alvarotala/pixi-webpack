import config from '../config.js'

const seedrandom = require('seedrandom');
global.srandom = seedrandom();

const addentropy = (str) => {
  seedrandom(str, { entropy: true });
};

const logger = {};

const r = {

  setup: () => {
    r.tiles   = config.roullete_tiles;
    r.len     = config.roullete_tiles.length;

    r.multipliers = {};
    Object.keys(config.multipliers).forEach((k) => {
      r.multipliers[k] = {cursor: 0, values: config.multipliers[k]}
    });
  },

  simulate: (algorithm, maxplaces, maxbet) => {
    console.log('***********************    RTP Simulated machine \n\n\n\n');

    let credits   = 0;
    let wins      = 0;
    let current   = 0;

    let i = 0;
    while(i < 1000000) { // Play spin.. 100 millones -> 100000000
      const bets = r.getrandombets(8, maxplaces, maxbet);

      // const bets = [1,1,1,1,1,1,1,1];

      // const bets = [0,0,0,0,0,0,0,1];

      // const bets = [1,0,0,0,0,0,0,0];

      // const bets = [1,0,0,0,0,0,0,1];

      // const bets = [1,0,0,0,1,0,0,1];

      // const patterns = [
      //   [1,0,1,1,0,1,1,2],
      //   [1,1,1,1,0,1,0,1],
      //   [1,1,2,0,0,1,1,1],
      //   [1,1,1,1,1,1,1,1],
      //   [1,0,0,0,0,0,0,0],
      //   [1,0,0,0,2,0,0,1],
      //   [1,2,0,0,0,0,1,1],
      //   [1,0,0,2,0,1,1,1],
      //   [2,2,0,0,0,0,0,0],
      // ];
      //
      // const bets = patterns[i%patterns.length];


      const btotal = r.totalbets(bets);
      const steps  = algorithm(current, bets, btotal); // steps

      const pos = r.poswithdistance(current, steps);
      const tile = r.tiles[pos];

      /// if jackpot, play again..
      if (tile.jackpot != undefined) {
        continue;
      }

      // sum used credits
      credits+=btotal;

      // sum earnings..
      wins+=r.getpoints(tile, bets, steps);

      current = pos;
      i++;
    }

    const diff = credits - wins;
    const rtp = Math.round((wins * 100) / credits);

    console.log('>> results:', credits, wins, diff);
    console.log(">> RTP:", rtp);

    console.log(logger);
  },

  getrandombets: (total, maxplaces, maxbet) => {
    const t = Math.ceil(srandom() * maxplaces);
    const bets = new Array(total).fill(0)
    for (let p=0; p<t; p++) {
      bets[p] = Math.ceil(srandom() * maxbet);
    }

    return bets.shuffle();
  },

  totalbets: (bets) => {
    return bets.reduce(((sum, a, i) => (sum + a)), 0);
  },

  poswithdistance: (from, steps) => {
    return (from + steps) % r.len;
  },

  getpoints: (tile, bets, steps) => {
    if (tile.jackpot !== undefined) return 0;
    let points = tile.points;
    if (tile.multiplier != undefined) {
      points*= r.getmultiplier(steps, tile.multiplier);
    }

    return points * bets[tile.bet];
  },

  getmultiplier: (distance, k) => {
    const m = r.multipliers[k];
    const i = distance % m.values.length;
    return m.values[i];
  },

  getsimresult: (from, steps, bets) => {
    const pos = r.poswithdistance(from, steps);
    const tile = r.tiles[pos];

    /// if jackpot, play again..
    if (tile.jackpot != undefined) {
      return 0;
    }

    return r.getpoints(tile, bets, steps);
  },

  simulatecases: (from, bets) => {
    const cases = [];
    for (let i = 0; i<r.len; i++) {
      cases.push(r.getsimresult(from, i, bets));
    }

    return cases;
  },


  algorithms: {

    random: (from, bets, total) => {
      return Math.floor(srandom() * r.len);
    },

    test1: (from, bets, total) => {
      const cases = r.simulatecases(from, bets);
      let num = 0;

      if (srandom() >= 0.41) { // magic number...
        const indexes = [];
        cases.forEach((c, i) => {
          if (c <= total) indexes.push(i);
        });

        const sel = Math.floor(srandom() * indexes.length);
        num = indexes[sel];
      }
      else {
        num = Math.floor(srandom() * r.len);
      }

      return num;
    },

    interpolate1: (from, bets, total) => {
      if (srandom() >= 0.1) { // low probs
        const scales = config.roullete_tiles_scales;
        const cursor = Math.ceil(srandom() * 100);

        let pos = 0;
        for (let i = 0; i<scales.length; i++) {
          const dist = pos + scales[i];
          if(cursor > pos && cursor <= dist) {
            const tiles = [];
            r.tiles.forEach((t, a) => {
              if (t.bet == i) tiles.push(a);
            });

            return tiles[Math.floor(srandom() * tiles.length)];
          }
          pos=dist;
        }
      }

      return Math.floor(srandom() * r.len);
    },

    interpolate2: (from, bets, total) => {
      if (srandom() >= 0.2) { // 0.2 = 89 0.3 = 98    = RTP 0.25 = 94%
        const scales = config.roullete_tiles_scales;
        const cursor = Math.ceil(srandom() * 100);

        const smallonly = srandom() < 0.6;

        let pos = 0;
        for (let i = 0; i<scales.length; i++) {
          const dist = pos + scales[i];
          if(cursor > pos && cursor <= dist) {
            const tiles = [];

            r.tiles.forEach((t, a) => {
              if (smallonly && t.bet == i && t.multiplier == undefined) {
                tiles.push(a);
              }
              else if (!smallonly && t.bet == i) tiles.push(a);
            });

            const sel = tiles[Math.floor(srandom() * tiles.length)];
            return ((r.len - from) + sel) % r.len;
          }
          pos=dist;
        }
      }

      return Math.floor(srandom() * r.len);
    },

    interpolate: (from, bets, total) => {

      const findtile = (condition) => {
        const tiles = [];

        r.tiles.forEach((t, a) => {
          if (condition(t, a)) tiles.push(a);
        });

        const sel = tiles[Math.floor(srandom() * tiles.length)];
        return ((r.len - from) + sel) % r.len; // tile number to steps..
      }


      /// jackpot?
      if (srandom() < 0.05) { // 5%
        return findtile((t) => (t.jackpot != undefined));
      }

      const scales = config.roullete_tiles_scales;
      const cursor = Math.ceil(srandom() * 100);

      const smallonly = srandom() < 0.1;

      let pos = 0;
      for (let i = 0; i<scales.length; i++) {
        const dist = pos + scales[i];
        if(cursor > pos && cursor <= dist) {
          if (smallonly) {
            return findtile((t) => (t.bet == i && t.small == true));
          }

          return findtile((t) => (t.bet == i));
        }
        pos=dist;
      }
    }

  },

  foo: null
};

r.setup();

global.RTPCalc = {
  r: r,
  addentropy: addentropy
};


RTPCalc.r.simulate(r.algorithms.interpolate, 5, 2);
