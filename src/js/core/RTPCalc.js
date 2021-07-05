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

  simulate: (algorithm, maxplaces, maxbet, limit) => {
    console.log('***********************    RTP Simulated machine \n\n');

    let credits   = 0;
    let wins      = 0;
    let current   = 0;

    let i = 0;
    while(i < limit) { // Play spin.. 100 millones -> 100000000
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
      const steps  = algorithm({from: current, bets: bets, total: btotal}); // steps

      const pos = r.poswithdistance(current, steps);
      const tile = r.tiles[pos];

      /// if jackpot, play again..
      if (tile.jackpot != undefined) {
        continue;
      }

      // sum used credits
      credits+=btotal;

      // sum earnings..
      const points  = r.getpoints(tile, steps);
      wins+=(points * bets[tile.bet]);

      current = pos;
      i++;
    }

    const diff = credits - wins;
    const rtp = Math.round((wins * 100) / credits);

    console.log('>> results:', credits, wins, diff);
    console.log(">> RTP:", rtp);
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

  getpoints: (tile, steps) => {
    if (tile.jackpot !== undefined) return 0;
    let points = tile.points;
    if (tile.multiplier != undefined) {
      points*= r.getmultiplier(steps, tile.multiplier);
    }

    return points;
  },

  getmultiplier: (distance, k) => {
    const m = r.multipliers[k];
    const i = distance % m.values.length;
    return m.values[i];
  },

  algorithms: {

    random: (params) => {
      return Math.floor(srandom() * r.len);
    },

    test1: (params) => {
      const { from, bets, total } = params;

      const getresult = (steps) => {
        const pos = r.poswithdistance(from, steps);
        const tile = r.tiles[pos];

        /// if jackpot, play again..
        if (tile.jackpot != undefined) {
          return 0;
        }

        const points = getpoints(tile, steps);
        return points * bets[tile.bet];
      };

      const cases = [];
      for (let i = 0; i<r.len; i++) {
        cases.push(getresult(i));
      }

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

    test2: (params) => {
      const { from, bets, total } = params;
      if (srandom() >= 0.1) { // low probs
        const scales = config.roullete_bets_scales;
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

    test3: (params) => {
      const { from, bets, total } = params;
      if (srandom() >= 0.2) { // 0.2 = 89 0.3 = 98    = RTP 0.25 = 94%
        const scales = config.roullete_bets_scales;
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

    test4: (params) => {
      const { from, bets, total } = params;

      const findtile = (condition) => {
        const tiles = [];

        r.tiles.forEach((t, a) => {
          if (condition(t, a)) tiles.push(a);
        });

        const sel = tiles[Math.floor(srandom() * tiles.length)];
        return ((r.len - from) + sel) % r.len; // tile number to steps..
      }

      const getbetwithscale = (cursor) => {
        const scales = config.roullete_bets_scales;
        let pos = 0;
        for (let i = 0; i<scales.length; i++) {
          const dist = pos + scales[i];
          if(cursor > pos && cursor <= dist) {
            return i;
          }
          pos=dist;
        }

        return (scales.length - 1);
      };


      /// jackpot?
      if (srandom() < (config.jackpot_rate * 0.01)) {
        return findtile((t) => (t.jackpot != undefined));
      }

      const cursor = Math.ceil(srandom() * 100);
      const bet = getbetwithscale(cursor);

      if (srandom() < 0.33) { // smallonly - 0.1
        return findtile((t) => (t.bet == bet && t.small == true));
      }

      return findtile((t) => (t.bet == bet));
    },


    test5: (params) => {
      const { from, bets, total } = params;

      // tile number to steps..
      const tiletosteps = (num) => {
        return ((r.len - from) + num) % r.len;
      }

      const findtiles = (condition) => {
        const tiles = [];

        r.tiles.forEach((t, a) => {
          if (condition(t, a)) {
            t.index = a;
            tiles.push(t);
          }
        });

        return tiles;
      }

      /// jackpot?
      if (srandom() < (config.jackpot_rate * 0.01)) {
        const tiles = findtiles((t) => (t.jackpot != undefined));
        // console.log(">>> JACKPOT !!!");

        // TODO: add real jackpot (local and remote)
        // for now.. equal chances to all..
        const i = Math.floor(srandom() * tiles.length);
        return tiletosteps(tiles[i].index);
      }

      const getresult = (steps) => {
        const pos = r.poswithdistance(from, steps);
        const tile = r.tiles[pos];

        /// if jackpot, play again..
        if (tile.jackpot != undefined) {
          return null;
        }

        // const p = r.getpoints(tile, steps);
        // return {bet: tile.bet, points: p, index: pos};

        let m = 0;
        if (tile.multiplier != undefined) {
          m = r.getmultiplier(steps, tile.multiplier);
        }

        return {bet: tile.bet, points: tile.points, index: pos, multiplier: m};
      };

      const roullete = [];
      for (let i = 0; i<r.len; i++) {
        const pos = r.poswithdistance(from, i);
        const tile = r.tiles[pos];

        let scale = config.roullete_transform_scales[pos];

        /// if jackpot, skip..
        if (tile.jackpot != undefined) {
          continue;
        }

        if (tile.multiplier != undefined) {
          const mv = r.getmultiplier(i, tile.multiplier); // value
          const mi = config.multipliers[tile.multiplier].indexOf(mv); // index
          scale = config.multipliers_transform_scales[tile.multiplier][mi];
        }

        for (let a = 0; a<scale; a++) {
          roullete.push({bet: tile.bet, index: pos});
        }
      }

      roullete.shuffle();
      // console.log(roullete);

      const cursor = Math.floor(srandom() * roullete.length);
      return tiletosteps(roullete[cursor].index);
    }

  },

  foo: null
};

r.setup();

global.RTPCalc = {
  r: r,
  addentropy: addentropy,

  currentAlgorithm: r.algorithms.test5,
};


RTPCalc.r.simulate(r.algorithms.test5, 8, 8, 100000);
