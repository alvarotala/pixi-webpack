const geom = {

  angle: (cx, cy, ex, ey) => {
    const theta = Math.atan2(ey - cy, ex - cx);
    // theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
    //if (theta < 0) theta = 360 + theta; // range [0, 360)
    return theta;
  },

  point: (cx, cy, len, ang) => {
    const ex = cx+len*Math.cos(ang);
    const ey = cy+len*Math.sin(ang);

    return({ x:ex, y:ey });
  }

}

export default geom;
