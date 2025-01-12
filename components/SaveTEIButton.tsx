import React from 'react';
import { Button } from "./ui/Button";
import { FileText } from 'lucide-react';

interface SaveTEIButtonProps {
  alignedComments: Array<{
    start: number | null;
    end: number | null;
  }>;
  onSave: () => void;
}

export const SaveTEIButton: React.FC<SaveTEIButtonProps> = ({ 
  alignedComments,
  onSave 
}) => {
  const unalignedCount = alignedComments.filter(
    comment => comment.start === null || comment.end === null
  ).length;

  const isFullyAligned = unalignedCount === 0 && alignedComments.length > 0;
  
  const tooltipText = !isFullyAligned && alignedComments.length > 0
    ? `${unalignedCount} ${unalignedCount === 1 ? 'comment needs' : 'comments need'} to be aligned before saving`
    : '';

  return (
    <Button
      onClick={onSave}
      disabled={!isFullyAligned}
      title={tooltipText}
      className={`relative font-serif text-lg px-8 py-6 rounded-lg flex items-center gap-2
        ${isFullyAligned 
          ? 'bg-accent hover:bg-accent/90 text-white' 
          : 'bg-transparent border-2 border-accent/30 text-accent/70 hover:bg-accent/5'}`}
    >
      <FileText className="w-4 h-4" />
      Save TEI File
      {!isFullyAligned && alignedComments.length > 0 && (
        <span className="ml-2 text-sm bg-accent/10 px-2 py-0.5 rounded-full">
          {unalignedCount} unaligned
        </span>
      )}
    </Button>
  );
};