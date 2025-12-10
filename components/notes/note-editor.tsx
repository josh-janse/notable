"use client";

import { EditorContent, EditorRoot, type JSONContent } from "novel";
import { useState } from "react";

type NoteEditorProps = {
  initialContent?: JSONContent | string;
  template?: {
    id: string;
    name: string;
    structure: {
      headers: Array<{ level: number; text: string; required: boolean }>;
      sections: Array<{
        title: string;
        placeholder: string;
        required: boolean;
      }>;
    };
  };
  onChange?: (content: JSONContent) => void;
  readOnly?: boolean;
};

export function NoteEditor({
  initialContent,
  template,
  onChange,
  readOnly = false,
}: NoteEditorProps) {
  const [content, setContent] = useState<JSONContent | undefined>(
    typeof initialContent === "string" ? undefined : initialContent || undefined
  );

  const handleUpdate = (editor: { getJSON: () => JSONContent }) => {
    const json = editor.getJSON();
    setContent(json);
    onChange?.(json);
  };

  return (
    <div className="w-full">
      <EditorRoot>
        <EditorContent
          className="min-h-[500px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          editable={!readOnly}
          editorProps={{
            attributes: {
              class:
                "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
            },
          }}
          extensions={[]}
          initialContent={content}
          onUpdate={({ editor }) => handleUpdate(editor)}
        />
      </EditorRoot>

      {template && (
        <div className="mt-4 rounded-md border border-border bg-muted/50 p-4">
          <h3 className="font-medium text-sm">Template: {template.name}</h3>
          <div className="mt-2 space-y-1 text-muted-foreground text-xs">
            {template.structure.sections.map((section) => (
              <div className="flex items-center gap-2" key={section.title}>
                <span className="font-medium">{section.title}</span>
                {section.required && (
                  <span className="text-destructive">*</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
