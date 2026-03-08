import {
  Editor,
  Element as SlateElement,
  Transforms,
  type Descendant,
  type Location,
  type NodeEntry,
} from "slate";
import type {
  CustomElement,
  TableElement,
  TableRowElement,
  TableCellElement,
  PlaceholderElement,
} from "./slate-types";
import { LIST_TYPES, EMPTY_PARAGRAPH } from "./slate-types";

// Side-effect import to ensure module augmentation is applied
import "./slate-types";

// ── Mark helpers ────────────────────────────────────────────────────

export function isMarkActive(editor: Editor, format: string): boolean {
  const marks = Editor.marks(editor);
  return marks ? (marks as Record<string, boolean>)[format] === true : false;
}

export function toggleMark(editor: Editor, format: string) {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
}

export function getFontSize(editor: Editor): string | undefined {
  const marks = Editor.marks(editor);
  return marks && typeof (marks as Record<string, unknown>).fontSize === "string"
    ? (marks as Record<string, string>).fontSize
    : undefined;
}

export function setFontSize(editor: Editor, fontSize: string) {
  Editor.addMark(editor, "fontSize", fontSize);
}

// ── Block helpers ───────────────────────────────────────────────────

export function isBlockActive(
  editor: Editor,
  format: string,
  blockType: "type" | "align" = "type",
): boolean {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        (blockType === "type"
          ? n.type === format
          : "align" in n && n.align === format),
    }),
  );

  return !!match;
}

export function toggleBlock(editor: Editor, format: string) {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format as (typeof LIST_TYPES)[number]);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type as (typeof LIST_TYPES)[number]),
    split: true,
  });

  const newProperties: Partial<CustomElement> = isList
    ? isActive
      ? { type: "paragraph" }
      : { type: "list-item" }
    : isActive
      ? { type: "paragraph" }
      : { type: format as CustomElement["type"] };

  Transforms.setNodes<CustomElement>(editor, newProperties);

  if (!isActive && isList) {
    const block: CustomElement = {
      type: format as "bulleted-list" | "numbered-list",
      children: [],
    };
    Transforms.wrapNodes(editor, block);
  }
}

export function setTextAlign(
  editor: Editor,
  align: "right" | "center" | "left",
) {
  Transforms.setNodes<CustomElement>(
    editor,
    { align } as Partial<CustomElement>,
    {
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        (n.type === "paragraph" ||
          n.type === "heading" ||
          n.type === "table-cell"),
    },
  );
}

export function setTextDirection(editor: Editor, dir: "rtl" | "ltr") {
  Transforms.setNodes<CustomElement>(
    editor,
    { dir, align: dir === "rtl" ? "right" : "left" } as Partial<CustomElement>,
    {
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        (n.type === "paragraph" ||
          n.type === "heading" ||
          n.type === "table-cell" ||
          n.type === "bulleted-list" ||
          n.type === "numbered-list"),
    },
  );
}

export function setHeading(editor: Editor, level: 1 | 2 | 3) {
  const isActive = isBlockActive(editor, "heading");
  if (isActive) {
    // Check if it's same level - toggle off
    const [match] = Array.from(
      Editor.nodes(editor, {
        match: (n) =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          n.type === "heading" &&
          n.level === level,
      }),
    );
    if (match) {
      Transforms.setNodes<CustomElement>(editor, {
        type: "paragraph",
      } as Partial<CustomElement>);
      return;
    }
  }
  Transforms.setNodes<CustomElement>(editor, {
    type: "heading",
    level,
  } as Partial<CustomElement>);
}

// ── Table helpers ───────────────────────────────────────────────────

export function insertTable(
  editor: Editor,
  rows: number,
  cols: number,
  columnWidths?: string[],
) {
  const defaultWidth = `${Math.floor(100 / cols)}%`;
  const widths = columnWidths ?? Array(cols).fill(defaultWidth);

  const tableRows: TableRowElement[] = [];

  for (let r = 0; r < rows; r++) {
    const cells: TableCellElement[] = [];
    for (let c = 0; c < cols; c++) {
      cells.push({
        type: "table-cell",
        width: widths[c] ?? defaultWidth,
        children: [
          {
            type: "paragraph",
            dir: "rtl",
            align: "right",
            children: [{ text: "" }],
          },
        ],
      });
    }
    tableRows.push({ type: "table-row", children: cells });
  }

  const table: TableElement = {
    type: "table",
    dir: "rtl",
    children: tableRows,
  };

  Transforms.insertNodes(editor, table);
  // Insert paragraph after table for easy continued editing
  Transforms.insertNodes(editor, {
    ...EMPTY_PARAGRAPH,
    children: [{ text: "" }],
  });
}

export function addTableRow(editor: Editor, at?: Location) {
  const [tableEntry] = Array.from(
    Editor.nodes(editor, {
      at: at ?? editor.selection ?? [],
      match: (n) =>
        !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "table",
    }),
  ) as NodeEntry<TableElement>[];

  if (!tableEntry) return;

  const [tableNode, tablePath] = tableEntry;
  const numCols = tableNode.children[0]?.children.length ?? 3;
  const widths =
    tableNode.children[0]?.children.map((c) => c.width ?? "auto") ?? [];

  const cells: TableCellElement[] = [];
  for (let i = 0; i < numCols; i++) {
    cells.push({
      type: "table-cell",
      width: widths[i],
      children: [
        {
          type: "paragraph",
          dir: "rtl",
          align: "right",
          children: [{ text: "" }],
        },
      ],
    });
  }

  const newRow: TableRowElement = { type: "table-row", children: cells };
  const insertAt = [...tablePath, tableNode.children.length];
  Transforms.insertNodes(editor, newRow, { at: insertAt });
}

export function addTableColumn(editor: Editor, at?: Location) {
  const [tableEntry] = Array.from(
    Editor.nodes(editor, {
      at: at ?? editor.selection ?? [],
      match: (n) =>
        !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "table",
    }),
  ) as NodeEntry<TableElement>[];

  if (!tableEntry) return;

  const [tableNode, tablePath] = tableEntry;

  for (let r = 0; r < tableNode.children.length; r++) {
    const row = tableNode.children[r];
    const insertAt = [...tablePath, r, row.children.length];
    const newCell: TableCellElement = {
      type: "table-cell",
      children: [
        {
          type: "paragraph",
          dir: "rtl",
          align: "right",
          children: [{ text: "" }],
        },
      ],
    };
    Transforms.insertNodes(editor, newCell, { at: insertAt });
  }
}

export function deleteTableRow(editor: Editor, at?: Location) {
  const [rowEntry] = Array.from(
    Editor.nodes(editor, {
      at: at ?? editor.selection ?? [],
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n.type === "table-row",
    }),
  );
  if (rowEntry) {
    Transforms.removeNodes(editor, { at: rowEntry[1] });
  }
}

export function deleteTableColumn(editor: Editor, at?: Location) {
  const [cellEntry] = Array.from(
    Editor.nodes(editor, {
      at: at ?? editor.selection ?? [],
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n.type === "table-cell",
    }),
  );
  if (!cellEntry) return;

  const colIndex = cellEntry[1][cellEntry[1].length - 1];

  const [tableEntry] = Array.from(
    Editor.nodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "table",
    }),
  ) as NodeEntry<TableElement>[];

  if (!tableEntry) return;

  const [tableNode, tablePath] = tableEntry;

  // Remove column from bottom to top to preserve paths
  for (let r = tableNode.children.length - 1; r >= 0; r--) {
    Transforms.removeNodes(editor, { at: [...tablePath, r, colIndex] });
  }
}

export function setColumnWidth(editor: Editor, path: number[], width: string) {
  Transforms.setNodes<TableCellElement>(editor, { width }, { at: path });
}

export function setColumnWidths(
  editor: Editor,
  tablePath: number[],
  colIndex: number,
  width: string,
) {
  const table = Editor.node(editor, tablePath)[0] as TableElement;
  for (let r = 0; r < table.children.length; r++) {
    Transforms.setNodes<TableCellElement>(
      editor,
      { width },
      { at: [...tablePath, r, colIndex] },
    );
  }
}

export function setRowHeight(editor: Editor, path: number[], height: string) {
  Transforms.setNodes<TableRowElement>(editor, { height }, { at: path });
}

// ── Placeholder helpers ─────────────────────────────────────────────

export function insertPlaceholder(editor: Editor, token: string) {
  const placeholder: PlaceholderElement = {
    type: "placeholder",
    token,
    children: [{ text: "" }],
  };
  Transforms.insertNodes(editor, placeholder);
  Transforms.move(editor);
}

// ── Serialization: Slate → HTML ─────────────────────────────────────

function serializeText(node: {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: string;
}): string {
  let text = node.text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  if (node.bold) text = `<strong>${text}</strong>`;
  if (node.italic) text = `<em>${text}</em>`;
  if (node.underline) text = `<u>${text}</u>`;
  if (node.fontSize) text = `<span style="font-size:${node.fontSize}">${text}</span>`;
  return text;
}

export function serializeToHtml(nodes: Descendant[]): string {
  return nodes.map((node) => serializeNode(node)).join("");
}

function serializeNode(node: Descendant): string {
  if ("text" in node) {
    return serializeText(node);
  }

  const children = node.children
    .map((c: Descendant) => serializeNode(c))
    .join("");
  const dirAttr = "dir" in node && node.dir ? ` dir="${node.dir}"` : "";
  const alignStyle =
    "align" in node && node.align ? ` style="text-align:${node.align}"` : "";

  switch (node.type) {
    case "paragraph":
      return `<p${dirAttr}${alignStyle}>${children}</p>`;
    case "heading":
      return `<h${node.level}${dirAttr}${alignStyle}>${children}</h${node.level}>`;
    case "bulleted-list":
      return `<ul${dirAttr}>${children}</ul>`;
    case "numbered-list":
      return `<ol${dirAttr}>${children}</ol>`;
    case "list-item":
      return `<li>${children}</li>`;
    case "table":
      return `<table${dirAttr} style="width:100%;border-collapse:collapse">${children}</table>`;
    case "table-row": {
      const row = node as TableRowElement;
      const hStyle = row.height ? ` style="height:${row.height};min-height:${row.height}"` : "";
      return `<tr${hStyle}>${children}</tr>`;
    }
    case "table-cell": {
      const wStyle = node.width ? `width:${node.width};` : "";
      const cs =
        node.colSpan && node.colSpan > 1 ? ` colspan="${node.colSpan}"` : "";
      const rs =
        node.rowSpan && node.rowSpan > 1 ? ` rowspan="${node.rowSpan}"` : "";
      return `<td style="${wStyle}border:1px solid #333;padding:6px"${cs}${rs}>${children}</td>`;
    }
    case "placeholder":
      return `<span class="placeholder-token" data-token="${node.token}" contenteditable="false">{{${node.token}}}</span>`;
    default:
      return children;
  }
}

// ── Deserialization: HTML → Slate ───────────────────────────────────

export function deserializeFromHtml(html: string): Descendant[] {
  if (!html || html.trim() === "") {
    return [
      {
        type: "paragraph",
        dir: "rtl",
        align: "right",
        children: [{ text: "" }],
      },
    ];
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const result = deserializeElement(doc.body);

  if (result.length === 0) {
    return [
      {
        type: "paragraph",
        dir: "rtl",
        align: "right",
        children: [{ text: "" }],
      },
    ];
  }

  return result;
}

function deserializeElement(el: Node): Descendant[] {
  if (el.nodeType === Node.TEXT_NODE) {
    const text = el.textContent ?? "";
    if (text.trim() === "") return [];
    return [{ text }];
  }

  if (el.nodeType !== Node.ELEMENT_NODE) return [];

  const element = el as HTMLElement;
  const children: Descendant[] = Array.from(element.childNodes).flatMap(
    deserializeElement,
  );

  const dir = element.getAttribute("dir") as "rtl" | "ltr" | null;
  const style = element.getAttribute("style") ?? "";
  const alignMatch = style.match(/text-align:\s*(right|left|center)/);
  const align = alignMatch
    ? (alignMatch[1] as "right" | "center" | "left")
    : undefined;

  const ensureChildren = (c: Descendant[]): Descendant[] =>
    c.length > 0 ? c : [{ text: "" }];

  const tag = element.tagName.toLowerCase();

  switch (tag) {
    case "body":
      return children;
    case "p":
      return [
        {
          type: "paragraph",
          dir: dir ?? undefined,
          align,
          children: ensureChildren(children) as any,
        },
      ];
    case "h1":
      return [
        {
          type: "heading",
          level: 1,
          dir: dir ?? undefined,
          align,
          children: ensureChildren(children) as any,
        },
      ];
    case "h2":
      return [
        {
          type: "heading",
          level: 2,
          dir: dir ?? undefined,
          align,
          children: ensureChildren(children) as any,
        },
      ];
    case "h3":
      return [
        {
          type: "heading",
          level: 3,
          dir: dir ?? undefined,
          align,
          children: ensureChildren(children) as any,
        },
      ];
    case "ul":
      return [
        {
          type: "bulleted-list",
          dir: dir ?? undefined,
          children: ensureChildren(children) as any,
        },
      ];
    case "ol":
      return [
        {
          type: "numbered-list",
          dir: dir ?? undefined,
          children: ensureChildren(children) as any,
        },
      ];
    case "li":
      return [{ type: "list-item", children: ensureChildren(children) as any }];
    case "table":
      return [
        {
          type: "table",
          dir: dir ?? undefined,
          children: ensureChildren(children) as any,
        },
      ];
    case "thead":
    case "tbody":
    case "tfoot":
      return children;
    case "tr": {
      const heightMatch = style.match(/height:\s*([^;]+)/);
      const height = heightMatch ? heightMatch[1].trim() : undefined;
      return [
        {
          type: "table-row",
          height,
          children: ensureChildren(children) as any,
        },
      ];
    }
    case "td":
    case "th": {
      const widthMatch = style.match(/width:\s*([^;]+)/);
      const width = widthMatch ? widthMatch[1].trim() : undefined;
      const tdEl = element as HTMLTableCellElement;
      const colSpan = tdEl.colSpan > 1 ? tdEl.colSpan : undefined;
      const rowSpan = tdEl.rowSpan > 1 ? tdEl.rowSpan : undefined;
      // If children are only text nodes, wrap in paragraph
      const cellChildren = ensureChildren(children);
      const wrapped = cellChildren.every((c) => "text" in c)
        ? [
            {
              type: "paragraph" as const,
              dir: dir ?? ("rtl" as const),
              align: align ?? ("right" as const),
              children: cellChildren as any,
            },
          ]
        : cellChildren;
      return [
        {
          type: "table-cell",
          width,
          colSpan,
          rowSpan,
          children: wrapped as any,
        },
      ];
    }
    case "span": {
      const token = element.getAttribute("data-token");
      if (token) {
        return [{ type: "placeholder", token, children: [{ text: "" }] }];
      }
      const fontSizeMatch = style.match(/font-size:\s*([^;]+)/);
      const fontSize = fontSizeMatch ? fontSizeMatch[1].trim() : undefined;
      if (fontSize) {
        return children.map((c) =>
          "text" in c ? { ...c, fontSize } : c,
        );
      }
      return children;
    }
    case "strong":
    case "b":
      return children.map((c) => ("text" in c ? { ...c, bold: true } : c));
    case "em":
    case "i":
      return children.map((c) => ("text" in c ? { ...c, italic: true } : c));
    case "u":
      return children.map((c) => ("text" in c ? { ...c, underline: true } : c));
    case "br":
      return [{ text: "\n" }];
    default:
      return children;
  }
}
