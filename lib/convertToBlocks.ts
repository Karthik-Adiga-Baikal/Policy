/**
 * Converts CrewAI extraction output (section→group→item structure)
 * to the new PolicyBlock format (flat, ordered blocks)
 */

export interface CrewAIItem {
  name: string;
  type: "string" | "list" | "table";
  value?: string;
  values?: string[];
  columns?: string[];
  rows?: string[][];
  children?: any[];
}

export interface CrewAIGroup {
  group_name: string;
  items: CrewAIItem[];
}

export interface CrewAISection {
  section_name: string;
  groups: CrewAIGroup[];
  order_index?: number;
}

export interface CrewAIDocument {
  name: string;
  sections: CrewAISection[];
}

export interface BlockInput {
  type: string;
  label?: string;
  content: Record<string, any>;
  orderIndex: number;
  parentId?: string;
}

/**
 * Helper: Check if item is a numeric rule (contains numeric operator like >=, <=, =, etc.)
 */
function isNumericRule(item: CrewAIItem): boolean {
  if (!item.value) return false;

  const numericPatterns = [
    /^\s*[><=!]+\s*[\d.]+/,  // >= 100, < 50, etc.
    /^\s*[\d.]+\s*[><=!]+\s*[\d.]+/,  // 100 >= x >= 50
    /between\s+[\d.]+\s+and\s+[\d.]+/i,
  ];

  return numericPatterns.some((pattern) => pattern.test(item.value || ""));
}

/**
 * Helper: Extract operator from numeric value
 */
function extractOperator(value: string): string {
  const match = value.match(/([><=!]+)/);
  return match ? match[1] : "=";
}

/**
 * Helper: Extract numeric value
 */
function extractNumericValue(value: string): number {
  const match = value.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Helper: Extract unit from value string
 */
function extractUnit(value: string): string {
  const parts = value.trim().split(/\s+/);
  const lastPart = parts[parts.length - 1];
  return /^[a-zA-Z%]+$/.test(lastPart) ? lastPart : "";
}

/**
 * Convert CrewAI extraction JSON to PolicyBlock format
 * Handles the output.txt format with policy_document structure
 */
export function convertCrewAIToBlocks(input: any): BlockInput[] {
  const blocks: BlockInput[] = [];
  let orderIndex = 1;

  // Handle case where input is simplified with direct blocks array
  if (input.blocks && Array.isArray(input.blocks)) {
    return input.blocks.map((block: any, idx: number) => ({
      type: block.type || "paragraph",
      label: block.label || block.name || "",
      content: block.content || {},
      orderIndex: block.orderIndex !== undefined ? block.orderIndex : idx + 1,
      parentId: block.parentId,
    }));
  }

  // Handle output.txt format: { policy_document: { sections: [...] } }
  let policyDoc = input;
  if (input.policy_document) {
    policyDoc = input.policy_document;
  }

  const sections = policyDoc.sections || input.sections || [];
  if (!Array.isArray(sections) || sections.length === 0) {
    console.warn("No sections found in extraction data");
    return [];
  }

  for (const section of sections) {
    if (!section.section_name) continue;

    // 1. Section header block
    blocks.push({
      type: "section",
      label: section.section_name,
      content: { description: "" },
      orderIndex: orderIndex++,
    });

    // 2. Process groups within section
    const groups = section.groups || [];
    for (const group of groups) {
      if (!group.group_name) continue;

      // Add group as heading
      blocks.push({
        type: "heading",
        label: group.group_name,
        content: { level: 2, text: group.group_name },
        orderIndex: orderIndex++,
      });

      // 3. Process items within group
      const items = group.items || [];
      for (const item of items) {
        if (!item.name && !item.value) continue;

        // Table type - check first!
        if (item.type === "table" && item.columns && Array.isArray(item.columns) && item.columns.length > 0) {
          // Remove duplicate columns (e.g., "Items" and "Items_1")
          const seenColumns = new Set<string>();
          const uniqueColumns: string[] = [];
          const duplicateIndices: number[] = [];

          item.columns.forEach((col, idx) => {
            const normalized = col.toLowerCase().replace(/_\d+$/, ""); // Remove trailing _1, _2, etc
            if (!seenColumns.has(normalized)) {
              seenColumns.add(normalized);
              uniqueColumns.push(col);
            } else {
              duplicateIndices.push(idx);
            }
          });

          // Remove duplicate columns from rows
          const cleanedRows = (item.rows || []).map((row) => {
            return row.filter((_, idx) => !duplicateIndices.includes(idx));
          });

          console.log(`Creating table block: ${item.name} with ${uniqueColumns.length} columns (removed ${duplicateIndices.length} duplicates) and ${cleanedRows.length} rows`);

          blocks.push({
            type: "table",
            label: item.name,
            content: {
              columns: uniqueColumns,
              rows: cleanedRows,
            },
            orderIndex: orderIndex++,
          });
        }
        // List type (has values array)
        else if (item.type === "list" || (item.values && Array.isArray(item.values) && item.values.length > 0)) {
          blocks.push({
            type: "list",
            label: item.name,
            content: {
              items: item.values || [],
              ordered: false,
            },
            orderIndex: orderIndex++,
          });
        }
        // Numeric rule
        else if (isNumericRule(item)) {
          blocks.push({
            type: "number_rule",
            label: item.name,
            content: {
              name: item.name,
              operator: extractOperator(item.value || ""),
              value: extractNumericValue(item.value || ""),
              unit: extractUnit(item.value || ""),
            },
            orderIndex: orderIndex++,
          });
        }
        // Long text → paragraph (> 200 chars)
        else if (item.value && typeof item.value === "string" && item.value.length > 200) {
          blocks.push({
            type: "paragraph",
            label: item.name,
            content: {
              text: item.value,
            },
            orderIndex: orderIndex++,
          });
        }
        // Default: key-value pair
        else if (item.value || item.type === "string") {
          blocks.push({
            type: "kv_pair",
            label: item.name,
            content: {
              key: item.name,
              value: String(item.value || ""),
              unit: extractUnit(String(item.value || "")),
            },
            orderIndex: orderIndex++,
          });
        }
      }
    }
  }

  console.log(`Converted ${blocks.length} blocks from extraction data`);
  return blocks;
}

/**
 * Validate block structure
 */
export function validateBlocks(blocks: BlockInput[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  blocks.forEach((block, idx) => {
    if (!block.type) {
      errors.push(`Block ${idx}: type is required`);
    }
    if (block.orderIndex === undefined || block.orderIndex === null) {
      errors.push(`Block ${idx}: orderIndex is required`);
    }
    if (!block.content || typeof block.content !== "object") {
      errors.push(`Block ${idx}: content must be an object`);
    }
  });

  return { valid: errors.length === 0, errors };
}
