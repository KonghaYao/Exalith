"use client";

import { useState, useRef, useEffect } from "react";
import { useFileSystem } from "./FileManager/FileSystemContext";
import { message } from "antd";
import { Upload } from "lucide-react";
import { join } from "path";

export function GlobalDropZone({ children }: { children: React.ReactNode }) {
    const [isDragging, setIsDragging] = useState(false);
    const filesystem = useFileSystem();
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const dragCounter = useRef(0);

    useEffect(() => {
        const handleDragEnter = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current++;
            setIsDragging(true);
        };

        const handleDragLeave = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current--;
            if (dragCounter.current === 0) {
                setIsDragging(false);
            }
        };

        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const handleDrop = async (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current = 0;
            setIsDragging(false);

            const files = Array.from(e.dataTransfer?.files || []);
            if (files.length === 0) return;

            try {
                for (const file of files) {
                    const response = await fetch(
                        `/api/oss/${encodeURIComponent(join(filesystem.currentPath, file.name))}`,
                        {
                            method: "PUT",
                            body: file,
                        }
                    );

                    if (!response.ok) throw new Error("Upload failed");

                    // 上传成功后自动选中文件
                    filesystem.selectFile(join(filesystem.currentPath, file.name));
                }

                message.success(`成功上传 ${files.length} 个文件`);
                filesystem.loadFiles();
            } catch (err) {
                console.error("Upload failed:", err);
                message.error("文件上传失败");
            }
        };

        const dropZone = dropZoneRef.current;
        if (dropZone) {
            dropZone.addEventListener('dragenter', handleDragEnter);
            dropZone.addEventListener('dragleave', handleDragLeave);
            dropZone.addEventListener('dragover', handleDragOver);
            dropZone.addEventListener('drop', handleDrop);

            return () => {
                dropZone.removeEventListener('dragenter', handleDragEnter);
                dropZone.removeEventListener('dragleave', handleDragLeave);
                dropZone.removeEventListener('dragover', handleDragOver);
                dropZone.removeEventListener('drop', handleDrop);
            };
        }
    }, [filesystem]);

    return (
        <div className="flex-1 relative" ref={dropZoneRef}>
            {isDragging && (
                <div className="fixed inset-0 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center z-[9999] pointer-events-none">
                    <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center gap-4 pointer-events-none">
                        <Upload className="w-12 h-12 text-blue-500" />
                        <p className="text-lg font-medium">拖放文件到此处上传</p>
                    </div>
                </div>
            )}
            {children}
        </div>
    );
} 