"use client"

import React, { useRef, useState } from 'react'
import { Upload, Loader2, FileText, Check, X } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const FileUpload: React.FC = () => {
    const { user, isSignedIn } = useUser();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<string | null>(null);

    const handleClick = () => {
        if (!isSignedIn) {
            toast.error("Please sign in to upload files");
            return;
        }
        fileInputRef.current?.click();
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];

        // Validate file type
        if (file.type !== 'application/pdf') {
            toast.error("Only PDF files are supported");
            e.target.value = '';
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size must be less than 10MB");
            e.target.value = '';
            return;
        }

        if (!isSignedIn || !user) {
            toast.error("Please sign in to upload files");
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', user.id);

        try {
            const response = await fetch('http://localhost:8080/uploads/pdf', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                setUploadedFile(file.name);
                toast.success(`${file.name} uploaded successfully!`);
            } else {
                toast.error(`Upload failed: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error uploading file", error);
            toast.error("Error uploading file. Please try again.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }

    return (
        <div className="space-y-3">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf"
                disabled={!isSignedIn}
            />

            <motion.button
                onClick={handleClick}
                disabled={isUploading || !isSignedIn}
                whileHover={isSignedIn && !isUploading ? { scale: 1.02 } : {}}
                whileTap={isSignedIn && !isUploading ? { scale: 0.98 } : {}}
                className={cn(
                    "w-full p-4 rounded-xl border-2 border-dashed transition-all duration-300 text-left group",
                    isSignedIn
                        ? uploadedFile
                            ? "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20"
                            : "border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/20 hover:bg-violet-100/50 dark:hover:bg-violet-900/30 hover:border-violet-400 dark:hover:border-violet-600 cursor-pointer"
                        : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-50"
                )}
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                        uploadedFile
                            ? "bg-green-500"
                            : isUploading
                                ? "bg-violet-500"
                                : "bg-violet-500/10 group-hover:bg-violet-500/20"
                    )}>
                        <AnimatePresence mode="wait">
                            {uploadedFile && !isUploading ? (
                                <motion.div
                                    key="success"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                >
                                    <Check className="w-5 h-5 text-white" />
                                </motion.div>
                            ) : isUploading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="upload"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <Upload className={cn(
                                        "w-5 h-5 transition-colors",
                                        isSignedIn ? "text-violet-600 dark:text-violet-400" : "text-gray-400"
                                    )} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={cn(
                            "text-sm font-semibold transition-colors truncate",
                            isSignedIn ? "text-gray-900 dark:text-gray-100" : "text-gray-500"
                        )}>
                            {isUploading ? "Uploading..." : uploadedFile || "Upload PDF"}
                        </p>
                        <p className={cn(
                            "text-xs transition-colors",
                            isSignedIn ? "text-gray-500" : "text-gray-400"
                        )}>
                            {isSignedIn
                                ? uploadedFile
                                    ? "File attached and ready"
                                    : "Click to browse files"
                                : "Sign in to upload"}
                        </p>
                    </div>
                    {uploadedFile && !isUploading && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                setUploadedFile(null);
                            }}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                        >
                            <X className="w-4 h-4 text-red-500" />
                        </div>
                    )}
                    {!uploadedFile && (
                        <FileText className={cn(
                            "w-5 h-5 transition-colors",
                            isSignedIn ? "text-violet-400" : "text-gray-400"
                        )} />
                    )}
                </div>
            </motion.button>

            <div className="text-xs text-gray-500 px-1 space-y-1">
                <p>• Supported: PDF files only</p>
                <p>• Max size: 10MB</p>
            </div>
        </div>
    )
}

export default FileUpload
