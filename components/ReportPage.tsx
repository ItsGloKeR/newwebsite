import React from 'react';

interface ReportPageProps {
  onBack: () => void;
}

const ReportPage: React.FC<ReportPageProps> = ({ onBack }) => {
  return (
    <main className="min-h-screen text-white flex flex-col items-center animate-fade-in p-4 md:p-8">
      <div className="w-full max-w-4xl">
        <button 
          onClick={onBack} 
          className="mb-6 group flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors text-sm md:text-base whitespace-nowrap bg-gray-800/50 hover:bg-gray-700/60 px-4 py-2 rounded-lg"
          aria-label="Go back to player"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Player</span>
        </button>
        <h1 className="text-3xl font-bold text-white mb-4 text-center font-display">Report an Issue</h1>
        <p className="text-gray-400 text-center mb-6">
          Use the form below to report any issues with video playback, subtitles, or audio. Your feedback helps us improve the site.
        </p>
        <div className="w-full bg-white rounded-lg overflow-hidden shadow-2xl">
          <iframe 
            src="https://docs.google.com/forms/d/e/1FAIpQLSf8hgUgjpVYran2_KRAhkrutthwBucqwXYhsc6DB4yKfcMLPA/viewform?embedded=true" 
            width="100%" 
            height="1419" 
            frameBorder="0" 
            marginHeight={0} 
            marginWidth={0}
            title="Report Issue Form"
            className="block"
          >
            Loading…
          </iframe>
        </div>
      </div>
    </main>
  );
};

export default ReportPage;
