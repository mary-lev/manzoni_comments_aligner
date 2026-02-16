'use client'

import React, { useEffect, useState } from 'react';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { FileText, Loader2, X } from 'lucide-react';
import { parseXMLComments, parseChapterFromTarget } from '../services/xmlComments';
import { AlignedComment } from '../services/api';

interface CommentsIndex {
  [editor: string]: string[];
}

interface XMLFileSelectorProps {
  onCommentsLoaded: (comments: AlignedComment[], chapterId: string, editorName: string, rawXml: string) => void;
  onClear: () => void;
  isActive: boolean;
  selectedChapterId: string | null;
}

export const XMLFileSelector: React.FC<XMLFileSelectorProps> = ({
  onCommentsLoaded,
  onClear,
  isActive,
  selectedChapterId,
}) => {
  const [index, setIndex] = useState<CommentsIndex | null>(null);
  const [selectedEditor, setSelectedEditor] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/comments/index.json')
      .then(res => res.json())
      .then(data => setIndex(data))
      .catch(() => setError('Failed to load comments index'));
  }, []);

  // When a chapter is already selected, filter editors to those that have that chapter
  const chapterFilter = selectedChapterId || null;
  const editors = index
    ? Object.keys(index)
        .filter(editor => !chapterFilter || index[editor].includes(chapterFilter))
        .sort()
    : [];
  const formatFileName = (file: string) => {
    if (file === 'intro') return 'Introduction';
    return `Chapter ${file.replace('cap', '')}`;
  };

  const loadFile = async (editor: string, file: string) => {
    setSelectedFile(file);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/data/comments/${editor}/${file}.xml`);
      if (!response.ok) throw new Error(`Failed to load ${file}.xml`);
      const xmlText = await response.text();

      const comments = parseXMLComments(xmlText);
      if (comments.length === 0) {
        throw new Error('No comments found in the XML file');
      }

      const chapterId = parseChapterFromTarget(xmlText) || file;
      onCommentsLoaded(comments, chapterId, editor, xmlText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse XML');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditorSelect = (editor: string) => {
    setSelectedEditor(editor);
    setSelectedFile('');
    setError(null);
    if (!editor) return;

    // If chapter is already selected and this editor has it, auto-load
    if (chapterFilter && index && index[editor]?.includes(chapterFilter)) {
      loadFile(editor, chapterFilter);
    }
  };

  const handleClear = () => {
    setSelectedEditor('');
    setSelectedFile('');
    setError(null);
    onClear();
  };

  if (isActive) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 border border-accent/30 rounded-md text-sm">
          <FileText className="w-4 h-4 text-accent" />
          <span className="font-serif text-primary">
            {selectedEditor} / {formatFileName(selectedFile)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-muted-foreground hover:text-destructive"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground font-serif whitespace-nowrap">Review XML:</span>
      <Select
        value={selectedEditor}
        onChange={(e) => handleEditorSelect(e.target.value)}
        className="w-44"
        disabled={isLoading || !chapterFilter}
        title={!chapterFilter ? 'Select a chapter first' : ''}
      >
        <option value="">{chapterFilter ? 'Select editor...' : 'Select chapter first'}</option>
        {editors.map(editor => (
          <option key={editor} value={editor}>
            {editor.replace(/_/g, ' ')}
          </option>
        ))}
      </Select>

      {isLoading && (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      )}
      {error && (
        <span className="text-sm text-destructive">{error}</span>
      )}
    </div>
  );
};
