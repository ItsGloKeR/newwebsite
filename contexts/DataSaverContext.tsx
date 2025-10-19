import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface DataSaverContextType {
  isDataSaverActive: boolean;
}

const DataSaverContext = createContext<DataSaverContextType | undefined>(undefined);

// Type definition for the Network Information API
interface NetworkInformation extends EventTarget {
  readonly effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  readonly saveData?: boolean;
}

// Type assertion for navigator
declare global {
  interface Navigator {
    connection?: NetworkInformation;
  }
}

const checkDataSaver = (): boolean => {
    if (typeof navigator !== 'undefined' && navigator.connection) {
        // Return true if data saver is explicitly enabled OR connection is slow
        return navigator.connection.saveData === true || 
               navigator.connection.effectiveType === 'slow-2g' || 
               navigator.connection.effectiveType === '2g';
    }
    return false;
};

export const DataSaverProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDataSaverActive, setIsDataSaverActive] = useState(checkDataSaver());

  useEffect(() => {
    const connection = navigator.connection;
    if (!connection) return;

    const handleChange = () => {
        setIsDataSaverActive(checkDataSaver());
    };

    connection.addEventListener('change', handleChange);
    return () => {
        connection.removeEventListener('change', handleChange);
    };
  }, []);

  const value = { isDataSaverActive };

  return (
    <DataSaverContext.Provider value={value}>
      {children}
    </DataSaverContext.Provider>
  );
};

export const useDataSaver = (): DataSaverContextType => {
  const context = useContext(DataSaverContext);
  if (context === undefined) {
    throw new Error('useDataSaver must be used within a DataSaverProvider');
  }
  return context;
};
