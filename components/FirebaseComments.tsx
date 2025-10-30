import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Comment, UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
    postComment, 
    getComments, 
    deleteComment, 
    toggleLikeComment, 
    editComment, 
    reportComment,
    moderateUser,
    togglePinComment
} from '../services/firebaseService';
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

const Spoiler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [revealed, setRevealed] = useState(false);
    return (
        <span
            onClick={() => setRevealed(!revealed)}
            className={`cursor-pointer transition-colors duration-200 rounded px-1 ${revealed ? 'bg-transparent text-inherit' : 'bg-gray-700 text-gray-700 hover:bg-gray-600'}`}
            title="Click to reveal spoiler"
        >
            {children}
        </span>
    );
};

const parseText = (text: string) => {
    const parts = text.split(/(>!.*?<!|@[a-zA-Z0-9_]+)/g);
    return parts.map((part, index) => {
        if (part.startsWith('>!') && part.endsWith('!<')) {
            return <Spoiler key={index}>{part.slice(2, -2)}</Spoiler>;
        }
        if (part.startsWith('@')) {
            return <strong key={index} className="text-cyan-400 font-semibold">{part}</strong>;
        }
        return part;
    });
};

const linkRegex = /https?:\/\/[^\s/$.?#].[^\s]*/gi;
const badWords = [
    'profanity1', 'profanity2', 'badword', 'inappropriate' 
    // In a real app, this would be a much more comprehensive list, likely managed on a server.
];

const CommentForm: React.FC<{
    user: UserProfile;
    isPosting: boolean;
    onSubmit: (text: string) => void;
    initialText?: string;
    onCancel?: () => void;
    placeholder: string;
    submitLabel: string;
}> = ({ user, isPosting, onSubmit, initialText = '', onCancel, placeholder, submitLabel }) => {
    const [text, setText] = useState(initialText);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lastPostTime = useRef(0);
    const [error, setError] = useState('');

    useEffect(() => {
        setText(initialText);
        if(initialText && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [initialText]);

    const handleSpoiler = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = text.substring(start, end);
        const newText = `${text.substring(0, start)}>!${selectedText || 'spoiler'}!<${text.substring(end)}`;
        setText(newText);
        textarea.focus();
    };

    const handleEmoji = () => {
        setError("Emoji support is coming soon!");
        setTimeout(() => setError(''), 3000);
    };

    const handleSubmit = () => {
        setError('');
        if (text.trim().length === 0) return;

        if (user.isMuted || user.isBanned) {
            setError('Your account is restricted from posting comments.');
            return;
        }

        const now = Date.now();
        if (now - lastPostTime.current < 5000) { // 5-second cooldown
            setError('Please wait a moment before posting again.');
            setTimeout(() => setError(''), 3000);
            return;
        }
        
        if (linkRegex.test(text)) {
            setError('Links are not allowed in comments.');
            setTimeout(() => setError(''), 3000);
            return;
        }

        const foundBadWord = badWords.some(word => text.toLowerCase().includes(word));
        if (foundBadWord) {
            setError('Your comment contains inappropriate language.');
            setTimeout(() => setError(''), 3000);
            return;
        }

        onSubmit(text);
        if(!initialText) setText(''); // Only clear if it's a new comment, not an edit
        lastPostTime.current = now;
    };

    return (
        <div className="flex items-start gap-3 w-full">
            <img 
                src={user.photoURL || DEFAULT_AVATAR_URL} 
                alt={user.displayName || 'User'}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1"
            />
            <div className="flex-grow">
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-gray-700 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                    rows={2}
                    maxLength={1000}
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-2">
                         <button
                            type="button"
                            onClick={handleSpoiler}
                            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-gray-600"
                            aria-label="Add spoiler tag"
                            title="Add spoiler tag"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        </button>
                        <button
                            type="button"
                            onClick={handleEmoji}
                            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-gray-600"
                            aria-label="Add emoji"
                            title="Add emoji"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 01-1.415-1.414 3 3 0 00-4.242 0 1 1 0 01-1.415 1.414 5 5 0 017.072 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex gap-2">
                        {onCancel && <button onClick={onCancel} className="text-gray-300 font-semibold py-1.5 px-4 rounded-md transition-colors text-sm hover:bg-gray-700">Cancel</button>}
                        <button
                            onClick={handleSubmit}
                            disabled={isPosting || text.trim().length === 0}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-1.5 px-4 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
                        >
                            {isPosting ? '...' : submitLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CommentItem: React.FC<{
    comment: Comment;
    currentUser: UserProfile | null;
    onDelete: (commentId: string) => void;
    onLike: (commentId: string) => void;
    onEdit: (comment: Comment) => void;
    onReply: (comment: Comment) => void;
    onReport: (commentId: string) => void;
    onModerateUser: (userId: string, action: 'mute' | 'ban') => void;
    onPin: (commentId: string) => void;
}> = ({ comment, currentUser, onDelete, onLike, onEdit, onReply, onReport, onModerateUser, onPin }) => {
    const isLiked = currentUser ? comment.likes.includes(currentUser.uid) : false;
    const isOwner = currentUser?.uid === comment.userId;
    const isAdmin = currentUser?.isAdmin || false;
    const [isModMenuOpen, setIsModMenuOpen] = useState(false);
    const modMenuRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modMenuRef.current && !modMenuRef.current.contains(event.target as Node)) {
                setIsModMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`flex items-start gap-3 p-3 rounded-md ${comment.isPinned ? 'bg-cyan-900/40' : ''}`}>
            <img 
                src={comment.photoURL || DEFAULT_AVATAR_URL} 
                alt={comment.displayName} 
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-grow">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white text-sm">{comment.displayName}</p>
                    <p className="text-xs text-gray-400">
                        {comment.createdAt ? timeAgo(new Date(comment.createdAt.seconds * 1000)) : 'just now'}
                        {comment.isEdited && <em> (edited)</em>}
                    </p>
                    {comment.isPinned && (
                        <span className="flex items-center gap-1 text-xs text-cyan-300 font-semibold bg-cyan-900/50 px-2 py-0.5 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 3.636a1 1 0 010 1.414l-1.414 1.414a1 1 0 01-1.414-1.414l1.414-1.414a1 1 0 011.414 0zM14.95 3.636a1 1 0 011.414 0l1.414 1.414a1 1 0 01-1.414 1.414l-1.414-1.414a1 1 0 010-1.414zM10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                            Pinned
                        </span>
                    )}
                </div>
                <div className="text-gray-300 mt-1 whitespace-pre-wrap break-words">{parseText(comment.text)}</div>
                <div className="flex items-center gap-4 mt-2 relative">
                    <button 
                        onClick={() => onLike(comment.id)} 
                        disabled={!currentUser}
                        className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                            isLiked ? 'text-cyan-400' : 'text-gray-400 hover:text-cyan-400'
                        } disabled:cursor-not-allowed`}
                        aria-label="Like comment"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008 18.5a4 4 0 002.844-1.252l.05-.025a2 2 0 001.106-1.79v-5.43c0-1.042-.79-1.92-1.833-2.167C9.332 7.98 8.667 7.98 8.167 8.167 7.124 8.413 6 9.29 6 10.333zM10 1.5a1.5 1.5 0 011.5 1.5v6a1.5 1.5 0 01-3 0v-6A1.5 1.5 0 0110 1.5z" /></svg>
                        <span>{comment.likeCount || 0}</span>
                    </button>
                     <button 
                        onClick={() => onReply(comment)} 
                        disabled={!currentUser}
                        className="text-xs font-semibold text-gray-400 hover:text-cyan-400 transition-colors disabled:cursor-not-allowed"
                        aria-label="Reply to comment"
                    >
                        Reply
                    </button>
                    {isOwner && (
                        <>
                            <button onClick={() => onEdit(comment)} className="text-xs font-semibold text-gray-400 hover:text-cyan-400 transition-colors">Edit</button>
                            <button onClick={() => onDelete(comment.id)} className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors">Delete</button>
                        </>
                    )}
                    <button onClick={() => onReport(comment.id)} disabled={!currentUser} className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors disabled:cursor-not-allowed">Report</button>
                    {isAdmin && (
                        <div ref={modMenuRef} className="relative">
                            <button onClick={() => setIsModMenuOpen(prev => !prev)} className="text-xs font-semibold text-yellow-400 hover:text-yellow-300 transition-colors">Moderate</button>
                            {isModMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-36 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 animate-fade-in-fast">
                                    <ul className="text-sm">
                                        {!isOwner && <li><button onClick={() => {onDelete(comment.id); setIsModMenuOpen(false);}} className="w-full text-left px-3 py-2 hover:bg-gray-700">Delete</button></li>}
                                        <li><button onClick={() => {onPin(comment.id); setIsModMenuOpen(false);}} className="w-full text-left px-3 py-2 hover:bg-gray-700">{comment.isPinned ? 'Unpin' : 'Pin'}</button></li>
                                        <li><button onClick={() => {onModerateUser(comment.userId, 'mute'); setIsModMenuOpen(false);}} className="w-full text-left px-3 py-2 hover:bg-gray-700">Mute User</button></li>
                                        <li><button onClick={() => {onModerateUser(comment.userId, 'ban'); setIsModMenuOpen(false);}} className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-900/50">Ban User</button></li>
                                    </ul>
                                </div>
                            )}
                        </div>
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
    const [isLoading, setIsLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [postError, setPostError] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'top'>('newest');
    const [commentScope, setCommentScope] = useState<'episode' | 'series'>('episode');

    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const [editingComment, setEditingComment] = useState<Comment | null>(null);

    const threadId = useMemo(() => {
        return commentScope === 'series' ? `${animeId}` : `${animeId}-${episodeNumber}`;
    }, [animeId, episodeNumber, commentScope]);

    const structuredComments = useMemo(() => {
        const commentMap = new Map<string, Comment>(comments.map(c => [c.id, { ...c, replies: [] }]));
        const topLevelComments: Comment[] = [];
        
        comments.forEach(comment => {
            if (comment.parentId && commentMap.has(comment.parentId)) {
                commentMap.get(comment.parentId)?.replies?.push(commentMap.get(comment.id)!);
            } else {
                topLevelComments.push(commentMap.get(comment.id)!);
            }
        });

        // Sort replies by creation date
        commentMap.forEach(comment => {
            comment.replies?.sort((a,b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        });

        return topLevelComments;
    }, [comments]);


    const fetchComments = useCallback(async (loadMore = false) => {
        setIsLoading(true);
        try {
            const result = await getComments(threadId, sortBy, loadMore ? lastVisible : undefined);
            const filteredComments = result.comments.filter(c => c.userId !== user?.uid || !user?.isBanned);
            setComments(prev => loadMore ? [...prev, ...filteredComments] : filteredComments);
            setLastVisible(result.lastVisible);
            setHasMore(result.comments.length > 0 && !!result.lastVisible);
        } catch (error) {
            console.error("Failed to fetch comments", error);
        } finally {
            setIsLoading(false);
        }
    }, [threadId, sortBy, lastVisible, user]);

    useEffect(() => {
        setComments([]);
        setLastVisible(null);
        setHasMore(true);
        fetchComments(false);
    // fetchComments is memoized, adding it to dependency array is safe.
    }, [threadId, sortBy, fetchComments]);


    const handlePostComment = async (text: string, parentId?: string) => {
        if (!user) return;
        setIsPosting(true); setPostError('');
        try {
            const docId = await postComment(threadId, user, text, parentId);
            if (docId) {
                // To show immediately, we create a client-side comment.
                const newComment: Comment = {
                    id: docId,
                    threadId,
                    userId: user.uid,
                    displayName: user.displayName || 'User',
                    photoURL: user.photoURL || '',
                    text,
                    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
                    likes: [],
                    likeCount: 0,
                    parentId,
                    isEdited: false,
                    isPinned: false,
                };
                setComments(prev => [newComment, ...prev]);
                setReplyingTo(null);
            } else {
                throw new Error("Failed to get document ID.");
            }
        } catch (error) {
            setPostError('Failed to post comment. Please try again.');
        } finally {
            setIsPosting(false);
        }
    };
    
    const handleEditComment = async (text: string) => {
        if (!editingComment) return;
        setIsPosting(true); setPostError('');
        const success = await editComment(editingComment.id, text);
        if (success) {
            setComments(prev => prev.map(c => c.id === editingComment.id ? { ...c, text, isEdited: true } : c));
            setEditingComment(null);
        } else {
            setPostError('Failed to save changes.');
        }
        setIsPosting(false);
    };

    const handleDelete = async (commentId: string) => {
        const confirmText = user?.isAdmin ? "Are you sure you want to delete this comment? This cannot be undone." : "Are you sure you want to delete this comment? This will also delete all replies to it.";
        if (!window.confirm(confirmText)) return;
        const success = await deleteComment(commentId);
        if (success) {
            setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId));
        } else {
            alert("Failed to delete comment.");
        }
    };

    const handleLike = async (commentId: string) => {
        if (!user) return;
        setComments(prev => prev.map(c => {
            if (c.id === commentId) {
                const isLiked = c.likes.includes(user.uid);
                const newLikes = isLiked ? c.likes.filter(uid => uid !== user.uid) : [...c.likes, user.uid];
                return { ...c, likes: newLikes, likeCount: newLikes.length };
            }
            return c;
        }));
        await toggleLikeComment(commentId, user.uid);
    };
    
    const handleReport = async (commentId: string) => {
        if (!user) return;
        if (window.confirm("Are you sure you want to report this comment for review?")) {
            const success = await reportComment(commentId, user.uid);
            if(success) alert("Comment reported. Thank you for your feedback.");
            else alert("Failed to report comment.");
        }
    };
    
    const handleModerateUser = async (userId: string, action: 'mute' | 'ban') => {
        const actionText = action === 'mute' ? 'mute this user' : 'ban this user';
        if (!window.confirm(`Are you sure you want to ${actionText}?`)) return;
        const success = await moderateUser(userId, { [action]: true });
        if (success) {
            alert(`User has been ${action}d.`);
        } else {
            alert(`Failed to ${action} user.`);
        }
    };
    
    const handlePin = async (commentId: string) => {
        const success = await togglePinComment(commentId);
        if (success) {
            // Refetch to re-order correctly
            fetchComments(false);
        } else {
            alert("Failed to update pin status.");
        }
    };

    const renderCommentList = (commentList: Comment[]) => {
        return commentList.map(comment => (
            <div key={comment.id}>
                {editingComment?.id === comment.id ? (
                    <div className="p-3">
                       <CommentForm 
                         user={user!}
                         isPosting={isPosting}
                         onSubmit={handleEditComment}
                         initialText={editingComment.text}
                         onCancel={() => setEditingComment(null)}
                         placeholder="Edit your comment..."
                         submitLabel="Save"
                       />
                    </div>
                ) : (
                    <CommentItem
                        comment={comment}
                        currentUser={user}
                        onDelete={handleDelete}
                        onLike={handleLike}
                        onEdit={setEditingComment}
                        onReply={setReplyingTo}
                        onReport={handleReport}
                        onModerateUser={handleModerateUser}
                        onPin={handlePin}
                    />
                )}
                 <div className="pl-6 border-l-2 border-gray-800 ml-5">
                    {comment.replies && comment.replies.length > 0 && renderCommentList(comment.replies)}
                    {replyingTo?.id === comment.id && (
                        <div className="py-3">
                            <CommentForm
                                user={user!}
                                isPosting={isPosting}
                                onSubmit={(text) => handlePostComment(text, comment.id)}
                                onCancel={() => setReplyingTo(null)}
                                placeholder={`Replying to ${comment.displayName}...`}
                                submitLabel="Reply"
                            />
                        </div>
                    )}
                </div>
            </div>
        ));
    };


    return (
        <div className="bg-gray-900/80 rounded-lg shadow-lg flex flex-col">
            <div className="flex flex-wrap justify-between items-center gap-y-2 p-3 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">Comments</h3>
                    <select value={commentScope} onChange={(e) => setCommentScope(e.target.value as 'episode' | 'series')} className="bg-gray-700/80 text-white text-xs font-semibold rounded-md py-1 px-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500">
                        <option value="episode">This Episode</option>
                        <option value="series">Entire Series</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'newest' | 'top')} className="bg-gray-700/80 text-white text-xs font-semibold rounded-md py-1 px-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500">
                        <option value="newest">Newest</option>
                        <option value="top">Top</option>
                    </select>
                    <button onClick={() => fetchComments(false)} className="text-gray-400 hover:text-white" aria-label="Refresh comments"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg></button>
                </div>
            </div>
            <div className="p-3 border-b border-gray-700">
                {authLoading ? (<div className="h-24 bg-gray-700 rounded-lg animate-pulse"></div>) 
                : user ? (<CommentForm user={user} isPosting={isPosting} onSubmit={(text) => handlePostComment(text)} placeholder="Add a public comment..." submitLabel="Post" />) 
                : (
                    <div 
                        className="w-full flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg"
                    >
                        <img 
                            src={DEFAULT_AVATAR_URL} 
                            alt="Guest"
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1 opacity-50"
                        />
                        <div className="flex-grow">
                            <div className="w-full bg-gray-700/80 rounded-lg p-3 text-left">
                                <button onClick={onLoginClick} className="text-gray-400 hover:text-cyan-400 font-semibold transition-colors hover:underline">
                                    You must be logged in to comment...
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {postError && <p className="text-red-500 text-xs mt-1">{postError}</p>}
            </div>
            <div className="flex-grow overflow-y-auto max-h-[800px] divide-y divide-gray-800">
                {isLoading && comments.length === 0 ? (<div className="p-8"><LoadingSpinner /></div>) 
                : comments.length > 0 ? (renderCommentList(structuredComments)) 
                : (<p className="text-gray-500 text-center p-8">Be the first to comment!</p>)}
                
                {hasMore && !isLoading && (
                    <div className="p-4 text-center">
                        <button onClick={() => fetchComments(true)} className="text-cyan-400 font-semibold hover:underline">Load More Comments</button>
                    </div>
                )}
                {isLoading && comments.length > 0 && <div className="p-4"><LoadingSpinner /></div>}
            </div>
        </div>
    );
};

export default FirebaseComments;