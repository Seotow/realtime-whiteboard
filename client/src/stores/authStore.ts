import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
    id: string;
    email: string;
    username: string;
    avatar?: string;
    createdAt: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    _hasHydrated: boolean;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (
        email: string,
        username: string,
        password: string
    ) => Promise<void>;
    logout: () => void;
    clearError: () => void;
    setUser: (user: User) => void;
    setToken: (token: string) => void;
    setHasHydrated: (hasHydrated: boolean) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            _hasHydrated: false,
            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });

                try {
                    const response = await fetch(
                        `${API_BASE_URL}/api/auth/login`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ email, password }),
                        }
                    );

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || "Login failed");
                    }

                    const data = await response.json();

                    // Store token in localStorage for API access
                    localStorage.setItem("accessToken", data.data.token);

                    set({
                        user: data.data.user,
                        token: data.data.token,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });
                } catch (error) {
                    set({
                        error:
                            error instanceof Error
                                ? error.message
                                : "Login failed",
                        isLoading: false,
                    });
                    throw error;
                }
            },

            register: async (
                email: string,
                username: string,
                password: string
            ) => {
                set({ isLoading: true, error: null });

                try {
                    const response = await fetch(
                        `${API_BASE_URL}/api/auth/register`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ email, username, password }),
                        }
                    );

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(
                            errorData.message || "Registration failed"
                        );
                    }

                    const data = await response.json();

                    // Store token in localStorage for API access
                    localStorage.setItem("accessToken", data.token);

                    set({
                        user: data.user,
                        token: data.token,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });
                } catch (error) {
                    set({
                        error:
                            error instanceof Error
                                ? error.message
                                : "Registration failed",
                        isLoading: false,
                    });
                    throw error;
                }
            },

            logout: () => {
                // Clear token from localStorage
                localStorage.removeItem("accessToken");

                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    error: null,
                });
            },

            clearError: () => {
                set({ error: null });
            },

            setUser: (user: User) => {
                set({ user, isAuthenticated: true });
            },

            setToken: (token: string) => {
                set({ token });
            },

            setHasHydrated: (hasHydrated: boolean) => {
                set({ _hasHydrated: hasHydrated });
            },
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                console.log("[AuthStore] Hydration started");
                if (state) {
                    console.log("[AuthStore] Hydration completed:", {
                        user: state.user,
                        isAuthenticated: state.isAuthenticated,
                        hasToken: !!state.token,
                    });
                    state.setHasHydrated(true);
                }
            },
        }
    )
);
