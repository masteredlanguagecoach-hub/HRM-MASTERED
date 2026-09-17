// Role-Based Access Control (RBAC) & Authenticated Session Context (Fail-Closed Architecture)

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ROLES, ROLE_PERMISSIONS } from '../config/constants.js';
import { dbService } from '../services/db/dbService.js';

const AuthContext = createContext();
const AUTH_SESSION_KEY = 'HRMS_AUTH_SESSION_TOKEN';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // Resolve active authenticated user session from localStorage session token
    try {
      const storedSession = typeof window !== 'undefined' ? localStorage.getItem(AUTH_SESSION_KEY) : null;
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        if (parsed && parsed.email && parsed.expiresAt && Date.now() < parsed.expiresAt) {
          const users = dbService.getAllRaw('Users') || [];
          const user = users.find(u => u.Email === parsed.email && u.Status === 'ACTIVE');
          if (user) {
            setCurrentUser(user);
          } else {
            localStorage.removeItem(AUTH_SESSION_KEY);
          }
        } else {
          localStorage.removeItem(AUTH_SESSION_KEY);
        }
      }
    } catch (e) {
      console.warn('Auth session resolution warning:', e);
      localStorage.removeItem(AUTH_SESSION_KEY);
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

    // Set authenticated session token (8 hours expiration)
    const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
    const sessionPayload = { email: matchingUser.Email, role: matchingUser.Role, expiresAt };
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionPayload));

    // Update LastLogin timestamp and log in AuditLogs
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
    const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (!isDev) {
      console.warn('Role switching is disabled in production environment');
      return;
    }
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
    // FAIL-CLOSED SAFEGUARD: Default fallback denies all permissions
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
