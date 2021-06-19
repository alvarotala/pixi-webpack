import * as PIXI from 'pixi.js'
import config from '../config.js'

import Easing from '../etc/easing.js'

export default class BackgroundComponent {

  constructor() {
    const res = PIXI.Loader.shared.resources;

    this.container = new PIXI.Sprite(res.background.texture);

    this.container.width  = config.width;
    this.container.height = config.height;


    this.logo = new PIXI.Sprite(res.logo.texture);
    this.logo.anchor.set(0.5);
    this.logo.scale.set(0.8, 0.8);

    this.logo.x = config.width / 2;
    // this.logo.oy = config.height / 2;
    this.logo.oy = 550;
    this.logo.y = this.logo.oy;

    ui.view.addChild(this.container);
    ui.view.addChild(this.logo);

    this.tick = 0;

    this.ticker = (delta) => {
      this.tick+=0.02;
      this.container.alpha = 0.6 + Math.sin(this.tick) * 0.25;
    };

    app.ticker.add(this.ticker);
  }

}
