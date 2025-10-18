import React from 'react';

interface FooterProps {
  onAdminClick: () => void;
}

const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-16">
      <div className="container mx-auto p-8 text-center">
        <p className="font-bold text-lg mb-2"><span className="text-cyan-400">Ani</span>GloK</p>
        <p className="text-sm mb-4">
          This is a fan-made project. All anime content belongs to their respective owners.
        </p>
        <div className="text-xs flex justify-center items-center gap-4">
          <span>Powered by <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">AniList</a> API.</span>
          <span className="text-gray-600">|</span>
          <button onClick={onAdminClick} className="text-cyan-400 hover:underline">Admin</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
