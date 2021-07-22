import * as PIXI from 'pixi.js'
import config from '../../config.js'

import { file } from '../../core/utils.js'

import { SimpleText } from '../TextField.js'

const f = {
  init: (error) => {
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
    f.message.appendText('Error: ' + error.code + '\n\n');

    file.getnumber('/cfsession.data', (num) => {
      if (num > 0) {
        f.message.appendText('Créditos para devolución: ' + num);
      }
    });

    gpio.send.lightsOff();
    ui.stopAll();
  }
};

export const ContextError = f;
