import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi, userApi, onUnauthorized } from "../services/api";
import { bindMockUser } from "../services/mock";

const AuthContext = createContext(null);

// status: "loading" | "authenticated" | "anonymous" | "unreachable"
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState({
    status: "loading",
    user: null,
    error: null,
  });

  const applyUser = useCallback((user) => {
    bindMockUser(user);
    setState({
      status: user ? "authenticated" : "anonymous",
      user,
      error: null,
    });
  }, []);

  const loadSession = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading" }));
    try {
      applyUser(await userApi.getMe());
    } catch (err) {
      if (err.status === 0)
        setState({ status: "unreachable", user: null, error: err });
      else applyUser(null);
    }
  }, [applyUser]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Any protected request that comes back with the auth-middleware error
  // drops us back to the login screen.
  useEffect(
    () =>
      onUnauthorized(() => {
        setState((s) => {
          if (s.status === "authenticated")
            toast.error("Your session has expired. Please log in again.");
          return { status: "anonymous", user: null, error: null };
        });
        bindMockUser(null);
        queryClient.clear();
      }),
    [queryClient],
  );

  const login = useCallback(
    async (creds) => {
      await authApi.login(creds);
      applyUser(await userApi.getMe());
    },
    [applyUser],
  );

  const signup = useCallback(
    async (data) => {
      await authApi.signup(data);
      applyUser(await userApi.getMe());
    },
    [applyUser],
  );

  // Only clear local state once the server confirms the cookie was expired.
  const logout = useCallback(async () => {
    await authApi.logout();
    applyUser(null);
    queryClient.clear();
  }, [applyUser, queryClient]);

  const setUser = useCallback((user) => setState((s) => ({ ...s, user })), []);

  const value = useMemo(
    () => ({ ...state, login, signup, logout, setUser, retry: loadSession }),
    [state, login, signup, logout, setUser, loadSession],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
