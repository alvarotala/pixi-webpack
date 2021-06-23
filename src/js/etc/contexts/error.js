import * as PIXI from 'pixi.js'
import config from '../../config.js'

import { file } from '../../core/utils.js'

import { SimpleText } from '../TextField.js'

const f = {
  init: () => {
    const res = PIXI.Loader.shared.resources;
    const container = new PIXI.Sprite(res.errorscreen.texture);

    container.width  = config.width;
    container.height = config.height;

    const message = new SimpleText(720, 300, '');
    message.y = config.height - 300;

    message.text.style.fontSize = 18;
    message.text.style.fill = "#ffffff";
    message.text.style.stroke = null;
    message.text.style.strokeThickness = 1;
    message.text.style.align = 'center';

    container.addChild(message);
    ui.view.addChild(container);

    // TODO: LEER ERROR DE ARCHIVO..
    let text = 'Fuera de servicio\n(E109)\n\n';
    text+='35 créditos';

    message.setText(text);

    ui.stopAll();
  }
};

export const ContextError = f;
