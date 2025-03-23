"use client";

import { FileInfo } from "../FileList";
import { File, Folder, Download, Trash2, Menu } from "lucide-react";
import { Checkbox, Dropdown, MenuProps, Popconfirm } from "antd";
import { join } from "path";

interface GridViewProps {
  files: FileInfo[];
  currentPath: string;
  selectedFiles: { path: string }[];
  onFileClick: (file: FileInfo, preview?: boolean) => void;
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
    const items: MenuProps["items"] = [
      {
        key: "preview",
        label: "预览",
        onClick: () => {
          onFileClick(file, true);
        },
      },
      {
        key: "download",
        label: "下载",
        onClick: () => {
          onFileClick(file);
        },
      },
      {
        key: "delete",
        label: "删除",
        onClick() {
          onDelete(file);
        },
      },
    ];

    return (
      <div
        key={file.name}
        className={`relative p-4 bg-white rounded-lg border border-gray-300 hover:border-gray-400 transition-colors ${file.isDirectory ? "cursor-pointer" : ""}`}
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
        onDoubleClick={(e) => {
          if (!file.isDirectory) {
            onFileClick(file, true);
          }
        }}
      >
        <div className="absolute top-2 left-2 w-full flex flex-row justify-between">
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
          {!file.isDirectory && (
            <Dropdown menu={{ items }}>
              <Menu className="text-gray-700 w-4 h-4 mr-4 cursor-pointer"></Menu>
            </Dropdown>
          )}
        </div>
        <div className="flex flex-col items-center gap-2 pt-4">
          {file.isDirectory ? (
            <Folder className="w-12 h-12 text-blue-500" />
          ) : (
            <File className="w-12 h-12 text-gray-400" />
          )}
          <span className="text-black text-center break-all line-clamp-2">
            {file.name}
          </span>
          {!file.isDirectory && (
            <span className="text-xs text-gray-700">
              {formatSize(file.size)}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="custom-scrollbar flex-1 bg-white">
      <div className="grid grid-cols-4 gap-4 overflow-y-auto p-4">
        {files.map(renderFileItem)}
      </div>
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
