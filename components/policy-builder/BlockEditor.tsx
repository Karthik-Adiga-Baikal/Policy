"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import type { PolicyBlock } from "@/hooks/useBlocks";
import { useCreateBlock, useDeleteBlock } from "@/hooks/useBlocks";

const BLOCK_TYPES = [
  { id: "section", name: "Section" },
  { id: "heading", name: "Heading" },
  { id: "paragraph", name: "Paragraph" },
  { id: "kv_pair", name: "Key / Value" },
  { id: "list", name: "List" },
  { id: "table", name: "Table" },
  { id: "number_rule", name: "Number Rule" },
  { id: "divider", name: "Divider" },
];

interface BlockEditorProps {
  blockId: string;
  block?: PolicyBlock;
  childBlocks?: PolicyBlock[];
  onUpdate: (updates: any) => void;
  onClose: () => void;
}

export default function BlockEditor({
  blockId,
  block,
  childBlocks = [],
  onUpdate,
  onClose,
}: BlockEditorProps) {
  const [localContent, setLocalContent] = useState(block?.content || {});
  const [localLabel, setLocalLabel] = useState(block?.label || "");
  const [selectedChildBlockType, setSelectedChildBlockType] = useState("paragraph");
  const [expandedChildren, setExpandedChildren] = useState<Record<string, boolean>>({});

  const createBlockMutation = useCreateBlock();
  const deleteBlockMutation = useDeleteBlock();

  const sortedChildren = useMemo(() => {
    return [...(childBlocks || [])].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [childBlocks]);

  const handleSave = () => {
    onUpdate({
      label: localLabel,
      content: localContent,
    });
  };

  const getDefaultContent = (blockType: string) => {
    switch (blockType) {
      case "section":
        return { description: "" };
      case "heading":
        return { level: 2, text: "New Heading" };
      case "paragraph":
        return { text: "" };
      case "kv_pair":
        return { key: "", value: "", unit: "" };
      case "list":
        return { items: [], ordered: false };
      case "table":
        return { columns: [], rows: [] };
      case "number_rule":
        return { name: "", operator: "=", value: 0, unit: "" };
      case "divider":
        return {};
      default:
        return {};
    }
  };

  const handleAddChildBlock = async () => {
    const maxOrder = sortedChildren.length > 0 ? Math.max(...sortedChildren.map((b) => b.orderIndex)) : 0;
    try {
      await createBlockMutation.mutateAsync({
        policyId: block?.policyId || "",
        type: selectedChildBlockType,
        label: BLOCK_TYPES.find((t) => t.id === selectedChildBlockType)?.name || "New Block",
        content: getDefaultContent(selectedChildBlockType),
        orderIndex: maxOrder + 1,
        parentId: blockId,
      });
      toast.success(`Child ${selectedChildBlockType} block added`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to add child block");
    }
  };

  if (!block) {
    return <div className="text-center text-gray-400">Block not found</div>;
  }

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
      {/* Block Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Block Editor</p>
          <h2 className="text-2xl font-bold text-gray-900 capitalize">{block.type.replace('_', ' ')}</h2>
          <p className="text-sm text-gray-500 mt-1">Configure block content and nested structure</p>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X size={16} className="mr-1" /> Close
        </Button>
      </div>

      {/* Block Label */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Label</label>
        <Input
          value={localLabel}
          onChange={(e) => setLocalLabel(e.target.value)}
          placeholder="Block label (e.g., Section Title)"
          className="border-gray-200"
        />
      </div>

      {/* Block Type-Specific Content */}
      <div className="space-y-4 border-t border-gray-200 pt-4">
        <h3 className="font-semibold text-gray-900">Content</h3>

        {block.type === "paragraph" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Text</label>
            <Textarea
              value={localContent.text || ""}
              onChange={(e) => setLocalContent({ ...localContent, text: e.target.value })}
              placeholder="Enter paragraph text"
              rows={6}
              className="border-gray-200"
            />
          </div>
        )}

        {block.type === "heading" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Heading Level</label>
              <Select
                value={String(localContent.level || 2)}
                onValueChange={(v) => setLocalContent({ ...localContent, level: parseInt(v) })}
              >
                <SelectTrigger className="border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">H1 (Largest)</SelectItem>
                  <SelectItem value="2">H2</SelectItem>
                  <SelectItem value="3">H3</SelectItem>
                  <SelectItem value="4">H4</SelectItem>
                  <SelectItem value="5">H5</SelectItem>
                  <SelectItem value="6">H6 (Smallest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Heading Text</label>
              <Input
                value={localContent.text || ""}
                onChange={(e) => setLocalContent({ ...localContent, text: e.target.value })}
                placeholder="Enter heading text"
                className="border-gray-200"
              />
            </div>
          </div>
        )}

        {block.type === "section" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <Textarea
              value={localContent.description || ""}
              onChange={(e) => setLocalContent({ ...localContent, description: e.target.value })}
              placeholder="Section description"
              rows={4}
              className="border-gray-200"
            />
          </div>
        )}

        {block.type === "kv_pair" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Key</label>
              <Input
                value={localContent.key || ""}
                onChange={(e) => setLocalContent({ ...localContent, key: e.target.value })}
                placeholder="Key name"
                className="border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Value</label>
              <Input
                value={localContent.value || ""}
                onChange={(e) => setLocalContent({ ...localContent, value: e.target.value })}
                placeholder="Value"
                className="border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Unit (Optional)</label>
              <Input
                value={localContent.unit || ""}
                onChange={(e) => setLocalContent({ ...localContent, unit: e.target.value })}
                placeholder="e.g., %, kg, m"
                className="border-gray-200"
              />
            </div>
          </div>
        )}

        {block.type === "number_rule" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Rule Name</label>
              <Input
                value={localContent.name || ""}
                onChange={(e) => setLocalContent({ ...localContent, name: e.target.value })}
                placeholder="e.g., Minimum Age"
                className="border-gray-200"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Operator</label>
                <Select
                  value={localContent.operator || "="}
                  onValueChange={(v) => setLocalContent({ ...localContent, operator: v })}
                >
                  <SelectTrigger className="border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="=">=</SelectItem>
                    <SelectItem value=">">&gt;</SelectItem>
                    <SelectItem value=">=">&gt;=</SelectItem>
                    <SelectItem value="<">&lt;</SelectItem>
                    <SelectItem value="<=">&lt;=</SelectItem>
                    <SelectItem value="!=">!=</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Value</label>
                <Input
                  type="number"
                  value={localContent.value || 0}
                  onChange={(e) => setLocalContent({ ...localContent, value: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Unit</label>
                <Input
                  value={localContent.unit || ""}
                  onChange={(e) => setLocalContent({ ...localContent, unit: e.target.value })}
                  placeholder="e.g., %"
                  className="border-gray-200"
                />
              </div>
            </div>
          </div>
        )}

        {block.type === "list" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localContent.ordered || false}
                  onChange={(e) => setLocalContent({ ...localContent, ordered: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium text-gray-700">Ordered List</span>
              </label>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Items (one per line)</label>
              <Textarea
                value={(localContent.items || []).join("\n")}
                onChange={(e) => setLocalContent({ ...localContent, items: e.target.value.split("\n").filter((i) => i.trim()) })}
                placeholder="Item 1&#10;Item 2&#10;Item 3"
                rows={6}
                className="border-gray-200"
              />
            </div>
          </div>
        )}

        {block.type === "table" && (
          <div className="space-y-3 text-sm text-gray-500">
            <p>Table editing is limited. Edit columns and rows in the advanced editor.</p>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Columns (comma-separated)</label>
              <Input
                value={(localContent.columns || []).join(", ")}
                onChange={(e) => setLocalContent({ ...localContent, columns: e.target.value.split(",").map((c) => c.trim()) })}
                placeholder="Column 1, Column 2, Column 3"
                className="border-gray-200"
              />
            </div>
          </div>
        )}

        {block.type === "divider" && (
          <div className="text-sm text-gray-500">
            <p>Divider blocks have no content to edit. They render as a horizontal line.</p>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex gap-2 border-t border-gray-200 pt-4">
        <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
          Save Changes
        </Button>
      </div>

      {/* Child Blocks Section */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="mb-4 font-semibold text-gray-900">Child Blocks (Nested)</h3>
        <p className="mb-4 text-sm text-gray-600">Add blocks inside this block to create a hierarchy:</p>

        <div className="space-y-3 mb-4 pb-4 border-b">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-2">Child Block Type</label>
            <Select value={selectedChildBlockType} onValueChange={setSelectedChildBlockType}>
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOCK_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            onClick={handleAddChildBlock}
            disabled={createBlockMutation.isPending}
          >
            <Plus size={16} className="mr-2" /> Add Child Block
          </Button>
        </div>

        {/* Child Blocks List */}
        {sortedChildren.length > 0 ? (
          <div className="space-y-2">
            {sortedChildren.map((child) => (
              <div
                key={child.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setExpandedChildren((prev) => ({ ...prev, [child.id]: !prev[child.id] }))}
                    className="flex items-center gap-2 flex-1 text-left hover:opacity-70"
                  >
                    {expandedChildren[child.id] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">{child.label || child.type}</p>
                      <p className="text-xs text-gray-500">{child.type}</p>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this child block?")) {
                        deleteBlockMutation.mutate(child.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {expandedChildren[child.id] && (
                  <div className="mt-3 border-t border-gray-200 pt-3 text-xs text-gray-600 bg-white rounded p-2">
                    <p className="mb-1 font-medium">Content Preview:</p>
                    <pre className="overflow-x-auto text-xs whitespace-pre-wrap break-words">
                      {JSON.stringify(child.content, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-xs text-gray-400">
            No child blocks yet. Add one above to create nesting.
          </div>
        )}
      </div>
    </div>
  );
}
