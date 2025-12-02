export function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('RequestCacheDB', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = () => {
            request.result.createObjectStore('cache', { keyPath: 'key' });
        };
    });
}

export function getFromDB(db, key) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('cache', 'readonly');
        const store = tx.objectStore('cache');
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export function putInDB(db, key, value) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('cache', 'readwrite');
        const store = tx.objectStore('cache');
        const req = store.put({ key, ...value });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

export function deleteFromDB(db, key) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('cache', 'readwrite');
        const store = tx.objectStore('cache');
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

export async function cleanExpiredCache(cacheTime = 5) {
    const db = await openDB();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    const now = Date.now();

    const req = store.openCursor();
    req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
            const { key, timestamp } = cursor.value;
            if (now - timestamp >= cacheTime * 1000) {
                cursor.delete(); // delete expired entry
            }
            cursor.continue();
        }
    };
    req.onerror = () => {
        console.error('Error while cleaning expired cache:', req.error);
    };
}
