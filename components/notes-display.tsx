'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, FileText, File as FileIcon, ChevronDown, Check } from 'lucide-react';
import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface NotesDisplayProps {
  notes: string;
}

export default function NotesDisplay({ notes }: NotesDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const notesRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(notes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const exportToText = () => {
    const element = document.createElement('a');
    // We keep markdown symbols for text format as it's the standard for portable notes,
    // or we could strip them. Let's keep them for now as it's more useful for text editors.
    const file = new Blob([notes], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'study-notes.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const exportToPDF = async () => {
    if (!notesRef.current) return;
    setExporting(true);
    try {
      const element = notesRef.current;
      
      // Improve rendering by making sure we're at the top
      window.scrollTo(0, 0);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save('study-notes.pdf');
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExporting(false);
    }
  };

  const exportToDoc = () => {
    // Basic HTML to Word conversion trick
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
            "xmlns:w='urn:schemas-microsoft-com:office:word' " +
            "xmlns='http://www.w3.org/TR/REC-html40'>" +
            "<head><meta charset='utf-8'><title>Study Notes</title></head><body>";
    const footer = "</body></html>";
    
    // We can use the innerHTML of our rendered notes or generate from markdown
    // Using the rendered div is better for formatting
    const sourceHTML = header + notesRef.current?.innerHTML + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = 'study-notes.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="default"
              size="sm"
              disabled={exporting}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exporting...' : 'Download Notes'}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer gap-2">
              <FileIcon className="h-4 w-4 text-red-500" />
              <span>Download PDF</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToDoc} className="cursor-pointer gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span>Download DOC</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToText} className="cursor-pointer gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              <span>Download Text</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div 
          ref={notesRef}
          className="p-8 prose prose-slate max-w-none dark:prose-invert prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-slate-700 prose-li:text-slate-700"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {notes}
          </ReactMarkdown>
        </div>
      </Card>
      
      <style jsx global>{`
        .prose h1 { margin-top: 0; margin-bottom: 1.5rem; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
        .prose h2 { margin-top: 2rem; margin-bottom: 1rem; color: #1e293b; }
        .prose h3 { margin-top: 1.5rem; margin-bottom: 0.75rem; color: #334155; }
        .prose p { margin-bottom: 1rem; line-height: 1.7; }
        .prose ul, .prose ol { margin-bottom: 1rem; padding-left: 1.5rem; }
        .prose li { margin-bottom: 0.5rem; }
        .prose strong { color: #0f172a; font-weight: 700; highlight: #fef08a; }
        .prose blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; font-style: italic; color: #475569; background: #eff6ff; padding: 1rem 1rem 1rem 1.5rem; border-radius: 0 0.5rem 0.5rem 0; margin: 1.5rem 0; }
      `}</style>
    </div>
  );
}
