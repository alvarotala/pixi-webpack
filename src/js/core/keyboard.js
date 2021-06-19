import { dispatch } from './inputs.js'

const keyboardHandler = (e) => {
  // e.preventDefault();

  if (e.key == 'Enter') {
    dispatch('play');
  }


  if (e.key == 'q') {
    dispatch('pay');
  }

  if (e.key == 'w') {
    dispatch('left');
  }

  if (e.key == 'e') {
    dispatch('right');
  }

  if (e.key == 'r') {
    dispatch('option');
  }

  if (e.key == 't') {
    dispatch('cancel');
  }


  if (e.key == 'z') {
    dispatch('addcoins', 1);
  }

  if (e.key == 'x') {
    dispatch('addcoins', 10);
  }

  if (e.key == 'c') {
    dispatch('addcoins', 100);
  }

  // numpad
  const bet = [1,2,3,4,5,6,7,8].indexOf(parseInt(e.key));
  if (bet >= 0) {
    dispatch('numpad', bet);
  }
}

export const inputsWithKeyboard = () => {
  window.addEventListener("keydown", keyboardHandler, false);
};
