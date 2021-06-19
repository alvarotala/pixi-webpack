import { setContextsDescriptor, setContext } from '../core/contexts.js'

import { ContextIdle } from './contexts/idle.js'
import { ContextPlaying } from './contexts/playing.js'
import { ContextBonus } from './contexts/bonus.js'

// TODO: Jackpot
// import { ContextJackpot } from './contexts/jackpot.js'


setContextsDescriptor({

  idle: ContextIdle,
  playing: ContextPlaying,
  bonus: ContextBonus,

  // TODO: Jackpot
  // jackpot: ContextJackpot,


  error: {
    coineractive: false,
  },

  settings: {
    coineractive: false,

  }

});
