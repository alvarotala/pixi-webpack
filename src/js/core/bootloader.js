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

      if (storage.get('installed') != 'yes') {
          this.settings_keymap();
          return;
      }
      
      file.getconfig((object) => {
        if (object == null) {
          // Block machine.. cant read config file..
          terminal.clear();
          terminal.append('ERROR: 3045');
          return;
        }

        log("***** global.app.config", object);
        this.mapping = object.mapping
        global.app.config = object;

        this.autostart_init();
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
      for(let i=0; i<config.settings_pin.length; i++) {
        pin.push(settings_auth_pin.length > i ? "*" : '-');
      }

      terminal.append('   [ ' + pin.join(' ') + ' ]');
    };

    this.keymapListener((key) => {
      const k = key.split(':');
      if (k[0] != 'numpad') return;
      const num = parseInt(k[1]);
      if (num == NaN) return;

      settings_auth_pin.push((num + 1));
      settings_auth_update_screen();

      if (settings_auth_pin.length >= config.settings_pin.length) {
        removeGPIOListeners();

        next(500, () => {
          terminal.newline();
          if (settings_auth_pin.join('') == config.settings_pin) {
            terminal.append("-> Acceso autorizado..");

            file.audit('ADM', 'AUT', 'SCC');
            next(500, this.settings_main.bind(this));
            return;
          }

          file.audit('ADM', 'AUT', 'ERR');
          terminal.append("-> Acceso denegado.");
          next(1000, this.start_game.bind(this));
        });
      }
    });

    settings_auth_update_screen();
  }

  // settings main menu
  settings_main() {
    this.resetscreen();

    terminal.append('-> Configuracion de sistema');
    terminal.newline(2);

    terminal.append('1- Cargar');
    terminal.append('2- Retirar');

    terminal.newline();

    terminal.append('3- Desbloquear');

    terminal.newline();

    terminal.append('4- Configurar botonera');
    terminal.append('5- Configurar pantalla');

    terminal.newline();

    terminal.append('7- Guardar configuraciones');
    terminal.append('8- Iniciar juego');

    this.keymapListener((key) => {
      switch (key) {

        case 'numpad:0': // set keys mapping
          this.resetscreen();
          this.settings_keymap();
          break;

        case 'numpad:1': // channge screen size & position
          this.settings_screen();
          break;

        case 'numpad:2': // set keys mapping
          this.resetscreen();
          this.settings_keymap();
          break;

        case 'numpad:3': // channge screen size & position
          this.settings_screen();
          break;

        case 'numpad:6': // save all data and register device to server..
          this.settings_save();
          break;

        case 'numpad:7': // save all data and register device to server..
          this.start_game();
          break;
      }
    });
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

    terminal.append('1- (  ↑  ) mover arriba');
    terminal.append('2- (  ↓  ) mover abajo');
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


        case 'numpad:2': // move up
          terminal.container.y--;
          break;

        case 'numpad:3': // move down
          terminal.container.y++;
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
