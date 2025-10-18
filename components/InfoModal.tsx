import React from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="bg-gray-900 text-white rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-400">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        <div className="flex-grow overflow-y-auto pr-4 text-gray-300 space-y-4 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
