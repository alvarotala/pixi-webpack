/*
 * Easing Functions - inspired from http://gizma.com/easing/
 * only considering the t value for the range [0, 1] => [0, 1]
 */
const Easing = {
  // no easing, no acceleration
  linear: t => t,
  // accelerating from zero velocity
  easeInQuad: t => t*t,
  // decelerating to zero velocity
  easeOutQuad: t => t*(2-t),
  // acceleration until halfway, then deceleration
  easeInOutQuad: t => t<.5 ? 2*t*t : -1+(4-2*t)*t,
  // accelerating from zero velocity
  easeInCubic: t => t*t*t,
  // decelerating to zero velocity
  easeOutCubic: t => (--t)*t*t+1,
  // acceleration until halfway, then deceleration
  easeInOutCubic: t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1,
  // accelerating from zero velocity
  easeInQuart: t => t*t*t*t,
  // decelerating to zero velocity
  easeOutQuart: t => 1-(--t)*t*t*t,
  // acceleration until halfway, then deceleration
  easeInOutQuart: t => t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t,
  // accelerating from zero velocity
  easeInQuint: t => t*t*t*t*t,
  // decelerating to zero velocity
  easeOutQuint: t => 1+(--t)*t*t*t*t,
  // acceleration until halfway, then deceleration
  easeInOutQuint: t => t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t,


  elastic: {
    // elastic bounce effect at the beginning
    easeInElastic: function (t) { return (.04 - .04 / t) * Math.sin(25 * t) + 1 },
    // elastic bounce effect at the end
    easeOutElastic: function (t) { return .04 * t / (--t) * Math.sin(25 * t) },
    // elastic bounce effect at the beginning and end
    easeInOutElastic: function (t) { return (t -= .5) < 0 ? (.02 + .01 / t) * Math.sin(50 * t) : (.02 - .01 / t) * Math.sin(50 * t) + 1 }
  },

  foo:null
}

export default Easing;
