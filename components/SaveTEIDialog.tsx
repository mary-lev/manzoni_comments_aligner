import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TEIMetadata } from "@/services/api";

interface Edition {
  filename: string;
  title: string;
  author: string;
  curator: string;
  date: number;
  city: string;
  publisher: string;
  marcatura: Array<{
    resp: string;
    persName: string;
  }>;
  notes: {
    p: string;
  };
  description?: string;
}

interface SaveTEIDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (metadata: TEIMetadata, editorFilename: string) => void;
  selectedChapter: string;
}

export function SaveTEIDialog({ isOpen, onClose, onSave, selectedChapter }: SaveTEIDialogProps) {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [selectedEdition, setSelectedEdition] = useState<string>("");
  const [annotatorName, setAnnotatorName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEditions = async () => {
      try {
        const response = await fetch('/data/output.json');
        if (!response.ok) throw new Error('Failed to load editions');
        const data = await response.json();
        setEditions(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading editions:', error);
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadEditions();
      // Reset selection when dialog opens
      setSelectedEdition("");
      // Keep annotator name for convenience
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const edition = editions.find(ed => ed.filename === selectedEdition);
    if (!edition) return;
  
    const metadata: TEIMetadata = {
      author: annotatorName,
      editor: edition.curator,
      publisher: edition.publisher,
      publisherPlace: edition.city,
      publisherYear: edition.date.toString(),
    };
    console.log('Saving TEI with metadata:', metadata);

    onSave(metadata, edition.filename);
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex justify-center p-4">
            Loading editions...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save TEI Comments for Chapter {selectedChapter}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="edition">Select Edition</Label>
              <Select
                id="edition"
                value={selectedEdition}
                onChange={(e) => setSelectedEdition(e.target.value)}
                required
                className="w-full"
              >
                <option value="">Select an edition...</option>
                {editions.map((edition) => (
                  <option key={edition.filename} value={edition.filename}>
                    {edition.curator} ({edition.date})
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="annotator">Your Name (Annotator)</Label>
              <Input
                id="annotator"
                value={annotatorName}
                onChange={(e) => setAnnotatorName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>

            {selectedEdition && (
              <div className="bg-gray-50 p-3 rounded-md text-sm">
                <h4 className="font-medium mb-2">Selected Edition Details:</h4>
                {(() => {
                  const edition = editions.find(ed => ed.filename === selectedEdition);
                  if (!edition) return null;
                  return (
                    <>
                      <p>Title: {edition.title}</p>
                      <p>Curator: {edition.curator}</p>
                      <p>Publisher: {edition.publisher}</p>
                      <p>Place: {edition.city}</p>
                      <p>Year: {edition.date}</p>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!selectedEdition || !annotatorName}
            >
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};