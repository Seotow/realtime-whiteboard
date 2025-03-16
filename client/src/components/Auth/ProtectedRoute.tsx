import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, user, _hasHydrated } = useAuthStore();
    const location = useLocation();

    console.log(
        "ProtectedRoute - isAuthenticated:",
        isAuthenticated,
        "user:",
        user,
        "hasHydrated:",
        _hasHydrated
    );

    // Wait for hydration before making auth decisions
    if (!_hasHydrated) {
        console.log("ProtectedRoute - Waiting for hydration...");
        return <div>Loading...</div>; // or a proper loading component
    }

    if (!isAuthenticated) {
        console.log(
            "ProtectedRoute - Redirecting to /auth because not authenticated"
        );
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
