import React from 'react';

interface GenrePillProps {
  genre: string;
}

const GenrePill: React.FC<GenrePillProps> = ({ genre }) => {
  return (
    <span className="bg-gray-800 text-cyan-300 text-xs font-medium mr-2 mb-2 px-2.5 py-1 rounded-full">
      {genre}
    </span>
  );
};

export default GenrePill;