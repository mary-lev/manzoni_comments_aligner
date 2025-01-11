import React from 'react';
import { Dropdown } from "./ui/Dropdown";
import { ChevronDown } from 'lucide-react';
import { Chapter } from "../services/api";

interface ChapterSelectorProps {
  chapters: Chapter[];
  selectedChapter: Chapter | null;
  onChapterSelect: (chapterId: string) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (isOpen: boolean) => void;
}

export const ChapterSelector: React.FC<ChapterSelectorProps> = ({
  chapters,
  selectedChapter,
  onChapterSelect,
  isDropdownOpen,
  setIsDropdownOpen
}) => {
  return (
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
            onClick={() => onChapterSelect(chapter.id)}
          >
            {chapter.name}
          </div>
        ))}
      </Dropdown>
    </div>
  );
};

