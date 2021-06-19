import * as PIXI from 'pixi.js'
import config from '../config.js'

export default class RoulleteTile extends PIXI.Container {

  constructor(image, size=200) {
    super();

    this.size  = size;
    this.pivot.set(this.size/2, this.size/2);

    this.build(image);
  }

  build(image) {
    const texture = PIXI.Loader.shared.resources.tile.texture;
    this.background = new PIXI.Sprite(texture);

    this.background.width   = this.size;
    this.background.height  = this.size;

    this.addChild(this.background);

    // this.hover = new PIXI.Graphics();
    // this.hover.beginFill(0xffffff);
    // this.hover.drawRoundedRect(0, 0, this.size, this.size, 10);
    // this.hover.endFill();

    this.hover = new PIXI.Sprite(PIXI.Loader.shared.resources.tile_hover.texture);
    this.hover.width  = this.size;
    this.hover.height = this.size;

    this.hover.visible = false;
    this.addChild(this.hover);

    // JUST FOR TEST
    // hasta completar todas las animaciones que faltan
    const animations = ['77', '772', 'banana', 'banana2', 'bell', 'bell2', 'strawberry', 'strawberry2'];

    if (animations.includes(image)) {
      const textures = PIXI.Loader.shared.resources[image];
      this.image = new PIXI.AnimatedSprite(textures.spritesheet.animations[image]);
      this.image.play();
    }

    else {
      const path = config.path_assets + '/images/tiles/'+image+'.png';
      this.image = new PIXI.Sprite.from(path);
    }

    this.image.anchor.set(0.5);

    this.image.width  = this.size * 0.8;
    this.image.height = this.size * 0.8;

    this.image.x = this.size / 2;
    this.image.y = this.size / 2;

    this.addChild(this.image);
  }

}
