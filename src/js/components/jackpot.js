import * as PIXI from 'pixi.js'

import config from '../config.js'

import { Actions, Interpolations } from 'pixi-actions';
import Easing from '../etc/easing.js'

import { SimpleText } from '../etc/TextField.js'

import { log, next, pause, setHandledTimeout } from '../core/utils.js'

export default class JackpotComponent {

  constructor() {
    this.speed = 0.02;
    this.isplaying = false;

    this.wheels = [];

    this.load();
  }

  load() {
    this.loader = new PIXI.Loader();
    this.loader
      .add('jackpot_slots_bg', config.path_assets + '/images/jackpot_slots_bg.png')

      // .add('slots_symbol_0', config.path_assets + '/images/slots_symbol_0.png')
      // .add('slots_symbol_1', config.path_assets + '/images/slots_symbol_1.png')
      // .add('slots_symbol_2', config.path_assets + '/images/slots_symbol_2.png')

      .add('wheel', config.path_assets + '/images/wheel.png')

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
    this.slots = new PIXI.Sprite(res.jackpot_slots_bg.texture);

    this.slots.oy = 360;
    this.slots.y  = this.slots.oy;

    this.container.addChild(this.slots);

    const maskcontainer = new PIXI.Container();
    maskcontainer.y = this.slots.oy + 86;
    maskcontainer.width = config.width;

    const maskbg = new PIXI.Graphics();
    maskbg.beginFill(0xd53ec1);
    maskbg.drawRect(0, maskcontainer.y, config.width, 306);
    maskbg.endFill();

    maskbg.visible = true;

    this.container.addChild(maskbg);

    // maskcontainer.mask = maskbg;
    this.container.addChild(maskcontainer);

    var xpos = 70;
    for (let i=0; i<3; i++) {
      const wheel = new SlotWheel(this);
      wheel.x = xpos;
      // wheel.y = 86;
      wheel.index = i;

      xpos+=wheel.width + 52;

      maskcontainer.addChild(wheel);
      this.wheels.push(wheel);
    }

    this.field = new SimpleText(120, 60);
    this.field.y = 300;
    this.field.x = (config.width / 2);
    this.field.pivot.set(60, 30);

    this.container.addChild(this.field);

    // this.standAloneRunner();
  }

  standAloneRunner() {
    this.animateShow({mode: 'local', spins: 1000});

    setInterval(() => {
      this.play();
    }, 1000);
  }

  animateShow(params) {
    if (this.isplaying) return;
    if(this.container.visible) return;

    this.container.alpha = 0;
    this.container.visible = true;

    // NOTE: memory leak fix?
    ui.view.addChild(this.container);

    this.mode   = params.mode;

    this.spins  = params.spins;
    this.field.setText(this.spins);

    Actions.fadeTo(this.container, 1.0, 0.7, Easing.easeInQuad).play();
  }

  animateDismiss() {
    if (this.isplaying) return;
    if(!this.container.visible) return;
    this.container.alpha = 1;

    const actions = Actions.fadeTo(this.container, 0.0, 0.5, Easing.easeInQuad);

    actions.queue(Actions.runFunc(() => {
      this.container.visible = false;

      // NOTE: memory leak fix?
      ui.view.removeChild(this.container);
    }));

    actions.play();
  }

  addFreeSpin(num) {
    this.spins+=num;
    this.field.setText(this.spins);
  }

  play() {
    if (this.isplaying) return;
    if (this.spins <= 0) return;

    this.isplaying = true;

    this.spins--;
    this.field.setText(this.spins);

    this.wheel_responses = [];
    for (let i=0, n=this.wheels.length; i < n; ++i) {
      const wheel = this.wheels[i];

      setHandledTimeout(() => wheel.play(), i * 144);
    }

    app.ticker.add(this.enterLoopAnimation, this);
  }


  enterLoopAnimation(delta) {
    if (!this.isplaying) return;

    for (let i=0, n=this.wheels.length; i < n; ++i) {
      this.wheels[i].enterLoopAnimation(delta);
    }
  }

  wheelStopedCallback(result) {
    this.wheel_responses.push(result);

    if (this.wheel_responses.length >= this.wheels.length) {
      this.completed();
    }
  }

  completed() {
    if (!this.isplaying) return;
    app.ticker.remove(this.enterLoopAnimation, this);

    // log(this.spins, this.wheel_responses);

    this.isplaying = false;

    /// callback from context
    if (this.oncompleted) this.oncompleted();

    // let ms = (this.spins == 0) ? 3000 : 0;

    // next(ms, () => {
    //   this.isplaying = false;
    //   this.oncompleted(this.spins);
    // });

    // setTimeout(() => {
    //   this.isplaying = false;
    //   this.oncompleted(this.spins);
    // }, ms);
  }
}


class SlotWheel extends PIXI.Container {

  constructor(delegate) {
    super();
    this.delegate = delegate;

    this.size   = 158;
    this.speed  = 0;

    this.width  = this.size;
    this.height = 306;

    this.build();
  }

  build() {
    this.items = [];
    const res = this.delegate.loader.resources;

    this.holder = new PIXI.Container();
    this.holder = new PIXI.Sprite(res.wheel.texture);

    // this.sequences = [0,1,2,0,2,1,0,1,2];
    this.sequences = [0,1,2,0,1,2];

    this.total = this.sequences.length;
    // this.sequences.forEach((a, i) => {
    //   const item = new PIXI.Sprite(res['slots_symbol_'+a].texture);
    //   item.x = 0;
    //   item.y = this.size * i;
    //
    //   this.holder.addChild(item);
    // });

    this.holder.oy = -((this.total - 3) * this.size) - (this.size / 2);
    this.holder.y = this.holder.oy + (this.size * Math.floor(Math.random() * 6));

    // FOR DEV: test all with fixed start..
    // this.holder.y = this.holder.oy + (this.size * 1);

    this.addChild(this.holder);
    this.holder.cacheAsBitmap = true;
  }

  enterLoopAnimation(delta) {
    if (this.speed == 0) return;

    // delta = delta / settings.TARGET_FPMS / 1000;

    this.holder.y += this.speed;
    this.frameCounter++;

    // reset holder position..
    if (this.holder.y >= 0) {
      const offset = this.holder.oy + this.holder.y + (this.size / 2);
      this.holder.y = offset;
    }

    if (!this.stopping && this.frameCounter >= (60 * 3)) {
      this.stopping = true;
    }

    if (this.stopping) {
      // add friction..
      this.speed-=0.5; // 0.7

      if (this.speed < 15.0) {
        this.completed();
      }
    }
  }


  play() {
    if (this.speed > 0) return;

    this.speed = 30; // 40
    this.stopping = false;

    this.frameCounter = 0;

    // log(this.holder.height, this.maskbg.height, this.maskbg.y, this.holder.y);

    // const action = Actions.moveTo(this.holder, 0, this.holder.y + 200, 0.5, Easing.easeInQuad)
    // action.queue(Actions.runFunc(() => {
    //   app.ticker.add(this.enterLoopAnimation, this);
    // }))
    //
    // action.play();

    // stop after XX ms..
    // const endtime = (3 + Math.floor(Math.random() * 3)) * 1000;
    // const endtime = (500 * this.index) + 2500;

    // const endtime = 3000;

    // next(endtime, () => {
    //   this.stopping = true;
    // });

    // setTimeout(this.stopSpin.bind(this), endtime);
    // app.ticker.add(this.enterLoopAnimation, this);



    // this.loopInterval = setInterval(() => {
    //   this.enterLoopAnimation();
    // }, 100);
    //
    // setTimeout(this.stopSpin.bind(this), endtime);
  }

  stopSpin() {
    this.stopping = true;
  }

  completed() {
    // app.ticker.remove(this.enterLoopAnimation, this);
    // clearInterval(this.loopInterval);
    // this.loopInterval = null;

    this.speed = 0;
    this.stopping = false;

    const theight = this.size * this.total;
    const ypos = this.holder.y;

    const num = Math.floor(ypos / this.size) * -1;
    const selected = this.sequences[num];

    const moveto = -(num * this.size) + (this.size * .5);

    this.holder.y = moveto;

    // if (ypos > moveto) {
    //   Actions.moveTo(this.holder, 0, moveto, 0.5, Easing.easeInCubic).play();
    // }
    // else {
    //   Actions.moveTo(this.holder, 0, moveto, 0.3, Easing.easeOutCubic).play();
    // }

    this.delegate.wheelStopedCallback(selected);
  }

}
