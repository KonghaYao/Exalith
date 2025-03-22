"use client";

import { FileInfo } from "../FileList";
import { File, Folder, Download, Trash2 } from "lucide-react";
import { Checkbox, Popconfirm } from "antd";
import { join } from "path";

interface ListViewProps {
  files: FileInfo[];
  currentPath: string;
  selectedFiles: { path: string }[];
  onFileClick: (file: FileInfo) => void;
  onDirectoryClick: (path: string) => void;
  onDelete: (file: FileInfo) => void;
  onSelect: (filePath: string, isDirectory: boolean) => void;
  onUnselect: (filePath: string) => void;
}

export function ListView({
  files,
  currentPath,
  selectedFiles,
  onFileClick,
  onDirectoryClick,
  onDelete,
  onSelect,
  onUnselect,
}: ListViewProps) {
  const renderFileItem = (file: FileInfo) => {
    const filePath = join(currentPath, file.name);
    const isSelected = selectedFiles.some((f) => f.path === filePath);

    return (
      <div
        key={file.name}
        className={`flex items-center justify-between p-3 hover:bg-gray-100 ${file.isDirectory ? "cursor-pointer" : ""}`}
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
        <div className="flex items-center flex-1 min-w-0">
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
            className="mr-2"
          />
          {file.isDirectory ? (
            <Folder className="w-5 h-5 mx-3 text-blue-500 flex-shrink-0" />
          ) : (
            <File className="w-5 h-5 mx-3 text-gray-400 flex-shrink-0" />
          )}
          <span className="truncate text-md font-medium text-black">
            {file.name}
          </span>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {!file.isDirectory && (
            <span className="ml-3 text-xs text-gray-700">
              {formatSize(file.size)}
            </span>
          )}
          {!file.isDirectory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileClick(file);
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
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
              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors duration-200 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Popconfirm>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white divide-y divide-gray-200 flex-1 overflow-y-auto custom-scrollbar ">
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
