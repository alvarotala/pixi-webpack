import * as PIXI from 'pixi.js'
import config from '../config.js'

const style = new PIXI.TextStyle({
  fontFamily: 'Arial',
  fontSize: 18,
  fill: 0xffffff,
  align: 'left'
});


export default class Terminal {

  load(title) {
    this.title = title;

    this.container = new PIXI.Container();
    this.container.width  = config.width;
    this.container.height = config.height;

    app.stage.addChild(this.container);


    this.out = new PIXI.Text(this.title, style);
    this.out.position.set(20, 20);


    const screen = new PIXI.Graphics();
    screen.lineStyle(5, 0xFF0000, 1);
    screen.beginFill(0x000000, 1);
    screen.drawRect(0, 0, config.width, config.height);
    screen.endFill();

    this.container.addChild(screen);
    this.container.addChild(this.out);
  }

  set(text) {
    this.out.text = text;
  }

  clear() {
    this.set(this.title);
  }

  repeat(str, times=1) {
    var strs = '';
    for(let i = 0; i<times; i++) {
      strs+=str;
    }

    return strs;
  }

  newline(times=1) {
    this.set(this.out.text + this.repeat('\n', times));
  }

  append(text, indent = 0) {
    const indentstr = this.repeat('  ', indent);
    this.set(this.out.text + indentstr + text);
    this.newline();
  }

  dispose() {
    app.stage.removeChild(this.container);
    this.container.destroy({children: true});
  }
}
