import * as PIXI from 'pixi.js'
import config from '../config.js'

import { Actions, Interpolations } from 'pixi-actions';
import Easing from './easing.js'
import geom from './geom.js'

import { promise, next, pause, playSound } from '../core/utils.js'

import * as particles from 'pixi-particles'

import { animations } from './gpio_animations.js'


// TODO: el tiempo de la jugada debe influir enn el resultado
// si el jugador tarda mucho vs tarda poco..
// la maquina deberia medir ese tiempo y calcular que accion tomar
// si pagar o cobrar..

export default class RoulleteSpinAnimatorSimple {

  constructor() {
    this.roullete = ui.components.roullete;

    const particle = [PIXI.Loader.shared.resources.particle.texture]
    this.emitter = new particles.Emitter(ui.particles, particle, _particle_config);
  }

  async run(steps) {
    ui.components.bets.multipliers.reset();
    this.roullete.animateReset();
    // await pause(1000);

    const cursor_tile = this.roullete.tiles[this.roullete.current];
    this.emitter.updateOwnerPos(cursor_tile.x + this.roullete.container.x, cursor_tile.y + this.roullete.container.y);

    gpio.send.ledstripAnimation(animations.ledstrip.flash(66), 6);

    this.emitterticker = (delta) => {
      if (this.emitter) {
        this.emitter.update(delta*0.0015); // 0.005
      }
    };

    gpio.send.ledstripAnimation(animations.ledstrip.fade(66))

    let speedx    = 5;
    let currstep  = 0;

    await promise((resolve) => {
      this.ticker = (timestamp, frame) => {
        const cframe = frame % speedx;
        if (cframe !== 0) return; // step!

        currstep++;
        this.update();

        if (currstep == 6) speedx = 2;

        if (currstep == (steps - 6)) {
          speedx = 6;
          gpio.send.ledstripAnimation(animations.ledstrip.flash(200, [1,1,1]));
        }

        if (currstep >= steps) {
          speedx = 0;
          app.ticker.remove(this.ticker);
          resolve(true);
        }
      }

      app.ticker.add(this.ticker);
      app.ticker.add(this.emitterticker);
      this.emitter.emit = true;
    })

    await this.complete();
    return true;
  }

  update() {
    if (currentContext != 'playing') return;
    this.roullete.current++;
    if (this.roullete.current >= this.roullete.tiles.length)
      this.roullete.current = 0;


    const cursor = this.roullete.current;
    const cursor_tile = this.roullete.tiles[cursor];

    // reset other tiles..
    this.roullete.tiles.forEach((tile, i) => {
      if (tile.hover.visible && i != cursor) {
        tile.hover.visible = false;

        if (tile.scale.x > 1) {
          Actions.parallel(
            Actions.scaleTo(tile, 1.0, 1.0, 0.6, Easing.linear),
            Actions.moveTo(tile, tile.ox, tile.oy, 0.6, Easing.linear)
          ).play();
        }
      }
    });

    cursor_tile.hover.visible = true;

    if (cursor_tile.scale.x >= 0.7) {
      cursor_tile.scale.set(1.1, 1.1);

      const center = this.roullete.size /2;
      //
      const angle = geom.angle(center, center, cursor_tile.ox, cursor_tile.oy);
      const point = geom.point(cursor_tile.ox, cursor_tile.oy, 10, angle);

      cursor_tile.x = point.x;
      cursor_tile.y = point.y;
    }


    ui.components.bets.multipliers.next();

    this.emitter.updateOwnerPos(cursor_tile.x + this.roullete.container.x, cursor_tile.y + this.roullete.container.y);

    playSound(0, 'roulletestep', { volume: 0.6 });
  }

  async complete() {
    if (currentContext != 'playing') return;
    const cursor  = this.roullete.current;
    const current = this.roullete.tiles[cursor];

    gpio.send.ledstripAnimation(animations.ledstrip.flash(66), 6);
    await pause(300);

    this.roullete.animateScale(0.7, 10, 1.0, 0.5, [current]); // 0.7, -11
    Actions.scaleTo( current, 1.15, 1.15, 0.5, Easing.easeInQuad ).play();

    this.emitter.emit = false;
    app.ticker.remove(this.emitterticker);
    this.emitter.destroy();
    this.emitter = null;
  }

}

// gas
const _particle_config = {alpha:{start:0.8,end:0.1},scale:{start:1.2,end:3.0,minimumScaleMultiplier:1.95},color:{start:"#fcf200",end:"#be0000"},speed:{start:0,end:0,minimumSpeedMultiplier:1},acceleration:{x:0,y:0},maxSpeed:0,startRotation:{min:0,max:0},noRotation:true,rotationSpeed:{min:0,max:0},lifetime:{min:0.100,max:0.251},blendMode:"normal",frequency:0.008,emitterLifetime:-1,maxParticles:50,pos:{x:0,y:0},addAtBack:false,spawnType:"point"};
