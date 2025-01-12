// services/api.ts
export interface AlignedComment {
    number: number;
    text: string;
    comment: string;
    start: number | null;
    end: number | null;
    status: string;
  }

export interface TEIMetadata {
    author: string;
    editor: string;
    publisher: string;
    publisherPlace: string;
    publisherYear: string;
  }
  
  export interface Chapter {
    id: string;
    name: string;
  }
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

 
  export async function alignComments(
    chapter: string,
    author: string,
    commentsFile: File
  ): Promise<AlignedComment[]> {
    const formData = new FormData();
    formData.append('comments_file', commentsFile);
    
    const response = await fetch(
      `${API_BASE}/align?chapter=${chapter}&author=${author}`,
      {
        method: 'POST',
        body: formData,
      }
    );
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Alignment failed');
    }
  
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
  
    return data.aligned;
  }
  
  export interface Chapter {
    id: string;
    name: string;
  }
  
  export function getChapters(): Promise<Chapter[]> {
    const chapters: Chapter[] = [
      { id: "intro", name: "Introduction" },
      ...Array.from({ length: 38 }, (_, i) => ({
        id: `cap${i + 1}`,
        name: `Chapter ${i + 1}`
      })),
      { id: "header", name: "Chapter header" }
    ];
    
    return Promise.resolve(chapters);
  }
  
  export async function getChapterContent(chapterId: string): Promise<string> {
    const response = await fetch(`${API_BASE}/chapters/${chapterId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch chapter content');
    }
    const data = await response.json();
    return data.content;
  }

  export async function saveTEIFile(
    chapter: string,
    metadata: TEIMetadata,
    alignedComments: AlignedComment[]
  ): Promise<string> {
    const response = await fetch(`${API_BASE}/save-tei`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chapter,
        metadata,
        aligned_comments: alignedComments
      }),
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to save TEI file');
    }
  
    const data = await response.json();
    return data.content;
  }