import config, { game } from '../config.js'

import storage from './storage.js'
import Terminal from './terminal.js'

import { log, next, pause, file } from './utils.js'

import { startGPIOInterface, mapGPIOtoInputs, rawGPIOListener, mapsetup, removeGPIOListeners } from './cfgpio.js'


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

      file.getconfig((object) => {
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
  }

  check_clean_start() {
    file.getberror((error) => {
      if (error == null) {
        // no error.. normal start
        this.autostart_init();
        return;
      }

      this.error = error;
      const errorn = error.data;

      file.getsession((num) => {
        this.session = num + errorn;

        terminal.clear();
        terminal.append('-> ERROR: ' + error.code);
        terminal.newline();

        terminal.append('-> CREDITOS: ' + this.session);
        terminal.newline(2);

        terminal.newline();
        terminal.append('Técnico requerido para desbloquear..');

        next(4000, () => this.settings_auth());
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

      if (this.error != undefined) {
        terminal.append('-> ERROR: ' + this.error.code);
        terminal.newline();

        terminal.append('-> CREDITOS: ' + this.session);
        terminal.newline(2);
      }

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

    if (this.error != undefined) {
      terminal.append('---> ERROR: ' + this.error.code);
      terminal.newline();

      terminal.append('---> CREDITOS: ' + this.session);
      terminal.newline(2);
    }

    terminal.append('1- Configurar botonera');
    terminal.append('2- Configurar pantalla');

    terminal.newline();

    if (this.error == undefined) {

      terminal.append('3- Cargar');
      terminal.append('4- Retirar');

      terminal.newline();

      terminal.append('7- Guardar configuraciones');
      terminal.append('8- Iniciar juego');
    }


    else { // handle errors first!
      terminal.append('6- Desbloquear error');
      terminal.newline();
    }


    this.keymapListener((key) => {
      switch (key) {

        case 'numpad:0': // set keys mapping
          this.resetscreen();
          this.settings_keymap();
          break;

        case 'numpad:1': // channge screen size & position
          this.settings_screen();
          break;


        case 'numpad:2': // cargar
          if (this.error != undefined) return;
          this.settings_set_amount("in");
          break;

        case 'numpad:3': // retirar
          if (this.error != undefined) return;
          this.settings_set_amount("out");
          break;


        case 'numpad:5': // reset errors
          this.reset_error();
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

  reset_error() {
    if (this.error == undefined) return;
    this.resetscreen();
    terminal.append('Limpiando errores...');

    file.setsession(this.session);
    file.clearberror();

    this.error = undefined;
    next(4000, () => this.settings_main());
  }

  // setup keys mapping
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

  // settings: screen size & position
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

  // save and send data to server
  async settings_save() {
    this.resetscreen();

    terminal.append('-> Guardar configuraciones.');
    terminal.newline(2);

    const {x, y, scale} = terminal.container;

    global.app.config = {
      screen: {x: x, y: y, scale: scale.x},
      mapping: this.mapping
    };

    file.setconfig(app.config);
    log("***** saved global.app.config", app.config);

    terminal.append('> Enviando datos, aguarde un momento...');
    await pause(2000);

    file.audit('ADM', 'CNFSET'); // config saved

    storage.set('installed', 'yes');
    terminal.append('>> Datos guardados exitosamente.');
    await pause(2000);

    this.settings_main();
  }


  settings_set_amount(delta) {
    this.resetscreen();

    const update_screen = () => {
      terminal.clear();

      if (delta == 'in') {
        terminal.append('-> Cargar monedas a hopper.');
      }

      if (delta == 'out') {
        terminal.append('-> Retirar monedas de hopper.');
      }

      terminal.newline(2);

      terminal.append('1 - (+) 1000');
      terminal.append('2 - (+) 100');
      terminal.append('3 - (+) 10');
      terminal.append('4 - (+) 1');
      terminal.append('5 - (-) 1');
      terminal.append('6 - (-) 10');
      terminal.append('7 - (-) 100');
      terminal.append('8 - (-) 1000');
      terminal.newline(2);

      terminal.append('[Cancelar] - Volver');
      terminal.append('[Pagar]    - Confirmar');

      terminal.newline(3);

      terminal.append("-> Ingresar cantidad de monedas:");
      terminal.newline()

      terminal.append('   [ ' + amount + ' ]');
    };


    let amount = 0;
    update_screen();

    this.keymapListener((key) => {
      switch (key) {

        case 'play':
          file.updatecash(delta, amount);
          return this.settings_main();

        case 'cancel':
          return this.settings_main();

        case 'numpad:0':
          amount+=1000;
          break;

        case 'numpad:1':
          amount+=100;
          break;

        case 'numpad:2':
          amount+=10;
          break;

        case 'numpad:3':
          amount+=1;
          break;


        case 'numpad:4':
          amount-=1;
          if (amount<0)amount=0;
          break;

        case 'numpad:5':
          amount-=10;
          if (amount<0)amount=0;
          break;

        case 'numpad:6':
          amount-=100;
          if (amount<0)amount=0;
          break;

        case 'numpad:7':
          amount-=1000;
          if (amount<0)amount=0;
          break;
      }

      update_screen();
    });
  }


  start_game() {
    this.resetscreen();
    terminal.append('Iniciando juego...');

    next(3000, async () => {
      terminal.dispose();
      terminal = null;

      this.resolve().then(mapGPIOtoInputs);
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
    terminal.append('ERROR: 2054');
    return true;
  }

}

export const bootloader = (cfgpio_url, resolve) => {
  terminal.load('Crazy Fruits Machines - v0.1\n--------------------------------------------\n\n');

  const booter = new Bootloader();
  booter.resolve = resolve;
  booter.cfgpio_url = cfgpio_url;

  booter.boot();
};
