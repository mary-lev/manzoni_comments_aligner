'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Upload, FileText, ChevronDown, Loader2 } from 'lucide-react';
import { Dropdown } from "../components/ui/Dropdown";
import { toast } from "../components/ui/toast";
import { SaveTEIDialog } from "../components/SaveTEIDialog";
import { alignComments, getChapters, saveTEIFile, AlignedComment, Chapter, TEIMetadata } from "../services/api";
import { ChapterSelector } from '../components/ChapterSelector';
import { FileUploader } from '../components/FileUploader';
import { CommentsList } from '../components/CommentsList';
import { TEIContent } from '../components/TEIContent';

declare global {
  interface Window {
    handleWordClick: (wordId: number) => void;
  }
}

const TEIAligner: React.FC = () => {
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [renderedTEI, setRenderedTEI] = useState<string | null>(null);
  const [commentsFile, setCommentsFile] = useState<File | null>(null);
  const [commentsText, setCommentsText] = useState<string | null>(null);
  const [alignedComments, setAlignedComments] = useState<AlignedComment[]>([]);
  const [highlightedComment, setHighlightedComment] = useState<number | null>(null);
  const [highlightedText, setHighlightedText] = useState<{ start: number, end: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isManualAlignmentMode, setIsManualAlignmentMode] = useState(false);
  const [selectedTextRange, setSelectedTextRange] = useState<{ start: number, end: number } | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [activeAlignmentCommentId, setActiveAlignmentCommentId] = useState<number | null>(null);
  const [isTextSelected, setIsTextSelected] = useState(false); // Added state variable


  const commentRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const textRefs = useRef<{ [key: number]: HTMLSpanElement | null }>({});

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
      return () => {
        document.removeEventListener('mouseup', handleTextSelection);
        setSelectedTextRange(null);
        setActiveAlignmentCommentId(null);
      };
    }
  }, [isManualAlignmentMode]);

  const handleChapterSelect = useCallback(async (chapterId: string) => {
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
  }, [chapters]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setCommentsFile(file);
      setCommentsText(text);
    } catch (err) {
      setError("Error processing comments file");
    }
  }, []);

  const handleProcess = useCallback(async () => {
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
  }, [selectedChapter, commentsFile]);

  const handleTextSelection = useCallback(() => {
    if (!isManualAlignmentMode || !activeAlignmentCommentId) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setIsTextSelected(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const startContainer = range.startContainer.parentElement;
    const endContainer = range.endContainer.parentElement;

    if (!startContainer?.classList.contains('tei-w') ||
      !endContainer?.classList.contains('tei-w')) {
      setIsTextSelected(false);
      return;
    }

    const startId = parseInt(startContainer.getAttribute('data-id')?.split('_')[1] || '0');
    const endId = parseInt(endContainer.getAttribute('data-id')?.split('_')[1] || '0');

    if (startId && endId) {
      setSelectedTextRange({
        start: Math.min(startId, endId),
        end: Math.max(startId, endId)
      });
      setIsTextSelected(true);
    } else {
      setIsTextSelected(false);
    }
  }, [isManualAlignmentMode, activeAlignmentCommentId]);

  const handleCancelSelection = useCallback(() => {
    setSelectedTextRange(null);
    setIsTextSelected(false);
    window.getSelection()?.removeAllRanges();
  }, []);

  const handleSaveXML = useCallback(async (metadata: TEIMetadata) => {
    if (!selectedChapter || !alignedComments.length) return;
  
    try {
      setIsProcessing(true);
      const xmlContent = await saveTEIFile(
        selectedChapter.id,
        metadata,
        alignedComments
      );
      
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
  }, [selectedChapter, alignedComments]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f4e9] to-[#f0e8d5] py-12">
      <div className="max-w-[1600px] mx-auto px-4">
        <Card className="bg-transparent-white backdrop-blur-sm shadow-md rounded-xl overflow-hidden mb-8 card-hover border-accent/20">
          <CardHeader className="border-b border-accent/20 bg-transparent-primary">
            <CardTitle className="text-3xl font-bold text-primary font-display">TEI Comment Aligner</CardTitle>
          </CardHeader>
  
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
              <ChapterSelector
                chapters={chapters}
                selectedChapter={selectedChapter}
                onChapterSelect={handleChapterSelect}
                isDropdownOpen={isDropdownOpen}
                setIsDropdownOpen={setIsDropdownOpen}
              />
  
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
                {allCommentsAligned && (
                  <Button
                    onClick={() => setIsSaveDialogOpen(true)}
                    className="bg-accent hover:bg-accent/90 text-white font-serif text-lg px-8 py-6 rounded-lg"
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
  
              <FileUploader
                commentsFile={commentsFile}
                onFileUpload={handleFileUpload}
              />
            </div>
  
            <div className="grid md:grid-cols-2 gap-8">
              <TEIContent
                renderedTEI={renderedTEI}
                highlightedText={highlightedText}
                selectedTextRange={selectedTextRange}
                isManualAlignmentMode={isManualAlignmentMode}
                isTextSelected={isTextSelected}
                onCancelSelection={handleCancelSelection}
              />
  
              <CommentsList
                alignedComments={alignedComments}
                commentsText={commentsText}
                highlightedComment={highlightedComment}
                isManualAlignmentMode={isManualAlignmentMode}
                selectedTextRange={selectedTextRange}
                setAlignedComments={setAlignedComments}
                setHighlightedComment={setHighlightedComment}
                setHighlightedText={setHighlightedText}
                commentRefs={commentRefs}
                setIsManualAlignmentMode={(mode) => {
                  setIsManualAlignmentMode(mode);
                  if (mode) {
                    setHighlightedText(null);
                  }
                }}
                setSelectedTextRange={setSelectedTextRange}
                setActiveAlignmentCommentId={setActiveAlignmentCommentId}
                activeAlignmentCommentId={activeAlignmentCommentId}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TEIAligner;

