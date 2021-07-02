const config = {

  width   : 720,
  height  : 1280,

  autostart_interrupts: 4,
  settings_pin: '114465448',
  // settings_pin: '1111',
  autostart_timeout: 5, // seconds


  idle_timeout: 10, /// seconds

  max_bet_per_tile: 33,

  bonus_rate: 75, // 85, // % no winnings.. this is the probability "the house" have..

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

  // roullete_tiles_scales: [5, 10, 10, 10, 15, 15, 15, 20], // percents
  roullete_tiles_scales: [1, 12, 13, 13, 15, 15, 15, 16], // percents must sum 100
  // roullete_tiles_scales: [2, 10, 10, 10, 16, 16, 16, 20], // percents must sum 100

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


  multipliers: {big: [30, 20, 10], small: [10, 5, 3]},

  foo: null
}

export default config;
