import config, { game } from '../config.js'

import storage from './storage.js'
import Terminal from './terminal.js'

import { log, next, pause, file } from './utils.js'

import { startGPIOInterface, mapGPIOtoInputs, rawGPIOListener, mapsetup, removeGPIOListeners, sendDataToGPIO } from './cfgpio.js'

import * as PIXI from 'pixi.js'
import QRious from 'qrious';

let terminal = new Terminal();

class Bootloader {

  boot() {
    terminal.append('-> Iniciando...');

    startGPIOInterface(this.cfgpio_url, (success) => {
      if (!success) {
        terminal.clear();
        terminal.append('ERROR: 2041');
        return; // cant connenct to gpio..
      }

      gpio.send.disableAll();

      file.r('/uuid', (data) => {
        if (data == null) {
          terminal.clear();
          terminal.append('ERROR: 2053 (uuid)');
          return; // uuid not generated..?? cfcomm??
        }

        this.uuid = data;
        this.qrcode = new PIXI.Sprite(generateQRCode('https://admin.crazyfruits.app/m/i/' + data));

        file.readjson('/cfconfig.json', (object) => {
          if (object == null) {

            // check if installed..
            // if not, set keys mapping first!
            this.settings_keymap();
            return;
          }

          log("***** global.app.config", object);
          this.mapping = object.mapping
          global.app.config = object;

          this.check_clean_start();
        });
      });
    });
  }

  check_clean_start() {
    file.getberror((error) => {
      if (error == null) {
        // no error.. normal start
        this.autostart_init();
        return;
      }

      this.error = error;

      terminal.clear();
      terminal.append('-> ERROR: ' + error.code);
      terminal.newline();

      this.getcredits((num) => {
        terminal.append('-> CREDITOS: ' + num);
        terminal.newline(2);

        terminal.append('-> Técnico requerido para desbloquear..');
        terminal.newline(2);

        terminal.append('8- Ingresar');
      });

      this.keymapListener((key) => {
        switch (key) {

          case 'numpad:7': // reset errors
            this.settings_auth()
            break;
        }
      });
    });
  }

  autostart_init() {
    // set screen position..
    terminal.container.x = app.config.screen.x;
    terminal.container.y = app.config.screen.y;
    terminal.container.scale.set(app.config.screen.scale, app.config.screen.scale);

    this.resetscreen();

    const autostart_update_screen = () => {
      terminal.clear();
      terminal.append('-> Iniciando... ' + this.autostart_interval_timer);
    }

    const autostart_game = () => {
      if (this.autostart_interval == null) return;
      this.autostart_interval_timer--;

      autostart_update_screen();

      if (this.autostart_interval_timer <= 0) {
        clearInterval(this.autostart_interval);
        this.autostart_interval = null;
        this.start_game();
      }
    };

    this.autostart_interval_timer = config.autostart_timeout;
    this.autostart_interval = setInterval(autostart_game.bind(this), 1000);
    this.autostart_interrupts = 0;

    autostart_update_screen();

    this.keymapListener((key) => {
      if (this.autostart_interval == null) return;
      if (key != 'option') return;

      this.autostart_interrupts++;
      autostart_update_screen();

      if (this.autostart_interrupts >= config.autostart_interrupts) {
        clearInterval(this.autostart_interval);
        this.autostart_interval = null;

        this.settings_auth();
      }
    });
  }

  settings_auth() {
    this.resetscreen();
    const settings_auth_pin = [];

    const settings_auth_update_screen = () => {
      terminal.clear();

      terminal.append("-> Ingresar PIN de acceso:");
      terminal.newline()

      const pin = [];
      for(let i=0; i<10; i++) {
        pin.push(settings_auth_pin.length > i ? "*" : '-');
      }

      terminal.append('   [ ' + pin.join(' ') + ' ]');
    };

    const checkpass = () => {
      const inp = settings_auth_pin.join('');
      if (inp == config.settings_pin) {
        file.audit('ADM', 'AUTH', '0');
        return true;
      }

      if (config.loaded != undefined) {
        if (config.loaded.auth != undefined && config.loaded.auth.length > 0) {
          for (let i=0; i<config.loaded.auth.length; i++) {
            const p = config.loaded.auth[i];
            if (p[1] == inp) {
              file.audit('ADM', 'AUTH', p[0]);
              return true;
            }
          }
        }
      }

      return false;
    };

    this.keymapListener((key) => {
      const k = key.split(':');
      if (k[0] != 'numpad') return;
      const num = parseInt(k[1]);
      if (isNaN(num)) return;

      settings_auth_pin.push((num + 1));
      settings_auth_update_screen();

      if (checkpass() == true) {
        removeGPIOListeners();

        return next(500, () => {
          terminal.newline();
          terminal.append("-> Acceso autorizado..");
          next(500, this.settings_main.bind(this));
        });
      }

      if (settings_auth_pin.length >= 10) {
        removeGPIOListeners();
        terminal.newline();

        file.audit('ADM', 'AUTH', 'ERR');
        terminal.append("-> Acceso denegado.");

        if (this.error == undefined) { // only if no error...
          next(1000, this.start_game.bind(this));
        }
      }
    });

    settings_auth_update_screen();
  }

  // settings main menu
  settings_main() {
    this.resetscreen();

    terminal.append('-> Configuracion de sistema');
    terminal.newline(2);


    if (this.error == undefined) {

      terminal.append('1- Configurar botonera');
      terminal.append('2- Configurar pantalla');
      terminal.append('3- Configurar red');

      terminal.newline();

      terminal.append('5- Retirar monedas');

      terminal.newline();

      terminal.append('6- Actualizar datos');
      terminal.append('7- Guardar configuraciones');
      terminal.append('8- Iniciar juego');

      terminal.newline(5);

      terminal.append('>> UUID: ' + this.uuid);

      this.getcredits((num) => {
        terminal.append('>> Creditos de sesion: ' + num);
      });

      file.getnumber('/cfgpio_counter_in.data', (num) => {
        terminal.append('>> Contador IN: ' + num);
      });

      file.getnumber('/cfgpio_counter_out.data', (num) => {
        terminal.append('>> Contador OUT: ' + num);
      });

      file.r('/cfcomm.mode', (str) => {
        terminal.append('>> Modo de red: ' + str);
      });

      this.getlastconn((mins) => {
        if (mins == null) {
          terminal.append('>> Ultima conexion: N/d');
          return;
        }

        terminal.append('>> Ultima conexion (min): ' + mins);
      });

      if (terminal.qrcodeadded != true) {
        terminal.qrcodeadded = true;

        this.qrcode.x = 40;
        this.qrcode.y = config.height - 240;
        terminal.container.addChild(this.qrcode);
      }

      this.qrcode.visible = true;

      this.keymapListener((key) => {
        this.qrcode.visible = false;

        switch (key) {

          case 'numpad:0': // set keys mapping
            this.resetscreen();
            this.settings_keymap();
            break;

          case 'numpad:1': // change screen size & position
            this.settings_screen();
            break;

          case 'numpad:2': // set networking mode
            this.settings_networking();
            break;


          case 'numpad:4': // retirar monedas
            if (this.error != undefined) return;
            this.settings_cashout();
            break;


          case 'numpad:5': // refresh screen...
            this.settings_main();
            break;

          case 'numpad:6': // save all data and register device to server..
            if (this.error != undefined) return;
            this.settings_save();
            break;

          case 'numpad:7': // start game!
            if (this.error != undefined) return;
            this.start_game();
            break;
        }
      });
    }


    else { // handle errors first!
      terminal.clear();
      terminal.append('-> ERROR: ' + this.error.code);
      terminal.newline();

      this.getcredits((num) => {
        terminal.append('-> CREDITOS: ' + num);
        terminal.newline(2);

        terminal.append('8 - Desbloquear error');
      });

      this.keymapListener((key) => {
        switch (key) {

          case 'numpad:7': // reset errors
            this.reset_error();
            break;
        }
      });
    }

  }

  reset_error() {
    if (this.error == undefined) return;
    this.resetscreen();
    terminal.append('Limpiando errores...');

    let errnum = 0;
    if (this.error != undefined && this.error != 'error') {

      if (this.error.code == 109) { // hopper error..
        errnum = this.error.data;
      }
    }

    this.getcredits((num) => {
      if (num > 0) {
        file.setnumber('/cfcashout.data', 0);
        file.setnumber('/cfsession.data', num);
      }

      // clear all errors..
      file.clearberror();

      this.error = undefined;
      next(4000, () => this.settings_main());
    });
  }

  // keys mapping
  async settings_keymap() {
    this.resetscreen();
    this.mapping = [];

    const updateScreen = async () => {
      terminal.clear();

      terminal.append('-> Configuracion de botonera');
      terminal.append('Presione las teclas de la botonera en la secuencia solicitada.');
      terminal.newline(2);

      mapsetup.forEach((k, i) => {
        terminal.append(((this.mapping.length > i) ? 'OK ----> ' : '> ') + k);
      });

      if (this.mapping.length >= mapsetup.length) {
        removeGPIOListeners();
        await pause(1000);

        terminal.newline(1);
        terminal.append('> Mapeo de teclas finalizado...');

        next(2000, this.settings_main.bind(this));
      }
    };

    terminal.append('Iniciando configuracion teclas, aguarde un momento...');
    await pause(2000);

    rawGPIOListener((data) => {
      if (this.gpioHasError(data)) return;

      const comps = data.split(":");
      if (comps[0] != 'U') return;
      this.mapping.push(parseInt(comps[1]));

      updateScreen();
    });

    updateScreen();
  }

  // screen size & position
  settings_screen() {
    this.resetscreen();

    terminal.append('-> Configuracion de pantalla');
    terminal.newline(2);

    terminal.append('1- (  ←  ) mover izquierda');
    terminal.append('2- (  →  ) mover derecha');
    terminal.newline(1);

    terminal.append('3- (  ↓  ) mover abajo');
    terminal.append('4- (  ↑  ) mover arriba');
    terminal.newline(1);

    terminal.append('5- ( << >> ) agrandar');
    terminal.append('6- ( >> << ) achicar');

    terminal.newline(1);
    terminal.append('8- Volver');

    this.keymapListener((key) => {
      const scalestep = 0.001;
      switch (key) {

        case 'numpad:0': // move left
          terminal.container.x--;
          break;

        case 'numpad:1': // move right
          terminal.container.x++;
          break;


        case 'numpad:2': // move down
          terminal.container.y++;
          break;

        case 'numpad:3': // move up
          terminal.container.y--;
          break;


        case 'numpad:4': // bigger
          const scaleA = terminal.container.scale.x + scalestep;
          terminal.container.scale.set(scaleA, scaleA);
          break;

        case 'numpad:5': // smaller
          const scaleB = terminal.container.scale.x - scalestep;
          terminal.container.scale.set(scaleB, scaleB);
          break;

        case 'numpad:7': // save all data and register device to server..
          this.settings_main();
          break;
      }
    });
  }

  settings_networking() {
    this.resetscreen();

    terminal.append('-> Configuracion de red');
    terminal.newline(2);

    terminal.append('1- Wifi');
    terminal.append('2- GPRS');
    terminal.newline(2);

    terminal.append('8- Volver');
    terminal.newline(5);

    this.keymapListener((key) => {
      switch (key) {

        case 'numpad:0':
          file.w('/cfcomm.mode', 'wifi');
          this.settings_main();
          break;

        case 'numpad:1':
          file.w('/cfcomm.mode', 'gprs');
          this.settings_main();
          break;

        case 'numpad:7':
          this.settings_main();
          break;
      }
    });
  }

  // save and send data to server?
  async settings_save() {
    this.resetscreen();

    terminal.append('-> Guardar configuraciones.');
    terminal.newline(2);

    const {x, y, scale} = terminal.container;

    global.app.config = {
      screen: {x: x, y: y, scale: scale.x},
      mapping: this.mapping
    };

    file.writejson('/cfconfig.json', app.config);
    log("***** saved global.app.config", app.config);

    terminal.append('> Enviando datos, aguarde un momento...');
    await pause(2000);

    file.audit('ADM', 'CNFSET'); // config saved

    storage.set('installed', 'yes');
    terminal.append('>> Datos guardados exitosamente.');
    await pause(2000);

    this.settings_main();
  }


  settings_cashout() {
    this.resetscreen();
    let amount = 0;

    const cashoutAccountable = () => {
      removeGPIOListeners();

      terminal.clear();
      terminal.append('-> Contabilidad actualizada..');
      terminal.newline();

      file.audit('ADMIN', 'CASHOUT', amount);

      // reset session if any..
      file.setnumber('/cfsession.data', 0);
      file.setnumber('/cfcashout.data', 0);

      file.updatenumber('/cfgpio_counter_out.data', amount);

      next(4000, () => this.settings_main());
    };

    const cashoutHopper = () => {
      terminal.clear();
      terminal.append('-> Liberando monedas... aguarde a que termine.');
      terminal.newline();

      rawGPIOListener((data) => {
        if (this.gpioHasError(data)) return;

        if (data == 'H:0') { // success..
          return this.settings_main();
        }

        const comps = data.split(":");
        if (comps[0] == 'E' && comps[1] == '109') {
          const num = parseInt(comps[2]);

          this.error = {code: 109, data: num}
          file.audit('ADMIN', 'CASHOUT', 'ERR', 109, num);

          terminal.clear();
          terminal.append('-> Error... Hopper atascado..');

          next(4000, () => this.settings_main());
        }
      });

      file.audit('ADMIN', 'CASHOUT', amount);

      // reset session if any..
      file.setnumber('/cfsession.data', 0);
      file.setnumber('/cfcashout.data', 0);

      next(1000, () => sendDataToGPIO('H:' + amount));
    };


    const update_screen = () => {
      terminal.clear();
      terminal.append('-> Retirar monedas');
      terminal.newline(2);

      terminal.append('1 - (+) 100');
      terminal.append('2 - (+) 10');
      terminal.append('3 - (+) 1');
      terminal.append('4 - (-) 1');
      terminal.append('5 - (-) 10');
      terminal.append('6 - (-) 100');
      terminal.newline(2);

      terminal.append('[Cancelar] - Volver');
      terminal.newline(2);

      terminal.append('** ATENCION: si confirma, se borraran todos los datos de sesion.');
      terminal.newline(2);

      terminal.append('[Enter]    - Confirmar (Contable)');
      terminal.append('[Pagar]    - Confirmar (Hopper)');

      terminal.newline(3);

      terminal.append("-> Ingresar cantidad de monedas:");
      terminal.newline()

      terminal.append('   [ ' + amount + ' ]');
    };

    update_screen();
    this.keymapListener((key) => {
      switch (key) {

        case 'pay':
          return cashoutHopper();

        case 'play':
          return cashoutAccountable();

        case 'cancel':
          return this.settings_main();


        case 'numpad:0':
          amount+=100;
          break;

        case 'numpad:1':
          amount+=10;
          break;

        case 'numpad:2':
          amount+=1;
          break;


        case 'numpad:3':
          amount-=1;
          if (amount<0)amount=0;
          break;

        case 'numpad:4':
          amount-=10;
          if (amount<0)amount=0;
          break;

        case 'numpad:5':
          amount-=100;
          if (amount<0)amount=0;
          break;
      }

      update_screen();
    });
  }


  start_game() {
    this.resetscreen();

    this.getlastconn((mins) => {
      if (mins == null) {
        terminal.append('>> ERROR: 4004');
        return;
      }

      const days = Math.floor(mins / 60 / 24);
      if (days > 5) { // if no connection in 5 days
        terminal.append('>> ERROR: 4005');
        return;
      }

      terminal.append('Iniciando juego...');

      next(3000, async () => {
        terminal.dispose();
        terminal = null;

        this.resolve().then(mapGPIOtoInputs);
      });
    });
  }

  resetscreen() {
    removeGPIOListeners();
    terminal.clear();
  }

  keymapListener(callback) {
    rawGPIOListener((data) => {
      if (this.gpioHasError(data)) return;

      const comps = data.split(":");
      if (comps[0] != 'U') return;
      const pin = mapsetup[this.mapping.indexOf(parseInt(comps[1]))];

      callback(pin)
    });
  }

  gpioHasError(data) {
    if (data != 'error') return false;

    terminal.clear();
    terminal.append('-> ERROR: 2054');

    this.getcredits((num) => {
      terminal.newline(2)
      terminal.append('>> Creditos de sesion: ' + num);
    });

    return true;
  }

  getlastconn(callback) {
    file.getnumber('/cfcomm.ts', (num) => {
      if (num == 0) {
        return callback(null);
      }

      const diff = (Date.now() / 1000) - num;
      const minutes = Math.floor(diff / 60);

      callback(minutes);
    });
  }

  // for session credits..
  getcredits(callback) {
    file.getnumber('/cfsession.data', (session) => {
      if (session == 0) {
        return callback(0);
      }

      file.getnumber('/cfcashout.data', (cashout) => {
        let err = 0;
        if (this.error != undefined && this.error != 'error') {

          if (this.error.code == 109) { // hopper error..
            err = this.error.data;
          }
        }

        callback(session - cashout + err);
      });
    });
  }

}

const generateQRCode = (value, size = '200') => {
    const code = new QRious({
        background: 'black',
        foreground: 'white',
        size,
        value,
    });

    return PIXI.Texture.from(code.toDataURL());
};

export const bootloader = (cfgpio_url, resolve) => {
  terminal.load('Crazy Fruits Machines - v0.1\n--------------------------------------------\n\n');

  const booter = new Bootloader();
  booter.resolve = resolve;
  booter.cfgpio_url = cfgpio_url;

  booter.boot();
};
