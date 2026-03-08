import type { BaseEditor, Descendant } from "slate";
import type { ReactEditor } from "slate-react";
import type { HistoryEditor } from "slate-history";

// ── Custom element types ────────────────────────────────────────────

export type ParagraphElement = {
  type: "paragraph";
  align?: "right" | "center" | "left";
  dir?: "rtl" | "ltr";
  children: CustomText[];
};

export type HeadingElement = {
  type: "heading";
  level: 1 | 2 | 3;
  align?: "right" | "center" | "left";
  dir?: "rtl" | "ltr";
  children: CustomText[];
};

export type TableElement = {
  type: "table";
  dir?: "rtl" | "ltr";
  children: TableRowElement[];
};

export type TableRowElement = {
  type: "table-row";
  height?: string; // e.g. "40px", "2em"
  children: TableCellElement[];
};

export type TableCellElement = {
  type: "table-cell";
  width?: string; // e.g. "30%", "200px"
  colSpan?: number;
  rowSpan?: number;
  children: Descendant[];
};

export type BulletedListElement = {
  type: "bulleted-list";
  dir?: "rtl" | "ltr";
  children: ListItemElement[];
};

export type NumberedListElement = {
  type: "numbered-list";
  dir?: "rtl" | "ltr";
  children: ListItemElement[];
};

export type ListItemElement = {
  type: "list-item";
  children: CustomText[];
};

// Placeholder inline
export type PlaceholderElement = {
  type: "placeholder";
  token: string;
  children: CustomText[];
};

export type CustomElement =
  | ParagraphElement
  | HeadingElement
  | TableElement
  | TableRowElement
  | TableCellElement
  | BulletedListElement
  | NumberedListElement
  | ListItemElement
  | PlaceholderElement;

export type FormattedText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: string; // e.g. "12px", "14px", "16px", "18px"
};

export type CustomText = FormattedText;

// ── Slate module augmentation ───────────────────────────────────────

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// ── Constants ───────────────────────────────────────────────────────

export const HOTKEYS: Record<string, string> = {
  "mod+b": "bold",
  "mod+i": "italic",
  "mod+u": "underline",
};

export const LIST_TYPES = ["numbered-list", "bulleted-list"] as const;
export const BLOCK_TYPES = [
  "paragraph",
  "heading",
  "bulleted-list",
  "numbered-list",
  "list-item",
] as const;

export const EMPTY_PARAGRAPH: ParagraphElement = {
  type: "paragraph",
  dir: "rtl",
  align: "right",
  children: [{ text: "" }],
};

export function createEmptyDocument(): Descendant[] {
  return [{ ...EMPTY_PARAGRAPH, children: [{ text: "" }] }];
}
