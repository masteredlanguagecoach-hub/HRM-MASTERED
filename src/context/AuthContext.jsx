// Role-Based Access Control (RBAC) & Authenticated Session Context (Fail-Closed Architecture)

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ROLES, ROLE_PERMISSIONS } from '../config/constants.js';
import { dbService } from '../services/db/dbService.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // Resolve active authenticated user session from database
    const users = dbService.getAllRaw('Users') || [];
    const activeAdmin = users.find(u => u.Email === 'admin@masteredhrms.com' && u.Status === 'ACTIVE') || users[0] || null;
    setCurrentUser(activeAdmin);
    setIsAuthLoading(false);
  }, []);

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

  // Role switching Simulator (strictly for local development / testing)
  const switchRole = (newRole) => {
    const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (!isDev) {
      console.warn('Role switching is disabled in production environment');
      return;
    }
    const users = dbService.getAllRaw('Users') || [];
    const matchingUser = users.find(u => u.Role === newRole && u.Status === 'ACTIVE');
    
    if (matchingUser) {
      setCurrentUser(matchingUser);
    } else {
      console.error(`Seeded user account for role ${newRole} not found`);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      setCurrentUser,
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
      hasPermission: () => false,
      hasAnyPermission: () => false,
      switchRole: () => {},
      isAuthLoading: false
    };
  }
  return ctx;
}
