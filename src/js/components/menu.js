// TODO: el menu hay que mover a un componnente glogal.
// y tienen que ser botones para manejar el mennu de mobile / web..

this.menu = new PIXI.Sprite(res.bonus_help.texture);
this.menu.anchor.set(0.5);

this.menu.x = this.roullete.x;
this.menu.oy = this.roullete.y + 200;
this.menu.y = this.menu.oy;

this.container.addChild(this.menu);
