import React, { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface TrailerModalProps {
  trailerId: string;
  onClose: () => void;
}

const TrailerModal: React.FC<TrailerModalProps> = ({ trailerId, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, true);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trailer-modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-black rounded-lg shadow-xl w-full max-w-4xl aspect-video relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="trailer-modal-title" className="sr-only">Anime Trailer</h2>
        <button 
          onClick={onClose} 
          className="absolute -top-4 -right-4 z-10 bg-gray-800 text-white rounded-full p-2 hover:bg-cyan-500 transition-colors"
          aria-label="Close trailer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <iframe
          src={`https://www.youtube.com/embed/${trailerId}?autoplay=1&rel=0`}
          title="Anime Trailer"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg"
        ></iframe>
      </div>
    </div>
  );
};

export default TrailerModal;