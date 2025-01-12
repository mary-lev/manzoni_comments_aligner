# Manzoni Comments Aligner Frontend

A Next.js application for aligning and managing comments for Manzoni's "I Promessi Sposi" TEI/XML edition. This tool is designed to work with the [LeggoManzoni project](https://projects.dharc.unibo.it/leggomanzoni/), providing a user-friendly interface for comment alignment and TEI/XML generation. Live demo: [Manzoni Comments Aligner](https://manzoni-comments-aligner.vercel.app/)

## Features

- Upload and align comments with TEI/XML text from the Quarantana edition
- Interactive text selection and comment alignment
- Real-time preview of alignments
- TEI/XML export compatible with LeggoManzoni project specifications
- Support for multiple editions and chapters
- Manual alignment mode for corrections
- Automatic generation of proper XML IDs and references

## LeggoManzoni Integration

The generated TEI/XML files are formatted to be directly compatible with the LeggoManzoni digital edition:
- Proper XML structure and namespaces
- Correct reference system to the Quarantana edition
- Standard metadata format
- Consistent note IDs and targets
- Edition-specific annotation attribution

Example of generated XML:
```xml
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <!-- Metadata following LeggoManzoni specifications -->
  </teiHeader>
  <text>
    <body>
      <div xml:id="intro_Russo">
        <note xml:id="Russo_intro-n1" type="comm" 
              target="quarantana/intro.xml#intro_10001" 
              targetEnd="quarantana/intro.xml#intro_10060">
          <ref rend="bold">Reference text</ref>: Comment text
        </note>
      </div>
    </body>
  </text>
</TEI>
```

## Backend Integration

This frontend works with the [Manzoni Comments Aligner Backend](https://github.com/mary-lev/aligner_backend) service, which handles:
- Text alignment processing
- XML generation
- Edition metadata management

## Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- Backend service running (see [backend README](https://github.com/mary-lev/aligner_backend))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mary-lev/manzoni_comments_aligner
cd manzoni_comments_aligner
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure environment variables:
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api  # Development
# or
NEXT_PUBLIC_API_URL=https://your-backend.render.com/api  # Production
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Project Structure

```
├── components/
│   ├── ChapterSelector.tsx     # Chapter selection dropdown
│   ├── CommentsList.tsx        # Comments display and management
│   ├── FileUploader.tsx        # File upload component
│   ├── SaveTEIDialog.tsx       # TEI save dialog with metadata
│   ├── TEIContent.tsx          # TEI text display
│   └── ui/                     # Shared UI components
├── pages/
│   └── index.tsx              # Main application page
├── services/
│   └── api.ts                 # API client functions
└── styles/
    └── globals.css            # Global styles
```

## Usage

1. Select a chapter from the dropdown menu
2. Upload a comments file (.txt format)
3. Click "Align Comments" to process
4. Review alignments:
   - Green: Successfully aligned
   - Red: Needs manual alignment
5. Use manual alignment mode if needed:
   - Click "Click to align with text"
   - Select text in the TEI content
   - Click "Align!" to confirm
6. Save TEI/XML:
   - Click "Save TEI File"
   - Select the edition from LeggoManzoni editions list
   - Enter annotator name
   - Click "Save" to generate LeggoManzoni-compatible XML

## Input Format

The comments file should be in .txt format with the following structure:
- Each comment on a new line
- Text reference and comment separated by ": "
Example: 
rincomincia: ricomincia. Rincomincia è piú volg., e non so perché il M. l'abbia preferito. 

## Components

### TEIAligner
Main component that orchestrates the alignment process.

### CommentsList
Displays and manages comments with the following features:
- Comment status indication
- Manual alignment mode
- Text highlighting
- Jump to reference

### TEIContent
Displays TEI text with:
- Word-level selection
- Highlight support
- Reference linking

### SaveTEIDialog
Handles TEI file saving with:
- Edition selection
- Metadata input
- XML generation

## Development

### Adding New Features

1. Create new components in `components/`
2. Add API endpoints in `services/api.ts`
3. Update types as needed
4. Add UI components in `components/ui/`

### Styling

The project uses:
- Tailwind CSS for styling
- shadcn/ui components
- Custom CSS in `globals.css`

## Deployment

The application is deployed on Vercel:

1. Connect your GitHub repository
2. Configure environment variables (NEXT_PUBLIC_API_URL for the backend integration)
3. Deploy automatically with git push

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License
This project is licensed under the MIT License

## Related Projects

- [Backend Repository](https://github.com/mary-lev/aligner_backend)
- [LeggoManzoni project](https://projects.dharc.unibo.it/leggomanzoni)