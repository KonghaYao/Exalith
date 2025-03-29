"use client";
import { useState, useEffect } from "react";
import { join } from "path";
import {
  ArrowUp,
  Upload,
  FolderPlus,
  RotateCw,
  LayoutGrid,
  List,
  MoveLeft,
  ChevronLeft,
} from "lucide-react";
import { SelectedFileGroup } from "./SelectedFileGroup";
import { Modal, message, Spin, Space, Button, Alert } from "antd";
import { useFileSystem } from "./FileSystemContext";
import { ListView } from "./FileViews/ListView";
import { GridView } from "./FileViews/GridView";
import { useFilePreview } from "../FilePreview/FilePreviewContext";
import { useTab } from "../TabContext";

export interface FileInfo {
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
  const filesystem = useFileSystem();
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const previewFile = useFilePreview();

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
  const tab = useTab();
  const handleFileClick = async (file: FileInfo, preview = false) => {
    if (!file.isDirectory) {
      try {
        if (preview) {
          tab.setTab("preview");
          return previewFile.preview(join(currentPath, file.name));
        }
        const path = `/api/oss/${encodeURIComponent(join(currentPath, file.name))}`;
        const response = await fetch(path);
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
        console.error(preview ? "Preview failed:" : "Download failed:", err);
        setError(
          preview ? "Failed to preview file" : "Failed to download file",
        );
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

  const [viewType, setViewType] = useState<"list" | "grid">("list");

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  return (
    <div className="h-full flex flex-col  bg-gray-100">
      <header className="flex items-center justify-between border-b p-4 ">
        <div className="flex items-center space-x-4">
          <Button
            onClick={navigateUp}
            disabled={!currentPath}
            type="primary"
            icon={<ChevronLeft className="w-4 h-4" />}
          ></Button>
        </div>
        <Space className="flex-none">
          <input
            type="file"
            onChange={handleUpload}
            className="hidden"
            id="file-upload"
          />
          <Button
            type="default"
            icon={
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-4 h-4" />
              </label>
            }
          ></Button>
          <Button
            type="default"
            icon={<RotateCw className="w-4 h-4" />}
            onClick={() => loadFiles()}
          ></Button>
          <Button
            type="default"
            icon={<FolderPlus className="w-4 h-4" />}
            onClick={() => setShowNewFolderDialog(true)}
          ></Button>

          <Button
            type={viewType === "list" ? "primary" : "default"}
            icon={<List className="w-4 h-4" />}
            onClick={() => setViewType("list")}
          />
          <Button
            type={viewType === "grid" ? "primary" : "default"}
            icon={<LayoutGrid className="w-4 h-4" />}
            onClick={() => setViewType("grid")}
          />
        </Space>
      </header>

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
        <div className="text-center py-12 flex-1 bg-white">
          <Spin size="large" tip="加载中..." />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 text-gray-400 flex-1 bg-white">
          <div className="text-6xl mb-4">📁</div>
          <p>当前文件夹为空</p>
        </div>
      ) : viewType === "list" ? (
        <ListView
          files={files}
          currentPath={currentPath}
          selectedFiles={filesystem.selectedFiles}
          onFileClick={handleFileClick}
          onDirectoryClick={(path) => setCurrentPath(path)}
          onDelete={handleDelete}
          onSelect={(filePath, isDirectory) =>
            filesystem.selectFile(filePath, isDirectory)
          }
          onUnselect={(filePath) => filesystem.unselectFile(filePath)}
        />
      ) : (
        <GridView
          files={files}
          currentPath={currentPath}
          selectedFiles={filesystem.selectedFiles}
          onFileClick={handleFileClick}
          onDirectoryClick={(path) => setCurrentPath(path)}
          onDelete={handleDelete}
          onSelect={(filePath, isDirectory) =>
            filesystem.selectFile(filePath, isDirectory)
          }
          onUnselect={(filePath) => filesystem.unselectFile(filePath)}
        />
      )}

      <footer className="px-4 py-2 flex flex-col gap-2">
        <span className="text-gray-600 text-sm">
          当前路径: /{currentPath || ""}
        </span>
        <nav className="flex justify-end">
          <SelectedFileGroup />
        </nav>
      </footer>
      <Alert
        message="点击选中文件，可以加入上下文"
        type="warning"
        className="text-center"
      ></Alert>
    </div>
  );
}
