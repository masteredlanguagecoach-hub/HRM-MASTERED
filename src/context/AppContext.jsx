// Global Application State Context (Authoritative Startup Load, Navigation, Search, Sync Status, Toast Notifications)

import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbService } from '../services/db/dbService.js';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null); // { message, type: 'success'|'error'|'info' }
  const [refreshKey, setRefreshKey] = useState(0);
  const [syncStatus, setSyncStatus] = useState(dbService.getSyncStatus());
  const [isInitializingData, setIsInitializingData] = useState(true);

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setSyncStatus(dbService.getSyncStatus());
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Boot fetch authoritative Google Sheets data on application load
  useEffect(() => {
    async function bootAuthoritativeData() {
      setIsInitializingData(true);
      try {
        const res = await dbService.initAuthoritativeData();
        setSyncStatus(dbService.getSyncStatus());
        if (res && res.status === 'SUCCESS') {
          showToast('Loaded authoritative state from Google Sheets', 'success');
        }
      } catch (e) {
        console.warn('Boot authoritative fetch notice:', e);
      } finally {
        setIsInitializingData(false);
        triggerRefresh();
      }
    }
    bootAuthoritativeData();
  }, []);

  // 2. Poll sync queue status every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      dbService.processSyncQueue().then(() => {
        setSyncStatus(dbService.getSyncStatus());
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const list = dbService.getAll('Notifications') || [];
      const safeList = Array.isArray(list) ? list : [];
      setNotifications(safeList.filter(n => n && !n.IsRead));
    } catch (e) {
      console.warn('Notifications fetch warning:', e);
      setNotifications([]);
    }
  }, [refreshKey]);

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab,
      searchQuery,
      setSearchQuery,
      notifications: Array.isArray(notifications) ? notifications : [],
      toast,
      showToast,
      refreshKey,
      triggerRefresh,
      syncStatus,
      isInitializingData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    return {
      activeTab: 'Dashboard',
      setActiveTab: () => {},
      searchQuery: '',
      setSearchQuery: () => {},
      notifications: [],
      toast: null,
      showToast: () => {},
      refreshKey: 0,
      triggerRefresh: () => {},
      syncStatus: {
        status: 'OFFLINE',
        pendingCount: 0,
        lastSyncedAt: null
      },
      isInitializingData: false
    };
  }
  return ctx;
}
