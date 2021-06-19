const config = {

  width   : 720,
  height  : 1280,

  idle_timeout: 10, /// seconds

  path_assets : 'assets',

  bets_tiles_textures: [
    'bar',        /// 0
    '77',         /// 1
    'banana',     /// 2
    'watermelon', /// 3
    'strawberry', /// 4
    'bell',       /// 5
    'grapes',     /// 6
    'orange',     /// 7
  ],

  roullete_tiles: [
    {texture: 'orange5', bet: 7, points: 5},
    {texture: 'bell', bet: 5, points: 1, multiplier: 'small', bonus: true},
    {texture: 'bar50', bet: 0, points: 50},
    {texture: 'bar100', bet: 0, points: 100},
    {texture: 'strawberry', bet: 4, points: 1, multiplier: 'small', bonus: true},
    {texture: 'strawberry2', bet: 4, points: 2},
    {texture: 'grapes', bet: 6, points: 1, multiplier: 'small', bonus: true},
    {texture: 'watermelon', bet: 3, points: 1, multiplier: 'big', bonus: true},
    {texture: 'watermelon2', bet: 3, points: 2},
    {texture: 'luck', bet: null, jackpot: 'local'},
    {texture: 'strawberry', bet: 4, points: 1, multiplier: 'small', bonus: true},
    {texture: 'orange2', bet: 7, points: 2},
    {texture: 'orange5', bet: 7, points: 5},
    {texture: 'bell', bet: 5, points: 1, multiplier: 'small', bonus: true},
    {texture: '772', bet: 1, points: 2},
    {texture: '77', bet: 1, points: 1, multiplier: 'big', bonus: true},
    {texture: 'strawberry', bet: 4, points: 1, multiplier: 'small', bonus: true},
    {texture: 'grapes2', bet: 6, points: 2},
    {texture: 'grapes', bet: 6, points: 1, multiplier: 'small', bonus: true},
    {texture: 'banana', bet: 2, points: 1, multiplier: 'big', bonus: true},
    {texture: 'banana2', bet: 2, points: 2},
    {texture: 'luck', bet: null, jackpot: 'global'},
    {texture: 'strawberry', bet: 4, points: 1, multiplier: 'small', bonus: true},
    {texture: 'bell2', bet: 5, points: 2},
  ],


  multipliers: {big: [30, 20, 10], small: [15, 10, 5]},

  cfgpio_url: 'ws://127.0.0.1:8080',
  cfgpio_remote_debug: 'ws://192.168.100.90:8080',

  foo: null
}

export default config;
