// Collegamento a Firebase (dati sincronizzati) e alle funzioni del telefono (notifiche e sveglia).
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut, setPersistence, browserLocalPersistence, indexedDBLocalPersistence, initializeAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager, collection, doc, query, where, limit,
  onSnapshot, setDoc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const native = Capacitor.isNativePlatform();
const cfg = window.FIREBASE_CONFIG;
const configured = !!(cfg && cfg.apiKey && !String(cfg.apiKey).includes("INSERISCI"));
let app, auth, db;
if (configured) {
  app = initializeApp(cfg);
  auth = native ? initializeAuth(app, { persistence: indexedDBLocalPersistence }) : getAuth(app);
  if (!native) setPersistence(auth, browserLocalPersistence).catch(() => {});
  try { db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }) }); }
  catch (e) { db = initializeFirestore(app, {}); }
}

const mapErr = e => {
  const c = (e && e.code) || "";
  if (c.includes("unavailable")) return { code: "unavailable" };
  if (c.includes("resource-exhausted")) return { code: "quota_exceeded" };
  return { code: "invalid_argument", message: c };
};

function base(uid) {
  const path = name => ["users", uid, name];
  const wrapQuery = (name, cons) => ({
    where: (f, op, v) => wrapQuery(name, cons.concat([where(f, op, v)])),
    limit: n => wrapQuery(name, cons.concat([limit(n)])),
    onSnapshot: (next, err) => onSnapshot(query(collection(db, ...path(name)), ...cons),
      s => next({ docs: s.docs.map(d => ({ id: d.id, exists: true, data: () => d.data() })) }),
      e => err && err(mapErr(e)))
  });
  const docRef = (name, id) => {
    const r = id ? doc(db, ...path(name), id) : doc(collection(db, ...path(name)));
    const w = p => p.catch(e => { throw mapErr(e); });
    return { id: r.id, set: d => w(setDoc(r, d)), update: d => w(updateDoc(r, d)), delete: () => w(deleteDoc(r)) };
  };
  return {
    collection: name => Object.assign(wrapQuery(name, []), {
      doc: id => docRef(name, id),
      add: async d => { const r = docRef(name); await r.set(d); return r; }
    })
  };
}

const AlarmClock = registerPlugin("AlarmClock");
let scheduled = [];
async function initNotifs() {
  if (!native) return;
  try {
    await LocalNotifications.requestPermissions();
    await LocalNotifications.createChannel({ id: "sveglie", name: "Sveglie attività", description: "Promemoria delle attività con orario",
      importance: 5, visibility: 1, vibration: true, lights: true });
  } catch (e) {}
}
async function scheduleNotifs(list) {
  if (!native) return;
  try {
    const pend = await LocalNotifications.getPending();
    if (pend.notifications.length) await LocalNotifications.cancel({ notifications: pend.notifications.map(n => ({ id: n.id })) });
    const now = Date.now();
    const items = list.filter(n => n.at.getTime() > now + 5000).slice(0, 60);
    if (items.length) await LocalNotifications.schedule({ notifications: items.map(n => ({
      id: n.id, title: n.title, body: n.body, channelId: "sveglie", smallIcon: "ic_stat_alarm",
      schedule: { at: n.at, allowWhileIdle: true }, extra: { date: n.date } })) });
    scheduled = items;
  } catch (e) { console.warn("notifiche", e); }
}

window.AG = {
  native, configured,
  onAuth: cb => configured ? onAuthStateChanged(auth, cb) : cb(null),
  login: (e, p) => signInWithEmailAndPassword(auth, e, p),
  register: (e, p) => createUserWithEmailAndPassword(auth, e, p),
  reset: e => sendPasswordResetEmail(auth, e),
  logout: () => signOut(auth),
  base, initNotifs, scheduleNotifs,
  setClockAlarm: opts => native ? AlarmClock.set(opts) : Promise.reject({ code: "web" }),
  onNotifTap: cb => { if (native) LocalNotifications.addListener("localNotificationActionPerformed", a => cb(a.notification && a.notification.extra)); }
};
