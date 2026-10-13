import React, { useEffect, useState } from 'react';
import { ShieldAlert, EyeOff } from 'lucide-react';

interface AntiScreenshotGuardProps {
  children: React.ReactNode;
  isDarkMode?: boolean;
}

export const AntiScreenshotGuard: React.FC<AntiScreenshotGuardProps> = ({
  children,
  isDarkMode = true,
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);

  useEffect(() => {
    // 1. Prevent Right Click / Context Menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. Prevent Dragging Images
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // 3. Detect Screenshot & Print Keyboard Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

      // PrintScreen Key
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        triggerProtection();
      }

      // Print: Ctrl+P or Cmd+P
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        triggerProtection();
      }

      // Save: Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        triggerProtection();
      }

      // Mac Screenshot Shortcuts: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
      if (isMac && e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
        e.preventDefault();
        triggerProtection();
      }

      // Windows Snipping Tool Shortcut: Win+Shift+S
      if (e.key === 'S' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        triggerProtection();
      }
    };

    const triggerProtection = () => {
      setShowWarning(true);
      // Attempt to clear clipboard to prevent screenshot paste
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('').catch(() => {});
      }
      setTimeout(() => setShowWarning(false), 3000);
    };

    // 4. Blur Window Content when App Loses Focus or Tab Hidden (Snipping tool active)
    const handleBlur = () => {
      setIsWindowBlurred(true);
    };

    const handleFocus = () => {
      setIsWindowBlurred(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsWindowBlurred(true);
      } else {
        setIsWindowBlurred(false);
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full select-none overflow-x-hidden">
      {/* Main Content Area with Blur on window unfocus */}
      <div
        className={`w-full min-h-screen transition-all duration-200 ${
          isWindowBlurred ? 'filter blur-2xl opacity-10 pointer-events-none' : ''
        }`}
      >
        {children}
      </div>

      {/* Screen Security Curtain Overlay when app window is unfocused / backgrounded */}
      {isWindowBlurred && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 text-center backdrop-blur-3xl transition-opacity ${
            isDarkMode ? 'bg-black/95 text-white' : 'bg-neutral-900/95 text-white'
          }`}
        >
          <div className="w-16 h-16 rounded-3xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-4 text-blue-400 animate-pulse">
            <EyeOff className="w-8 h-8 stroke-[2]" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Privacy Shield Active</h2>
          <p className="text-sm text-neutral-400 max-w-xs mt-1 leading-relaxed">
            Screen capture and background viewing are restricted on Banter. Return to the window to resume.
          </p>
        </div>
      )}

      {/* Screenshot Warning Popup Banner */}
      {showWarning && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-3 px-5 py-3 rounded-2xl bg-red-600/95 text-white shadow-2xl backdrop-blur-xl border border-red-400/30 animate-bounce">
          <ShieldAlert className="w-5 h-5 shrink-0 stroke-[2.5]" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-red-200">
              Screenshots Prohibited
            </span>
            <span className="text-xs font-semibold">
              Screenshots and screen recordings are disabled on this web app.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
