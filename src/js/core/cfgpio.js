import config from '../config.js'
import storage from './storage.js'

import { log, promise, pause, runsequencial, file, setHandledTimeout } from './utils.js'

import { dispatch } from './inputs.js'
import { setContext } from './contexts.js'


export const mapsetup = ['pay', 'left', 'right', 'option', 'cancel', 'play', 'numpad:0', 'numpad:1', 'numpad:2', 'numpad:3', 'numpad:4', 'numpad:5', 'numpad:6', 'numpad:7'];


function getmapkeypin(name) {
  return gpio.mapping[mapsetup.indexOf(name)];
}

function getmapkeyname(pin) {
  return mapsetup[gpio.mapping.indexOf(pin)];
}

function sendDataToGPIO(str) {
  return promise((resolve) => {
    if (gpio.socket == null || gpio.socket == undefined) {
      resolve(false);
      return;
    }

    if (gpio.socket.readyState == WebSocket.OPEN) {
      gpio.socket.send(str);
      resolve(true);
      return;
    }

    resolve(false);
  });
}

const inputsHandler = (event) => {
  const data = event.data.split(":")
  const key  = data.shift();

  RTPCalc.addentropy(event.data);

  switch (key) {
    case "U":
      const value = getmapkeyname(parseInt(data[0]));
      if (value != null && value != undefined && value.length > 1) {
        dispatch(...value.split(":"));
      }
      break;
    case "C":
      file.audit('COIN', 'A', data[0]);
      dispatch('addcoins', parseInt(data[0]));
      break;
    case "H":
      file.audit('HOPPER', data[0]);
      dispatch('hopper', {status: parseInt(data[0])});
      break;
    case "E":
      file.audit('ERROR', data[0], data[1]);
      dispatch('error', {code: parseInt(data[0]), data: parseInt(data[1])});
      break;
  }
}

export const startGPIOInterface = (host, callback) => {
  gpio.socket = new WebSocket(host);

  gpio.socket.onclose = (e) => {
    log("> remote gpio connecting error", e);
    callback(false);
  };

  gpio.socket.onopen = (event) => {
    log("> remote gpio connected", host);

    gpio.socket.onclose = null;
    callback(true)
  };
};

export const mapGPIOtoInputs = () => {
  log(">> mapGPIOtoInputs");

  gpio.mapping = app.config.mapping;
  gpio.socket.onmessage = inputsHandler;
  gpio.socket.onclose = (e) => dispatch('error', {code: 1001});
}

export const rawGPIOListener = (callback) => {
  log(">> rawGPIOListener");

  gpio.socket.onmessage = (e) => callback(e.data);
  gpio.socket.onclose = (e) => callback('error');
}

export const removeGPIOListeners = () => {
  log(">> removeGPIOListeners");

  gpio.socket.onmessage = null;
  gpio.socket.onclose = null;
}


export const setGPIOInterface = () => {
  log(">> setGPIOInterface");

  gpio.send = {

    raw: (str) => {
      return sendDataToGPIO(str);
    },

    setCoinerState: (active) => {
      return sendDataToGPIO('C:' + ((active == true) ? 1 : 0));
    },

    hopperReleaseCoins: (coins) => {
      return sendDataToGPIO('H:' + coins);
    },

    disableAll: () => {
      return sendDataToGPIO('C:0')
        .then(() => gpio.send.lightsOff())
    },

    lightsOff: () => {
      runsequencial(100,
        () => gpio.send.ledstripOff(),
        () => gpio.send.keyledOff()
      );
    },

    ledstripOff: () => {
      sendDataToGPIO('L:0,0,0,0$1');
    },

    keyledOff: () => {
      sendDataToGPIO('B:0000000000000000,0$1');
    },

    ledstripAnimation: (sequences, times=0) => {
      if (debugLevel > 0) return;
      const seqstr = sequences.map((seq) => seq.join(',')).join('#');
      return sendDataToGPIO('L:'+seqstr+'$'+times);
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

      const str = 'B:'+seqstr+'$'+times;
      if (str == gpio.send.keyledAnimationLock) return;
      gpio.send.keyledAnimationLock = str;

      // console.log('>> keyledAnimation');
      return sendDataToGPIO(str);
    },

    foo: null
  };
};
