// BlockNote block editor (Notion-style: slash menu, drag handles, to-do blocks).
// Loaded lazily because BlockNote + Mantine are large.
import { forwardRef, useImperativeHandle } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useTheme } from "../../context/ThemeContext";

const NoteEditor = forwardRef(function NoteEditor({ initialContent, editable = true, onChange }, ref) {
  const { resolved } = useTheme();
  const editor = useCreateBlockNote({
    initialContent: initialContent?.length ? initialContent : undefined,
  });

  useImperativeHandle(
    ref,
    () => ({
      focus: () => editor.focus(),
      /** Append a block (reusing a trailing empty paragraph) and put the cursor in it. */
      addBlock: (type, props = {}) => {
        const last = editor.document.at(-1);
        const lastEmpty = last && last.type === "paragraph" && (!last.content || last.content.length === 0);
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
      focusStart: () => {
        const first = editor.document[0];
        if (first) editor.setTextCursorPosition(first, "start");
        editor.focus();
      },
    }),
    [editor],
  );

  return <BlockNoteView editor={editor} editable={editable} theme={resolved} onChange={() => onChange?.(editor.document)} />;
});

export default NoteEditor;
