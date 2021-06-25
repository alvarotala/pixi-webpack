import * as PIXI from 'pixi.js'

let consoleObj = null;

export const con = {

  start: () => {
    consoleObj = new PIXI.Text();
    ui.view.addChild(consoleObj);

    consoleObj.style = { fontSize: 14, fill: "#fff" };
    consoleObj.x = 20
    consoleObj.y = 20
  },

  append: (text) => {
    consoleObj.text = consoleObj.text + text + "\n";
  },

  clear: () => {
    consoleObj.text = '';
  }
};
