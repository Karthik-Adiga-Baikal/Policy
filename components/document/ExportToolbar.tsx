"use client";

import { type Editor } from "@tiptap/react";
import { 
  Bold, Italic, List, ListOrdered, FileDown, 
  Save, Table as TableIcon, Heading1, Heading2 
} from "lucide-react";
import html2pdf from "html2pdf.js";

interface ExportToolbarProps {
  editor: Editor;
  onSync: () => void;
  policyName: string;
}

export default function ExportToolbar({ editor, onSync, policyName }: ExportToolbarProps) {
  
  const handleExportPdf = () => {
    const element = document.getElementById("document-export-container");
    if (!element) return;
    
    const opt = {
      margin: 1,
      filename: `${policyName}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="flex flex-wrap items-center justify-between border-b bg-white p-2 shadow-sm sticky top-0 z-10 gap-2">
      <div className="flex flex-wrap items-center gap-1">
        
        {/* Formatting Buttons */}
        <div className="flex items-center gap-1 border-r pr-2 shadow-sm rounded bg-gray-50 border p-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive("bold") ? "bg-gray-200 text-blue-600" : "text-gray-700"}`}
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive("italic") ? "bg-gray-200 text-blue-600" : "text-gray-700"}`}
            title="Italic"
          >
            <Italic size={16} />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 border-r pr-2 shadow-sm rounded bg-gray-50 border p-1">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded text-xs font-bold hover:bg-gray-200 flex items-center gap-1 ${editor.isActive("heading", { level: 1 }) ? "bg-gray-200 text-blue-600" : "text-gray-700"}`}
            title="Heading 1 (Tab)"
          >
            <Heading1 size={14} /> Tab
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded text-xs font-bold hover:bg-gray-200 flex items-center gap-1 ${editor.isActive("heading", { level: 2 }) ? "bg-gray-200 text-blue-600" : "text-gray-700"}`}
            title="Heading 2 (SubTab)"
          >
            <Heading2 size={14} /> SubTab
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 shadow-sm rounded bg-gray-50 border p-1 border-r pr-2">
           <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive("bulletList") ? "bg-gray-200 text-blue-600" : "text-gray-700"}`}
            title="Bullet List"
          >
            <List size={16} />
          </button>
           <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive("orderedList") ? "bg-gray-200 text-blue-600" : "text-gray-700"}`}
            title="Ordered List"
          >
            <ListOrdered size={16} />
          </button>
        </div>

        {/* Table Management */}
        <div className="flex items-center gap-1 shadow-sm rounded bg-gray-50 border p-1">
          <button
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 4, withHeaderRow: true }).run()}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-700 flex items-center gap-1 text-xs"
            title="Insert Table"
          >
            <TableIcon size={14} /> Add Table
          </button>
          {editor.can().addColumnBefore() && (
             <>
               <button onClick={() => editor.chain().focus().addRowAfter().run()} className="p-1.5 rounded hover:bg-gray-200 text-gray-700 text-xs font-medium">Add Row</button>
               <button onClick={() => editor.chain().focus().deleteRow().run()} className="p-1.5 rounded hover:bg-gray-200 text-red-600 text-xs font-medium">Delete Row</button>
               <button onClick={() => editor.chain().focus().deleteTable().run()} className="p-1.5 rounded hover:bg-red-100 text-red-700 text-xs font-bold">Destroy Table</button>
             </>
          )}
        </div>

      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleExportPdf}
          className="flex items-center gap-1 rounded bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200"
        >
          <FileDown size={14} />
          Export PDF
        </button>

        <button
          onClick={onSync}
          className="flex items-center gap-1 rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
          title="Parse edits backwards and update Redux rule engine"
        >
          <Save size={14} />
          Sync to Rules
        </button>
      </div>
    </div>
  );
}
