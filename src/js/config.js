const config = {

  width   : 720,
  height  : 1280,

  autostart_interrupts: 4,
  settings_pin: '114465448',
  // settings_pin: '1111',
  autostart_timeout: 5, // seconds


  idle_timeout: 10, /// seconds

  max_bet_per_tile: 33,

  bonus_rate: 65, // 85, // % no winnings.. this is the probability "the house" have..
  jackpot_rate: 5, // 5%

  path_assets : './assets',

  base_path: '/home/alvarotala/cfdata',
  debug_base_path: '/Users/alvaro/Desktop/cfdata',

  cfgpio_url: 'ws://localhost:8080',
  cfgpio_remote_debug: 'ws://192.168.100.90:8080',

  roullete_bets: [
    'bar',        /// 0
    '77',         /// 1
    'banana',     /// 2
    'watermelon', /// 3
    'strawberry', /// 4
    'bell',       /// 5
    'grapes',     /// 6
    'orange',     /// 7
  ],

  // algorithms.test4
  roullete_bets_scales: [1, 12, 13, 13, 15, 15, 15, 16], // percents must sum 100


  // algorithms.test5

  // orange5        20 5 x 4
  // orange2        20 5 x 4

  // grapes         mult
  // grapes2        20 20 x 1
  // bell           mult
  // bell2          20 20 x 1
  // strawberry     mult
  // strawberry2    20 20 x 1

  // watermelon     mult
  // watermelon2    20 20 x 1
  // banana         mult
  // banana2        20 20 x 1
  // 77             mult
  // 772            20 20 x 1

  // bar50          1
  // bar100         1

  multipliers_transform_scales: {big: [3, 5, 10], small: [5, 10, 14]},
  roullete_transform_scales: [
    0,  0,  1,  1,  5, 20,
    0,  0, 20, -1,  5, 20,
    0,  0, 20,  0,  5, 20,
    0,  0, 20, -1,  5, 20
  ],

  roullete_tiles: [
    {texture: 'strawberry', bet: 4, points: 1, multiplier: 'small', bonus: true}, //
    {texture: 'bell', bet: 5, points: 1, multiplier: 'small', bonus: true},
    {texture: 'bar50', bet: 0, points: 50, small: true},
    {texture: 'bar100', bet: 0, points: 100},
    {texture: 'orange5', bet: 7, points: 5}, //
    {texture: 'orange2', bet: 7, points: 2, small: true}, //
    {texture: 'grapes', bet: 6, points: 1, multiplier: 'small', bonus: true},
    {texture: 'watermelon', bet: 3, points: 1, multiplier: 'big', bonus: true},
    {texture: 'watermelon2', bet: 3, points: 2, small: true},
    {texture: 'luck', bet: null, jackpot: 'local'},
    {texture: 'orange5', bet: 7, points: 5, small: true}, //
    {texture: 'strawberry2', bet: 4, points: 2, small: true}, //
    {texture: 'strawberry', bet: 4, points: 1, multiplier: 'small', bonus: true}, //
    {texture: 'bell', bet: 5, points: 1, multiplier: 'small', bonus: true},
    {texture: '772', bet: 1, points: 2, small: true},
    {texture: '77', bet: 1, points: 1, multiplier: 'big', bonus: true},
    {texture: 'orange5', bet: 7, points: 5, small: true}, //
    {texture: 'grapes2', bet: 6, points: 2, small: true},
    {texture: 'grapes', bet: 6, points: 1, multiplier: 'small', bonus: true},
    {texture: 'banana', bet: 2, points: 1, multiplier: 'big', bonus: true},
    {texture: 'banana2', bet: 2, points: 2, small: true},
    {texture: 'luck', bet: null, jackpot: 'global'},
    {texture: 'orange5', bet: 7, points: 5, small: true}, //
    {texture: 'bell2', bet: 5, points: 2, small: true},
  ],


  multipliers:        {big: [30, 20, 10], small: [10, 5, 3]},

  foo: null
}

export default config;
