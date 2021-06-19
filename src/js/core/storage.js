
const db = window.localStorage;

const storage = {
  get: (k) => db.getItem(k),
  set: (k,v) => db.setItem(k,v),

  getObject: (k) => JSON.parse(storage.get(k)),
  setObject: (k, v) => storage.set(k, JSON.stringify(v)),

  clear: () => db.clear()
}

export default storage;
