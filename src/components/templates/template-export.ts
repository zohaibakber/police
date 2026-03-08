import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  type IRunOptions,
  type IParagraphOptions,
} from "docx";
import { saveAs } from "file-saver";
import type { Descendant } from "slate";
import "./slate-types";

// ── Placeholder substitution ────────────────────────────────────────

export function substitutePlaceholders(
  nodes: Descendant[],
  values: Record<string, string>,
): Descendant[] {
  return nodes.map((node) => substituteNode(node, values));
}

function substituteNode(
  node: Descendant,
  values: Record<string, string>,
): Descendant {
  if ("text" in node) return node;

  if (node.type === "placeholder") {
    const val = values[node.token] ?? `{{${node.token}}}`;
    return {
      type: "paragraph",
      dir: "rtl",
      align: "right",
      children: [{ text: val }],
    } as any;
  }

  return {
    ...node,
    children: node.children.map((c: Descendant) => substituteNode(c, values)),
  } as any;
}

// ── Slate → DOCX ───────────────────────────────────────────────────

function getAlignment(
  align?: "right" | "center" | "left",
  dir?: "rtl" | "ltr",
) {
  if (align === "center") return AlignmentType.CENTER;
  if (align === "left") return AlignmentType.LEFT;
  if (align === "right") return AlignmentType.RIGHT;
  if (dir === "rtl") return AlignmentType.RIGHT;
  return AlignmentType.LEFT;
}

function buildTextRuns(
  children: Descendant[],
  values: Record<string, string>,
): TextRun[] {
  const runs: TextRun[] = [];

  for (const child of children) {
    if ("text" in child) {
      const opts: IRunOptions = {
        text: child.text,
        bold: child.bold ?? false,
        italics: child.italic ?? false,
        underline: child.underline ? { type: "single" as any } : undefined,
        font: "Jameel Noori Nastaleeq",
        rightToLeft: true,
        size: 24, // 12pt
      };
      runs.push(new TextRun(opts));
    } else if (child.type === "placeholder") {
      const val = values[child.token] ?? `{{${child.token}}}`;
      runs.push(
        new TextRun({
          text: val,
          bold: true,
          font: "Jameel Noori Nastaleeq",
          rightToLeft: true,
          size: 24,
        }),
      );
    }
  }

  return runs;
}

function buildParagraphs(
  nodes: Descendant[],
  values: Record<string, string>,
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];

  for (const node of nodes) {
    if ("text" in node) {
      result.push(
        new Paragraph({
          bidirectional: true,
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: node.text,
              font: "Jameel Noori Nastaleeq",
              rightToLeft: true,
              size: 24,
            }),
          ],
        }),
      );
      continue;
    }

    switch (node.type) {
      case "paragraph": {
        const paraOpts: IParagraphOptions = {
          bidirectional: true,
          alignment: getAlignment(node.align, node.dir),
          children: buildTextRuns(node.children, values),
        };
        result.push(new Paragraph(paraOpts));
        break;
      }
      case "heading": {
        const headingMap: Record<
          number,
          (typeof HeadingLevel)[keyof typeof HeadingLevel]
        > = {
          1: HeadingLevel.HEADING_1,
          2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3,
        };
        result.push(
          new Paragraph({
            heading: headingMap[node.level] ?? HeadingLevel.HEADING_2,
            bidirectional: true,
            alignment: getAlignment(node.align, node.dir),
            children: buildTextRuns(node.children, values),
          }),
        );
        break;
      }
      case "bulleted-list":
      case "numbered-list": {
        for (const item of node.children) {
          if ("text" in item) continue;
          result.push(
            new Paragraph({
              bidirectional: true,
              bullet: node.type === "bulleted-list" ? { level: 0 } : undefined,
              numbering:
                node.type === "numbered-list"
                  ? { reference: "default-numbering", level: 0 }
                  : undefined,
              alignment: AlignmentType.RIGHT,
              children: buildTextRuns(item.children, values),
            }),
          );
        }
        break;
      }
      case "table": {
        const rows = node.children
          .filter((r): r is Extract<typeof r, { type: "table-row" }> => {
            return !("text" in r) && r.type === "table-row";
          })
          .map((row) => {
            const cells = row.children
              .filter(
                (c): c is Extract<typeof c, { type: "table-cell" }> =>
                  !("text" in c) && c.type === "table-cell",
              )
              .map((cell) => {
                const paragraphs = buildParagraphs(cell.children, values);
                const paras = paragraphs.filter(
                  (p): p is Paragraph => p instanceof Paragraph,
                );
                const widthValue = cell.width
                  ? parseInt(cell.width, 10) * 50 // approximate twips conversion
                  : undefined;
                return new TableCell({
                  children:
                    paras.length > 0
                      ? paras
                      : [new Paragraph({ children: [] })],
                  columnSpan: cell.colSpan,
                  rowSpan: cell.rowSpan,
                  width: widthValue
                    ? {
                        size: widthValue,
                        type: cell.width?.includes("%")
                          ? WidthType.PERCENTAGE
                          : WidthType.DXA,
                      }
                    : undefined,
                  borders: {
                    top: {
                      style: BorderStyle.SINGLE,
                      size: 1,
                      color: "333333",
                    },
                    bottom: {
                      style: BorderStyle.SINGLE,
                      size: 1,
                      color: "333333",
                    },
                    left: {
                      style: BorderStyle.SINGLE,
                      size: 1,
                      color: "333333",
                    },
                    right: {
                      style: BorderStyle.SINGLE,
                      size: 1,
                      color: "333333",
                    },
                  },
                });
              });
            return new TableRow({ children: cells });
          });

        if (rows.length > 0) {
          result.push(
            new Table({
              rows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
          );
        }
        break;
      }
      case "placeholder": {
        const val = values[node.token] ?? `{{${node.token}}}`;
        result.push(
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: val,
                bold: true,
                font: "Jameel Noori Nastaleeq",
                rightToLeft: true,
                size: 24,
              }),
            ],
          }),
        );
        break;
      }
    }
  }

  return result;
}

export async function exportToDocx(
  nodes: Descendant[],
  values: Record<string, string>,
  filename: string,
) {
  const content = buildParagraphs(nodes, values);
  const sections = content.filter(
    (c): c is Paragraph | Table => c instanceof Paragraph || c instanceof Table,
  );

  const doc = new Document({
    sections: [
      {
        children: sections,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename.endsWith(".docx") ? filename : `${filename}.docx`);
}

// ── Slate → PDF via rendered HTML ───────────────────────────────────

export async function exportToPdf(
  containerElement: HTMLElement,
  filename: string,
) {
  // Dynamic import to avoid SSR issues
  const { default: html2canvas } = await import("html2canvas");
  const { jsPDF } = await import("jspdf");

  const canvas = await html2canvas(containerElement, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let y = margin;
  let remainingHeight = imgHeight;

  // First page
  pdf.addImage(imgData, "PNG", margin, y, imgWidth, imgHeight);

  // Add pages if content overflows
  while (remainingHeight > pageHeight - margin * 2) {
    remainingHeight -= pageHeight - margin * 2;
    pdf.addPage();
    pdf.addImage(
      imgData,
      "PNG",
      margin,
      -(imgHeight - remainingHeight) + margin,
      imgWidth,
      imgHeight,
    );
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
