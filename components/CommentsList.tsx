import React from 'react';
import { AlignedComment } from "../services/api";
import { Button } from "./ui/Button";
import { X } from 'lucide-react';


interface CommentsListProps {
  alignedComments: AlignedComment[];
  commentsText: string | null;
  highlightedComment: number | null;
  isManualAlignmentMode: boolean;
  selectedTextRange: { start: number; end: number } | null;
  setAlignedComments: React.Dispatch<React.SetStateAction<AlignedComment[]>>;
  setHighlightedComment: React.Dispatch<React.SetStateAction<number | null>>;
  setHighlightedText: React.Dispatch<React.SetStateAction<{ start: number; end: number } | null>>;
  commentRefs: React.MutableRefObject<{ [key: number]: HTMLDivElement | null }>;
  setIsManualAlignmentMode: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedTextRange: React.Dispatch<React.SetStateAction<{ start: number; end: number } | null>>;
  setActiveAlignmentCommentId: React.Dispatch<React.SetStateAction<number | null>>;
  activeAlignmentCommentId: number | null;
}

export const CommentsList: React.FC<CommentsListProps> = ({
  alignedComments,
  commentsText,
  highlightedComment,
  isManualAlignmentMode,
  selectedTextRange,
  setAlignedComments,
  setHighlightedComment,
  setHighlightedText,
  commentRefs,
  setIsManualAlignmentMode,
  setSelectedTextRange,
  setActiveAlignmentCommentId,
  activeAlignmentCommentId,
}) => {
  const renderComment = (comment: AlignedComment, index: number) => {
    const isAligned = comment.start !== null && comment.end !== null;
    const isHighlighted = highlightedComment === comment.number;
    const isActiveForAlignment = activeAlignmentCommentId === comment.number;

    const handleCancelAlignment = () => {
        setIsManualAlignmentMode(false);
        setSelectedTextRange(null);
        setActiveAlignmentCommentId(null);
      };

    const handleAlignmentClick = () => {
      if (!isManualAlignmentMode) {
        setIsManualAlignmentMode(true);
        setActiveAlignmentCommentId(comment.number);
        setHighlightedComment(comment.number);
      } else if (selectedTextRange && isActiveForAlignment) {
        const updatedComments = alignedComments.map(c =>
          c.number === comment.number
            ? {
              ...c,
              start: selectedTextRange.start,
              end: selectedTextRange.end,
              status: 'OK'
            }
            : c
        );
        setAlignedComments(updatedComments);
        setIsManualAlignmentMode(false);
        setSelectedTextRange(null);
        setActiveAlignmentCommentId(null);
      }
    };

    const handleCommentClick = () => {
      if (isAligned) {
        setHighlightedComment(comment.number);
        setHighlightedText({ start: comment.start!, end: comment.end! });
        const element = document.getElementById(`word-${comment.start}`);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    };

    const setCommentRef = (el: HTMLDivElement | null) => {
      if (el) {
        commentRefs.current[comment.number] = el;
      }
    };

    return (
      <div
        key={index}
        ref={setCommentRef}
        className={`mb-4 p-4 rounded-lg transition-all duration-200 ${
          isAligned ? (isHighlighted ? 'bg-yellow-100/50' : 'bg-white/50') : 'border-2 border-red-300 bg-red-50/50'
        } ${isActiveForAlignment ? 'ring-2 ring-accent ring-offset-2' : ''}`}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">Comment {comment.number}</span>
          <div className="flex items-center gap-2">
            {isManualAlignmentMode && isActiveForAlignment && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelAlignment}
                className="text-sm text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAlignmentClick}
              className={`text-sm ${isManualAlignmentMode && isActiveForAlignment && selectedTextRange 
                ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                : 'text-accent hover:text-accent-dark'}`}
            >
              {!isAligned && !isManualAlignmentMode && "Click to align with the text"}
              {isAligned && !isManualAlignmentMode && "Click to change the alignment"}
              {isManualAlignmentMode && isActiveForAlignment && selectedTextRange && "Align!"}
              {isManualAlignmentMode && isActiveForAlignment && !selectedTextRange && "Select text to align"}
              {isManualAlignmentMode && !isActiveForAlignment && "Alignment in progress"}
            </Button>
          </div>
        </div>
        <div className="comment-reference" onClick={handleCommentClick}>
          <span dangerouslySetInnerHTML={{ __html: comment.text }} />
        </div>
        <div className="mt-2">{comment.comment}</div>
        <div className="text-sm text-gray-600 mt-2">
          Status: {comment.status},
          Start: {comment.start !== null ? comment.start : 'N/A'},
          End: {comment.end !== null ? comment.end : 'N/A'}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[700px] overflow-y-auto p-6 bg-transparent-white rounded-lg shadow-md scrollbar-thin">
      {alignedComments.length > 0 ? (
        alignedComments.map((comment, index) => renderComment(comment, index))
      ) : (
        commentsText && (
          <pre className="text-sm font-serif whitespace-pre-wrap">
            {commentsText}
          </pre>
        )
      )}
    </div>
  );
};