import * as PIXI from 'pixi.js'
import config from '../config.js'

import RoulleteTile from '../etc/RoulleteTile.js'
import RoulleteSpinAnimatorSimple from '../etc/RoulleteSpinAnimatorSimple.js'

import { Actions, Interpolations } from 'pixi-actions';
import Easing from '../etc/easing.js'
import geom from '../etc/geom.js'


export default class RoulleteComponent {

  constructor() {
    this.current  = 0;
    this.tiles    = [];

    this.build();
  }

  build() {
    const pad = 20;
    this.size = config.width - (pad * 2);

    this.container = new PIXI.Container();

    this.container.visible = false;

    this.container.x = pad;
    this.container.oy = 220;
    this.container.y = this.container.oy;

    this.container.width  = this.size;
    this.container.height = this.size;

    // NOTE: memory leak fix? - commented..
    // ui.view.addChild(this.container);

    var len = config.roullete_tiles.length;

    if (len % 4) throw 'Tiles amount must be divisible by four..';

    const rows = len / 4; // four sizes (TRBL)
    const spacing = 10;

    const tile_size = (this.size - (spacing * rows)) / (rows + 1);

    var xt = 0;
    var yt = 0;

    var pos = 0;

    for (var a=0; a<len; a++) {
      const tile = new RoulleteTile(config.roullete_tiles[a].texture, tile_size);

      const subindex = a % rows;

      switch (pos) {
        case 0: // top
          xt = (tile_size + spacing) * subindex;
          yt = 0;
          break;
        case 1: // right
          xt = this.size - tile_size;
          yt = (tile_size + spacing) * subindex;
          break;
        case 2: // bottom
          xt = (this.size - tile_size) - ((tile_size + spacing) * subindex);
          yt = this.size - tile_size;
          break;
        case 3: // left
          xt = 0;
          yt = (this.size - tile_size) - ((tile_size + spacing) * subindex);
          break;
      }

      tile.x = xt + (tile_size / 2);
      tile.y = yt + (tile_size / 2);

      tile.ox = tile.x;
      tile.oy = tile.y;

      if (subindex == (rows - 1)) pos++;

      this.container.addChild(tile);
      this.tiles.push(tile);
    }

  }
  
  isDismissed() {
    return this.container.alpha == 0;
  }

  animateDismiss() {
    this.animateScale(0.2, -160, 0, 0.5);
  }

  animateReset() {
    if (!this.container.visible) {
      this.container.alpha = 0;
      this.container.visible = true;

      // NOTE: memory leak fix?
      ui.view.addChild(this.container);
    }

    const actions = [];

    actions.push(Actions.fadeTo(this.container, 1, 1.0, Easing.easeInQuad));

    this.tiles.forEach((tile) => {
      actions.push(Actions.moveTo(tile, tile.ox, tile.oy, 1.0, Easing.easeInQuad));
      actions.push(Actions.scaleTo(tile, 1.0, 1.0, 1.0, Easing.easeInQuad));
    });

    Actions.parallel(...actions).play();
  }

  resetCursor() {
    const tile = this.tiles[this.current];
    tile.hover.visible = false;
  }

  // hide
  // ui.components.roullete.animateScale(0.2, -260, 0, 1)
  // ui.components.roullete.animateScale(0.2, -160, 0, 0.5)

  // blur
  // ui.components.roullete.animateScale(0.5, 30, 0.5, 0.7)

  animateScale(scale, len=0, alp=1, tim=1, exclude=[]) {
    const actions = [];
    const center = this.size /2;

    if (alp > 0) {
      this.container.visible = true;
    }

    actions.push(Actions.fadeTo(this.container, alp, tim, Easing.easeInQuad));

    this.tiles.forEach((tile) => {
      if (exclude.includes(tile)) {
        return;
      }

      actions.push(Actions.scaleTo(tile, scale, scale, tim, Easing.easeInQuad));

      const angle = geom.angle(center, center, tile.ox, tile.oy);
      const point = geom.point(tile.ox, tile.oy, len, angle);

      actions.push(Actions.moveTo(tile, point.x, point.y, tim, Easing.easeInQuad));
    });

    const action = Actions.parallel(...actions);

    if (alp == 0) {
      action.queue(Actions.runFunc(() => {
        this.container.visible = false;

        // NOTE: memory leak fix?
        ui.view.removeChild(this.container);
      }));
    }

    action.play();
  }

}
