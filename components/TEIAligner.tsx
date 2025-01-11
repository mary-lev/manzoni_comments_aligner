'use client'

import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Alert, AlertDescription } from "../components/ui/Alert";
import { Upload, FileText, AlertCircle, ChevronDown, Loader2 } from 'lucide-react';
import { Dropdown } from "../components/ui/Dropdown";
import { toast } from "../components/ui/toast";
import { SaveTEIDialog } from "../components/SaveTEIDialog";
import { alignComments, getChapters, saveTEIFile, getChapterContent, AlignedComment, Chapter, TEIMetadata } from "../services/api";


declare global {
  interface Window {
    handleWordClick: (wordId: number) => void;
  }
}

const TEIAligner: React.FC = () => {
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterContent, setChapterContent] = useState<string | null>(null);
  const [renderedTEI, setRenderedTEI] = useState<string | null>(null);
  const [commentsFile, setCommentsFile] = useState<File | null>(null);
  const [commentsText, setCommentsText] = useState<string | null>(null);
  const [alignedComments, setAlignedComments] = useState<AlignedComment[]>([]);
  const [highlightedComment, setHighlightedComment] = useState<number | null>(null);
  const [highlightedText, setHighlightedText] = useState<{ start: number, end: number } | null>(null);
  const commentRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const textRefs = useRef<{ [key: number]: HTMLSpanElement | null }>({});
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isManualAlignmentMode, setIsManualAlignmentMode] = useState(false);
  const [selectedTextRange, setSelectedTextRange] = useState<{ start: number, end: number } | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const allCommentsAligned = alignedComments.length > 0 && 
  alignedComments.every(c => c.start !== null && c.end !== null);


  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const fetchedChapters = await getChapters();
        setChapters(fetchedChapters);
      } catch (err) {
        setError("Failed to fetch chapters");
        console.error(err);
      }
    };

    fetchChapters();
  }, []);

  useEffect(() => {
    const clearHighlights = () => {
      setHighlightedComment(null);
      setHighlightedText(null);
    };

    // Clear highlights when chapter or comments change
    return clearHighlights;
  }, [selectedChapter, alignedComments]);

  useEffect(() => {
    window.handleWordClick = (wordId: number) => {
      const comment = alignedComments.find(c =>
        c.start !== null &&
        c.end !== null &&
        c.start <= wordId &&
        c.end >= wordId
      );
      if (comment && comment.number) {
        setHighlightedComment(comment.number);
        setHighlightedText({ start: comment.start!, end: comment.end! });

        // Get the comment element by index and scroll to it
        const commentElement = commentRefs.current[comment.number];
        if (commentElement) {
          commentElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    };

    return () => {
      window.handleWordClick = () => { };
    };
  }, [alignedComments]);

  useEffect(() => {
    if (isManualAlignmentMode) {
      document.addEventListener('mouseup', handleTextSelection);
      return () => document.removeEventListener('mouseup', handleTextSelection);
    }
  }, [isManualAlignmentMode]);

  const handleChapterSelect = async (chapterId: string) => {
    try {
      const chapter = chapters.find(c => c.id === chapterId);
      if (!chapter) throw new Error('Chapter not found');

      setSelectedChapter(chapter);
      setIsDropdownOpen(false);

      const response = await fetch(`/data/tei/${chapterId}.xml`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();

      try {
        const xsltResponse = await fetch('/xslt/tei-to-html.xsl');
        const xsltText = await xsltResponse.text();
        const parser = new DOMParser();
        const xsltDoc = parser.parseFromString(xsltText, 'text/xml');
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        const xsltProcessor = new XSLTProcessor();
        xsltProcessor.importStylesheet(xsltDoc);
        const resultDoc = xsltProcessor.transformToDocument(xmlDoc);
        if (resultDoc && resultDoc.documentElement) {
          const serializedHtml = new XMLSerializer().serializeToString(resultDoc);
          setRenderedTEI(serializedHtml);
        }
      } catch (xsltError) {
        console.error('XSLT transformation failed:', xsltError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error(err);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setCommentsFile(file);
      setCommentsText(text);
    } catch (err) {
      setError("Error processing comments file");
    }
  };

  const handleProcess = async () => {
    if (!selectedChapter || !commentsFile) {
      toast({
        title: "Missing Content",
        description: "Please select a chapter and upload comments file first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const aligned = await alignComments(selectedChapter.id, "default_author", commentsFile);
      setAlignedComments(aligned);
      toast({
        title: "Success",
        description: "Comments aligned successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An unexpected error occurred while processing the files.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSelection = () => {
    if (!isManualAlignmentMode) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    // Find the first and last selected word spans
    const range = selection.getRangeAt(0);
    const startContainer = range.startContainer.parentElement;
    const endContainer = range.endContainer.parentElement;

    if (!startContainer?.classList.contains('tei-w') ||
      !endContainer?.classList.contains('tei-w')) return;

    const startId = parseInt(startContainer.getAttribute('data-id')?.split('_')[1] || '0');
    const endId = parseInt(endContainer.getAttribute('data-id')?.split('_')[1] || '0');

    if (startId && endId) {
      setSelectedTextRange({
        start: Math.min(startId, endId),
        end: Math.max(startId, endId)
      });
      // Clear selection
      selection.removeAllRanges();
    }
  };

  const renderTEIContent = (content: string) => {
    const handleWordClick = (wordId: number) => {
      const comment = alignedComments.find(c =>
        c.start !== null &&
        c.end !== null &&
        c.start <= wordId &&
        c.end >= wordId
      );
      if (comment && comment.start !== null && comment.end !== null) {
        setHighlightedComment(comment.number);
        setHighlightedText({ start: comment.start, end: comment.end });
        commentRefs.current[comment.number]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    // Add classes and click handlers to each word span
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

  const renderComment = (comment: AlignedComment, index: number) => {
    const hasError = !comment.start || !comment.end;
    const isHighlighted = highlightedComment === comment.number;

    const handleCommentClick = () => {
      if (isManualAlignmentMode && selectedTextRange) {
        // Update the comment's alignment
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
        setSelectedTextRange(null);
        return;
      }

      if (comment.start && comment.end) {
        setHighlightedComment(comment.number);
        setHighlightedText({ start: comment.start, end: comment.end });
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
        className={`mb-4 p-4 rounded-lg transition-all duration-200 ${hasError ? 'border-2 border-red-300 bg-red-50/50' :
            isHighlighted ? 'bg-yellow-100/50' : 'bg-white/50'
          } ${isManualAlignmentMode && hasError ? 'cursor-pointer ring-2 ring-offset-2 ring-accent/50' : ''}`}
        onClick={handleCommentClick}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">Comment {comment.number}</span>
          {hasError && isManualAlignmentMode && (
            <span className="text-sm text-accent">
              Click to align with selected text
            </span>
          )}
        </div>
        <div className="comment-reference">
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

  const handleSaveXML = async (metadata: TEIMetadata) => {
    if (!selectedChapter || !alignedComments.length) return;
  
    try {
      setIsProcessing(true);
      const xmlContent = await saveTEIFile(
        selectedChapter.id,
        metadata,
        alignedComments
      );
      
      // Create and download the file
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${metadata.author}_${selectedChapter.id}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
  
      setIsSaveDialogOpen(false);
      toast({
        title: "Success",
        description: "TEI file saved successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save TEI file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f4e9] to-[#f0e8d5] py-12">
      <div className="max-w-[1600px] mx-auto px-4">
        <Card className="bg-transparent-white backdrop-blur-sm shadow-md rounded-xl overflow-hidden mb-8 card-hover border-accent/20">
          <CardHeader className="border-b border-accent/20 bg-transparent-primary">
            <CardTitle className="text-3xl font-bold text-primary font-display">TEI Comment Aligner</CardTitle>
          </CardHeader>
          <CardContent className="mt-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              {/* Chapter Dropdown */}
              <div className="w-full md:w-auto">
                <Dropdown
                  isOpen={isDropdownOpen}
                  onClose={() => setIsDropdownOpen(false)}
                  trigger={
                    <div
                      className="flex items-center justify-between w-full md:w-64 px-4 py-2 border border-accent/30 rounded-md cursor-pointer hover:bg-accent/5 transition-colors duration-200"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span className="text-primary font-serif">
                        {selectedChapter ? selectedChapter.name : 'Select Chapter'}
                      </span>
                      <ChevronDown className="w-4 h-4 ml-2 text-primary/60" />
                    </div>
                  }
                >
                  {chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="px-4 py-2 hover:bg-accent/10 cursor-pointer transition-colors duration-200 font-serif"
                      onClick={() => handleChapterSelect(chapter.id)}
                    >
                      {chapter.name}
                    </div>
                  ))}
                </Dropdown>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
              <Button
                onClick={handleProcess}
                disabled={isProcessing || !selectedChapter || !commentsFile}
                className="bg-accent hover:bg-accent/90 text-white font-serif text-lg px-8 py-6 rounded-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Align Comments'
                )}
              </Button>
              </div>

              {/* File Upload */}
              <div className="flex items-center gap-4 w-full md:w-auto">
                <Button variant="outline" className="relative w-full md:w-auto bg-transparent-white hover:bg-accent/10 text-primary border-accent/30 hover:border-accent/50 transition-colors duration-200 font-serif">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
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
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="mt-6 bg-destructive/10 backdrop-blur-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription className="font-serif">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Split View */}
        {(renderedTEI || alignedComments.length > 0) && (
          <>
            <div className="grid md:grid-cols-2 gap-8 mb-6">
              {/* TEI Content */}
              <Card className="bg-transparent-white backdrop-blur-sm shadow-md rounded-xl overflow-hidden card-hover border-accent/20">
                <CardHeader className="border-b border-accent/20 bg-transparent-primary">
                  <CardTitle className="text-primary font-display">
                    {selectedChapter ? selectedChapter.name : ''} Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[700px] overflow-y-auto p-6 scrollbar-thin">
                    {renderedTEI ? (
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: renderTEIContent(renderedTEI)  // Use renderTEIContent here
                        }}
                      />
                    ) : (
                      <pre className="text-sm font-serif whitespace-pre-wrap bg-transparent-white backdrop-blur-sm p-4 rounded-lg">
                        {chapterContent}
                      </pre>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Aligned Comments or Raw Comments */}
              <Card className="bg-transparent-white backdrop-blur-sm shadow-md rounded-xl overflow-hidden card-hover border-accent/20">
                <CardHeader className="border-b border-accent/20 bg-transparent-primary">
                  <CardTitle className="text-primary font-display">
                    {alignedComments.length > 0 ? 'Aligned Comments' : 'Comments'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[700px] overflow-y-auto p-6 scrollbar-thin">
                    {alignedComments.length > 0 ? (
                      // Use renderComment for each aligned comment
                      alignedComments.map((comment, index) => renderComment(comment, index))
                    ) : (
                      // Raw comments view
                      commentsText && (
                        <pre className="text-sm font-serif whitespace-pre-wrap bg-transparent-white backdrop-blur-sm p-4 rounded-lg">
                          {commentsText}
                        </pre>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alignment Button */}
            <div className="flex justify-center gap-4">
              {alignedComments.some(c => !c.start || !c.end) && (
                <Button
                  onClick={() => {
                    setIsManualAlignmentMode(!isManualAlignmentMode);
                    setSelectedTextRange(null);
                  }}
                  variant={isManualAlignmentMode ? "default" : "outline"}
                  className="font-serif"
                >
                  {isManualAlignmentMode ? 'Exit Manual Alignment' : 'Manual Alignment'}
                </Button>
              )}

              {allCommentsAligned && (
                <Button
                  onClick={() => setIsSaveDialogOpen(true)}
                  variant="outline"
                  className="font-serif bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Save TEI File
                </Button>
              )}

              <SaveTEIDialog
                isOpen={isSaveDialogOpen}
                onClose={() => setIsSaveDialogOpen(false)}
                onSave={handleSaveXML}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TEIAligner;

