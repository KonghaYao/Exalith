"use client";

import { FileInfo } from "../FileList";
import { File, Folder, Download, Trash2 } from "lucide-react";
import { Checkbox, Popconfirm } from "antd";
import { join } from "path";

interface GridViewProps {
  files: FileInfo[];
  currentPath: string;
  selectedFiles: { path: string }[];
  onFileClick: (file: FileInfo) => void;
  onDirectoryClick: (path: string) => void;
  onDelete: (file: FileInfo) => void;
  onSelect: (filePath: string, isDirectory: boolean) => void;
  onUnselect: (filePath: string) => void;
}

export function GridView({
  files,
  currentPath,
  selectedFiles,
  onFileClick,
  onDirectoryClick,
  onDelete,
  onSelect,
  onUnselect,
}: GridViewProps) {
  const renderFileItem = (file: FileInfo) => {
    const filePath = join(currentPath, file.name);
    const isSelected = selectedFiles.some((f) => f.path === filePath);

    return (
      <div
        key={file.name}
        className={`relative p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition-colors ${file.isDirectory ? "cursor-pointer" : ""}`}
        onClick={(e) => {
          if (file.isDirectory) {
            onDirectoryClick(join(currentPath, file.name));
          } else {
            if (isSelected) {
              onUnselect(filePath);
            } else {
              onSelect(filePath, file.isDirectory);
            }
          }
        }}
      >
        <div className="absolute top-2 left-2">
          <Checkbox
            checked={isSelected}
            onClick={(e) => {
              e.stopPropagation();
              if (isSelected) {
                onUnselect(filePath);
              } else {
                onSelect(filePath, file.isDirectory);
              }
            }}
          />
        </div>
        <div className="flex flex-col items-center gap-2 pt-4">
          {file.isDirectory ? (
            <Folder className="w-12 h-12 text-blue-500" />
          ) : (
            <File className="w-12 h-12 text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-700 text-center break-all line-clamp-2">
            {file.name}
          </span>
          {!file.isDirectory && (
            <span className="text-xs text-gray-400">
              {formatSize(file.size)}
            </span>
          )}
        </div>
        <div className="absolute top-2 right-2 flex gap-1">
          {!file.isDirectory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileClick(file);
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors duration-200 bg-white rounded-full hover:bg-blue-50"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          <Popconfirm
            title="确认删除"
            description={`确定要删除 ${file.name} 吗？`}
            onConfirm={(e) => {
              e?.stopPropagation();
              onDelete(file);
            }}
            okText="确定"
            cancelText="取消"
          >
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors duration-200 bg-white rounded-full hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Popconfirm>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 overflow-y-auto custom-scrollbar">
      {files.map(renderFileItem)}
    </div>
  );
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  if (size < 1024 * 1024 * 1024)
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
