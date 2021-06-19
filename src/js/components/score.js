import * as PIXI from 'pixi.js'
import config from '../config.js'

import {AnimatedNumberField} from '../etc/TextField.js'

import { Actions, Interpolations } from 'pixi-actions';
import Easing from '../etc/easing.js'

export default class ScoreComponent {

  constructor() {
    this.fields = {}
    this.build()
  }

  build() {
    const background = PIXI.Loader.shared.resources.scorebg.texture;
    this.container = new PIXI.Sprite(background);
    this.container.visible = false;

    this.container.width  = config.width;
    this.container.height = 197;

    // NOTE: memory leak fix? - commented
    // ui.view.addChild(this.container);

    this.fields.wins = new AnimatedNumberField(220, 70, 0);
    this.fields.wins.y = 70;
    this.fields.wins.x = 80;
    this.fields.wins.value = 0;

    this.fields.wins.text.style.fontSize = 50;

    this.container.addChild(this.fields.wins);


    this.fields.credits = new AnimatedNumberField(220, 70, 0);
    this.fields.credits.y = 70;
    this.fields.credits.x = config.width - this.fields.wins.x - 220;
    this.fields.credits.value = 0;

    this.fields.credits.text.style.fontSize = 50;

    this.container.addChild(this.fields.credits);

  }

  addAtField(n, num=1) {
    const field = this.fields[n];
    field.value = field.value + num;
    field.setText(field.value, (num > 0));
  }

  resetField(n) {
    const field = this.fields[n];
    field.value = 0;
    field.setText(0, false);
  }

  animateShow() {
    if(this.container.visible) return;
    this.container.visible = true;
    this.container.y = -this.container.height;

    // NOTE: memory leak fix?
    ui.view.addChild(this.container);

    Actions.moveTo(this.container, this.container.x, 0, 1.5, Easing.easeInQuad).play();
  }

  animateDismiss() {
    if(!this.container.visible) return;

    const action = Actions.moveTo(this.container, this.container.x, -this.container.height, 1.5, Easing.easeInQuad)
    action.queue(Actions.runFunc(() => {
      this.container.visible = false;

      // NOTE: memory leak fix?
      ui.view.removeChild(this.container);
    }))

    action.play();
  }

}
