"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { useEffect } from "react";
import type { Tab } from "@/types";
import { policyJsonToHtml, htmlToPolicyJson } from "@/lib/tiptapSync";
import ExportToolbar from "./ExportToolbar";

interface TipTapEditorPanelProps {
  initialTabs: Tab[];
  onSyncBack: (updatedTabs: Tab[]) => void;
  policyName?: string;
}

export default function TipTapEditorPanel({ initialTabs, onSyncBack, policyName }: TipTapEditorPanelProps) {
  // Initialize TipTap with our extensions
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "w-full border-collapse border border-slate-300 my-4 text-sm",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "border-b border-slate-200",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "bg-slate-100 border border-slate-300 px-4 py-2 font-semibold text-left",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-slate-300 px-4 py-2 align-top",
        },
      }),
    ],
    content: "<p>Loading document...</p>", // placeholder
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl focus:outline-none max-w-none p-6 min-h-[500px]",
      },
    },
  });

  // Inject the dynamically built HTML when initialTabs load
  useEffect(() => {
    if (editor && initialTabs?.length > 0) {
      const generatedHtml = policyJsonToHtml(initialTabs);
      // Wait for editor to be ready before updating content
      if (editor.getHTML() !== generatedHtml) {
        editor.commands.setContent(generatedHtml);
      }
    }
  }, [editor, initialTabs]); // We only want this once ideally, but it's safe to re-run if tabs dramatically change.

  if (!editor) {
    return null;
  }

  const handleSyncToRules = () => {
    const html = editor.getHTML();
    const updatedTabs = htmlToPolicyJson(html, initialTabs);
    onSyncBack(updatedTabs);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Our Editor Toolbar */}
      <ExportToolbar 
        editor={editor} 
        onSync={handleSyncToRules} 
        policyName={policyName || "Policy_Document"} 
      />
      
      {/* The Actual Document Map */}
      <div className="flex-1 overflow-auto bg-gray-50 flex justify-center p-8 custom-scrollbar">
        <div className="w-full max-w-[850px] bg-white shadow-md border border-gray-200" id="document-export-container">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
