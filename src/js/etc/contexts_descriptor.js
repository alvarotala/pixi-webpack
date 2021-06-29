import { setContextsDescriptor, setContext } from '../core/contexts.js'

import { ContextError } from './contexts/error.js'

import { ContextIdle } from './contexts/idle.js'
import { ContextPlaying } from './contexts/playing.js'
import { ContextBonus } from './contexts/bonus.js'
import { ContextMenu } from './contexts/menu.js'



// TODO: Jackpot
// import { ContextJackpot } from './contexts/jackpot.js'


setContextsDescriptor({

  error: ContextError,

  idle: ContextIdle,
  playing: ContextPlaying,
  bonus: ContextBonus,

  menu: ContextMenu,

  // TODO: Jackpot
  // jackpot: ContextJackpot,

  settings: {
    coineractive: false,
  }
});
