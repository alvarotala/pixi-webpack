import * as PIXI from 'pixi.js'
import config from '../../config.js'

import { log, next, pause } from '../../core/utils.js'
import { setContext } from '../../core/contexts.js'
import storage from '../../core/storage.js'

import { Actions, Interpolations } from 'pixi-actions';
import Easing from '../easing.js'



const update = () => {
  ui.components.menu.fields.volume.setText(Math.round(config.local.master_volume * 100));
  ui.components.menu.fields.music.setText(config.local.music == 1 ? 'Si' : 'No');
}

const save = () => {
  storage.setObject('local', config.local);
  update();
}

const f = {
  coineractive: false,

  init: () => {
    f.view = ui.components.menu.container;
    ui.view.addChild(f.view);
    update();
  },

  dealloc: () => {
    ui.view.removeChild(f.view);
  },

  inputs: {

    option: () => { // quit
      setContext('playing');
    },

    left: () => {
      config.local.master_volume -= 0.1;
      if (config.local.master_volume <= 0)
        config.local.master_volume = 0;
      save();
    },

    right: () => {
      config.local.master_volume += 0.1;
      if (config.local.master_volume >= 1)
        config.local.master_volume = 1;
      save();
    },

    play: () => {
      config.local.music = 1;
      save();
    },

    cancel: () => {
      config.local.music = 0;
      save();
    }
  }
};

export const ContextMenu = f;
