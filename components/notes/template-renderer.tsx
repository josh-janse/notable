"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type TemplateSection = {
  title: string;
  content?: string;
  placeholder?: string;
  required?: boolean;
  locked?: boolean;
};

type TemplateRendererProps = {
  template: {
    id: string;
    name: string;
    structure: {
      headers?: Array<{ level: number; text: string; locked?: boolean }>;
      sections: TemplateSection[];
    };
  };
  content?: Record<string, string>;
  onSectionChange?: (sectionTitle: string, value: string) => void;
  readOnly?: boolean;
  className?: string;
};

export function TemplateRenderer({
  template,
  content = {},
  onSectionChange,
  readOnly = false,
  className,
}: TemplateRendererProps) {
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isUserEditingRef = useRef<Record<string, boolean>>({});

  // Update content from props only when not actively editing
  useEffect(() => {
    for (const section of template?.structure?.sections || []) {
      const element = contentRefs.current[section.title];
      if (
        element &&
        !isUserEditingRef.current[section.title] &&
        element.innerText !== (content[section.title] || "")
      ) {
        element.innerText = content[section.title] || "";
      }
    }
  }, [content, template?.structure?.sections]);

  const handleContentEdit = (sectionTitle: string, element: HTMLDivElement) => {
    if (
      !(
        readOnly ||
        template?.structure?.sections?.find((s) => s.title === sectionTitle)
          ?.locked
      )
    ) {
      onSectionChange?.(sectionTitle, element.innerText);
    }
  };

  const handleFocus = (sectionTitle: string) => {
    isUserEditingRef.current[sectionTitle] = true;
  };

  const handleBlur = (sectionTitle: string, element: HTMLDivElement) => {
    isUserEditingRef.current[sectionTitle] = false;
    handleContentEdit(sectionTitle, element);
  };

  if (!template?.structure) {
    return (
      <div className={cn("prose prose-sm max-w-none", className)}>
        <p className="text-muted-foreground">No template structure available</p>
      </div>
    );
  }

  return (
    <div className={cn("max-w-none", className)}>
      {/* Document Headers */}
      {template.structure.headers && template.structure.headers.length > 0 && (
        <div className="mb-8 border-b pb-4">
          {template.structure.headers.map((header) => {
            const HeadingTag = `h${header.level}` as React.ElementType;
            return (
              <HeadingTag
                className={cn(
                  "font-bold leading-tight tracking-tight",
                  header.level === 1 && "mb-2 text-3xl",
                  header.level === 2 && "mb-1 text-2xl",
                  header.level === 3 && "mb-1 text-xl"
                )}
                key={header.text}
              >
                {header.text}
              </HeadingTag>
            );
          })}
        </div>
      )}

      {/* Document Body */}
      <div className="space-y-6">
        {template.structure.sections.map((section) => (
          <div key={section.title}>
            {/* Section Header - Locked */}
            <h3 className="mb-2 font-semibold text-base">{section.title}</h3>

            {/* Section Content - Editable like Google Docs */}
            {/* biome-ignore lint/a11y/useSemanticElements: ContentEditable div is standard for rich text style inputs */}
            <div
              aria-label={`${section.title} section`}
              aria-required={section.required}
              className={cn(
                "min-h-[1.5em] whitespace-pre-wrap leading-relaxed outline-none",
                (!content[section.title] || content[section.title] === "") &&
                  "text-muted-foreground"
              )}
              contentEditable={!(readOnly || section.locked)}
              onBlur={(e) => handleBlur(section.title, e.currentTarget)}
              onFocus={() => handleFocus(section.title)}
              onInput={(e) => handleContentEdit(section.title, e.currentTarget)}
              ref={(el) => {
                contentRefs.current[section.title] = el;
                // Set initial content only if element is empty
                if (el && !el.innerText) {
                  el.innerText =
                    content[section.title] || section.placeholder || "";
                }
              }}
              role="textbox"
              style={{
                cursor: readOnly || section.locked ? "default" : "text",
              }}
              suppressContentEditableWarning
              tabIndex={readOnly || section.locked ? -1 : 0}
            />

            {section.required && !content[section.title] && (
              <p className="mt-1 text-destructive text-xs">
                This field is required
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
