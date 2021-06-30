import * as PIXI from 'pixi.js'
import config from '../../config.js'

import { file } from '../../core/utils.js'

import { SimpleText } from '../TextField.js'

const f = {
  init: (params) => {
    const res = PIXI.Loader.shared.resources;
    const container = new PIXI.Sprite(res.errorscreen.texture);

    container.width  = config.width;
    container.height = config.height;

    f.message = new SimpleText(720, 300, '');
    f.message.y = config.height - 300;

    f.message.text.style.fontSize = 18;
    f.message.text.style.fill = "#ffffff";
    f.message.text.style.stroke = null;
    f.message.text.style.strokeThickness = 1;
    f.message.text.style.align = 'center';

    container.addChild(f.message);
    ui.view.addChild(container);

    f.message.setText('Fuera de servicio\n\n');

    file.getsession((num) => f.handle_errors(num, params));

    gpio.send.lightsOff();
    ui.stopAll();
  },

  handle_errors: (credits, error) => {
    const setCredits = () => {
      if (credits > 0) {
        f.message.appendText(credits + ' créditos para devolución.');
      }
    };


    if (error.code == 109) { // Hopper error..
      credits = credits + parseInt(error.data);
    }

    setCredits(credits);
  }
};

export const ContextError = f;
