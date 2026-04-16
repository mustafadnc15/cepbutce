import { createMMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

const storage = createMMKV({ id: 'cepbutce-settings' });

export const mmkvStorage: StateStorage = {
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => {
    storage.remove(name);
  },
};

export { storage };
