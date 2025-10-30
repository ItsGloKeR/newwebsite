import React from 'react';
import { DiscussionEmbed } from 'disqus-react';

interface DisqusCommentsProps {
    animeId: number;
    episodeNumber: number;
    animeTitle: string;
}

const FirebaseComments: React.FC<DisqusCommentsProps> = ({ animeId, episodeNumber, animeTitle }) => {
    const shortname = 'aniglok'; // Your Disqus shortname
    
    // Generate a stable, canonical URL for the discussion thread.
    // This ensures Disqus can always identify the correct page.
    const url = `${window.location.origin}${window.location.pathname}#/watch/${animeId}/${episodeNumber}`;

    const disqusConfig = {
        url: url,
        identifier: `${animeId}-${episodeNumber}`, // A unique identifier for each episode's comment thread
        title: `${animeTitle} - Episode ${episodeNumber}`,
    };

    return (
        <div className="bg-gray-900/80 p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4 border-l-4 border-cyan-400 pl-3">Comments</h3>
            <div className="mt-4">
                <DiscussionEmbed
                    shortname={shortname}
                    config={disqusConfig}
                />
            </div>
        </div>
    );
};

export default FirebaseComments;
