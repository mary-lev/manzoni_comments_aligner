// components/SaveTEIDialog.tsx
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { TEIMetadata } from "@/services/api";

interface SaveTEIDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (metadata: TEIMetadata) => void;
}

export function SaveTEIDialog({ isOpen, onClose, onSave }: SaveTEIDialogProps) {
  const [metadata, setMetadata] = React.useState<TEIMetadata>({
    author: "",
    editor: "Pistelli, Ermenegildo",
    publisher: "Sansoni",
    publisherPlace: "Firenze",
    publisherYear: "1978"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(metadata);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save TEI Comments File</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="author">Comments Author</Label>
              <Input
                id="author"
                value={metadata.author}
                onChange={(e) => setMetadata(prev => ({ ...prev, author: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editor">Editor</Label>
              <Input
                id="editor"
                value={metadata.editor}
                onChange={(e) => setMetadata(prev => ({ ...prev, editor: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publisher">Publisher</Label>
              <Input
                id="publisher"
                value={metadata.publisher}
                onChange={(e) => setMetadata(prev => ({ ...prev, publisher: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publisherPlace">Publisher Place</Label>
              <Input
                id="publisherPlace"
                value={metadata.publisherPlace}
                onChange={(e) => setMetadata(prev => ({ ...prev, publisherPlace: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publisherYear">Publisher Year</Label>
              <Input
                id="publisherYear"
                value={metadata.publisherYear}
                onChange={(e) => setMetadata(prev => ({ ...prev, publisherYear: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}