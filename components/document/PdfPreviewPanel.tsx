"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { useState } from "react";
import { ZoomIn, ZoomOut, Download } from "lucide-react";

// Setup standard PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfPreviewPanelProps {
  file: File | string; // Could be a local File object or a remote URL
}

export default function PdfPreviewPanel({ file }: PdfPreviewPanelProps) {
  const [numPages, setNumPages] = useState<number>();
  const [scale, setScale] = useState(1.0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="flex h-full flex-col bg-gray-100">
      {/* Viewer Toolbar */}
      <div className="flex items-center justify-between border-b bg-white p-2 shadow-sm">
        <span className="text-sm font-semibold text-gray-700">Original Document</span>
        <div className="flex gap-2">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
            className="rounded bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="px-2 text-sm text-gray-600 font-mono flex items-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.2))}
            className="rounded bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <a
            href={typeof file === "string" ? file : URL.createObjectURL(file)}
            download
            className="ml-2 rounded bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100 flex items-center gap-1 text-xs font-semibold px-2"
            title="Download Original"
          >
            <Download size={14} /> Source
          </a>
        </div>
      </div>

      {/* PDF Container */}
      <div className="flex-1 overflow-auto p-4 flex justify-center custom-scrollbar">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center p-12 text-sm text-gray-500">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-r-2 border-blue-600 mb-2"></div>
              Loading exact preview...
            </div>
          }
          error={<p className="text-sm text-red-500">Failed to load PDF preview.</p>}
        >
          {Array.from(new Array(numPages), (el, index) => (
            <div key={`page_${index + 1}`} className="mb-4 shadow-lg">
              <Page 
                pageNumber={index + 1} 
                scale={scale} 
                renderTextLayer={true} 
                renderAnnotationLayer={true}
                className="bg-white"
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}
