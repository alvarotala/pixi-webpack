import * as PIXI from 'pixi.js'
import config from '../config.js'

import { Actions, Interpolations } from 'pixi-actions';
import Easing from '../etc/easing.js'

import { AnimatedNumberField } from '../etc/TextField.js'

export default class BonusComponent {

  constructor() {
    this.speed = 0.02;
    this.isplaying = -1;
    this.segments = 8;

    this.load();
  }

  load() {
    this.loader = new PIXI.Loader();
    this.loader
      .add('bonus_roullete', config.path_assets + '/images/bonus_roullete.png')
      .add('bonus_roullete_center', config.path_assets + '/images/bonus_roullete_center.png')
      .load(this.build.bind(this))
  }

  build() {
    this.container = new PIXI.Container();
    this.container.visible = false;

    this.container.x = 0;
    this.container.y = 0;

    this.container.width  = config.width;
    this.container.height = config.height;

    // NOTE: memory leak fix? - commented
    // ui.view.addChild(this.container);

    const res = this.loader.resources;
    this.roullete = new PIXI.Sprite(res.bonus_roullete.texture);

    this.roullete.width  = 579;
    this.roullete.height = 579;

    this.roullete.anchor.set(0.5);

    const anchor = ui.components.roullete;
    this.roullete.x  = (config.width / 2);
    this.roullete.y  = anchor.container.y + (anchor.size / 2);

    this.container.addChild(this.roullete);


    const center = new PIXI.Sprite(res.bonus_roullete_center.texture);
    center.anchor.set(0.5);

    center.x = this.roullete.x;
    center.y = this.roullete.y;

    this.container.addChild(center);


    this.field = new AnimatedNumberField(120, 60, '0');
    this.field.y = 400;
    this.field.x = (config.width / 2);
    this.field.pivot.set(60, 30);

    this.field.alpha = 0;
    this.container.addChild(this.field);
  }

  // 0 => purple
  // 1 => yellow

  getRoulleteResult() {
    const angle = (this.roullete.rotation * 180/Math.PI) % 360;
    // console.log("A: ", angle / (360 / this.segments));
    return Math.floor(angle / (360 / this.segments)) % 2;
  }

  enterLoopAnimation() {
    if (this.speed > 0) {
      this.roullete.rotation += this.speed;
    }

    if (this.isplaying >= 0) {
      // add friction..
      this.speed-=0.0003;

      if (this.speed < 0.001) {
        this.completed();
      }
    }
  }

  animateShow(params) {
    if(this.container.visible) return;
    this.container.alpha = 0;
    this.container.visible = true;

    // NOTE: memory leak fix?
    ui.view.addChild(this.container);

    this.amount = params.amount;

    this.field.y = 400;
    this.field.setText(this.amount);

    this.roullete.scale.set(0.2, 0.2);

    this.speed = 0.02;

    this.ticker = (delta) => this.enterLoopAnimation();
    app.ticker.add(this.ticker);

    const logo = ui.components.background.logo;

    const actions = Actions.parallel(
      Actions.scaleTo(this.roullete, 0.4, 0.4, 0.9, Easing.easeInQuad),
      Actions.fadeTo(this.container, 1.0, 0.5, Easing.easeInQuad),
      Actions.fadeTo(logo, 0, 0.5, Easing.easeInQuad)
    );

    actions.queue(Actions.fadeTo(this.field, 1.0, 0.5, Easing.easeInQuad));

    actions.play();
  }

  animateDismiss() {
    if(!this.container.visible) return;
    this.container.alpha = 1;
    this.container.visible = true;

    app.ticker.remove(this.ticker);

    const logo = ui.components.background.logo;

    const actions = Actions.parallel(
      Actions.scaleTo(this.roullete, 0.2, 0.2, 0.5, Easing.easeInQuad),
      Actions.fadeTo(this.container, 0.0, 0.5, Easing.easeInQuad),
      Actions.fadeTo(logo, 1, 0.5, Easing.easeInQuad)
    );

    actions.queue(Actions.runFunc(() => {
      this.container.visible = false;

      // NOTE: memory leak fix?
      ui.view.removeChild(this.container);
    }));

    actions.play();
  }

  play(section, oncomplete) {
    if (this.isplaying >= 0) return;
    this.oncomplete = oncomplete;
    this.isplaying = section;

    // this.speed = 0.3; // 0.3011; // 0.05
    // this.speed = 0.28 + (Math.random() * 0.1);
    this.speed = 0.27 + ((Math.random() * 2) * 0.01);
    // console.log(">>>> ", this.getRoulleteResult(), this.speed);

    const actions = Actions.parallel(
      Actions.scaleTo(this.roullete, 1, 1, 0.9, Easing.easeInQuad),
      Actions.moveTo(this.field, this.field.x, 200, 0.5, Easing.easeInQuad)
    );

    actions.play();
  }

  completed() {
    const playing = this.isplaying;
    this.isplaying = -1;
    this.speed = 0;

    const result = this.getRoulleteResult();

    // winner winner chicken dinner
    if (result == playing) {
      this.amount*=2;
      this.field.setText(this.amount);
      this.oncomplete();
      return;
    }

    this.amount = 0; // lose all
    this.oncomplete();
  }

}
