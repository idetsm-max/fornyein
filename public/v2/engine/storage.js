// Projects are saved in IndexedDB (this browser only). A new session starts with an empty project; "My Projects" opens the saved ones.
import { isEmpty } from './model.js';
const DB = 'fornyein2', ST = 'projects';
let dbp;
const db = () => (dbp ||= new Promise((res, rej) => {
  const r = indexedDB.open(DB, 1);
  r.onupgradeneeded = () => r.result.createObjectStore(ST, { keyPath: 'id' });
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
}));
const run = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction(ST, mode), q = fn(t.objectStore(ST)); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }); };
export const saveProject = (p) => run('readwrite', (s) => s.put({ id: p.id, name: p.name, updated: Date.now(), data: p }));
export const loadProject = async (id) => { const r = await run('readonly', (s) => s.get(id)); return r ? r.data : null; };
export const deleteProject = (id) => run('readwrite', (s) => s.delete(id));
export const listProjects = async () => (await run('readonly', (s) => s.getAll())).map(({ id, name, updated }) => ({ id, name, updated })).sort((a, b) => b.updated - a.updated);

// status: 'idle' | 'dirty' | 'saving' | 'saved' | 'error'
export function attachAutosave(store, onStatus) {
  let timer = null, last = store.get().project;
  store.subscribe(() => {
    const p = store.get().project; if (p === last) return; last = p;
    onStatus('dirty'); clearTimeout(timer);
    timer = setTimeout(async () => {
      if (isEmpty(p) && p.name === 'Untitled Project') { onStatus('idle'); return; }
      onStatus('saving');
      try { await saveProject(p); onStatus('saved', Date.now()); } catch { onStatus('error'); }
    }, 700);
  });
}
