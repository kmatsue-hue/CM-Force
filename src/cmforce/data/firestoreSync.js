import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebase.js';

export const PROJECTS_COLLECTION = 'projects';
export const STAFF_COLLECTION = 'staff';
export const PROJECT_COUNTERS_COLLECTION = 'projectCounters';
export const PROJECT_SNAPSHOTS_COLLECTION = 'projectSnapshots';

const formatProjectId = (year, sequence) =>
  `PRJ-${year}-${String(sequence).padStart(3, '0')}`;

const getMaxProjectSequence = (projects = [], year = new Date().getFullYear()) =>
  projects.reduce((max, project) => {
    const match = String(project?.id || '').match(/^PRJ-(\d{4})-(\d+)$/);
    if (!match) return max;
    const [, projectYear, sequence] = match;
    if (Number(projectYear) !== year) return max;
    return Math.max(max, Number(sequence) || 0);
  }, 0);

const createProjectSnapshotId = (projectId) =>
  `${projectId}__${Date.now()}__${Math.random().toString(36).slice(2, 8)}`;

const buildProjectSnapshot = (projectId, eventType, previousData, nextData = null) => {
  const snapshotId = createProjectSnapshotId(projectId);
  return {
    id: snapshotId,
    projectId,
    eventType,
    capturedAt: new Date().toISOString(),
    projectName: previousData?.name || nextData?.name || '',
    status: previousData?.status || nextData?.status || '',
    previousData,
    nextData: nextData ? {
      id: nextData.id || projectId,
      name: nextData.name || '',
      status: nextData.status || '',
      updatedAt: nextData.updatedAt || '',
    } : null,
  };
};

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
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[firestore] save ${collectionName}/${id} failed:`, err.code || err.message);
    return false;
  }
};

// id 指定で削除。
export const deleteDocument = async (collectionName, id) => {
  try {
    await deleteDoc(doc(db, collectionName, id));
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[firestore] delete ${collectionName}/${id} failed:`, err.code || err.message);
    return false;
  }
};

export const createProjectDocument = async (data, existingProjects = []) => {
  const year = new Date().getFullYear();
  const localMaxSequence = getMaxProjectSequence(existingProjects, year);

  try {
    return await runTransaction(db, async (transaction) => {
      const counterRef = doc(db, PROJECT_COUNTERS_COLLECTION, String(year));
      const counterSnap = await transaction.get(counterRef);
      let sequence = Math.max(Number(counterSnap.data()?.latestSequence) || 0, localMaxSequence);

      let projectId = '';
      let projectRef = null;

      while (!projectRef) {
        sequence += 1;
        const candidateId = formatProjectId(year, sequence);
        const candidateRef = doc(db, PROJECTS_COLLECTION, candidateId);
        const candidateSnap = await transaction.get(candidateRef);
        if (!candidateSnap.exists()) {
          projectId = candidateId;
          projectRef = candidateRef;
        }
      }

      const newProject = { ...data, id: projectId, revision: 1 };
      transaction.set(counterRef, {
        year,
        latestSequence: sequence,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      transaction.set(projectRef, newProject);
      return newProject;
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[firestore] create project failed:', err.code || err.message);
    return null;
  }
};

export const saveProjectDocument = async (id, data) => {
  try {
    return await runTransaction(db, async (transaction) => {
      const projectRef = doc(db, PROJECTS_COLLECTION, id);
      const currentSnap = await transaction.get(projectRef);
      const currentData = currentSnap.exists() ? currentSnap.data() : null;
      const currentRevision = Number(currentData?.revision) || 0;
      const expectedRevision = Number(data?.revision) || 0;

      if (currentData && expectedRevision !== currentRevision) {
        throw new Error('revision-conflict');
      }

      const nextProject = {
        ...data,
        revision: currentRevision + 1,
      };

      if (currentData) {
        const snapshot = buildProjectSnapshot(id, 'update', currentData, nextProject);
        const snapshotRef = doc(db, PROJECT_SNAPSHOTS_COLLECTION, snapshot.id);
        transaction.set(snapshotRef, snapshot);
      }

      transaction.set(projectRef, nextProject);
      return nextProject;
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[firestore] save project ${id} failed:`, err.code || err.message);
    return null;
  }
};

export const deleteProjectDocument = async (id) => {
  try {
    return await runTransaction(db, async (transaction) => {
      const projectRef = doc(db, PROJECTS_COLLECTION, id);
      const currentSnap = await transaction.get(projectRef);
      if (!currentSnap.exists()) return false;

      const snapshot = buildProjectSnapshot(id, 'delete', currentSnap.data());
      const snapshotRef = doc(db, PROJECT_SNAPSHOTS_COLLECTION, snapshot.id);
      transaction.set(snapshotRef, snapshot);
      transaction.delete(projectRef);
      return true;
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[firestore] delete project ${id} failed:`, err.code || err.message);
    return false;
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
