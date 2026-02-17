import type { User, Session } from '@supabase/supabase-js';
interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    initialized: boolean;
    onboardingStep: number;
    setUser: (user: User | null) => void;
    setSession: (session: Session | null) => void;
    setLoading: (loading: boolean) => void;
    signInWithGoogle: () => Promise<void>;
    signInWithPassword: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, data?: Record<string, unknown>) => Promise<boolean>;
    signOut: () => Promise<void>;
    initialize: () => Promise<void>;
    setOnboardingStep: (step: number) => void;
    updateProfile: (updates: Record<string, unknown>) => Promise<void>;
}
export declare const useAuthStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AuthState>>;
export {};
//# sourceMappingURL=auth-store.d.ts.map