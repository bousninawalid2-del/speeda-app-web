'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  AuthUser,
  authApi,
  saveSession,
  clearSession,
  getStoredUser,
  getAccessToken,
} from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────
interface RegisterData {
  name:     string;
  email:    string;
  password: string;
  phone?:   string;
  referralCode?: string;
}

interface AuthContextValue {
  user:            AuthUser | null;
  isLoading:       boolean;
  isAuthenticated: boolean;

  /** Email + password register. Returns userId for verification. */
  register: (data: RegisterData) => Promise<{ userId: string }>;

  /** Email + password login. */
  login: (email: string, password: string) => Promise<void>;

  /** Quick login — sends a magic link to the email. */
  sendMagicLink: (email: string) => Promise<void>;

  /** Verify OTP code. Auto-logs in on success. */
  verifyEmail: (userId: string, code: string) => Promise<void>;

  /** Resend OTP. */
  resendVerification: (userId: string) => Promise<void>;

  /** Request a password reset link. */
  forgotPassword: (email: string) => Promise<void>;

  /** Complete password reset using link token. */
  resetPassword: (token: string, newPassword: string) => Promise<void>;

  /** Change password while logged in. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;

  /**
   * Called by magic-link callback page after exchanging token for JWT pair.
   * The refresh token is already in the httpOnly cookie set by the server.
   */
  loginWithTokens: (data: { accessToken: string; user: AuthUser }) => void;

  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate access token + user from localStorage on first render
  useEffect(() => {
    const stored = getStoredUser();
    const token  = getAccessToken();
    if (stored && token) {
      setUser(stored);
      setAuthCookie(true);
    }
    setIsLoading(false);
  }, []);

  /** Simple presence flag for middleware SSR routing — contains no sensitive data. */
  const setAuthCookie = (set: boolean) => {
    if (set) {
      document.cookie = 'speeda_auth=1; path=/; max-age=604800; SameSite=Lax';
    } else {
      document.cookie = 'speeda_auth=; path=/; max-age=0';
    }
  };

  const loginWithTokens = useCallback(
    (data: { accessToken: string; user: AuthUser }) => {
      saveSession(data);
      setUser(data.user);
      setAuthCookie(true);
    },
    []
  );

  const register = useCallback(async (data: RegisterData) => {
    const res = await authApi.register(data);
    return { userId: res.userId };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    loginWithTokens(data);
  }, [loginWithTokens]);

  const sendMagicLink = useCallback(async (email: string) => {
    await authApi.quickLogin(email);
  }, []);

  const verifyEmail = useCallback(async (userId: string, code: string) => {
    const data = await authApi.verify({ userId, code });
    loginWithTokens(data);
  }, [loginWithTokens]);

  const resendVerification = useCallback(async (userId: string) => {
    await authApi.resendVerify(userId);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await authApi.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    await authApi.resetPassword(token, newPassword);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await authApi.changePassword(currentPassword, newPassword);
  }, []);

  const logout = useCallback(async () => {
    try {
      // Server clears the httpOnly refresh cookie + revokes the DB record
      await authApi.logout();
    } catch { /* ignore network errors on logout */ }
    clearSession();
    setAuthCookie(false);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        register,
        login,
        sendMagicLink,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        changePassword,
        loginWithTokens,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
