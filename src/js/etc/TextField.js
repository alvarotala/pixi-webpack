import * as PIXI from 'pixi.js'
import config from '../config.js'

import { Actions, Interpolations } from 'pixi-actions';
import Easing from './easing.js'

const _textFieldStyle = new PIXI.TextStyle({
  fontFamily: "Helvetica",
  fontSize: 36,
  fill: "#fff",
  stroke: '#ff00e6',
  strokeThickness: 4,
  align: 'right',
});

// PIXI.BitmapFont.from("Default", {
//   fontFamily: "Arial",
//   fontSize: 12,
//   strokeThickness: 2,
//   fill: "purple"
// });

export default class TextField extends PIXI.Container {

  // bgcol=0x330000, selcol=0xb90505
  constructor(width, height, def="33", bgcol=0x990033, selcol=0xb90505) {
    super();

    this.width  = width;
    this.height = height;

    this.background = new PIXI.Graphics();
    this.background.beginFill(bgcol);
    this.background.drawRoundedRect(0, 0, width, height, 20);
    this.background.endFill();

    this.background.alpha = 0.5;

    this.addChild(this.background);

    this.selected = new PIXI.Graphics();
    this.selected.beginFill(selcol);
    this.selected.drawRoundedRect(0, 0, width, height, 20);
    this.selected.endFill();

    this.selected.visible = false;

    this.addChild(this.selected);

    const style = Object.assign({}, _textFieldStyle);



    // this.text = new PIXI.BitmapText(def, { fontName: "Default" });
    this.text = new PIXI.Text(def, style);

    this.text.anchor.set(0.5);
    this.text.x = width/2;
    this.text.y = height/2;

    this.addChild(this.text);
  }

  setText(text) {
    this.text.text = text; // LOL
  }

}


export class AnimatedNumberField extends TextField {

  setText(text, animated=true) {
    super.setText(text);
    if (!animated) return;

    Actions.parallel(
      Actions.sequence(
        Actions.scaleTo( this.text, 1.4, 1.4, 0.3, Easing.easeInQuad ),
        Actions.scaleTo( this.text, 1.0, 1.0, 0.5, Easing.easeOutQuad )
      ),

      Actions.sequence(
        Actions.moveTo( this.background, 0, 3, 0.5, Easing.easeInQuad ),
        Actions.moveTo( this.background, 0, 0, 0.3, Easing.easeOutQuad )
      )
    ).play();
  }

}


export class SimpleText extends PIXI.Container {

  constructor(width, height, def="33") {
    super();

    this.width  = width;
    this.height = height;

    const style = Object.assign({}, _textFieldStyle);
    this.text = new PIXI.Text(def, style);
    this.text.anchor.set(0.5);
    this.text.x = width/2;
    this.text.y = height/2;

    this.addChild(this.text);
  }

  setText(text) {
    this.text.text = text; // LOL
  }

}
