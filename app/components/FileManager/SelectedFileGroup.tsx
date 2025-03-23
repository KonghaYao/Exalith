"use client";

import { File, Folder, X } from "lucide-react";
import { useFileSystem } from "./FileSystemContext";

export function SelectedFileGroup() {
  const { selectedFiles, unselectFile } = useFileSystem();

  if (selectedFiles.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 w-full">
      {selectedFiles.map((file) => {
        const isDirectory = file.isDirectory;
        return (
          <div
            key={file.path}
            className="flex items-center gap-2 border border-gray-300 px-2 rounded-md group cursor-default bg-gradient-to-r from-white to-gray-100 hover:from-white hover:to-gray-100 transition-colors duration-200"
          >
            <button
              onClick={() => unselectFile(file.path)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <span className="group-hover:hidden flex place-content-center">
                {isDirectory ? (
                  <Folder className="w-4 h-4 text-blue-500" />
                ) : (
                  <File className="w-4 h-4 text-gray-400" />
                )}
              </span>
              <span className="hidden group-hover:flex place-content-center">
                <X className="w-4 h-4" />
              </span>
            </button>
            <span className="text-sm truncate max-w-[150px] text-gray-700">
              {file.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
