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
  constructor(width, height, def="33", bgcol=0x990033) {
    super();

    this.w  = width;
    this.h  = height;
    this.width   = width;
    this.height  = height;

    this.background = new PIXI.Container();
    this.setBackgroundColor(bgcol);

    this.background.alpha = 0.5;
    this.addChild(this.background);

    const style = Object.assign({}, _textFieldStyle);

    // this.text = new PIXI.BitmapText(def, { fontName: "Default" });
    this.text = new PIXI.Text(def, style);

    this.text.anchor.set(0.5);
    this.text.x = width/2;
    this.text.y = height/2;

    this.addChild(this.text);
  }

  setBackgroundColor(color, radio = 20) {
    if (color == this.lastcolor) return;
    this.lastcolor = color;

    this.background.children.forEach((c) => {
      this.background.removeChild(c);
    });

    const graph = new PIXI.Graphics();
    graph.beginFill(color);
    graph.drawRoundedRect(0, 0, this.w, this.h, radio);
    graph.endFill();

    this.background.addChild(graph);
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
