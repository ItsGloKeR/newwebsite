import React, { createContext, useContext, ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  // All notification functionality has been removed.
  // This provider now does nothing but render its children.
  const value = { showNotification: () => {} }; // No-op function

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  // Return a no-op function to prevent errors in components that still use this hook.
  if (context === undefined) {
    return { showNotification: () => {} };
  }
  return context;
};
