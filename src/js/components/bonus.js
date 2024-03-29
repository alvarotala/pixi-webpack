import * as PIXI from 'pixi.js'
import config from '../config.js'
import { next, playSound } from '../core/utils.js'
import { AnimatedNumberField } from '../etc/TextField.js'

import { Actions, Interpolations } from 'pixi-actions';
import Easing from '../etc/easing.js'

import * as particles from 'pixi-particles'

export default class BonusComponent {

  constructor() {
    this.speed = 0;
    this.isplaying = false;
    this.segments = 8;

    this.speedlimit = 0.5;
    this.accrate = 0.01; // 0.015;
    this.desrate = 0.001;
    this.stopdelta = 0.001;

    this.load();
  }

  load() {
    this.loader = new PIXI.Loader();
    this.loader
      .add('bonus_roullete', config.path_assets + '/images/bonus_roullete.png')
      .add('bonus_roullete_center', config.path_assets + '/images/bonus_roullete_center.png')
      .add('bonus_roullete_tick', config.path_assets + '/images/bonus_roullete_tick.png')
      .add('bonus_help', config.path_assets + '/images/bonus_help.png')

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


    this.tick = new PIXI.Sprite(res.bonus_roullete_tick.texture);
    this.tick.anchor.set(0.5);

    this.tick.x = this.roullete.x;
    this.tick.y = this.roullete.y - 236; // 290, 280

    this.tick.alpha = 0;
    this.container.addChild(this.tick);


    this.field = new AnimatedNumberField(120, 60, '0');
    this.field.background.alpha = 1;
    this.field.oy = 380;
    this.field.y = this.field.oy;
    this.field.x = (config.width / 2);
    this.field.pivot.set(60, 30);

    this.container.addChild(this.field);
  }

  animateShow() {
    if(this.container.visible) return;
    this.container.alpha = 0;
    this.container.visible = true;

    // NOTE: memory leak fix?
    ui.view.addChild(this.container);

    this.field.y = this.field.oy;
    this.field.setText(this.amount);

    this.tick.alpha = 0;

    this.roullete.scale.set(0.2, 0.2);

    this.isplaying = false;
    this.brakes = null;
    this.speed = 0.02;
    this.decelerating = false;

    this.ticker = (delta) => this.enterLoopAnimation();
    app.ticker.add(this.ticker);

    const actions = Actions.parallel(
      Actions.scaleTo(this.roullete, 0.4, 0.4, 0.9, Easing.easeInQuad),
      Actions.fadeTo(this.container, 1.0, 0.5, Easing.easeInQuad),
      Actions.fadeTo(ui.components.background.logo, 0, 0.5, Easing.easeInQuad)
    );

    actions.play();
  }

  animateDismiss() {
    if(!this.container.visible) return;
    this.container.alpha = 1;
    this.container.visible = true;

    app.ticker.remove(this.ticker);

    const actions = Actions.parallel(
      Actions.scaleTo(this.roullete, 0.2, 0.2, 0.5, Easing.easeInQuad),
      Actions.fadeTo(this.container, 0, 0.5, Easing.easeInQuad),
      Actions.fadeTo(ui.components.background.logo, 1, 0.5, Easing.easeInQuad),
    );

    actions.queue(Actions.runFunc(() => {
      this.container.visible = false;

      // NOTE: memory leak fix?
      ui.view.removeChild(this.container);
    }));

    actions.play();
  }

  animateBig() {
    if (this.roullete.scale.x >= 1) return;

    Actions.parallel(
      Actions.scaleTo(this.roullete, 1, 1, 0.9, Easing.easeInQuad),
      Actions.moveTo(this.field, this.field.x, 200, 0.5, Easing.easeInQuad),
      Actions.fadeTo(this.tick, 1.0, 1.2, Easing.easeInQuad)
    ).play();
  }

  getRoulletePosition(rotation) {
    const angle = (rotation * 180/Math.PI) % 360;
    return angle / (360 / this.segments);
  }

  // 0 => purple
  // 1 => yellow

  getRoulleteResult() {
    return Math.floor(this.getRoulletePosition(this.roullete.rotation)) % 2;
  }

  play(selection, target, oncomplete) {
    if (this.isplaying) return;
    this.oncomplete = oncomplete;

    this.field.setBackgroundColor(selection ? 0xbd6306 : 0x330245);

    this.speed = this.getSpeedWithTargetFromCurrentRotation(target);

    this.isplaying = true;
    this.decelerating = false;
    this.brakes = null;

    this.animateBig();
  }

  getSpeedWithTargetFromCurrentRotation(target) {
    while (true)  { // tries
      let setspeed = Math.random() * 0.1;

      let tmpspeed = setspeed;
      let rotation = this.roullete.rotation;
      let decelerating = false;

      while (true) { // animation frames..
        rotation+=tmpspeed;

        if (tmpspeed < this.speedlimit && decelerating != true) {
          tmpspeed = Math.min(this.speedlimit, tmpspeed + this.accrate); // 0.03
          continue; // accelerate
        }

        decelerating = true;
        tmpspeed-=this.desrate; // decelerate

        if (tmpspeed < this.stopdelta) {
          const angle = this.getRoulletePosition(rotation);
          const result = Math.floor(angle) % 2;
          if (result != target) break; // try another speed..

          // check padding
          const delta = angle % 1;
          if (delta < 0.05 || delta >= 0.95) {
            break; // too close to edge.. better avoid confussions..
          }

          return setspeed;
        }
      }
    }
  }

  endsLoopAnimation() {
    this.brakes = true;
    this.decelerating = false;
    this.isplaying = false;
    this.speed = 0;

    this.oncomplete(this.getRoulleteResult());
  }

  enterLoopAnimation() {
    if (this.brakes == true) return;
    if (this.speed > 0) {
      this.roullete.rotation+=this.speed;
    }

    if (this.isplaying) {

      const tic = this.getRoulleteResult();
      if (tic != this.previoustick) {
        this.previoustick = tic;
        playSound(0, 'bonustickspin', { volume: 0.3 });
      }

      if (this.speed < this.speedlimit && this.decelerating != true) {
        this.speed = Math.min(this.speedlimit, this.speed + this.accrate);
        return // accelerate
      }

      this.decelerating = true;
      this.speed-=this.desrate; // 0.0003


      if (this.speed < this.stopdelta) {  // stop
        this.endsLoopAnimation();
      }
    }

    else {
      this.field.setBackgroundColor(this.getRoulleteResult() ? 0xbd6306 : 0x330245);
    }

  }

}
