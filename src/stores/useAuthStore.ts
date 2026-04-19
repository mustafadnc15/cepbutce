import { create } from 'zustand';
import * as auth from '../services/auth';
import type { AuthUser, SignInInput, SignUpInput } from '../services/auth';

interface AuthState {
  user: AuthUser | null;
  submitting: boolean;

  hydrate: () => void;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<AuthUser, 'name' | 'email'>>) => Promise<void>;
}

// Auth session already lives in MMKV via services/auth.ts, so this store just
// mirrors it into React state. No Zustand persist middleware — double-writing
// the session would be redundant.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  submitting: false,

  hydrate: () => set({ user: auth.getCurrentUser() }),

  signIn: async (input) => {
    set({ submitting: true });
    try {
      const user = await auth.signIn(input);
      set({ user, submitting: false });
    } catch (e) {
      set({ submitting: false });
      throw e;
    }
  },

  signUp: async (input) => {
    set({ submitting: true });
    try {
      const user = await auth.signUp(input);
      set({ user, submitting: false });
    } catch (e) {
      set({ submitting: false });
      throw e;
    }
  },

  signOut: async () => {
    await auth.signOut();
    set({ user: null });
  },

  updateProfile: async (patch) => {
    const updated = await auth.updateProfile(patch);
    if (updated) set({ user: updated });
  },
}));
