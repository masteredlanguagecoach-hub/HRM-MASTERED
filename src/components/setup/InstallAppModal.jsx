// PWA & Native App Installation Guide and Launcher Modal
import React, { useState, useEffect } from 'react';
import { Modal, Button, SVGIcon } from '../common/UIComponents.jsx';

export function InstallAppModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('android'); // 'android' | 'ios' | 'desktop'
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsStandalone(true);
    }

    // Capture browser install prompt if available
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        onClose();
      }
    } else {
      alert('To install directly, tap your browser menu (⋮ or Share) and select "Install app" or "Add to Home screen".');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      title="Download & Install Mastered HRMS"
      subtitle="Install Mastered HRMS as an App / APK on Android, iOS, Windows PC, Mac & Linux"
      onClose={onClose}
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Device Platform Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--slate-200)', paddingBottom: '12px' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'android' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '10px 8px', fontSize: '13px' }}
            onClick={() => setActiveTab('android')}
          >
            <SVGIcon name="smartphone" size={16} />
            <span>Android (APK / Web App)</span>
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'ios' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '10px 8px', fontSize: '13px' }}
            onClick={() => setActiveTab('ios')}
          >
            <SVGIcon name="smartphone" size={16} />
            <span>iPhone / iPad (iOS)</span>
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'desktop' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '10px 8px', fontSize: '13px' }}
            onClick={() => setActiveTab('desktop')}
          >
            <SVGIcon name="laptop" size={16} />
            <span>PC, Laptops & Mac</span>
          </button>
        </div>

        {/* TAB CONTENT: ANDROID */}
        {activeTab === 'android' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--emerald-50)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--emerald-100)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' }}>
                M
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#065f46' }}>Android Instant APK & App Install</div>
                <div style={{ fontSize: '12px', color: '#047857' }}>Fast, offline-enabled, full-screen APK-equivalent experience</div>
              </div>
              {deferredPrompt && (
                <Button variant="primary" icon="download" onClick={handleNativeInstall}>
                  1-Tap Install
                </Button>
              )}
            </div>

            <div style={{ background: 'var(--slate-50)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--slate-800)', marginBottom: '10px' }}>How to install on Android phone or tablet:</h4>
              <ol style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--slate-700)', lineHeight: '1.8' }}>
                <li>Open this link in <strong>Chrome</strong> or <strong>Samsung Internet</strong>.</li>
                <li>Tap the <strong>three dots menu (⋮)</strong> at the top right of Chrome.</li>
                <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                <li>Tap <strong>Install</strong>. Mastered HRMS will appear in your App Drawer alongside your native Android APKs.</li>
              </ol>
            </div>
          </div>
        )}

        {/* TAB CONTENT: IOS */}
        {activeTab === 'ios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--primary-50)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-100)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' }}>
                M
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--primary-700)' }}>iOS Native Web App (iPhone / iPad)</div>
                <div style={{ fontSize: '12px', color: 'var(--primary-600)' }}>Runs in standalone mode with full screen, no Safari URL bar</div>
              </div>
            </div>

            <div style={{ background: 'var(--slate-50)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--slate-800)', marginBottom: '10px' }}>How to install on iPhone / iPad:</h4>
              <ol style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--slate-700)', lineHeight: '1.8' }}>
                <li>Open this link in <strong>Safari</strong> browser on your iPhone or iPad.</li>
                <li>Tap the <strong>Share button</strong> (square icon with an arrow pointing up at the bottom).</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong> (➕).</li>
                <li>Tap <strong>Add</strong> in the top-right corner. The Mastered HRMS app icon will be pinned to your home screen!</li>
              </ol>
            </div>
          </div>
        )}

        {/* TAB CONTENT: DESKTOP */}
        {activeTab === 'desktop' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--slate-900)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' }}>
                M
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--slate-900)' }}>Windows PC, Mac, Laptops & Linux Desktop App</div>
                <div style={{ fontSize: '12px', color: 'var(--slate-600)' }}>Dedicated desktop window, taskbar pin, and desktop shortcut</div>
              </div>
              {deferredPrompt && (
                <Button variant="primary" icon="download" onClick={handleNativeInstall}>
                  Install App
                </Button>
              )}
            </div>

            <div style={{ background: 'var(--slate-50)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--slate-800)', marginBottom: '10px' }}>How to install on Windows / Mac / Chrome / Edge:</h4>
              <ol style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--slate-700)', lineHeight: '1.8' }}>
                <li>In <strong>Chrome</strong> or <strong>Microsoft Edge</strong>, look at the address bar on the right.</li>
                <li>Click the <strong>Install icon (🖥️ or ⬇️)</strong> in the URL bar, OR open the 3-dot menu and select <strong>"Install Mastered HRMS"</strong>.</li>
                <li>Click <strong>Install</strong>. Mastered HRMS opens in its own window and creates a Desktop shortcut & Start Menu entry.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Status notice */}
        {isStandalone ? (
          <div style={{ textAlign: 'center', padding: '10px', background: 'var(--emerald-50)', color: '#065f46', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: '600' }}>
            ✓ You are currently running Mastered HRMS in installed Standalone App mode!
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button variant="secondary" onClick={onClose}>Close</Button>
            {deferredPrompt && (
              <Button variant="primary" icon="download" onClick={handleNativeInstall}>
                Install Now
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
