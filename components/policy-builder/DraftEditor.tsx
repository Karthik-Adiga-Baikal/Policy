"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Blockquote from "@tiptap/extension-blockquote";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import HardBreak from "@tiptap/extension-hard-break";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Strike from "@tiptap/extension-strike";
import TextAlign from "@tiptap/extension-text-align";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  Table2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo2,
  Redo2,
  Save,
  Download,
  Search,
  Replace,
  Minus,
  Quote,
  Code,
  Sun,
  Moon,
  Ruler,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import html2pdf from "html2pdf.js";
import toast from "react-hot-toast";
import type { PolicyBlock } from "@/hooks/useBlocks";
import {
  DocumentEditorProvider,
  useDocumentEditor,
  type DocumentEditorState,
} from "@/components/policy-builder/editor/DocumentEditorContext";
import {
  loadSnapshotFromIndexedDb,
  loadSnapshotFromLocalStorage,
  saveSnapshotToIndexedDb,
  saveSnapshotToLocalStorage,
} from "@/lib/editorStorage";

const lowlight = createLowlight(common);

interface DraftEditorProps {
  blocks: PolicyBlock[];
  policyMeta: {
    name?: string;
    product?: string;
    version?: string | number;
    status?: string;
  };
  onContentChange?: (html: string) => void;
}

const FONT_FAMILIES = [
  "Arial",
  "Times New Roman",
  "Calibri",
  "Cambria",
  "Georgia",
  "Verdana",
  "Trebuchet MS",
  "Courier New",
  "Segoe UI",
];

const FONT_SIZES = ["10", "11", "12", "14", "16", "18", "20", "24", "28", "32"];

const MENU_NAMES = ["File", "Edit", "View", "Insert", "Format", "Tools", "Help"] as const;

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeColumns(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((col) => {
      if (typeof col === "string") return col;
      if (col && typeof col === "object") {
        const maybeCol = col as Record<string, unknown>;
        return String(maybeCol.label ?? maybeCol.name ?? maybeCol.key ?? "").trim();
      }
      return "";
    })
    .filter(Boolean);
}

function normalizeRows(input: unknown, columnsCount: number): string[][] {
  if (!Array.isArray(input)) return [];
  return input.map((row) => {
    if (Array.isArray(row)) {
      return row.map((cell) => String(cell ?? ""));
    }

    if (row && typeof row === "object") {
      const values = Object.values(row as Record<string, unknown>).map((cell) => String(cell ?? ""));
      if (columnsCount > 0 && values.length < columnsCount) {
        return [...values, ...Array(columnsCount - values.length).fill("")];
      }
      return values;
    }

    return [String(row ?? "")];
  });
}

function containsTableMarkup(html: string): boolean {
  return /<table[\s>]/i.test(html);
}

function normalizeListItems(content: Record<string, unknown> | undefined): string[] {
  if (!content) return [];

  const itemsFromItems = content.items;
  if (Array.isArray(itemsFromItems)) {
    const normalized = itemsFromItems
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          const entry = item as Record<string, unknown>;
          return String(entry.value ?? entry.label ?? entry.name ?? "").trim();
        }
        return "";
      })
      .filter(Boolean);

    if (normalized.length > 0) return normalized;
  }

  const itemsFromValues = content.values;
  if (Array.isArray(itemsFromValues)) {
    return itemsFromValues
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);
  }

  const value = content.value;
  if (Array.isArray(value)) {
    return value.map((v) => String(v ?? "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const lines = value
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*\u2022]\s*/, "").trim())
      .filter(Boolean);
    if (lines.length > 1) return lines;
  }

  return [];
}

function blocksToHtml(allBlocks: PolicyBlock[], policyMeta: DraftEditorProps["policyMeta"]): string {
  const parentBlocks = allBlocks
    .filter((b) => b.parentId === null || b.parentId === undefined)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  let html = `<h1 style="margin-bottom: 0.5rem; font-size: 2em; font-weight: bold;">${policyMeta.name || "Untitled Policy"}</h1>`;
  if (policyMeta.product || policyMeta.version || policyMeta.status) {
    html += `<p style="margin: 0.5rem 0; color: #6b7280; font-size: 0.9em;"><strong>Product:</strong> ${policyMeta.product || "N/A"} | <strong>Version:</strong> ${policyMeta.version || "N/A"} | <strong>Status:</strong> ${policyMeta.status || "N/A"}</p>`;
  }
  html += `<hr style="margin: 1.25rem 0; border: none; border-top: 2px solid #e2e8f0;" />`;

  const renderBlock = (block: PolicyBlock): string => {
    switch (block.type) {
      case "section":
        return `<h2 style="margin: 1rem 0 0.4rem; font-size: 1.45em; font-weight: 700; color: #0f172a;">${block.label || "Section"}</h2>${block.content?.description ? `<p style="line-height: 1.65; color: #334155;">${block.content.description}</p>` : ""}`;
      case "heading": {
        const level = Math.max(1, Math.min(6, block.content?.level || 2));
        const text = block.content?.text || block.label || "Heading";
        return `<h${level}>${text}</h${level}>`;
      }
      case "paragraph":
        return block.content?.text ? `<p style="line-height: 1.75;">${block.content.text}</p>` : "";
      case "kv_pair": {
        const key = block.content?.key || block.label || "Key";
        const value = block.content?.value || "";
        const unit = block.content?.unit ? ` (${block.content.unit})` : "";
        return `<p><strong>${key}:</strong> ${value}${unit}</p>`;
      }
      case "list": {
        const items = normalizeListItems(block.content);
        if (items.length === 0) return "";
        const tag = block.content?.ordered ? "ol" : "ul";
        const title = block.label ? `<p style="margin: 0 0 0.3rem; font-weight: 600;">${escapeHtml(block.label)}</p>` : "";
        const rows = items.map((i: string) => `<li>${escapeHtml(i)}</li>`).join("");
        return `${title}<${tag}>${rows}</${tag}>`;
      }
      case "table": {
        const columns = normalizeColumns(block.content?.columns);
        const rows = normalizeRows(block.content?.rows, columns.length);
        if (columns.length === 0) return "";
        const thead = `<thead><tr>${columns
          .map((c: string) => `<th>${escapeHtml(String(c ?? ""))}</th>`)
          .join("")}</tr></thead>`;
        const tbody = `<tbody>${rows
          .map(
            (row: string[]) =>
              `<tr>${row
                .map((cell: string) => {
                  const safeCell = escapeHtml(String(cell ?? "")).replaceAll("\n", "<br />");
                  return `<td><p>${safeCell}</p></td>`;
                })
                .join("")}</tr>`
          )
          .join("")}</tbody>`;
        return `<table class="policy-draft-table">${thead}${tbody}</table>`;
      }
      case "number_rule": {
        const name = block.content?.name || block.label || "Rule";
        const operator = block.content?.operator || "=";
        const value = block.content?.value ?? "";
        const unit = block.content?.unit || "";
        return `<p><strong>${name}:</strong> ${operator} ${value} ${unit}</p>`;
      }
      case "divider":
        return "<hr />";
      default:
        return "";
    }
  };

  parentBlocks.forEach((parent) => {
    html += renderBlock(parent);
    const children = allBlocks
      .filter((b) => b.parentId === parent.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    children.forEach((child) => {
      const childHtml = renderBlock(child);
      if (!childHtml) return;
      html += `<div style="margin-left: 1rem; border-left: 3px solid #dbeafe; padding-left: 0.85rem;">${childHtml}</div>`;
    });
  });

  return html;
}

function countStats(editor: Editor) {
  const text = editor.getText();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const lines = Math.max(1, text.split("\n").length);

  const anchor = editor.state.selection.anchor;
  const before = editor.state.doc.textBetween(0, anchor, "\n", "\n");
  const beforeLines = before.split("\n");
  const cursorLine = Math.max(1, beforeLines.length);
  const cursorColumn = Math.max(1, (beforeLines[beforeLines.length - 1] || "").length + 1);

  return { words, chars, lines, cursorLine, cursorColumn };
}

function OfficeEditor({
  blocks,
  policyMeta,
  onContentChange,
}: DraftEditorProps) {
  const { state, dispatch } = useDocumentEditor();
  const [fontFamily, setFontFamily] = useState("Calibri");
  const [fontSize, setFontSize] = useState("12");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [isRecovering, setIsRecovering] = useState(false);
  const [showAdvancedToolbar, setShowAdvancedToolbar] = useState(false);
  const hasTableBlocks = useMemo(
    () => blocks.some((block) => String(block.type).toLowerCase() === "table"),
    [blocks]
  );

  const policyId = useMemo(() => {
    const blockPolicyId = blocks.find((block) => block.policyId)?.policyId;
    if (blockPolicyId) return blockPolicyId;
    return String((policyMeta.name || "untitled-policy").toLowerCase().replace(/\s+/g, "-") || "policy");
  }, [blocks, policyMeta.name]);
  const initialHtml = useMemo(() => blocksToHtml(blocks, policyMeta), [blocks, policyMeta]);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didRecoverRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        hardBreak: false,
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "policy-draft-table",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "policy-draft-table-row",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "policy-draft-table-header",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "policy-draft-table-cell",
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Blockquote,
      CodeBlockLowlight.configure({ lowlight }),
      HorizontalRule,
      HardBreak,
      Underline,
      Subscript,
      Superscript,
      Strike,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "<p>Loading editor...</p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[780px] p-8 leading-relaxed focus:outline-none policy-draft-editor",
      },
    },
    onUpdate: ({ editor: instance }) => {
      const html = instance.getHTML();
      onContentChange?.(html);

      const stats = countStats(instance);
      dispatch({
        type: "set_editor_stats",
        payload: {
          wordCount: stats.words,
          charCount: stats.chars,
          lineCount: stats.lines,
          cursorLine: stats.cursorLine,
          cursorColumn: stats.cursorColumn,
        },
      });

      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
      }

      saveDebounceRef.current = setTimeout(async () => {
        const nowIso = new Date().toISOString();
        try {
          saveSnapshotToLocalStorage({
            policyId,
            title: state.title,
            html,
            updatedAt: nowIso,
          });
          await saveSnapshotToIndexedDb({
            policyId,
            title: state.title,
            html,
            updatedAt: nowIso,
          });
          dispatch({ type: "set_editor_stats", payload: { lastSavedAt: nowIso } });
        } catch {
          toast.error("Auto-save failed. Changes are still in memory.");
        }
      }, 500);
    },
    onSelectionUpdate: ({ editor: instance }) => {
      const stats = countStats(instance);
      dispatch({
        type: "set_editor_stats",
        payload: {
          cursorLine: stats.cursorLine,
          cursorColumn: stats.cursorColumn,
        },
      });
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (!didRecoverRef.current) {
      void (async () => {
        setIsRecovering(true);
        const [lsSnapshot, idbSnapshot] = await Promise.all([
          Promise.resolve(loadSnapshotFromLocalStorage(policyId)),
          loadSnapshotFromIndexedDb(policyId),
        ]);

        const candidates = [lsSnapshot, idbSnapshot].filter(Boolean) as Array<{
          html: string;
          updatedAt: string;
        }>;

        const latest = candidates.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0];

        if (latest?.html && !(hasTableBlocks && !containsTableMarkup(latest.html))) {
          editor.commands.setContent(latest.html);
          dispatch({ type: "set_editor_stats", payload: { recoveryUsed: true } });
          toast.success("Recovered autosaved draft.");
        } else {
          editor.commands.setContent(initialHtml);
          if (latest?.html && hasTableBlocks) {
            toast("Loaded latest block draft to preserve tables.");
          }
        }

        didRecoverRef.current = true;
        setIsRecovering(false);
      })();
      return;
    }

    if (!editor.isFocused) {
      editor.commands.setContent(initialHtml);
    }
  }, [editor, initialHtml, policyId, dispatch, hasTableBlocks]);

  useEffect(() => {
    dispatch({ type: "set_title", payload: policyMeta.name || "Untitled Policy" });
    dispatch({
      type: "set_properties",
      payload: {
        product: policyMeta.product || "N/A",
        version: String(policyMeta.version || "N/A"),
        status: policyMeta.status || "DRAFT",
      },
    });
  }, [dispatch, policyMeta]);

  useEffect(() => {
    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    };
  }, []);

  const setColor = useCallback(
    (color: string) => {
      editor?.chain().focus().setColor(color).run();
    },
    [editor]
  );

  const setHighlight = useCallback(
    (color: string) => {
      editor?.chain().focus().toggleHighlight({ color }).run();
    },
    [editor]
  );

  const refreshFromBlocks = useCallback(() => {
    if (!editor) return;
    editor.commands.setContent(initialHtml);
    toast.success("Draft refreshed from latest block data.");
  }, [editor, initialHtml]);

  const exportPdf = useCallback(() => {
    if (!editor) return;
    const container = document.createElement("div");
    container.innerHTML = editor.getHTML();
    html2pdf()
      .set({
        margin: 10,
        filename: `${state.title || "policy"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      })
      .from(container)
      .save();
  }, [editor, state.title]);

  const applyFind = useCallback(() => {
    if (!editor || !findText.trim()) return;
    const text = editor.getText();
    const matches = text.toLowerCase().split(findText.toLowerCase()).length - 1;
    toast(matches > 0 ? `Found ${matches} matches.` : "No matches found.");
  }, [editor, findText]);

  const applyReplaceAll = useCallback(() => {
    if (!editor || !findText) return;
    const source = editor.getHTML();
    const replaced = source.replaceAll(findText, replaceText);
    editor.commands.setContent(replaced);
    toast.success("Replace all completed.");
  }, [editor, findText, replaceText]);

  if (!editor) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Initializing Word-style editor...</p>
      </div>
    );
  }

  return (
    <div className={`flex h-full flex-col ${state.ui.darkMode ? "bg-slate-900 text-slate-100" : "bg-[#f4f6fb]"}`}>
      <div className="border-b border-slate-300 bg-linear-to-r from-[#0f2a64] via-[#1e3a8a] to-[#3b2ca3] px-4 py-2 text-white shadow-md">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide">Document Editor</h3>
          <div className="max-w-[60%] truncate text-xs font-medium text-blue-100">{state.title}</div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {MENU_NAMES.map((menuName) => (
            <button
              key={menuName}
              type="button"
              className={`rounded-md border px-2.5 py-1 text-xs font-semibold tracking-wide transition ${
                state.ui.activeMenu === menuName
                  ? "border-white/40 bg-white/25"
                  : "border-transparent bg-white/5 hover:border-white/20 hover:bg-white/15"
              }`}
              onClick={() =>
                dispatch({
                  type: "set_ui",
                  payload: { activeMenu: state.ui.activeMenu === menuName ? null : menuName },
                })
              }
            >
              {menuName}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-slate-300 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-1">
            <Button size="sm" variant="outline" onClick={refreshFromBlocks}><Save className="mr-1 h-3.5 w-3.5" />Reload</Button>
            <Button size="sm" variant="outline" onClick={exportPdf}><Download className="mr-1 h-3.5 w-3.5" />PDF</Button>
            <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-4 w-4" /></Button>
            <div className="ml-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAdvancedToolbar((prev) => !prev)}
              >
                {showAdvancedToolbar ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
                {showAdvancedToolbar ? "Less tools" : "More tools"}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-1">
            <select className="h-8 rounded border px-2 text-xs" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
              {FONT_FAMILIES.map((font) => <option key={font} value={font}>{font}</option>)}
            </select>
            <select className="h-8 rounded border px-2 text-xs" value={fontSize} onChange={(e) => setFontSize(e.target.value)}>
              {FONT_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
            <Button size="sm" variant="ghost" onClick={() => setColor("#2563eb")}>A</Button>
            <Button size="sm" variant="ghost" onClick={() => setHighlight("#fef08a")}>HL</Button>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-1">
            <Button size="sm" variant={editor.isActive("bold") ? "default" : "ghost"} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Button>
            <Button size="sm" variant={editor.isActive("italic") ? "default" : "ghost"} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Button>
            <Button size="sm" variant={editor.isActive("underline") ? "default" : "ghost"} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></Button>
            <Button size="sm" variant={editor.isActive("strike") ? "default" : "ghost"} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Button>
            <Button size="sm" variant={editor.isActive("subscript") ? "default" : "ghost"} onClick={() => editor.chain().focus().toggleSubscript().run()}>x2</Button>
            <Button size="sm" variant={editor.isActive("superscript") ? "default" : "ghost"} onClick={() => editor.chain().focus().toggleSuperscript().run()}>x^2</Button>
            <Button size="sm" variant={editor.isActive("bulletList") ? "default" : "ghost"} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Button>
            <Button size="sm" variant={editor.isActive("orderedList") ? "default" : "ghost"} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 4, withHeaderRow: true }).run()}><Table2 className="h-4 w-4" /></Button>
          </div>

          {showAdvancedToolbar ? (
            <>
              <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-1">
            <Button size="sm" variant={editor.isActive("heading", { level: 1 }) ? "default" : "ghost"} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-4 w-4" /></Button>
            <Button size="sm" variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Button>
            <Button size="sm" variant={editor.isActive("heading", { level: 3 }) ? "default" : "ghost"} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></Button>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-1">
            <Button size="sm" variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="h-4 w-4" /></Button>
            <Button size="sm" variant={editor.isActive({ textAlign: "center" }) ? "default" : "ghost"} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="h-4 w-4" /></Button>
            <Button size="sm" variant={editor.isActive({ textAlign: "right" }) ? "default" : "ghost"} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="h-4 w-4" /></Button>
            <Button size="sm" variant={editor.isActive({ textAlign: "justify" }) ? "default" : "ghost"} onClick={() => editor.chain().focus().setTextAlign("justify").run()}><AlignJustify className="h-4 w-4" /></Button>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-1">
            <Button size="sm" variant={editor.isActive("taskList") ? "default" : "ghost"} onClick={() => editor.chain().focus().toggleTaskList().run()}>Task</Button>
            <Button size="sm" variant={editor.isActive("blockquote") ? "default" : "ghost"} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Button>
            <Button size="sm" variant={editor.isActive("codeBlock") ? "default" : "ghost"} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4" /></Button>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-1">
            <Button size="sm" variant="ghost" onClick={() => {
              const url = prompt("Enter URL");
              if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            }}><LinkIcon className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => {
              const url = prompt("Image URL");
              if (url) editor.chain().focus().setImage({ src: url }).run();
            }}><ImageIcon className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().addRowAfter().run()}><Plus className="h-4 w-4" />Row</Button>
            <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().addColumnAfter().run()}><Plus className="h-4 w-4" />Col</Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-1">
            <Button size="sm" variant="outline" onClick={() => dispatch({ type: "set_ui", payload: { showRuler: !state.ui.showRuler } })}><Ruler className="mr-1 h-4 w-4" />Ruler</Button>
            <Button size="sm" variant="outline" onClick={() => dispatch({ type: "set_ui", payload: { showFormattingMarks: !state.ui.showFormattingMarks } })}>¶ Marks</Button>
            <Button size="sm" variant="outline" onClick={() => dispatch({ type: "set_ui", payload: { darkMode: !state.ui.darkMode } })}>{state.ui.darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
            <Button size="sm" variant="outline" onClick={() => dispatch({ type: "set_ui", payload: { zoom: Math.max(50, state.ui.zoom - 10) } })}>-</Button>
            <span className="text-xs text-slate-600">{state.ui.zoom}%</span>
            <Button size="sm" variant="outline" onClick={() => dispatch({ type: "set_ui", payload: { zoom: Math.min(200, state.ui.zoom + 10) } })}>+</Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-1">
            <div className="flex items-center gap-1 rounded border bg-white px-2">
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <input className="h-8 text-xs outline-none" placeholder="Find" value={findText} onChange={(e) => setFindText(e.target.value)} />
              <button className="text-xs text-blue-600" type="button" onClick={applyFind}>Go</button>
            </div>
            <div className="flex items-center gap-1 rounded border bg-white px-2">
              <Replace className="h-3.5 w-3.5 text-slate-500" />
              <input className="h-8 text-xs outline-none" placeholder="Replace with" value={replaceText} onChange={(e) => setReplaceText(e.target.value)} />
              <button className="text-xs text-blue-600" type="button" onClick={applyReplaceAll}>All</button>
            </div>
          </div>
            </>
          ) : null}
        </div>
      </div>

      {state.ui.showRuler && (
        <div className="border-b bg-slate-100 px-8 py-1 text-[10px] text-slate-500">
          <div className="relative h-4">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="absolute" style={{ left: `${(i / 15) * 100}%` }}>|</span>
            ))}
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-auto p-6 ${state.ui.darkMode ? "bg-slate-800" : "bg-[#e9edf6]"}`}>
        {isRecovering ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">Recovering autosave...</div>
        ) : (
          <div className={`mx-auto w-full ${hasTableBlocks ? "max-w-6xl" : "max-w-4xl"}`}>
            <div
              className={`rounded-lg border p-0 shadow-xl ${state.ui.darkMode ? "border-slate-700 bg-slate-900" : "border-slate-300 bg-white"}`}
              style={{ transform: `scale(${state.ui.zoom / 100})`, transformOrigin: "top center" }}
            >
              <EditorContent editor={editor} />
            </div>
          </div>
        )}
      </div>

      <div className="border-t bg-white px-4 py-2 text-xs text-slate-600">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span>Words: {state.editor.wordCount}</span>
            <span>Characters: {state.editor.charCount}</span>
            <span>Lines: {state.editor.lineCount}</span>
            <span>Ln {state.editor.cursorLine}, Col {state.editor.cursorColumn}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Zoom: {state.ui.zoom}%</span>
            <span>
              Last Save: {state.editor.lastSavedAt ? new Date(state.editor.lastSavedAt).toLocaleTimeString() : "Not saved"}
            </span>
            {state.editor.recoveryUsed ? <span className="text-blue-600">Recovered</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DraftEditor(props: DraftEditorProps) {
  const initialState: DocumentEditorState = useMemo(
    () => ({
      title: props.policyMeta.name || "Untitled Policy",
      properties: {
        product: props.policyMeta.product || "N/A",
        version: String(props.policyMeta.version || "N/A"),
        status: props.policyMeta.status || "DRAFT",
      },
      ui: {
        activeMenu: null,
        showRuler: true,
        showFormattingMarks: false,
        darkMode: false,
        zoom: 100,
      },
      editor: {
        wordCount: 0,
        charCount: 0,
        lineCount: 1,
        cursorLine: 1,
        cursorColumn: 1,
        lastSavedAt: null,
        recoveryUsed: false,
      },
    }),
    [props.policyMeta]
  );

  return (
    <DocumentEditorProvider initialState={initialState}>
      <OfficeEditor {...props} />
    </DocumentEditorProvider>
  );
}
