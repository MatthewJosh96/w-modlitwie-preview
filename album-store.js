/* Local demonstration storage. It is not an account, purchase record or server entitlement. */
(() => {
  'use strict';
  const profiles = new Set(['maria', 'jan', 'helena', 'stanislaw', 'zofia', 'tadeusz']);
  const databaseName = 'wmodlitwie-memorial-demo-v1';
  const entitlementPrefix = 'wmodlitwie_demo_album_upgraded_';
  const maxFileBytes = 15 * 1024 * 1024;
  let databasePromise;

  function validProfile(id) {
    if (!profiles.has(id)) throw new Error('Nieznany profil przykładowy.');
    return id;
  }
  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Nie udało się odczytać zdjęć.'));
    });
  }
  function database() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('Ta przeglądarka nie obsługuje lokalnego przechowywania zdjęć.'));
    if (!databasePromise) databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore('photos', {keyPath: 'id'});
        store.createIndex('profileId', 'profileId', {unique: false});
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Nie można otworzyć lokalnego albumu.'));
      request.onblocked = () => reject(new Error('Zamknij inne karty z albumem i spróbuj ponownie.'));
    }).catch(error => { databasePromise = null; throw error; });
    return databasePromise;
  }
  async function list(id) {
    validProfile(id);
    const db = await database();
    const rows = await requestResult(db.transaction('photos', 'readonly').objectStore('photos').index('profileId').getAll(id));
    return rows.sort((a, b) => a.position - b.position || a.createdAt - b.createdAt).map(row => ({
      ...row,
      blob: row.bytes ? new Blob([row.bytes], {type: row.mime || 'image/png'}) : row.blob
    }));
  }
  function isUpgraded(id) {
    validProfile(id);
    try { return localStorage.getItem(entitlementPrefix + id) === 'yes'; }
    catch { return false; }
  }
  function setUpgraded(id) {
    validProfile(id);
    try { localStorage.setItem(entitlementPrefix + id, 'yes'); }
    catch { throw new Error('Nie udało się zapisać stanu demonstracji w tej przeglądarce.'); }
  }
  async function load(id) { return {photos: await list(id), upgraded: isUpgraded(id)}; }
  async function add(id, file) {
    validProfile(id);
    if (!(file instanceof File) || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Wybierz zdjęcie JPG, PNG lub WebP.');
    if (file.size > maxFileBytes) throw new Error('Zdjęcie jest za duże. Limit jednego pliku to 15 MB.');
    if (file.size === 0) throw new Error('Plik jest pusty. Wybierz inne zdjęcie.');
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
      if (bitmap.width * bitmap.height > 40_000_000) throw new Error('Zdjęcie ma zbyt wysoką rozdzielczość. Limit to 40 megapikseli.');
    } catch (error) {
      bitmap?.close();
      if (error.message.includes('40 megapikseli')) throw error;
      throw new Error('Nie udało się otworzyć zdjęcia. Wybierz prawidłowy plik obrazu.');
    }
    const maxSide = 2000;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Nie można przetworzyć zdjęcia w tej przeglądarce.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    try { context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); }
    finally { bitmap.close(); }
    const compressed = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .82));
    if (!compressed) throw new Error('Nie udało się przygotować zdjęcia. Spróbuj ponownie.');
    // WebKit rejects canvas-created Blob objects in IndexedDB. ArrayBuffer survives
    // structured cloning and is turned back into a Blob by list()/load().
    const bytes = await compressed.arrayBuffer();
    const row = {id: crypto.randomUUID(), profileId: id, bytes, mime: compressed.type, caption: '', position: 0, createdAt: Date.now()};
    const db = await database();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction('photos', 'readwrite');
        const storage = tx.objectStore('photos');
        const count = storage.index('profileId').count(id);
        let limitError;
        count.onsuccess = () => {
          const limit = isUpgraded(id) ? 50 : 10;
          if (count.result >= limit) {
            limitError = new Error(`Limit albumu to ${limit} zdjęć. Usuń zdjęcie, aby dodać nowe.`);
            tx.abort();
            return;
          }
          row.position = count.result;
          storage.add(row);
        };
        tx.oncomplete = resolve;
        tx.onerror = () => reject(limitError || tx.error || new Error('Nie udało się zapisać zdjęcia.'));
        tx.onabort = () => reject(limitError || tx.error || new Error('Nie udało się zapisać zdjęcia.'));
      });
    }
    catch (error) {
      if (error.message.includes('Limit albumu')) throw error;
      if (error?.name === 'QuotaExceededError') throw new Error('Brakuje miejsca na tym urządzeniu. Usuń niepotrzebne zdjęcia lub zwolnij pamięć.');
      throw new Error('Nie udało się zapisać zdjęcia na tym urządzeniu. Spróbuj ponownie.');
    }
    return {...row, blob: new Blob([bytes], {type: row.mime})};
  }
  async function mutate(id, callback) {
    validProfile(id);
    const db = await database();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readwrite');
      const storage = tx.objectStore('photos');
      const request = storage.index('profileId').getAll(id);
      let photos = [];
      let operationError;
      request.onsuccess = () => {
        photos = request.result.sort((a, b) => a.position - b.position || a.createdAt - b.createdAt);
        try {
          for (const row of callback(photos) || []) storage.put(row);
        } catch (error) {
          operationError = error;
          tx.abort();
        }
      };
      tx.oncomplete = () => resolve(photos);
      tx.onerror = () => reject(operationError || tx.error || new Error('Nie udało się zapisać zmian.'));
      tx.onabort = () => reject(operationError || tx.error || new Error('Nie udało się zapisać zmian.'));
    });
  }
  async function updateCaption(id, photoId, caption) {
    validProfile(id);
    return mutate(id, photos => {
      const photo = photos.find(item => item.id === photoId);
      if (!photo) throw new Error('Nie znaleziono zdjęcia.');
      photo.caption = String(caption).trim().slice(0, 180);
      return [photo];
    });
  }
  async function move(id, photoId, direction) {
    validProfile(id);
    return mutate(id, photos => {
      const index = photos.findIndex(item => item.id === photoId);
      const next = index + (direction === -1 ? -1 : 1);
      if (index < 0 || next < 0 || next >= photos.length) return [];
      [photos[index], photos[next]] = [photos[next], photos[index]];
      photos.forEach((photo, position) => { photo.position = position; });
      return photos;
    });
  }
  async function remove(id, photoId) {
    validProfile(id);
    const db = await database();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readwrite');
      const storage = tx.objectStore('photos');
      const request = storage.index('profileId').getAll(id);
      let operationError;
      request.onsuccess = () => {
        const photos = request.result.sort((a, b) => a.position - b.position || a.createdAt - b.createdAt);
        const index = photos.findIndex(photo => photo.id === photoId);
        if (index < 0) {
          operationError = new Error('Nie znaleziono zdjęcia w tym albumie.');
          tx.abort();
          return;
        }
        storage.delete(photoId);
        photos.splice(index, 1);
        photos.forEach((photo, position) => {
          if (photo.position !== position) storage.put({...photo, position});
        });
      };
      tx.oncomplete = resolve;
      tx.onerror = () => reject(operationError || tx.error || new Error('Nie udało się usunąć zdjęcia.'));
      tx.onabort = () => reject(operationError || tx.error || new Error('Nie udało się usunąć zdjęcia.'));
    });
  }
  window.MemorialAlbumStore = Object.freeze({load, list, add, remove, move, updateCaption, isUpgraded, setUpgraded});
})();
