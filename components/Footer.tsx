import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-16">
      <div className="container mx-auto p-8 text-center">
        <p className="font-bold text-lg mb-2"><span className="text-cyan-400">Ani</span>GloK</p>
        <p className="text-sm mb-4">
          This is a fan-made project. All anime content belongs to their respective owners.
        </p>
        <p className="text-xs">
          Powered by <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">AniList</a> API.
        </p>
      </div>
    </footer>
  );
};

export default Footer;