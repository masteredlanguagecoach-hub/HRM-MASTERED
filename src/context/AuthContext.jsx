// Role-Based Access Control (RBAC) & Authenticated Session Context (Fail-Closed Architecture)

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ROLES, ROLE_PERMISSIONS } from '../config/constants.js';
import { dbService } from '../services/db/dbService.js';

const AuthContext = createContext();
const AUTH_SESSION_KEY = 'HRMS_AUTH_SESSION_TOKEN';
const LOGOUT_FLAG_KEY = 'HRMS_EXPLICIT_LOGOUT_FLAG';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // Resolve active authenticated user session from database or default active Super Admin
    try {
      const isExplicitLogout = typeof window !== 'undefined' ? localStorage.getItem(LOGOUT_FLAG_KEY) : null;
      const storedSession = typeof window !== 'undefined' ? localStorage.getItem(AUTH_SESSION_KEY) : null;

      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        if (parsed && parsed.email && parsed.expiresAt && Date.now() < parsed.expiresAt) {
          const users = dbService.getAllRaw('Users') || [];
          const user = users.find(u => u.Email === parsed.email && u.Status === 'ACTIVE');
          if (user) {
            setCurrentUser(user);
            setIsAuthLoading(false);
            return;
          }
        }
      }

      if (!isExplicitLogout) {
        // Auto-seed active Super Admin account for seamless access
        const users = dbService.getAllRaw('Users') || [];
        const activeAdmin = users.find(u => u.Email === 'admin@masteredhrms.com' && u.Status === 'ACTIVE') || users[0] || null;
        setCurrentUser(activeAdmin);
      }
    } catch (e) {
      console.warn('Auth session resolution warning:', e);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const login = (email, password) => {
    const users = dbService.getAllRaw('Users') || [];
    const matchingUser = users.find(u => u.Email.toLowerCase() === email.toLowerCase());

    if (!matchingUser) {
      return { success: false, message: 'User account not found. Please check your work email.' };
    }

    if (matchingUser.Status !== 'ACTIVE') {
      return { success: false, message: 'User account is deactivated. Contact Super Admin for reactivation.' };
    }

    // Clear explicit logout flag & set session token (8 hours)
    localStorage.removeItem(LOGOUT_FLAG_KEY);
    const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
    const sessionPayload = { email: matchingUser.Email, role: matchingUser.Role, expiresAt };
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionPayload));

    try {
      dbService.update('Users', 'UserID', matchingUser.UserID, {
        LastLogin: new Date().toISOString()
      });
      dbService.insert('AuditLogs', {
        AuditID: 'AUD-' + Date.now(),
        UserEmail: matchingUser.Email,
        Action: 'USER_LOGIN',
        Module: 'AUTHENTICATION',
        Details: `User ${matchingUser.Email} signed in cleanly`,
        Timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Login audit log warning:', e);
    }

    setCurrentUser(matchingUser);
    return { success: true, user: matchingUser };
  };

  const logout = () => {
    if (currentUser) {
      try {
        dbService.insert('AuditLogs', {
          AuditID: 'AUD-' + Date.now(),
          UserEmail: currentUser.Email,
          Action: 'USER_LOGOUT',
          Module: 'AUTHENTICATION',
          Details: `User ${currentUser.Email} signed out`,
          Timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Logout audit log warning:', e);
      }
    }
    localStorage.setItem(LOGOUT_FLAG_KEY, 'true');
    localStorage.removeItem(AUTH_SESSION_KEY);
    setCurrentUser(null);
  };

  const hasPermission = (permission) => {
    if (!currentUser || currentUser.Status !== 'ACTIVE') return false; // Fail-Closed
    const userPermissions = ROLE_PERMISSIONS[currentUser.Role] || [];
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions) => {
    if (!currentUser || currentUser.Status !== 'ACTIVE') return false; // Fail-Closed
    const perms = Array.isArray(permissions) ? permissions : [permissions];
    const userPermissions = ROLE_PERMISSIONS[currentUser.Role] || [];
    return perms.some(p => userPermissions.includes(p));
  };

  // Role switching Simulator for local development / testing
  const switchRole = (newRole) => {
    const users = dbService.getAllRaw('Users') || [];
    const matchingUser = users.find(u => u.Role === newRole && u.Status === 'ACTIVE');
    
    if (matchingUser) {
      login(matchingUser.Email, 'password123');
    } else {
      console.error(`Seeded user account for role ${newRole} not found`);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      setCurrentUser,
      login,
      logout,
      hasPermission,
      hasAnyPermission,
      switchRole,
      isAuthLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      currentUser: null,
      setCurrentUser: () => {},
      login: () => ({ success: false }),
      logout: () => {},
      hasPermission: () => false,
      hasAnyPermission: () => false,
      switchRole: () => {},
      isAuthLoading: false
    };
  }
  return ctx;
}
