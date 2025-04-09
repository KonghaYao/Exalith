"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { join } from "path";

interface FileInfo {
  name: string;
  size: number;
  created: string;
  modified: string;
  isDirectory: boolean;
}

interface SelectedFile {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface FileSystemContextType {
  selectedFiles: SelectedFile[];
  currentPath: string;
  files: FileInfo[];
  loading: boolean;
  error: string;
  setError: (str: string) => void
  setCurrentPath: (path: string) => void;
  selectFile: (filePath: string, isDirectory?: boolean) => void;
  unselectFile: (filePath: string) => void;
  clearSelection: () => void;
  loadFiles: () => Promise<void>;
  navigateUp: () => void;
  getFile: (filePath: string, preview: boolean) => Promise<Blob>;
}

const FileSystemContext = createContext<FileSystemContextType | null>(null);

export function useFileSystem() {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error("useFileSystem must be used within a FileSystemProvider");
  }
  return context;
}

export function FileSystemProvider({ children }: { children: ReactNode }) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      const data = await response.json();
      setFiles(data.contents || []);
    } catch (err) {
      setError("Failed to load files");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadFiles();
  }, [currentPath]);
  const selectFile = useCallback((filePath: string, isDirectory = false) => {
    const fileName = filePath.split("/").pop() || "";
    setSelectedFiles((prev) => [
      ...prev,
      { name: fileName, path: filePath, isDirectory },
    ]);
  }, []);

  const unselectFile = useCallback((filePath: string) => {
    setSelectedFiles((prev) => prev.filter((file) => file.path !== filePath));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  const navigateUp = useCallback(() => {
    if (currentPath === "/") return;
    const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
    setCurrentPath(parentPath);
  }, [currentPath]);

  const getFile = useCallback(async (filePath: string, preview: boolean) => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(
        `/api/oss/${encodeURIComponent(filePath)}` +
        (preview ? "?preview=true" : ""),
      );

      if (!response.ok) {
        throw new Error("Failed to get file");
      }

      return await response.blob();
    } catch (err) {
      setError("Failed to get file");
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    selectedFiles,
    currentPath,
    files,
    loading,
    error,
    setCurrentPath,
    selectFile,
    unselectFile,
    clearSelection,
    loadFiles,
    navigateUp,
    getFile,
    setLoading,
    setError
  };

  return (
    <FileSystemContext.Provider value={value}>
      {children}
    </FileSystemContext.Provider>
  );
}
