import config from '../config.js'
import { dispatch } from './inputs.js'
import { log } from './utils.js'
import storage from './storage.js'


export const mapsetup = ['pay', 'left', 'right', 'option', 'cancel', 'play', 'numpad:0', 'numpad:1', 'numpad:2', 'numpad:3', 'numpad:4', 'numpad:5', 'numpad:6', 'numpad:7'];


function getmapkeypin(name) {
  return gpio.mapping[mapsetup.indexOf(name)];
}

function getmapkeyname(pin) {
  return mapsetup[gpio.mapping.indexOf(pin)];
}

function sendDataToGPIO(str) {
  if (gpio.socket == null || gpio.socket == undefined) return;
  if (gpio.socket.readyState == WebSocket.OPEN) gpio.socket.send(str);
}

const inputsHandler = (event, mapping) => {
  const d = event.data.split(":")
  switch (d[0]) {
    case "U":
      const value = getmapkeyname(parseInt(d[1]));
      const params = value.split(":");
      dispatch(...params);
      break;
    case "C":
      dispatch('addcoins', 1);
      break;
    case "E":
      log("> cfgpio error: ", d);
      break;
  }
}

export const startGPIOInterface = (host, callback) => {
  gpio.socket = new WebSocket(host);

  gpio.socket.onerror = (e) => {
    log("> remote gpio error", e);
  }

  gpio.socket.onopen = (event) => {
    log("> remote gpio connected", host);
    callback(true)
  }
};

export const mapGPIOtoInputs = () => {
  log(">> mapGPIOtoInputs");

  gpio.mapping = storage.getObject('mapping');
  gpio.socket.onmessage = inputsHandler;
}

export const rawGPIOListener = (callback) => {
  log(">> rawGPIOListener");

  gpio.socket.onmessage = (e) => callback(e.data);
}

export const removeGPIOListeners = () => {
  log(">> removeGPIOListeners");

  gpio.socket.onmessage = null;
}

export const setGPIOInterface = () => {
  log(">> setGPIOInterface");

  gpio.send = {

    raw: (str) => {
      sendDataToGPIO(str);
    },

    setCoinerState: (active) => {
      sendDataToGPIO('C:' + ((active == true) ? 1 : 0));
    },

    hopperReleaseCoins: (coins) => {
      sendDataToGPIO('H:' + coins);
    },

    disableAll: () => {
      sendDataToGPIO('C:0');
      gpio.send.lightsOff();
    },

    lightsOff: () => {
      sendDataToGPIO('L:0,0,0,0$1');
      sendDataToGPIO('B:0000000000000000,0$1');
    },

    ledstripAnimation: (sequences, times=0) => {
      if (debugLevel == 1) return;
      const seqstr = sequences.map((seq) => seq.join(',')).join('#');
      sendDataToGPIO('L:'+seqstr+'$'+times);
    },

    keyledAnimation: (sequences, times=0) => {
      if (debugLevel == 1) return;
      if (!gpio.mapping) return;

      const seqstr = sequences.map((seq) => {
        const tmparr = [];
        seq[0].forEach((m, i) => {
          tmparr[gpio.mapping[i]] = m;
        });

        return tmparr.join('')+'00,'+seq[1];
      }).join('#');

      sendDataToGPIO('B:'+seqstr+'$'+times);
    },

    foo: null
  };
};
