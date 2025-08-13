import React, { useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import FontSize from '@tiptap/extension-font-size';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough,
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Image as ImageIcon,
  Link as LinkIcon,
  Palette,
  Highlighter,
  Type,
  Upload,
  Quote,
  RotateCcw
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      FontFamily,
      FontSize,
      Color,
      Highlight,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none',
      },
    },
  });

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editor) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string;
          if (result) {
            editor.chain().focus().setImage({ src: result }).run();
          }
        } catch (error) {
          console.error('Error processing image:', error);
          alert('Error processing image. Please try again.');
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading file');
        alert('Error reading file. Please try again.');
      };
      
      try {
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading file. Please try again.');
      }
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [editor]);

  const setLink = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const setFontSize = useCallback((size: string) => {
    if (editor) {
      editor.chain().focus().setFontSize(size).run();
    }
  }, [editor]);

  const setColor = useCallback((color: string) => {
    if (editor) {
      editor.chain().focus().setColor(color).run();
    }
  }, [editor]);

  const setHighlight = useCallback((color: string) => {
    if (editor) {
      editor.chain().focus().setHighlight({ color }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="bg-dark-600/50 border border-dark-500/50 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-dark-700/50 border-b border-dark-500/50">
        {/* Text Formatting */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-dark-600/50 hover:scale-105 transition-all duration-200 ${
              editor.isActive('bold') ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:text-white'
            }`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-dark-600/50 hover:scale-105 transition-all duration-200 ${
              editor.isActive('italic') ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:text-white'
            }`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-dark-600/50 transition-colors ${
              editor.isActive('underline') ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:text-white'
            }`}
            title="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-dark-600/50 transition-colors ${
              editor.isActive('strike') ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:text-white'
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-dark-600/50 transition-colors ${
              editor.isActive('heading', { level: 1 }) ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:text-white'
            }`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-dark-600/50 transition-colors ${
              editor.isActive('heading', { level: 2 }) ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:text-white'
            }`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-dark-600/50 transition-colors ${
              editor.isActive('heading', { level: 3 }) ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:text-white'
            }`}
            title="Heading 3"
          >
            H3
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-dark-600/50 transition-colors ${
              editor.isActive('bulletList') ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:text-white'
            }`}
            title="Bullet List"
          >
            •
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-dark-600/50 transition-colors ${
              editor.isActive('orderedList') ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:text-white'
            }`}
            title="Numbered List"
          >
            1.
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-dark-600/50 transition-colors ${
              editor.isActive('blockquote') ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:text-white'
            }`}
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded hover:bg-dark-600/50 transition-colors ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:text-white'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-dark-600/50 transition-colors ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:text-white'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded hover:bg-dark-600/50 transition-colors ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:text-white'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-2 rounded hover:bg-dark-600/50 transition-colors ${
              editor.isActive({ textAlign: 'justify' }) ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:text-white'
            }`}
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-1">
          <Type className="w-4 h-4 text-gray-400" />
          <select
            onChange={(e) => setFontSize(e.target.value)}
            className="bg-dark-600/50 border border-dark-500/50 rounded text-white text-sm px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
            <option value="28px">28px</option>
            <option value="32px">32px</option>
          </select>
        </div>

        {/* Colors */}
        <div className="flex items-center gap-1">
          <Palette className="w-4 h-4 text-gray-400" />
          <div className="flex gap-1">
            {['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map((color) => (
              <button
                key={color}
                onClick={() => setColor(color)}
                className="w-6 h-6 rounded border border-dark-400 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={`Text Color: ${color}`}
              />
            ))}
          </div>
        </div>

        {/* Highlight Colors */}
        <div className="flex items-center gap-1">
          <Highlighter className="w-4 h-4 text-gray-400" />
          <div className="flex gap-1">
            {['#ffeb3b', '#ff9800', '#f44336', '#4caf50', '#2196f3', '#9c27b0', '#e91e63', '#795548'].map((color) => (
              <button
                key={color}
                onClick={() => setHighlight(color)}
                className="w-6 h-6 rounded border border-dark-400 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={`Highlight Color: ${color}`}
              />
            ))}
          </div>
        </div>

        {/* Media */}
        <div className="flex items-center gap-1">
          <button
            onClick={addImage}
            className="p-2 rounded hover:bg-dark-600/50 transition-colors text-gray-300 hover:text-white"
            title="Add Image from URL"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="image-upload"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded hover:bg-dark-600/50 transition-colors text-gray-300 hover:text-white"
            title="Upload Image"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={setLink}
            className={`p-2 rounded hover:bg-dark-600/50 transition-colors ${
              editor.isActive('link') ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:text-white'
            }`}
            title="Add Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Clear Formatting */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            className="p-2 rounded hover:bg-dark-600/50 transition-colors text-gray-300 hover:text-white"
            title="Clear Formatting"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-4 relative">
        <EditorContent 
          editor={editor} 
          className="min-h-[200px] text-white prose-invert"
        />
        {!content && (
          <div className="absolute top-4 left-4 text-gray-500 pointer-events-none">
            {placeholder || 'Start typing your content...'}
          </div>
        )}
        <style dangerouslySetInnerHTML={{
          __html: `
            .prose-invert {
              color: white;
            }
            .prose-invert h1, .prose-invert h2, .prose-invert h3 {
              color: white;
              margin: 1rem 0 0.5rem 0;
            }
            .prose-invert p {
              margin: 0.5rem 0;
            }
            .prose-invert ul, .prose-invert ol {
              margin: 0.5rem 0;
              padding-left: 1.5rem;
            }
            .prose-invert li {
              margin: 0.25rem 0;
            }
            .prose-invert blockquote {
              border-left: 3px solid #3b82f6;
              padding-left: 1rem;
              margin: 1rem 0;
              font-style: italic;
              color: #9ca3af;
            }
            .prose-invert code {
              background-color: rgba(59, 130, 246, 0.1);
              padding: 0.125rem 0.25rem;
              border-radius: 0.25rem;
              font-family: monospace;
              color: #60a5fa;
            }
            .prose-invert pre {
              background-color: rgba(31, 41, 55, 0.5);
              padding: 1rem;
              border-radius: 0.5rem;
              overflow-x: auto;
              margin: 1rem 0;
            }
            .prose-invert pre code {
              background-color: transparent;
              padding: 0;
              color: white;
            }
            .prose-invert strike {
              text-decoration: line-through;
              color: #9ca3af;
            }
            .prose-invert a {
              color: #60a5fa;
              text-decoration: underline;
            }
            .prose-invert a:hover {
              color: #93c5fd;
            }
            .prose-invert img {
              max-width: 100%;
              height: auto;
              border-radius: 0.5rem;
              margin: 1rem 0;
              border: 2px solid rgba(59, 130, 246, 0.2);
            }
          `
        }} />
      </div>
    </div>
  );
};

export default RichTextEditor;
