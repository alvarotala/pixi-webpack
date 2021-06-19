import * as PIXI from 'pixi.js'
import config from '../config.js'

import RoulleteTile from '../etc/RoulleteTile.js'
import TextField, {AnimatedNumberField, SimpleText} from '../etc/TextField.js'

import { Actions, Interpolations } from 'pixi-actions';
import Easing from '../etc/easing.js'

export default class BetsComponent {

  constructor() {
    this.fields = [];
    this.tiles  = [];
    this.lasts  = [];

    this.build();
  }

  build() {
    const background = PIXI.Loader.shared.resources.betsbg.texture;
    this.container = new PIXI.Sprite(background);

    this.container.visible = false;

    this.container.width  = config.width;
    this.container.height = 342;

    this.y                = config.height - this.container.height;
    this.container.y      = this.y;

    // NOTE: memory leak fix? - commented
    // ui.view.addChild(this.container);

    this.multipliers = new MultipliersBar();
    this.container.addChild(this.multipliers);

    const len = config.bets_tiles_textures.length;
    const pad = 20;
    const spacing = 5;

    const size = ((config.width - (pad * 2) - ((len - 1) * spacing)) / len);

    var xpos = pad;

    for (let i=0; i<len; i++) {

      const last = new SimpleText(size, 30, '0');

      last.y = 224;
      last.x = xpos + (size/2);

      last.value = 0;
      last.visible = false;

      last.pivot.set(size/2,30)

      last.text.style.fontSize = 15;
      last.text.style.fill = "#ffffff";
      last.text.style.stroke = null;
      last.text.style.strokeThickness = 1;

      this.container.addChild(last);
      this.lasts.push(last);

      const field = new AnimatedNumberField(size, 60, '0');
      field.y = 157; /// 170
      field.x = xpos + (size/2);

      field.oy = field.y;
      field.ox = field.x;

      field.pivot.set(size/2,30)

      const tile = new RoulleteTile(config.bets_tiles_textures[i], size);
      tile.y = 240 + (size / 2);
      tile.x = xpos + (size / 2);

      tile.oy = tile.y;
      tile.ox = tile.x;

      xpos+= size + spacing;
      field.value = 0;

      this.container.addChild(field);
      this.container.addChild(tile);

      this.fields.push(field);
      this.tiles.push(tile);
    }

    this.multipliers.build();
  }

  addAtPosition(i, num=1) {
    const field = this.fields[i];
    field.value = field.value + num;
    field.setText(field.value, (num > 0));

    if (num > 0 && field.value <= 1) {
      field.selected.visible = true;
    }
  }

  reset() {
    this.fields.forEach((field) => {
      field.value = 0;
      field.setText(0, false);

      field.selected.visible = false;
    });
  }

  total() {
    return this.fields.reduce(((sum, a, i) => (sum + a.value)), 0);
  }

  clearLastValues() {
    this.lasts.forEach((field, i) => {
      field.value = 0;
      field.visible = false;
    });
  }

  updateLastValues() {
    this.fields.forEach((field, i) => {
      this.lasts[i].value = field.value;
    });
  }

  showLastValues() {
    this.lasts.forEach((last) => {
      if (last.value == 0) {
        last.visible = false;
        return
      }

      last.visible = true;
      last.setText(last.value);
    });
  }

  getLastPlayedTotal() {
    return this.lasts.reduce(((sum, a, i) => (sum + a.value)), 0);
  }

  setLastPlayedFields() {
    this.lasts.forEach((last, i) => {
      if (last.value > 0) {
        this.addAtPosition(i, last.value);
      }
    });
  }

  animateShow() {
    if(this.container.visible) return;
    this.container.y = config.height;
    this.container.visible = true;

    // NOTE: memory leak fix?
    ui.view.addChild(this.container);

    Actions.moveTo(this.container, this.container.x, config.height - this.container.height, 1.5, Easing.easeInQuad).play();
  }

  animateDismiss() {
    if(!this.container.visible) return;

    const action = Actions.moveTo(this.container, this.container.x, config.height, 1.5, Easing.easeInQuad)
    action.queue(Actions.runFunc(() => {
      this.container.visible = false;

      // NOTE: memory leak fix?
      ui.view.removeChild(this.container);
    }))

    action.play();
  }

  animate(xpos) {
    Actions.moveTo(this.container, this.container.x, xpos, 1.5, Easing.easeInQuad).play();
  }

  animatePlayReset() {
    const actions = [];
    this.fields.forEach((f, i) => {
      const last = this.lasts[i];
      const tile = this.tiles[i];

      actions.push(Actions.fadeTo(f, 1.0, 0.4, Easing.easeInQuad));
      actions.push(Actions.scaleTo(f, 1.0, 1.0, 0.4, Easing.easeInQuad));
      actions.push(Actions.moveTo(f, f.ox, f.oy, 0.4, Easing.easeInQuad));


      actions.push(Actions.fadeTo(last, 1, 0.4, Easing.easeInQuad));

      actions.push(Actions.fadeTo(tile, 1.0, 0.4, Easing.easeInQuad));
      actions.push(Actions.scaleTo(tile, 1.0, 1.0, 0.4, Easing.easeInQuad));
      actions.push(Actions.moveTo(tile, tile.ox, tile.oy, 0.4, Easing.easeInQuad));
    });

    Actions.parallel(...actions).play();
  }

  animatePlaySelecteds() {
    const actions = [];
    this.fields.forEach((f, i) => {
      const last = this.lasts[i];
      const tile = this.tiles[i];

      actions.push(Actions.fadeTo(last, 0, 0.4, Easing.easeInQuad));

      if(f.value > 0) {
        actions.push(Actions.moveTo(f, f.ox, f.oy - 5, 0.4, Easing.easeInQuad));
        actions.push(Actions.moveTo(tile, tile.ox, tile.oy - 10, 0.4, Easing.easeInQuad));
      }

      else {
        actions.push(Actions.fadeTo(f, 0.5, 0.4, Easing.easeInQuad));
        actions.push(Actions.scaleTo(f, 0.5, 0.5, 0.4, Easing.easeInQuad));

        actions.push(Actions.fadeTo(tile, 0.5, 0.4, Easing.easeInQuad));
        actions.push(Actions.scaleTo(tile, 0.7, 0.7, 0.4, Easing.easeInQuad));
      }
    });

    Actions.parallel(...actions).play();
  }

}

class MultipliersBar extends PIXI.Container {

  constructor() {
    super();

    this.keys     = Object.keys(config.multipliers);
    this.data     = {}
    this.total    = 0;

    this.keys.forEach((k) => {
      const m = config.multipliers[k];
      this.total+=m.length;
      this.data[k] = { cursor: 0, fields: [], values: m}
    });

    this.build();
  }

  build() {
    this.container = new PIXI.Container();

    this.container.width  = config.width;
    this.container.height = 60;

    this.container.y      = 55;

    this.addChild(this.container);

    const pad       = 100;

    const section   = 50;
    const spacing   = 5;

    const size = ((config.width - (pad * 2) - ((this.total - 1) * spacing) - ((this.keys.length - 1) * section)) / this.total);

    var xpos = pad;

    for (let i=0; i<this.keys.length; i++) {
      const data = this.dataAtIndex(i);

      for (let b=0; b<data.values.length; b++) {
        const num = data.values[b];

        const field = new SimpleText(size, 46, 'x' + num);
        field.y = 0; // 85
        field.x = xpos;

        field.text.style.fontSize = 20;
        field.text.style.fill = "#ffffff";
        field.text.style.stroke = '#ff0dc2';
        field.text.style.strokeThickness = 1;

        field.text.style.dropShadow = true;
        field.text.style.dropShadowAlpha = 0.5;
        field.text.style.dropShadowBlur = 5;
        field.text.style.dropShadowDistance = 5;

        field.text.style.letterSpacing = 3;

        field.value = num;
        field.index = b;

        xpos+= size + spacing;

        this.container.addChild(field);
        data.fields.push(field);
      }

      xpos+= section;
    }

    this.update();
  }

  dataAtIndex(i) {
    return this.data[this.keys[i]];
  }

  simulate(dist, k) {
    const m = this.data[k];
    const i = dist % m.values.length;
    return m.values[i];
  }

  reset() {
    for (let i=0; i<this.keys.length; i++) {
      const data = this.dataAtIndex(i);
      data.cursor = 0;
    }

    this.update();
  }

  update() {
    for (let i=0; i<this.keys.length; i++) {
      const data = this.dataAtIndex(i);

      data.fields.forEach((field) => {
          if (field.index == data.cursor) {
            field.text.style.fontSize = 30;
            field.text.style.fill = "#faff00";
            field.text.style.stroke = '#ff0dc2';
            field.text.style.strokeThickness = 4;
            return;
          }

          field.text.style.fontSize = 20;
          field.text.style.fill = "#ffffff";
          field.text.style.stroke = '#ff0dc2';
          field.text.style.strokeThickness = 1;
      });
    }
  }

  next() {
    for (let i=0; i<this.keys.length; i++) {
      const data = this.dataAtIndex(i);
      data.cursor++;
      if (data.cursor >= data.values.length) data.cursor = 0;
    }

    this.update();
  }

}
