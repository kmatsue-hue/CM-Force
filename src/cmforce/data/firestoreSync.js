import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebase.js';

export const PROJECTS_COLLECTION = 'projects';
export const STAFF_COLLECTION = 'staff';

// 指定コレクションの全ドキュメントをリアルタイム購読。アンマウント時の解除関数を返す。
export const subscribeToCollection = (name, callback) => {
  const unsub = onSnapshot(
    collection(db, name),
    (snap) => {
      const items = snap.docs.map((d) => ({ ...d.data() }));
      callback(items);
    },
    (err) => {
      // Firestore 未有効化等。本番ではログだけ残してアプリは継続動作。
      // eslint-disable-next-line no-console
      console.warn(`[firestore] subscribe ${name} failed:`, err.code || err.message);
    }
  );
  return unsub;
};

// id をドキュメントID として保存（既存なら全置換）。
export const saveDocument = async (collectionName, id, data) => {
  try {
    await setDoc(doc(db, collectionName, id), data);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[firestore] save ${collectionName}/${id} failed:`, err.code || err.message);
  }
};

// id 指定で削除。
export const deleteDocument = async (collectionName, id) => {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[firestore] delete ${collectionName}/${id} failed:`, err.code || err.message);
  }
};

// 初回シード: コレクションが空なら指定アイテム配列をバッチ書き込み。
// 書き込んだら true、既存データがあるか失敗したら false。
export const seedIfEmpty = async (collectionName, items, idKey = 'id') => {
  try {
    const snap = await getDocs(collection(db, collectionName));
    if (!snap.empty) return false;
    if (!Array.isArray(items) || items.length === 0) return false;
    const batch = writeBatch(db);
    items.forEach((item) => {
      const id = String(item?.[idKey] ?? '').trim();
      if (!id) return;
      batch.set(doc(db, collectionName, id), item);
    });
    await batch.commit();
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[firestore] seed ${collectionName} failed:`, err.code || err.message);
    return false;
  }
};
