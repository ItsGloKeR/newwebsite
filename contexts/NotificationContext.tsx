import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useRef } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationState {
  message: string;
  type: NotificationType;
  id: number; // Unique ID for each notification
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const notificationQueueRef = useRef<NotificationState[]>([]);
  const timeoutRef = useRef<number | null>(null);

  const processQueue = useCallback(() => {
    if (notificationQueueRef.current.length > 0 && !notification) {
      const nextNotification = notificationQueueRef.current.shift();
      setNotification(nextNotification || null);
    }
  }, [notification]);

  const hideNotification = useCallback(() => {
    setNotification(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // After hiding, immediately try to show the next one
    processQueue();
  }, [processQueue]);

  const showNotification = useCallback((message: string, type: NotificationType = 'info', duration: number = 3000) => {
    const newNotification: NotificationState = { message, type, id: Date.now() };

    notificationQueueRef.current.push(newNotification);
    
    // Clear existing timeout if a new notification is shown while one is active
    // This ensures a new notification gets its full duration or replaces an expiring one.
    if (notification && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Attempt to show immediately if no current notification
    // Or, if there is a current notification, the `useEffect` below will pick it up
    // once the current one is dismissed (either manually or by its timeout).
    processQueue();

    // Set a new timeout for the *newly active* notification.
    // If a notification is already active, its timeout will be replaced.
    timeoutRef.current = window.setTimeout(hideNotification, duration);

  }, [hideNotification, processQueue, notification]); // Added notification to dependency array

  // Effect to handle current notification's visibility and queue processing
  useEffect(() => {
    if (!notification && notificationQueueRef.current.length > 0) {
      processQueue();
    } else if (notification && timeoutRef.current) {
        // If a new notification becomes active and a timeout already exists (e.g., from a previous notification),
        // we need to clear it and set a new one for the current notification.
        // This is primarily for cases where a notification is manually dismissed, and a new one
        // immediately pops up. The `showNotification` would have set a timeout for the *next* notification.
        // This makes sure the currently active one's timeout is refreshed.
        clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(hideNotification, 3000); // Default duration for safety
    }
  }, [notification, processQueue, hideNotification]);

  const value = { showNotification };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {notification && (
        <NotificationDisplay notification={notification} hideNotification={hideNotification} />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// NotificationDisplay component (moved here for simplicity, can be a separate file)
interface NotificationDisplayProps {
  notification: NotificationState;
  hideNotification: () => void;
}

const NotificationDisplay: React.FC<NotificationDisplayProps> = ({ notification, hideNotification }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // No specific timeout here, it's managed by the Provider
    return () => setIsVisible(false); // Trigger exit animation on unmount
  }, [notification.id]); // Rerun effect when notification ID changes

  const bgColorClass = (type: NotificationType) => {
    switch (type) {
      case 'success': return 'bg-green-600';
      case 'error': return 'bg-red-600';
      case 'warning': return 'bg-yellow-600';
      case 'info':
      default: return 'bg-cyan-500';
    }
  };

  const icon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
      case 'error':
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
      case 'warning':
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.342a.87.87 0 012.486 0l6.068 10.375c.346.593-.058 1.341-.755 1.341H2.801c-.697 0-1.101-.748-.755-1.341L8.257 3.342zM12 10a1 1 0 11-2 0 1 1 0 012 0zm-1 2a1 1 0 100 2h.01a1 1 0 100-2H11z" clipRule="evenodd" /></svg>;
      case 'info':
      default:
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>;
    }
  };

  return (
    <div
      key={notification.id}
      className={`fixed top-4 right-4 z-[100] p-4 pr-6 rounded-lg shadow-lg text-white max-w-sm transition-all duration-300 transform flex items-center gap-3 ${
        bgColorClass(notification.type)
      } ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      role="alert"
    >
      <div className="flex-shrink-0">{icon(notification.type)}</div>
      <p className="flex-grow text-sm font-semibold">{notification.message}</p>
      <button
        onClick={hideNotification}
        className="absolute top-1 right-1 text-white p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Close notification"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};