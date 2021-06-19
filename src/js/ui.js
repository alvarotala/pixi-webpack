import * as PIXI from 'pixi.js'
import config from './config.js'

import { Actions } from 'pixi-actions';

import { setContext } from './core/contexts.js'
import storage from './core/storage.js'
import { playSound } from './core/utils.js'


import './etc/contexts_descriptor.js'

import BackgroundComponent from './components/background.js'
import RoulleteComponent from './components/roullete.js'
import BetsComponent from './components/bets.js'
import ScoreComponent from './components/score.js'
import BonusComponent from './components/bonus.js'

// TODO: Jackpot
// import JackpotComponent from './components/jackpot.js'

import { sound } from '@pixi/sound';

export default class UIManager {

  constructor() {
    this.components = {};
    this.view = new PIXI.Container();
    this.view.interactiveChildren = false;

    this.view.width   = config.width;
    this.view.height  = config.height;

    const screen = storage.getObject('screen');
    if (screen) {
      this.view.x = screen.x;
      this.view.y = screen.y;
      this.view.scale.set(screen.scale, screen.scale);
    }
  }

  load() {
    PIXI.Loader.shared

      // Sprites
      .add('logo', config.path_assets + '/images/logo.png')
      .add('background', config.path_assets + '/images/background.png')
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


      .load(this.build.bind(this))
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

    app.ticker.add((delta) => Actions.tick(delta*0.005));

    setContext('idle');
  }

}
