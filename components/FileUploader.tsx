import React from 'react';
import { Button } from "./ui/Button";
import { Upload, FileText } from 'lucide-react';

interface FileUploaderProps {
  commentsFile: File | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ commentsFile, onFileUpload }) => {
  return (
    <div className="flex items-center gap-4 w-full md:w-auto">
      <Button
        variant="outline"
        className="relative w-full md:w-auto bg-transparent-white hover:bg-accent/10 text-primary border-accent/30 hover:border-accent/50 transition-colors duration-200 font-serif"
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={onFileUpload}
          accept=".txt"
        />
        <Upload className="w-4 h-4 mr-2" />
        Choose Comments File
      </Button>
      {commentsFile && (
        <span className="text-sm text-accent flex items-center bg-accent/10 backdrop-blur-sm px-3 py-1 rounded-full font-serif">
          <FileText className="w-4 h-4 mr-2" />
          {commentsFile.name}
        </span>
      )}
    </div>
  );
};

