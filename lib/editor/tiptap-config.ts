/**
 * Tiptap editor configuration for note templates with locked headers
 *
 * This configuration extends Novel's default Tiptap setup with custom extensions
 * for template-based note editing with locked (non-editable) header sections.
 */

import type { Extensions } from "@tiptap/core";

/**
 * Locked Header Extension Configuration
 *
 * Creates a custom Tiptap node that renders headers which cannot be edited or deleted.
 * These headers represent template structure that should remain fixed.
 *
 * Usage:
 * ```typescript
 * import { Editor } from '@tiptap/core'
 * import { getLockedHeaderExtension } from './tiptap-config'
 *
 * const editor = new Editor({
 *   extensions: [
 *     ...defaultExtensions,
 *     getLockedHeaderExtension()
 *   ]
 * })
 * ```
 */

type LockedHeaderAttributes = {
  level: number;
  text: string;
  locked: boolean;
};

export function getLockedHeaderExtension() {
  return {
    name: "lockedHeader",
    group: "block",
    content: "text*",
    attrs: {
      level: { default: 2 },
      text: { default: "" },
      locked: { default: true },
    },
    parseHTML() {
      return [
        {
          tag: "h1[data-locked]",
          attrs: { level: 1 },
        },
        {
          tag: "h2[data-locked]",
          attrs: { level: 2 },
        },
        {
          tag: "h3[data-locked]",
          attrs: { level: 3 },
        },
        {
          tag: "h4[data-locked]",
          attrs: { level: 4 },
        },
        {
          tag: "h5[data-locked]",
          attrs: { level: 5 },
        },
        {
          tag: "h6[data-locked]",
          attrs: { level: 6 },
        },
      ];
    },
    renderHTML({ node }: { node: { attrs: LockedHeaderAttributes } }) {
      const { level, text } = node.attrs;
      return [
        `h${level}`,
        {
          "data-locked": "true",
          class: "locked-header text-muted-foreground",
        },
        text,
      ];
    },
    addKeyboardShortcuts() {
      return {
        Backspace: ({
          editor,
        }: {
          editor: {
            state: {
              selection: { $from: { parent: { type: { name: string } } } };
            };
          };
        }) => {
          const { state } = editor;
          const { selection } = state;
          const { $from } = selection;
          return $from.parent.type.name === "lockedHeader";
        },
        Delete: ({
          editor,
        }: {
          editor: {
            state: {
              selection: { $from: { parent: { type: { name: string } } } };
            };
          };
        }) => {
          const { state } = editor;
          const { selection } = state;
          const { $from } = selection;
          return $from.parent.type.name === "lockedHeader";
        },
      };
    },
  };
}

/**
 * Template Section Extension Configuration
 *
 * Creates editable sections with metadata for template-based editing.
 * Each section has a title, placeholder, and optional validation rules.
 */

type TemplateSectionAttributes = {
  sectionId: string;
  title: string;
  placeholder: string;
  required: boolean;
};

export function getTemplateSectionExtension() {
  return {
    name: "templateSection",
    group: "block",
    content: "block+",
    attrs: {
      sectionId: { default: "" },
      title: { default: "" },
      placeholder: { default: "" },
      required: { default: false },
    },
    parseHTML() {
      return [
        {
          tag: "div[data-template-section]",
        },
      ];
    },
    renderHTML({ node }: { node: { attrs: TemplateSectionAttributes } }) {
      const { sectionId, title, placeholder, required } = node.attrs;
      return [
        "div",
        {
          "data-template-section": sectionId,
          "data-title": title,
          "data-placeholder": placeholder,
          "data-required": required,
          class: "template-section",
        },
        0,
      ];
    },
  };
}

/**
 * Get all custom template extensions
 *
 * Returns an array of custom Tiptap extensions for template-based note editing.
 * These can be added to Novel's default extensions or used with a standalone Tiptap editor.
 */
export function getTemplateExtensions() {
  return [
    getLockedHeaderExtension(),
    getTemplateSectionExtension(),
  ] as unknown as Extensions;
}

/**
 * Editor configuration options for template-based notes
 */
export type TemplateEditorConfig = {
  editable: boolean;
  placeholder?: string;
  autofocus?: boolean | "start" | "end";
  enableLockMode?: boolean;
};

/**
 * Get editor props for template mode
 *
 * Returns Tiptap editor props configured for template-based editing with locked headers.
 */
export function getTemplateEditorProps(
  config: TemplateEditorConfig = { editable: true }
) {
  return {
    attributes: {
      class:
        "prose prose-sm sm:prose lg:prose-lg focus:outline-none min-h-[400px] p-4",
      "data-template-mode": config.enableLockMode ? "true" : "false",
    },
    editable: config.editable,
  };
}

/**
 * Utility: Check if current selection is in a locked node
 */
export function isInLockedNode(editor: {
  state: { selection: { $from: { parent: { type: { name: string } } } } };
}): boolean {
  const { state } = editor;
  const { selection } = state;
  const { $from } = selection;
  return $from.parent.type.name === "lockedHeader";
}

/**
 * Utility: Get template section from current selection
 */
export function getCurrentTemplateSection(editor: {
  state: {
    selection: {
      $from: {
        node: (depth: number) => {
          type: { name: string };
          attrs: TemplateSectionAttributes;
        };
      };
      $to: { depth: number };
    };
  };
}): TemplateSectionAttributes | null {
  const { state } = editor;
  const { selection } = state;
  const { $from, $to } = selection;

  let section: TemplateSectionAttributes | null = null;

  for (let depth = $to.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === "templateSection") {
      section = node.attrs as TemplateSectionAttributes;
      break;
    }
  }

  return section;
}
