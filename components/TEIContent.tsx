import React from 'react';
import { Button } from "./ui/Button";

interface TEIContentProps {
  renderedTEI: string | null;
  highlightedText: { start: number; end: number } | null;
  selectedTextRange: { start: number; end: number } | null;
  isManualAlignmentMode: boolean;
  isTextSelected: boolean;
  onCancelSelection: () => void;
}

export const TEIContent: React.FC<TEIContentProps> = ({
  renderedTEI,
  highlightedText,
  selectedTextRange,
  isManualAlignmentMode,
  isTextSelected,
  onCancelSelection,
}) => {
  const renderTEIContent = (content: string) => {
    return content.replace(
      /<span class="tei-w" data-id="([^"]+)"([^>]*)>([^<]+)<\/span>/g,
      (match, id, attrs, text) => {
        const wordId = parseInt(id.split('_')[1]);
        const isHighlighted = !isManualAlignmentMode && highlightedText &&
          wordId >= highlightedText.start &&
          wordId <= highlightedText.end;
        const isInSelectedRange = selectedTextRange &&
          wordId >= selectedTextRange.start &&
          wordId <= selectedTextRange.end;

        return `<span 
          class="tei-w ${isHighlighted ? 'bg-accent/30 ring-1 ring-accent/50 rounded-sm' : ''}
                 ${isInSelectedRange ? 'bg-accent/20' : ''} 
                 ${isManualAlignmentMode ? 'cursor-text' : 'cursor-pointer'}"
          data-id="${id}"
          id="word-${wordId}"
          ${!isManualAlignmentMode ? `onclick="window.handleWordClick(${wordId})"` : ''}
          ${attrs}>${text}</span>`;
      }
    );
  };

  return (
    <div className="relative h-[700px] overflow-y-auto p-6 bg-transparent-white rounded-lg shadow-md scrollbar-thin">
      {isManualAlignmentMode && isTextSelected && (
        <div className="absolute top-2 right-2 z-10">
          <Button
            onClick={onCancelSelection}
            size="sm"
            className="font-serif"
          >
            Cancel Selection
          </Button>
        </div>
      )}
      {renderedTEI ? (
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{
            __html: renderTEIContent(renderedTEI),
          }}
        />
      ) : (
        <div className="text-center text-gray-500 mt-8">
          No TEI content loaded. Please select a chapter.
        </div>
      )}
    </div>
  );
};

