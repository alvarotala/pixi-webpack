import * as PIXI from 'pixi.js'
import config from '../config.js'

import Easing from '../etc/easing.js'

import TextField from '../etc/TextField.js'

export default class MenuComponent {

  constructor() {
    const res = PIXI.Loader.shared.resources;

    this.container = new PIXI.Sprite(res.menu_background.texture);

    this.container.width  = config.width;
    this.container.height = config.height;


    this.logo = new PIXI.Sprite(res.logo.texture);
    this.logo.anchor.set(0.5);
    this.logo.scale.set(0.8, 0.8);

    // ui.view.addChild(this.container);

    this.fields = {};

    this.fields.volume = new TextField(180, 50, '100');
    this.fields.volume.y = 562;
    this.fields.volume.x = (config.width / 2) - 90;
    this.fields.volume.value = 0;

    this.fields.volume.text.style.fontSize = 30;

    this.container.addChild(this.fields.volume);



    this.fields.music = new TextField(180, 50, 'Si');
    this.fields.music.y = 706;
    this.fields.music.x = (config.width / 2) - 90;
    this.fields.music.value = 0;

    this.fields.music.text.style.fontSize = 30;

    this.container.addChild(this.fields.music);


  }

}
