"use client";

import * as React from "react";
import {
  createEditor,
  Editor,
  Element as SlateElement,
  Transforms,
  type BaseOperation,
  type Descendant,
  type Range,
} from "slate";
import {
  Slate,
  Editable,
  useSlate,
  withReact,
  type RenderElementProps,
  type RenderLeafProps,
} from "slate-react";
import { ReactEditor } from "slate-react";
import { withHistory } from "slate-history";
import isHotkey from "is-hotkey";
import "./slate-types";
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  ColumnsIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  PlusIcon,
  RowsIcon,
  TableIcon,
  Trash2Icon,
  UnderlineIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  HOTKEYS,
  type PlaceholderElement,
  type TableElement,
  type TableRowElement,
} from "./slate-types";
import {
  isMarkActive,
  toggleMark,
  isBlockActive,
  toggleBlock,
  setTextAlign,
  getFontSize,
  setFontSize,
  insertTable,
  addTableRow,
  addTableColumn,
  deleteTableRow,
  deleteTableColumn,
  setColumnWidths,
  setRowHeight,
  insertPlaceholder,
  serializeToHtml,
  deserializeFromHtml,
} from "./slate-helpers";

// ── Inline / Void config ────────────────────────────────────────────

function withPlaceholders(editor: Editor) {
  const { isInline, isVoid } = editor;

  editor.isInline = (element: any) => {
    return element.type === "placeholder" ? true : isInline(element);
  };

  editor.isVoid = (element: any) => {
    return element.type === "placeholder" ? true : isVoid(element);
  };

  return editor;
}

function withTables(editor: Editor) {
  const { deleteBackward, deleteForward, insertBreak } = editor;

  editor.deleteBackward = (unit: any) => {
    const { selection } = editor;
    if (selection) {
      const [cell] = Array.from(
        Editor.nodes(editor, {
          match: (n: any) =>
            !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "table-cell",
        }),
      );
      if (cell) {
        const [, cellPath] = cell;
        if (Editor.isStart(editor, selection.anchor, cellPath)) {
          return;
        }
      }
    }
    deleteBackward(unit);
  };

  editor.deleteForward = (unit: any) => {
    const { selection } = editor;
    if (selection) {
      const [cell] = Array.from(
        Editor.nodes(editor, {
          match: (n: any) =>
            !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "table-cell",
        }),
      );
      if (cell) {
        const [, cellPath] = cell;
        if (Editor.isEnd(editor, selection.anchor, cellPath)) {
          return;
        }
      }
    }
    deleteForward(unit);
  };

  editor.insertBreak = () => {
    const { selection } = editor;
    if (selection) {
      const [table] = Array.from(
        Editor.nodes(editor, {
          match: (n: any) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "table",
        }),
      );
      if (table) {
        Transforms.insertText(editor, "\n");
        return;
      }
    }
    insertBreak();
  };

  return editor;
}

// ── Resizable table cell ────────────────────────────────────────────

function ResizableTableCell(
  props: RenderElementProps & { element: import("./slate-types").TableCellElement },
) {
  const { attributes, children, element } = props;
  const editor = useSlate();
  const cellRef = React.useRef<HTMLTableCellElement>(null);

  const path = React.useMemo(() => {
    try {
      return ReactEditor.findPath(editor, element);
    } catch {
      return null;
    }
  }, [editor, element]);

  const { tablePath, table, rowIndex, colIndex, isLastCol } = React.useMemo(() => {
    if (!path || path.length < 2) {
      return {
        tablePath: null,
        table: null,
        rowIndex: 0,
        colIndex: 0,
        isLastCol: false,
        isLastRow: false,
      };
    }
    const rowIndex = path[path.length - 2];
    const colIndex = path[path.length - 1];
    const tablePath = path.slice(0, -2);
    let table: TableElement | null = null;
    try {
      table = Editor.node(editor, tablePath)[0] as TableElement;
    } catch {
      return {
        tablePath,
        table: null,
        rowIndex,
        colIndex,
        isLastCol: false,
      };
    }
    const numCols = table.children[rowIndex]?.children.length ?? 0;
    return {
      tablePath,
      table,
      rowIndex,
      colIndex,
      isLastCol: colIndex === numCols - 1,
    };
  }, [editor, path]);

  const handleColResize = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!tablePath || !table) return;
      const startX = e.clientX;
      const tableEl = cellRef.current?.closest("table");
      if (!tableEl) return;
      const tableRect = tableEl.getBoundingClientRect();
      const colWidthsPx = Array.from(tableEl.rows[0]?.cells ?? []).map(
        (c) => c.getBoundingClientRect().width,
      );
      const totalWidth = tableRect.width;

      const onMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const newColWidth = Math.max(20, colWidthsPx[colIndex] + delta);
        const widthPct = (newColWidth / totalWidth) * 100;
        setColumnWidths(editor, tablePath, colIndex, `${widthPct.toFixed(1)}%`);
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [editor, tablePath, table, colIndex],
  );

  const handleRowResize = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!tablePath) return;
      const startY = e.clientY;
      const rowEl = cellRef.current?.closest("tr");
      if (!rowEl) return;
      const startHeight = rowEl.getBoundingClientRect().height;

      const onMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientY - startY;
        const newHeight = Math.max(24, startHeight + delta);
        setRowHeight(editor, [...tablePath, rowIndex], `${Math.round(newHeight)}px`);
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    },
    [editor, tablePath, rowIndex],
  );

  const mergedRef = React.useCallback(
    (el: HTMLTableCellElement | null) => {
      (
        attributes as React.HTMLAttributes<HTMLTableCellElement> & {
          ref?: (el: HTMLTableCellElement | null) => void;
        }
      ).ref?.(el);
      (cellRef as React.MutableRefObject<HTMLTableCellElement | null>).current = el;
    },
    [attributes],
  );

  return (
    <td
      {...attributes}
      ref={mergedRef}
      style={{
        width: element.width ?? "auto",
        position: "relative",
      }}
      colSpan={element.colSpan}
      rowSpan={element.rowSpan}
      className="slate-cell"
    >
      {children}
      {!isLastCol && tablePath && (
        <div
          contentEditable={false}
          className="slate-col-resize-handle"
          onMouseDown={handleColResize}
          aria-hidden
        />
      )}
      {isLastCol && tablePath && (
        <div
          contentEditable={false}
          className="slate-row-resize-handle"
          onMouseDown={handleRowResize}
          aria-hidden
        />
      )}
    </td>
  );
}

// ── Element renderers ───────────────────────────────────────────────

function ElementRenderer(props: RenderElementProps) {
  const { attributes, children, element } = props;

  switch (element.type) {
    case "heading": {
      const Tag = `h${element.level}` as "h1" | "h2" | "h3";
      return (
        <Tag
          {...attributes}
          dir={element.dir ?? "rtl"}
          style={{ textAlign: element.align ?? "right" }}
          className="slate-heading"
        >
          {children}
        </Tag>
      );
    }
    case "bulleted-list":
      return (
        <ul {...attributes} dir={element.dir ?? "rtl"} className="slate-list">
          {children}
        </ul>
      );
    case "numbered-list":
      return (
        <ol {...attributes} dir={element.dir ?? "rtl"} className="slate-list">
          {children}
        </ol>
      );
    case "list-item":
      return <li {...attributes}>{children}</li>;
    case "table":
      return (
        <table {...attributes} dir={element.dir ?? "rtl"} className="slate-table">
          <tbody>{children}</tbody>
        </table>
      );
    case "table-row": {
      const row = element as TableRowElement;
      return (
        <tr
          {...attributes}
          style={row.height ? { height: row.height, minHeight: row.height } : undefined}
        >
          {children}
        </tr>
      );
    }
    case "table-cell":
      return (
        <ResizableTableCell
          {...props}
          element={element as import("./slate-types").TableCellElement}
        />
      );
    case "placeholder":
      return <PlaceholderBadge {...props} element={element} />;
    case "paragraph":
    default:
      return (
        <p
          {...attributes}
          dir={element.type === "paragraph" ? (element.dir ?? "rtl") : "rtl"}
          style={{
            textAlign: element.type === "paragraph" ? (element.align ?? "right") : "right",
          }}
        >
          {children}
        </p>
      );
  }
}

function PlaceholderBadge({
  attributes,
  children,
  element,
}: RenderElementProps & { element: PlaceholderElement }) {
  return (
    <span {...attributes} contentEditable={false} className="slate-placeholder-token">
      {children}
      <span className="slate-placeholder-label">{`{{${element.token}}}`}</span>
    </span>
  );
}

function LeafRenderer({ attributes, children, leaf }: RenderLeafProps) {
  let el = children;
  if (leaf.bold) el = <strong>{el}</strong>;
  if (leaf.italic) el = <em>{el}</em>;
  if (leaf.underline) el = <u>{el}</u>;
  const style = leaf.fontSize
    ? { fontSize: leaf.fontSize, lineHeight: "inherit", display: "inline" as const }
    : undefined;
  return (
    <span {...attributes} style={style}>
      {el}
    </span>
  );
}

// ── Toolbar button components ───────────────────────────────────────

function MarkButton({
  format,
  icon: Icon,
  editor,
  label,
}: {
  format: string;
  icon: React.ElementType;
  editor: Editor;
  label: string;
}) {
  const active = isMarkActive(editor, format);
  return (
    <Button
      type="button"
      size="icon-sm"
      variant={active ? "default" : "outline"}
      onMouseDown={(e) => {
        e.preventDefault();
        toggleMark(editor, format);
      }}
      aria-label={label}
    >
      <Icon className="size-4" />
    </Button>
  );
}

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px"];

function TableContextMenuItems({
  editor,
  savedSelection,
}: {
  editor: Editor;
  savedSelection: React.MutableRefObject<Range | null>;
}) {
  const inTable = React.useMemo(() => {
    const sel = savedSelection.current ?? editor.selection;
    if (!sel) return false;
    const [match] = Array.from(
      Editor.nodes(editor, {
        at: sel,
        match: (n) =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          (n.type === "table" || n.type === "table-cell" || n.type === "table-row"),
      }),
    );
    return !!match;
  }, [editor, savedSelection]);

  const at = savedSelection.current ?? editor.selection;

  if (!inTable) return null;

  return (
    <>
      <ContextMenuItem
        onSelect={(e) => {
          e.preventDefault();
          if (at) {
            Transforms.select(editor, at);
            addTableRow(editor, at);
          }
        }}
      >
        <RowsIcon className="mr-2 size-4" />
        Add Row
      </ContextMenuItem>
      <ContextMenuItem
        onSelect={(e) => {
          e.preventDefault();
          if (at) {
            Transforms.select(editor, at);
            addTableColumn(editor, at);
          }
        }}
      >
        <ColumnsIcon className="mr-2 size-4" />
        Add Column
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        variant="destructive"
        onSelect={(e) => {
          e.preventDefault();
          if (at) {
            Transforms.select(editor, at);
            deleteTableRow(editor, at);
          }
        }}
      >
        <Trash2Icon className="mr-2 size-4" />
        Delete Row
      </ContextMenuItem>
      <ContextMenuItem
        variant="destructive"
        onSelect={(e) => {
          e.preventDefault();
          if (at) {
            Transforms.select(editor, at);
            deleteTableColumn(editor, at);
          }
        }}
      >
        <Trash2Icon className="mr-2 size-4" />
        Delete Column
      </ContextMenuItem>
    </>
  );
}

function FontSizeSelect({ editor }: { editor: Editor }) {
  const value = getFontSize(editor) ?? "16px";
  const savedSelectionRef = React.useRef<Range | null>(null);

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v) {
          const sel = savedSelectionRef.current;
          savedSelectionRef.current = null;
          if (sel) {
            Transforms.select(editor, sel);
            ReactEditor.focus(editor);
            setFontSize(editor, v);
          } else {
            setFontSize(editor, v);
          }
        }
      }}
    >
      <SelectTrigger
        size="sm"
        className="h-7 w-20"
        onMouseDown={(e) => {
          e.preventDefault();
          if (editor.selection) {
            savedSelectionRef.current = { ...editor.selection };
          }
        }}
      >
        <SelectValue placeholder="Size" />
      </SelectTrigger>
      <SelectContent>
        {FONT_SIZES.map((size) => (
          <SelectItem key={size} value={size}>
            {size}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function BlockButton({
  format,
  icon: Icon,
  editor,
  label,
}: {
  format: string;
  icon: React.ElementType;
  editor: Editor;
  label: string;
}) {
  const active = isBlockActive(editor, format);
  return (
    <Button
      type="button"
      size="icon-sm"
      variant={active ? "default" : "outline"}
      onMouseDown={(e) => {
        e.preventDefault();
        toggleBlock(editor, format);
      }}
      aria-label={label}
    >
      <Icon className="size-4" />
    </Button>
  );
}

function AlignButton({
  align,
  icon: Icon,
  editor,
  label,
}: {
  align: "right" | "center" | "left";
  icon: React.ElementType;
  editor: Editor;
  label: string;
}) {
  const active = isBlockActive(editor, align, "align");
  return (
    <Button
      type="button"
      size="icon-sm"
      variant={active ? "default" : "outline"}
      onMouseDown={(e) => {
        e.preventDefault();
        setTextAlign(editor, align);
      }}
      aria-label={label}
    >
      <Icon className="size-4" />
    </Button>
  );
}

// ── Urdu snippet presets ────────────────────────────────────────────

function getUrduHeaderNodes(): Descendant[] {
  return [
    {
      type: "heading",
      level: 2,
      dir: "rtl",
      align: "center",
      children: [{ text: "فارم چالان پولیس مکمل" }],
    },
    {
      type: "table",
      dir: "rtl",
      children: [
        {
          type: "table-row",
          children: [
            {
              type: "table-cell",
              width: "33%",
              children: [
                {
                  type: "paragraph",
                  dir: "rtl",
                  align: "right",
                  children: [{ text: "ضلع: ", bold: true }, { text: "" }],
                },
              ],
            },
            {
              type: "table-cell",
              width: "34%",
              children: [
                {
                  type: "paragraph",
                  dir: "rtl",
                  align: "center",
                  children: [{ text: "زیر دفعہ 173", bold: true }],
                },
              ],
            },
            {
              type: "table-cell",
              width: "33%",
              children: [
                {
                  type: "paragraph",
                  dir: "rtl",
                  align: "right",
                  children: [{ text: "تھانہ: ", bold: true }, { text: "" }],
                },
              ],
            },
          ],
        },
        {
          type: "table-row",
          children: [
            {
              type: "table-cell",
              width: "33%",
              children: [
                {
                  type: "paragraph",
                  dir: "rtl",
                  align: "right",
                  children: [{ text: "مقدمہ نمبر: ", bold: true }, { text: "" }],
                },
              ],
            },
            {
              type: "table-cell",
              width: "34%",
              children: [
                {
                  type: "paragraph",
                  dir: "rtl",
                  align: "center",
                  children: [{ text: "جرم: ", bold: true }, { text: "" }],
                },
              ],
            },
            {
              type: "table-cell",
              width: "33%",
              children: [
                {
                  type: "paragraph",
                  dir: "rtl",
                  align: "right",
                  children: [{ text: "مورخہ: ", bold: true }, { text: "" }],
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}

function getUrduPoliceFormNodes(): Descendant[] {
  const headers = [
    "نام و قومیت",
    "رہائش",
    "زیر حراست",
    "بر ضمانت",
    "مال مقدمہ",
    "نام چشم گواہان",
    "مختصر حالات و کیفیت جرم",
  ];

  return [
    {
      type: "table",
      dir: "rtl",
      children: [
        // Number row
        {
          type: "table-row",
          children: headers.map((_, i) => ({
            type: "table-cell" as const,
            width: i === 6 ? "25%" : "12.5%",
            children: [
              {
                type: "paragraph" as const,
                dir: "rtl" as const,
                align: "center" as const,
                children: [{ text: String(i + 1), bold: true }],
              },
            ],
          })),
        },
        // Header row
        {
          type: "table-row",
          children: headers.map((h, i) => ({
            type: "table-cell" as const,
            width: i === 6 ? "25%" : "12.5%",
            children: [
              {
                type: "paragraph" as const,
                dir: "rtl" as const,
                align: "center" as const,
                children: [{ text: h, bold: true }],
              },
            ],
          })),
        },
        // Empty data row
        {
          type: "table-row",
          children: headers.map((_, i) => ({
            type: "table-cell" as const,
            width: i === 6 ? "25%" : "12.5%",
            children: [
              {
                type: "paragraph" as const,
                dir: "rtl" as const,
                align: "right" as const,
                children: [{ text: "" }],
              },
            ],
          })),
        },
      ],
    },
  ];
}

// ── Main component ──────────────────────────────────────────────────

interface VisualTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholderTokens: readonly string[];
}

export function VisualTemplateEditor({
  value,
  onChange,
  placeholderTokens,
}: VisualTemplateEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const contextMenuSelectionRef = React.useRef<Range | null>(null);
  const [editor] = React.useState(() =>
    withTables(withPlaceholders(withHistory(withReact(createEditor())))),
  );

  const initialValue = React.useMemo(() => {
    if (!value) {
      return [
        {
          type: "paragraph" as const,
          dir: "rtl" as const,
          align: "right" as const,
          children: [{ text: "" }],
        },
      ];
    }
    return deserializeFromHtml(value);
  }, []);

  const handleChange = React.useCallback(
    (newValue: Descendant[]) => {
      const isAstChange = editor.operations.some(
        (op: BaseOperation) => op.type !== "set_selection",
      );
      if (isAstChange) {
        onChange(serializeToHtml(newValue));
      }
    },
    [editor, onChange],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      for (const hotkey in HOTKEYS) {
        if (isHotkey(hotkey, event.nativeEvent)) {
          event.preventDefault();
          const mark = HOTKEYS[hotkey];
          toggleMark(editor, mark);
        }
      }
    },
    [editor],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
        <div className="shrink-0 space-y-3 px-1 pb-3">
          {/* ── Toolbar ── */}
          <div className="flex flex-wrap items-center gap-1">
            {/* Marks */}
            <MarkButton format="bold" icon={BoldIcon} editor={editor} label="Bold" />
            <MarkButton format="italic" icon={ItalicIcon} editor={editor} label="Italic" />
            <MarkButton format="underline" icon={UnderlineIcon} editor={editor} label="Underline" />

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Blocks */}
            <BlockButton
              format="bulleted-list"
              icon={ListIcon}
              editor={editor}
              label="Bullet List"
            />
            <BlockButton
              format="numbered-list"
              icon={ListOrderedIcon}
              editor={editor}
              label="Numbered List"
            />

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Alignment */}
            <AlignButton align="right" icon={AlignRightIcon} editor={editor} label="Align Right" />
            <AlignButton
              align="center"
              icon={AlignCenterIcon}
              editor={editor}
              label="Align Center"
            />
            <AlignButton align="left" icon={AlignLeftIcon} editor={editor} label="Align Left" />

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Table */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button type="button" size="icon-sm" variant="outline" />}
              >
                <TableIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => insertTable(editor, 3, 3)}>
                  <TableIcon className="mr-2 size-4" />
                  3×3 Table
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertTable(editor, 3, 4)}>
                  <TableIcon className="mr-2 size-4" />
                  3×4 Table
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => insertTable(editor, 3, 5, ["10%", "20%", "20%", "20%", "30%"])}
                >
                  <TableIcon className="mr-2 size-4" />
                  3×5 Variable Width
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    insertTable(editor, 4, 7, [
                      "12.5%",
                      "12.5%",
                      "12.5%",
                      "12.5%",
                      "12.5%",
                      "12.5%",
                      "25%",
                    ])
                  }
                >
                  <TableIcon className="mr-2 size-4" />
                  4×7 Police Form
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Font size */}
            <FontSizeSelect editor={editor} />
          </div>

          {/* ── Presets ── */}
          <div className="flex flex-wrap items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onMouseDown={(e) => {
                e.preventDefault();
                Transforms.insertNodes(editor, getUrduHeaderNodes());
              }}
            >
              اردو ہیڈر
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onMouseDown={(e) => {
                e.preventDefault();
                Transforms.insertNodes(editor, getUrduPoliceFormNodes());
              }}
            >
              پولیس فارم گرڈ
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <ContextMenu>
            <ContextMenuTrigger className="h-full min-h-full">
              <div
                ref={editorRef}
                className="slate-editor-surface h-full min-h-full"
                onContextMenu={() => {
                  if (editor.selection) {
                    contextMenuSelectionRef.current = { ...editor.selection };
                  }
                }}
              >
                <Editable
                  className="slate-editable"
                  dir="rtl"
                  lang="ur"
                  spellCheck={false}
                  renderElement={ElementRenderer}
                  renderLeaf={LeafRenderer}
                  onKeyDown={handleKeyDown}
                  placeholder="...یہاں اردو متن لکھیں"
                  style={{
                    direction: "rtl",
                    textAlign: "right",
                    fontFamily:
                      '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Noto Naskh Arabic", "Segoe UI", serif',
                    minHeight: "350px",
                    lineHeight: 2.2,
                    fontSize: "16px",
                  }}
                />
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <TableContextMenuItems editor={editor} savedSelection={contextMenuSelectionRef} />
            </ContextMenuContent>
          </ContextMenu>
        </div>

        {/* ── Placeholder tokens & help ── */}
        <div className="mt-3 shrink-0 space-y-1">
          <div className="flex flex-wrap gap-1">
            <span className="flex items-center text-xs text-muted-foreground mr-2">
              Placeholders:
            </span>
            {placeholderTokens.map((token) => {
              const cleanToken = token.replace(/^\{\{|\}\}$/g, "");
              return (
                <Button
                  key={token}
                  type="button"
                  size="sm"
                  variant="secondary"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertPlaceholder(editor, cleanToken);
                  }}
                >
                  <PlusIcon className="mr-1 size-3" />
                  {token}
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            ایڈیٹر دائیں سے بائیں (RTL) ہے۔ پلیس ہولڈرز داخل کریں اور ٹیبل بنائیں۔
          </p>
        </div>
      </Slate>
    </div>
  );
}
