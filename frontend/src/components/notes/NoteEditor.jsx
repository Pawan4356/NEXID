// BlockNote block editor (Notion-style: slash menu, drag handles, to-do blocks).
// Loaded lazily because BlockNote + Mantine are large.
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
} from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useTheme } from "../../context/ThemeContext";
import {
  diagramSectionBlock,
  fileReferenceBlock,
  fileReferenceInline,
} from "./NoteEmbedBlocks";

const inlineContent = (content) => {
  if (Array.isArray(content)) {
    return content.map((item) =>
      typeof item === "string" ? { type: "text", text: item } : item,
    );
  }
  if (typeof content === "string" && content) {
    return [{ type: "text", text: content }];
  }
  return [];
};

function normalizeInitialContent(blocks) {
  if (!Array.isArray(blocks)) return undefined;
  const normalized = blocks
    .filter((block) => block && typeof block === "object")
    .map((block) => ({
      ...block,
      content: inlineContent(block.content),
    }));
  return normalized.length ? normalized : undefined;
}

const NoteEditor = forwardRef(function NoteEditor(
  { initialContent, editable = true, onChange },
  ref,
) {
  const { resolved } = useTheme();
  const schema = useMemo(
    () =>
      BlockNoteSchema.create({
        blockSpecs: {
          ...defaultBlockSpecs,
          fileReference: fileReferenceBlock(),
          diagramSection: diagramSectionBlock(),
        },
        inlineContentSpecs: {
          ...defaultInlineContentSpecs,
          fileReferenceInline,
        },
      }),
    [],
  );
  const editor = useCreateBlockNote({
    schema,
    initialContent: normalizeInitialContent(initialContent),
  });
  const lastTextBlockId = useRef(null);

  useEffect(() => {
    const rememberTextBlock = () => {
      const block = editor.getTextCursorPosition()?.block;
      if (block && block.type !== "fileReference" && block.type !== "diagramSection") {
        lastTextBlockId.current = block.id;
      }
    };
    rememberTextBlock();
    return editor.onSelectionChange(rememberTextBlock);
  }, [editor]);

  useEffect(() => {
    editor.focusLastText = () => {
      const target = editor.document.find(
        (block) => block.id === lastTextBlockId.current,
      );
      if (target) editor.setTextCursorPosition(target.id, "end");
      editor.focus();
    };
    return () => delete editor.focusLastText;
  }, [editor]);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => editor.focus(),
      /** Append a block (reusing a trailing empty paragraph) and put the cursor in it. */
      addBlock: (type, props = {}) => {
        const current = editor.getTextCursorPosition()?.block;
        const last = current ?? editor.document.at(-1);
        const lastEmpty =
          last &&
          last.type === "paragraph" &&
          (!last.content || last.content.length === 0);
        let target;
        if (lastEmpty) {
          editor.updateBlock(last, { type, props });
          target = last.id;
        } else {
          target = editor.insertBlocks([{ type, props }], last, "after")[0].id;
        }
        editor.setTextCursorPosition(target, "end");
        editor.focus();
      },
      addInline: (type, props = {}) => {
        editor.insertInlineContent([{ type, props }, " "], {
          updateSelection: true,
        });
        editor.focus();
      },
      focusStart: () => {
        const first = editor.document[0];
        if (first) editor.setTextCursorPosition(first, "start");
        editor.focus();
      },
    }),
    [editor],
  );

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      theme={resolved}
      onChange={() => onChange?.(editor.document)}
    />
  );
});

export default NoteEditor;
