'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from './ui/sheet';
import {
    Menu,
    PanelLeftClose,
    PanelLeftOpen,
    MessageSquarePlus,
    History,
    LogIn,
    UserPlus,
    Trash2,
    Edit2,
    Check,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import FileUpload from './FileUpload';

interface Chat {
    id: string;
    title: string;
    date: string;
    preview?: string;
}

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const { isSignedIn, user } = useUser();
    const [chats, setChats] = useState<Chat[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth < 768) setIsOpen(false);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);

        // Load chats from local storage
        if (isSignedIn && user?.id) {
            const savedChats = localStorage.getItem(`chats_${user.id}`);
            if (savedChats) {
                try {
                    setChats(JSON.parse(savedChats));
                } catch (e) {
                    console.error("Failed to parse chats", e);
                }
            }
        } else {
            setChats([]);
        }

        return () => window.removeEventListener('resize', checkMobile);
    }, [isSignedIn, user?.id]);

    // Listen for storage changes from Chatbot
    useEffect(() => {
        const handleStorageChange = () => {
            if (isSignedIn && user?.id) {
                const savedChats = localStorage.getItem(`chats_${user.id}`);
                if (savedChats) {
                    try {
                        setChats(JSON.parse(savedChats));
                    } catch (e) {
                        console.error("Failed to parse chats", e);
                    }
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [isSignedIn, user?.id]);

    const handleNewChat = () => {
        // Clear current chat messages
        if (user?.id) {
            localStorage.removeItem(`chat_messages_${user.id}`);
            window.location.reload();
        }
    };

    const handleDeleteChat = (chatId: string) => {
        if (!user?.id) return;
        const updatedChats = chats.filter(c => c.id !== chatId);
        setChats(updatedChats);
        localStorage.setItem(`chats_${user.id}`, JSON.stringify(updatedChats));

        // If deleting current chat, clear messages
        if (chatId === 'default') {
            localStorage.removeItem(`chat_messages_${user.id}`);
        }
    };

    const handleEditChat = (chatId: string, newTitle: string) => {
        if (!user?.id) return;
        const updatedChats = chats.map(c =>
            c.id === chatId ? { ...c, title: newTitle } : c
        );
        setChats(updatedChats);
        localStorage.setItem(`chats_${user.id}`, JSON.stringify(updatedChats));
        setEditingId(null);
        setEditTitle('');
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            {/* Header Section */}
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg">PDF RAG</h2>
                            <p className="text-xs text-gray-500">AI Assistant</p>
                        </div>
                    </div>
                    {!isMobile && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(false)}
                            className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-all"
                        >
                            <PanelLeftClose className="h-4 w-4 text-gray-500" />
                        </Button>
                    )}
                </div>

                {isSignedIn && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Button
                            onClick={handleNewChat}
                            className="w-full h-11 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 rounded-xl font-medium"
                        >
                            <MessageSquarePlus className="w-4 h-4 mr-2" />
                            New Chat
                        </Button>
                    </motion.div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
                {isSignedIn ? (
                    <>
                        {/* File Upload Section */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="mb-3 flex items-center gap-2 px-2">
                                <div className="w-1 h-4 bg-gradient-to-b from-violet-500 to-fuchsia-500 rounded-full" />
                                <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Your Documents
                                </h3>
                            </div>
                            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200/50 dark:border-gray-800/50 shadow-sm hover:shadow-md transition-shadow">
                                <FileUpload />
                            </div>
                        </motion.div>

                        {/* Chat History Section */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="mb-3 flex items-center gap-2 px-2">
                                <History className="w-3.5 h-3.5 text-violet-500" />
                                <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Recent Chats
                                </h3>
                            </div>
                            <div className="space-y-1.5">
                                <AnimatePresence>
                                    {chats.length === 0 ? (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="text-sm text-gray-400 italic px-3 py-6 text-center"
                                        >
                                            No chats yet. Start a conversation!
                                        </motion.p>
                                    ) : (
                                        chats.map((chat, index) => (
                                            <motion.div
                                                key={chat.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group relative"
                                            >
                                                {editingId === chat.id ? (
                                                    <div className="flex items-center gap-1 p-2 bg-white dark:bg-gray-800 rounded-lg border border-violet-500">
                                                        <input
                                                            type="text"
                                                            value={editTitle}
                                                            onChange={(e) => setEditTitle(e.target.value)}
                                                            className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-gray-100"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleEditChat(chat.id, editTitle);
                                                                } else if (e.key === 'Escape') {
                                                                    setEditingId(null);
                                                                    setEditTitle('');
                                                                }
                                                            }}
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => handleEditChat(chat.id, editTitle)}
                                                        >
                                                            <Check className="h-3 w-3 text-green-500" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => {
                                                                setEditingId(null);
                                                                setEditTitle('');
                                                            }}
                                                        >
                                                            <X className="h-3 w-3 text-red-500" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg transition-all cursor-pointer group-hover:pr-20">
                                                        <MessageSquarePlus className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="truncate font-medium">{chat.title}</p>
                                                            {chat.preview && (
                                                                <p className="text-xs text-gray-400 truncate">{chat.preview}</p>
                                                            )}
                                                        </div>
                                                        <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingId(chat.id);
                                                                    setEditTitle(chat.title);
                                                                }}
                                                            >
                                                                <Edit2 className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-500"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteChat(chat.id);
                                                                }}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6"
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 rounded-2xl flex items-center justify-center">
                            <LogIn className="w-10 h-10 text-violet-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Welcome Back!</h3>
                            <p className="text-sm text-gray-500 max-w-[200px]">
                                Sign in to manage your documents and chat history
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 w-full max-w-[240px]">
                            <SignInButton mode="modal">
                                <Button
                                    variant="outline"
                                    className="w-full h-11 border-2 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950 transition-all rounded-xl font-medium"
                                >
                                    <LogIn className="w-4 h-4 mr-2" />
                                    Sign In
                                </Button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <Button
                                    className="w-full h-11 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 text-white shadow-lg shadow-violet-500/25 transition-all rounded-xl font-medium"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Sign Up
                                </Button>
                            </SignUpButton>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Footer with User Profile */}
            {isSignedIn && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-4 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm"
                >
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-violet-500/5 via-fuchsia-500/5 to-pink-500/5 hover:from-violet-500/10 hover:via-fuchsia-500/10 hover:to-pink-500/10 transition-all border border-violet-500/10">
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: "w-10 h-10 ring-2 ring-violet-500/20"
                                }
                            }}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {user?.fullName || user?.username || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {user?.primaryEmailAddress?.emailAddress}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );

    return (
        <>
            {/* Mobile Trigger */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <Sheet>
                    <SheetTrigger asChild>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-11 w-11 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-800 shadow-xl hover:shadow-2xl hover:border-violet-500/50 transition-all rounded-xl"
                            >
                                <Menu className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                            </Button>
                        </motion.div>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="w-[300px] p-0 border-r-2 border-gray-200 dark:border-gray-800"
                    >
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <SidebarContent />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop Sidebar */}
            <AnimatePresence initial={false}>
                {isOpen && !isMobile && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                        className="hidden md:flex h-screen border-r-2 border-gray-200 dark:border-gray-800 flex-col relative shrink-0 overflow-hidden shadow-2xl"
                    >
                        <div className="h-full w-[320px]">
                            <SidebarContent />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Toggle Button (when closed) */}
            {!isOpen && !isMobile && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hidden md:block fixed top-6 left-6 z-50"
                >
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsOpen(true)}
                            className="h-12 w-12 bg-white dark:bg-gray-900 shadow-2xl border-2 border-gray-200 dark:border-gray-800 hover:bg-violet-50 dark:hover:bg-violet-950 hover:border-violet-500 transition-all rounded-xl"
                        >
                            <PanelLeftOpen className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </Button>
                    </motion.div>
                </motion.div>
            )}
        </>
    );
}
