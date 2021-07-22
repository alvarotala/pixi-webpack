import * as PIXI from 'pixi.js'
import config from './config.js'

import { Actions } from 'pixi-actions';

import { setContext } from './core/contexts.js'
import { file, promise, playSound, clearAllTasks, next } from './core/utils.js'


import './etc/contexts_descriptor.js'

import BackgroundComponent from './components/background.js'
import RoulleteComponent from './components/roullete.js'
import BetsComponent from './components/bets.js'
import ScoreComponent from './components/score.js'
import BonusComponent from './components/bonus.js'

import MenuComponent from './components/menu.js'

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
      .add('particle_coin', config.path_assets + '/images/particle_coin.png')

      .add('menu_background', config.path_assets + '/images/menu_background.png')

      // Animations
      .add('luck', config.path_assets + '/animations/luck.json')
      .add('strawberry', config.path_assets + '/animations/strawberry.json')
      .add('strawberry2', config.path_assets + '/animations/strawberry2.json')
      .add('77', config.path_assets + '/animations/77.json')
      .add('772', config.path_assets + '/animations/772.json')
      .add('banana', config.path_assets + '/animations/banana.json')
      .add('banana2', config.path_assets + '/animations/banana2.json')
      .add('bell', config.path_assets + '/animations/bell.json')
      .add('bell2', config.path_assets + '/animations/bell2.json')
      .add('watermelon', config.path_assets + '/animations/watermelon.json')
      .add('watermelon2', config.path_assets + '/animations/watermelon2.json')
      .add('grapes', config.path_assets + '/animations/grapes.json')
      .add('grapes2', config.path_assets + '/animations/grapes2.json')
      .add('orange', config.path_assets + '/animations/orange.json')
      .add('orange2', config.path_assets + '/animations/orange2.json')
      .add('orange5', config.path_assets + '/animations/orange5.json')
      .add('bar', config.path_assets + '/animations/bar.json')
      .add('bar50', config.path_assets + '/animations/bar50.json')
      .add('bar100', config.path_assets + '/animations/bar100.json')



      // Audios
      .add('chiptronical', config.path_assets + '/audios/chiptronical.ogg')

      .add('roulletemain', config.path_assets + '/audios/roulletemain.mp3')
      .add('playingintro', config.path_assets + '/audios/playingintro.wav')
      .add('roulletespin', config.path_assets + '/audios/roulletespin.wav')
      .add('roulletestep', config.path_assets + '/audios/roulletestep.wav')
      .add('roulletewin', config.path_assets + '/audios/roulletewin.wav')
      .add('roulletelos', config.path_assets + '/audios/roulletelos.wav')
      .add('roulletelucky', config.path_assets + '/audios/roulletelucky.wav')

      .add('addbet', config.path_assets + '/audios/addbet.wav')
      .add('addcoins', config.path_assets + '/audios/addcoins.wav')

      .add('bonusintro', config.path_assets + '/audios/bonusintro.wav')
      .add('bonuswin', config.path_assets + '/audios/bonuswin.wav')
      .add('bonuslos', config.path_assets + '/audios/bonuslos.wav')
      .add('bonusinitspin', config.path_assets + '/audios/bonusinitspin.mp3')
      .add('bonustickspin', config.path_assets + '/audios/bonustickspin.mp3')
      .add('bonusmain', config.path_assets + '/audios/bonusmain.mp3')


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


    this.components.menu          = new MenuComponent();

    // TODO: Jackpot
    // this.components.jackpot       = new JackpotComponent();

    app.ticker.add(actionsticker);

    next(2000, () => {
      file.getnumber('/cfsession.data', (num) => {
        if (num == 0) {
          setContext('idle')
          return;
        }

        ui.components.score.addAtField('wins', num);
        setContext('playing');
      });
    });
  }

  stopAll() {
    app.ticker.clear();
    clearAllTasks();
  }

}
