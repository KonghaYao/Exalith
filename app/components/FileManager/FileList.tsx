"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { join } from "path";
import {
  File,
  Folder,
  ArrowUp,
  Upload,
  Trash2,
  FolderPlus,
} from "lucide-react";
import { Modal, message, Spin, Popconfirm, Space } from "antd";
import { Download } from "lucide-react";

interface FileInfo {
  name: string;
  size: number;
  created: string;
  modified: string;
  isDirectory: boolean;
}

interface DirectoryInfo extends FileInfo {
  contents: FileInfo[];
}

export default function FileList() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(
        `/api/oss/${encodeURIComponent(currentPath)}`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load files");
      }

      const data: DirectoryInfo = await response.json();
      setFiles(data.contents || []);
    } catch (err) {
      setError("Failed to load files");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024)
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const handleFileClick = async (file: FileInfo) => {
    if (!file.isDirectory) {
      try {
        const response = await fetch(
          `/api/oss/${encodeURIComponent(join(currentPath, file.name))}`,
        );
        if (!response.ok) throw new Error("Download failed");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        console.error("Download failed:", err);
        setError("Failed to download file");
      }
    }
  };

  const handleDelete = async (file: FileInfo) => {
    try {
      const response = await fetch(
        `/api/oss/${encodeURIComponent(join(currentPath, file.name))}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) throw new Error("Delete failed");
      loadFiles();
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete file");
    }
  };

  const handleCreateFolder = async () => {
    const trimmedName = newFolderName.trim();
    if (!trimmedName) {
      setError("请输入文件夹名称");
      return;
    }

    if (/[\\\/:\*\?"<>\|]/.test(trimmedName)) {
      setError('文件夹名称不能包含特殊字符: \\ / : * ? " < > |');
      return;
    }

    try {
      const response = await fetch(
        `/api/oss/${encodeURIComponent(join(currentPath, trimmedName))}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/x-directory",
          },
        },
      );

      if (!response.ok) throw new Error("创建文件夹失败");
      loadFiles();
      setShowNewFolderDialog(false);
      setNewFolderName("");
      setError("");
    } catch (err) {
      console.error("创建文件夹失败:", err);
      setError("创建文件夹失败，请稍后重试");
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    try {
      const file = files[0];
      const response = await fetch(
        `/api/oss/${encodeURIComponent(join(currentPath, file.name))}`,
        {
          method: "PUT",
          body: file,
        },
      );

      if (!response.ok) throw new Error("Upload failed");
      loadFiles();
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Failed to upload file");
    }
  };

  const navigateUp = () => {
    if (!currentPath) return;
    const parentPath = currentPath.split("/").slice(0, -1).join("/");
    setCurrentPath(parentPath);
  };

  const renderFileItem = (file: FileInfo) => (
    <div
      key={file.name}
      className={`flex items-center justify-between p-3 hover:bg-gray-50 ${file.isDirectory ? "cursor-pointer" : ""}`}
      onClick={() =>
        file.isDirectory && setCurrentPath(join(currentPath, file.name))
      }
    >
      <div className="flex items-center flex-1 min-w-0">
        {file.isDirectory ? (
          <Folder className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0" />
        ) : (
          <File className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />
        )}
        <span className="truncate text-sm font-medium text-gray-700">
          {file.name}
        </span>
        {!file.isDirectory && (
          <span className="ml-3 text-xs text-gray-400">
            {formatSize(file.size)}
          </span>
        )}
      </div>
      <div className="flex items-center space-x-2 ml-4">
        {!file.isDirectory && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFileClick(file);
            }}
            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
        <Popconfirm
          title="确认删除"
          description={`确定要删除 ${file.name} 吗？`}
          onConfirm={(e) => {
            e?.stopPropagation();
            handleDelete(file);
          }}
          okText="确定"
          cancelText="取消"
        >
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </Popconfirm>
      </div>
    </div>
  );

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={navigateUp}
            disabled={!currentPath}
            className="flex items-center p-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 disabled:opacity-50 transition-colors duration-200"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <span className="text-gray-600 text-sm">
            当前路径: /{currentPath || ""}
          </span>
        </div>
        <Space>
          <button
            onClick={() => setShowNewFolderDialog(true)}
            className="flex items-center p-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 cursor-pointer transition-colors duration-200"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
          <input
            type="file"
            onChange={handleUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex items-center p-2 text-sm bg-green-50 text-green-600 rounded-md hover:bg-green-100 cursor-pointer transition-colors duration-200"
          >
            <Upload className="w-4 h-4" />
          </label>
        </Space>
      </div>

      <Modal
        title="新建文件夹"
        open={showNewFolderDialog}
        onOk={handleCreateFolder}
        onCancel={() => {
          setShowNewFolderDialog(false);
          setNewFolderName("");
        }}
        okText="创建"
        cancelText="取消"
      >
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="请输入文件夹名称"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
        />
      </Modal>

      {loading ? (
        <div className="text-center py-12">
          <Spin size="large" tip="加载中..." />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-6xl mb-4">📁</div>
          <p>当前文件夹为空</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg divide-y divide-gray-100 flex-1 overflow-y-auto custom-scrollbar">
          {files.map(renderFileItem)}
        </div>
      )}
    </div>
  );
}
