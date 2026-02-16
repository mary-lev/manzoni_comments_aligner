import React from 'react';
import { Button } from "./ui/Button";
import { Upload, FileText, X } from 'lucide-react';

interface FileUploaderProps {
  commentsFile: File | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  commentsFile, 
  onFileUpload,
  onClearFile 
}) => {
  // Create a ref for the file input to reset it
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClearFile();
  };

  return (
    <div className="flex items-center gap-4 w-full md:w-auto">
      <Button
        variant="outline"
        className="relative w-full md:w-auto bg-transparent-white hover:bg-accent/10 text-primary border-accent/30 hover:border-accent/50 transition-colors duration-200 font-serif"
      >
        <input
          ref={fileInputRef}
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={onFileUpload}
          accept=".txt,.xml"
        />
        <Upload className="w-4 h-4 mr-2" />
        Choose Comments File
      </Button>
      {commentsFile && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-accent flex items-center bg-accent/10 backdrop-blur-sm px-3 py-1 rounded-full font-serif">
            <FileText className="w-4 h-4 mr-2" />
            {commentsFile.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto hover:bg-accent/10"
            onClick={handleClear}
          >
            <X className="w-4 h-4 text-accent" />
          </Button>
        </div>
      )}
    </div>
  );
};