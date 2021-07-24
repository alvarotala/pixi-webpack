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
    f.handle_errors(error);

    gpio.send.lightsOff();
    ui.stopAll();
  },

  handle_errors: (error) => {
    if (error == undefined || error.code == undefined) {
      f.message.appendText('Error: 500\n\n');
      return;
    }

    console.log(error);

    f.message.appendText('Error: ' + error.code + '\n\n');

    const wins    = ui.components.score.fields.wins.value;
    const credits = ui.components.score.fields.credits.value;
    const bets    = ui.components.bets.total();

    const total   = wins + credits + bets;

    if (error.code == 109) {
      return file.getnumber('/cfcashout.data', (cashout) => {
        const diff = cashout - (cashout - error.data);

        const session = total + diff;
        f.message.appendText('Créditos para devolución: ' + session);
      });
    }

    f.message.appendText('Créditos para devolución: ' + total);
  }
};

export const ContextError = f;
