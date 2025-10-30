import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Comment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { postComment, getComments, deleteComment, toggleLikeComment } from '../services/firebaseService';
import { DocumentData } from 'firebase/firestore';
import { DEFAULT_AVATAR_URL } from '../constants';
import LoadingSpinner from './LoadingSpinner';

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) {
        const years = Math.floor(interval);
        return `${years} year${years > 1 ? 's' : ''} ago`;
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        const months = Math.floor(interval);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    interval = seconds / 86400;
    if (interval > 1) {
        const days = Math.floor(interval);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    interval = seconds / 3600;
    if (interval > 1) {
        const hours = Math.floor(interval);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    interval = seconds / 60;
    if (interval > 1) {
        const minutes = Math.floor(interval);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    return "just now";
};

const CommentItem: React.FC<{
    comment: Comment;
    currentUserId: string | null;
    onDelete: (commentId: string) => void;
    onLike: (commentId: string) => void;
}> = ({ comment, currentUserId, onDelete, onLike }) => {
    const isLiked = currentUserId ? comment.likes.includes(currentUserId) : false;

    return (
        <div className="flex items-start gap-3 p-3">
            <img 
                src={comment.photoURL || DEFAULT_AVATAR_URL} 
                alt={comment.displayName} 
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-grow">
                <div className="flex items-center gap-2">
                    <p className="font-bold text-white text-sm">{comment.displayName}</p>
                    <p className="text-xs text-gray-400">
                        {comment.createdAt ? timeAgo(new Date(comment.createdAt.seconds * 1000)) : 'just now'}
                    </p>
                </div>
                <p className="text-gray-300 mt-1 whitespace-pre-wrap">{comment.text}</p>
                <div className="flex items-center gap-4 mt-2">
                    <button 
                        onClick={() => onLike(comment.id)} 
                        disabled={!currentUserId}
                        className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                            isLiked ? 'text-cyan-400' : 'text-gray-400 hover:text-cyan-400'
                        } disabled:cursor-not-allowed`}
                        aria-label="Like comment"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <span>{comment.likeCount || comment.likes.length}</span>
                    </button>
                    {currentUserId === comment.userId && (
                        <button 
                            onClick={() => onDelete(comment.id)} 
                            className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Delete comment"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

interface FirebaseCommentsProps {
    animeId: number;
    episodeNumber: number;
    onLoginClick: () => void;
}

const FirebaseComments: React.FC<FirebaseCommentsProps> = ({ animeId, episodeNumber, onLoginClick }) => {
    const { user, loading: authLoading } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [postError, setPostError] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'top'>('newest');
    const [commentScope, setCommentScope] = useState<'episode' | 'series'>('episode');
    const lastPostTime = useRef(0);

    const threadId = useMemo(() => {
        return commentScope === 'series' ? `${animeId}` : `${animeId}-${episodeNumber}`;
    }, [animeId, episodeNumber, commentScope]);

    const fetchComments = useCallback(async (loadMore = false) => {
        setIsLoading(true);
        try {
            const result = await getComments(threadId, sortBy, loadMore ? lastVisible : undefined);
            setComments(prev => loadMore ? [...prev, ...result.comments] : result.comments);
            setLastVisible(result.lastVisible);
            setHasMore(result.comments.length > 0 && !!result.lastVisible);
        } catch (error) {
            console.error("Failed to fetch comments", error);
        } finally {
            setIsLoading(false);
        }
    }, [threadId, sortBy, lastVisible]);

    useEffect(() => {
        setComments([]);
        setLastVisible(null);
        setHasMore(true);
        fetchComments(false);
    // Disabling exhaustive-deps because we want to control refetching manually through the `fetchComments` dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [threadId, sortBy]);

    const handlePostComment = async () => {
        if (!user || newComment.trim().length === 0) return;

        const now = Date.now();
        if (now - lastPostTime.current < 30000) { // 30-second cooldown
            setPostError('Please wait before posting another comment.');
            setTimeout(() => setPostError(''), 3000);
            return;
        }

        setIsPosting(true);
        setPostError('');
        try {
            const newCommentData: Omit<Comment, 'id'> = {
                threadId,
                userId: user.uid,
                displayName: user.displayName || 'Anonymous',
                photoURL: user.photoURL || '',
                text: newComment.trim(),
                createdAt: { seconds: Math.floor(now / 1000), nanoseconds: 0 },
                likes: [],
                likeCount: 0,
            };
            
            const tempId = `temp-${Date.now()}`;
            setComments(prev => [{ ...newCommentData, id: tempId } as Comment, ...prev]);
            setNewComment('');
            
            const docId = await postComment(threadId, user, newComment.trim());

            if (docId) {
                setComments(prev => prev.map(c => c.id === tempId ? { ...newCommentData, id: docId } as Comment : c));
            } else {
                setComments(prev => prev.filter(c => c.id !== tempId));
                setPostError('Failed to post comment. Please try again.');
            }
            lastPostTime.current = now;

        } catch (error) {
            setPostError('Failed to post comment. Please try again.');
        } finally {
            setIsPosting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        
        const success = await deleteComment(commentId);
        if (success) {
            setComments(prev => prev.filter(c => c.id !== commentId));
        } else {
            alert("Failed to delete comment.");
        }
    };

    const handleLike = async (commentId: string) => {
        if (!user) return;
        
        setComments(prev => prev.map(c => {
            if (c.id === commentId) {
                const isLiked = c.likes.includes(user.uid);
                const newLikes = isLiked 
                    ? c.likes.filter(uid => uid !== user.uid)
                    : [...c.likes, user.uid];
                return { ...c, likes: newLikes, likeCount: newLikes.length };
            }
            return c;
        }));

        await toggleLikeComment(commentId, user.uid);
    };

    return (
        <div className="bg-gray-900/80 rounded-lg shadow-lg flex flex-col">
            <div className="flex flex-wrap justify-between items-center gap-y-2 p-3 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">Comments</h3>
                    <select
                        value={commentScope}
                        onChange={(e) => setCommentScope(e.target.value as 'episode' | 'series')}
                        className="bg-gray-700/80 text-white text-xs font-semibold rounded-md py-1 px-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        <option value="episode">This Episode</option>
                        <option value="series">Entire Series</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'top')}
                        className="bg-gray-700/80 text-white text-xs font-semibold rounded-md py-1 px-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        <option value="newest">Newest</option>
                        <option value="top">Top</option>
                        <option value="oldest">Oldest</option>
                    </select>
                    <button onClick={() => fetchComments(false)} className="text-gray-400 hover:text-white" aria-label="Refresh comments">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </div>
            <div className="p-3 border-b border-gray-700">
                {!authLoading && !user && (
                    <p className="text-sm text-gray-400 mb-3">
                        You must be <button onClick={onLoginClick} className="text-cyan-400 hover:underline font-semibold">logged in</button> to post a comment.
                    </p>
                )}
                <div className="flex items-start gap-3">
                    {authLoading ? (
                        <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse"></div>
                    ) : (
                        <img 
                            src={user?.photoURL || DEFAULT_AVATAR_URL} 
                            alt={user?.displayName || 'Guest'} 
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                    )}
                    <div className="flex-grow">
                        {authLoading ? (
                            <div className="h-24 bg-gray-700 rounded-lg animate-pulse"></div>
                        ) : user ? (
                            <div>
                                <div className="relative">
                                    <textarea
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        placeholder={`Commenting as ${user.displayName}...`}
                                        className="w-full bg-gray-700 text-white rounded-lg p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                                        rows={2}
                                        maxLength={1000}
                                    />
                                    <button
                                        type="button"
                                        className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-600"
                                        aria-label="Add emoji"
                                        title="Add emoji"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 01-1.415-1.414 3 3 0 00-4.242 0 1 1 0 01-1.415 1.414 5 5 0 017.072 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                                {postError && <p className="text-red-500 text-xs mt-1">{postError}</p>}
                                <div className="flex justify-end mt-2">
                                    <button
                                        onClick={handlePostComment}
                                        disabled={isPosting || newComment.trim().length === 0}
                                        className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-1.5 px-4 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                                    >
                                        {isPosting ? 'Posting...' : 'Post'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={onLoginClick}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onLoginClick() }}
                                className="w-full bg-gray-700 text-gray-400 rounded-lg p-3 cursor-pointer transition-colors hover:bg-gray-600/50 flex items-start"
                                style={{ minHeight: '60px' }}
                            >
                                Add a public comment...
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto max-h-[500px] divide-y divide-gray-800">
                {isLoading && comments.length === 0 ? (
                    <div className="p-8"><LoadingSpinner /></div>
                ) : comments.length > 0 ? (
                    comments.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            currentUserId={user?.uid || null}
                            onDelete={handleDelete}
                            onLike={handleLike}
                        />
                    ))
                ) : (
                    <p className="text-gray-500 text-center p-8">Be the first to comment!</p>
                )}
                
                {hasMore && !isLoading && (
                    <div className="p-4 text-center">
                        <button onClick={() => fetchComments(true)} className="text-cyan-400 font-semibold hover:underline">
                            Load More Comments
                        </button>
                    </div>
                )}
                {isLoading && comments.length > 0 && <div className="p-4"><LoadingSpinner /></div>}
            </div>
        </div>
    );
};

export default FirebaseComments;