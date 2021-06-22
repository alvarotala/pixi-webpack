import * as PIXI from 'pixi.js'
import config from './config.js'

import { Actions } from 'pixi-actions';

import { setContext } from './core/contexts.js'
import { promise, playSound, clearAllTasks, next } from './core/utils.js'


import './etc/contexts_descriptor.js'

import BackgroundComponent from './components/background.js'
import RoulleteComponent from './components/roullete.js'
import BetsComponent from './components/bets.js'
import ScoreComponent from './components/score.js'
import BonusComponent from './components/bonus.js'

// TODO: Jackpot
// import JackpotComponent from './components/jackpot.js'

import { sound } from '@pixi/sound';


const actionsticker = (delta) => Actions.tick(delta*0.005);

export default class UIManager {

  constructor() {
    this.components = {};
    this.view = new PIXI.Container();
    this.view.interactiveChildren = false;

    this.view.width   = config.width;
    this.view.height  = config.height;

    if (app.config) {
      this.view.x = app.config.screen.x;
      this.view.y = app.config.screen.y;
      this.view.scale.set(app.config.screen.scale, app.config.screen.scale);
    }
  }

  async load() {
    PIXI.Loader.shared

      // Sprites
      .add('logo', config.path_assets + '/images/logo.png')
      .add('background', config.path_assets + '/images/background.png')
      .add('errorscreen', config.path_assets + '/images/errorscreen.png')

      .add('tile', config.path_assets + '/images/tile.png')
      .add('tile_hover', config.path_assets + '/images/tile_hover.png')
      .add('betsbg', config.path_assets + '/images/betsbg.png')
      .add('scorebg', config.path_assets + '/images/scorebg.png')
      .add('particle', config.path_assets + '/images/particle.png')

      // Animations
      .add('strawberry', config.path_assets + '/animations/strawberry.json')
      .add('strawberry2', config.path_assets + '/animations/strawberry2.json')
      .add('77', config.path_assets + '/animations/77.json')
      .add('772', config.path_assets + '/animations/772.json')
      .add('banana', config.path_assets + '/animations/banana.json')
      .add('banana2', config.path_assets + '/animations/banana2.json')
      .add('bell', config.path_assets + '/animations/bell.json')
      .add('bell2', config.path_assets + '/animations/bell2.json')


      // Audios
      .add('chiptronical', config.path_assets + '/audios/chiptronical.ogg')

      .add('playingintro', config.path_assets + '/audios/mixkit-arcade-score-interface-217.wav')
      .add('roulletespin', config.path_assets + '/audios/mixkit-arcade-bonus-alert-767.wav')
      .add('roulletestep', config.path_assets + '/audios/mixkit-unlock-game-notification-253.wav')
      .add('roulletewin', config.path_assets + '/audios/mixkit-magic-sweep-game-trophy-257.wav')
      .add('roulletelos', config.path_assets + '/audios/mixkit-negative-game-notification-249.wav')
      .add('roulletelucky', config.path_assets + '/audios/mixkit-arcade-approved-mission-205.wav')

      .add('addbet', config.path_assets + '/audios/mixkit-arcade-game-jump-coin-216.wav')
      .add('addcoins', config.path_assets + '/audios/mixkit-fairy-arcade-sparkle-866.wav')

      .add('bonusintro', config.path_assets + '/audios/mixkit-arcade-bonus-229.wav')

    return await promise((resolve) => {
      PIXI.Loader.shared.load((loader, resources) => {
        this.build(loader, resources);
        resolve(true);
      });
    });
  }

  build(loader, resources) {
    this.components.background    = new BackgroundComponent();

    this.particles = new PIXI.Container();
    this.view.addChild(this.particles);

    this.components.roullete      = new RoulleteComponent();
    this.components.bets          = new BetsComponent();
    this.components.score         = new ScoreComponent();
    this.components.bonus         = new BonusComponent();

    // TODO: Jackpot
    // this.components.jackpot       = new JackpotComponent();

    app.ticker.add(actionsticker);

    next(1000, () => setContext('bonus', {amount: 5}));

    // setContext('idle');
    // setContext('error');
  }

  stopAll() {
    app.ticker.clear();
    clearAllTasks();
  }

}
