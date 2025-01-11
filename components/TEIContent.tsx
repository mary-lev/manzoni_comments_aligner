import React from 'react';

interface TEIContentProps {
  renderedTEI: string | null;
  highlightedText: { start: number; end: number } | null;
  selectedTextRange: { start: number; end: number } | null;
  isManualAlignmentMode: boolean;
}

export const TEIContent: React.FC<TEIContentProps> = ({
  renderedTEI,
  highlightedText,
  selectedTextRange,
  isManualAlignmentMode,
}) => {
  const renderTEIContent = (content: string) => {
    return content.replace(
      /<span class="tei-w" data-id="([^"]+)"([^>]*)>([^<]+)<\/span>/g,
      (match, id, attrs, text) => {
        const wordId = parseInt(id.split('_')[1]);
        const isHighlighted = highlightedText &&
          wordId >= highlightedText.start &&
          wordId <= highlightedText.end;
        const isInSelectedRange = selectedTextRange &&
          wordId >= selectedTextRange.start &&
          wordId <= selectedTextRange.end;

        return `<span 
          class="tei-w ${isHighlighted ? 'bg-yellow-200' : ''} 
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
    <div className="h-[700px] overflow-y-auto p-6 bg-transparent-white rounded-lg shadow-md scrollbar-thin">
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

