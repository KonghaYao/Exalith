import { createContext, useContext, useState } from "react";
import { useFileSystem } from "../FileManager/FileSystemContext";

interface PreviewState {
  filePath: string | null;
  previewType?: string;
  loading: boolean;
  error: string | null;
  previewData: Blob | null;
}

interface FilePreviewContextType {
  previewState: PreviewState;
  setPreview: (filePath: string, previewType?: string) => void;
  preview: (filePath: string, previewType?: string) => void;
  clearPreview: () => void;
}

const FilePreviewContext = createContext<FilePreviewContextType | undefined>(
  undefined,
);

export const FilePreviewProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [previewState, setPreviewState] = useState<PreviewState>({
    filePath: null,
    previewType: undefined,
    loading: false,
    error: null,
    previewData: null,
  });

  const setPreview = (filePath: string, previewType?: string) => {
    setPreviewState((prev) => ({
      ...prev,
      filePath,
      previewType,
      error: null,
      previewData: null,
    }));
  };

  const clearPreview = () => {
    setPreviewState({
      filePath: null,
      previewType: undefined,
      loading: false,
      error: null,
      previewData: null,
    });
  };
  const filesystem = useFileSystem();
  const preview = async (filePath: string, previewType?: string) => {
    setPreview(filePath, previewType);

    try {
      setPreviewState((prev) => ({ ...prev, loading: true, error: null }));
      const blob = await filesystem.getFile(filePath!);
      setPreviewState((prev) => ({
        ...prev,
        loading: false,
        previewData: blob,
      }));
    } catch (error) {
      setPreviewState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to load preview",
      }));
    }
  };
  return (
    <FilePreviewContext.Provider
      value={{
        previewState,
        setPreview,
        clearPreview,
        preview,
      }}
    >
      {children}
    </FilePreviewContext.Provider>
  );
};

export const useFilePreview = () => {
  const context = useContext(FilePreviewContext);
  if (context === undefined) {
    throw new Error("useFilePreview must be used within a FilePreviewProvider");
  }
  return context;
};
