'use client';

// Markdown preview component with syntax highlighting
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { replaceWikilinks } from '@/lib/markdown';
import { useMemo } from 'react';

interface MarkdownPreviewProps {
  content: string;
  noteId: string;
}

export default function MarkdownPreview({ content, noteId }: MarkdownPreviewProps) {
  const processedContent = useMemo(() => {
    return replaceWikilinks(content, noteId);
  }, [content, noteId]);

  return (
    <div className="h-full overflow-auto bg-editorial-bg selection:bg-editorial-accent/20">
      <div className="max-w-3xl mx-auto px-12 py-16 prose prose-editorial-ink prose-headings:font-display prose-headings:tracking-tight prose-a:text-editorial-accent prose-a:no-underline hover:prose-a:underline prose-blockquote:border-editorial-accent/30 prose-blockquote:text-editorial-ink/70 prose-img:rounded-none prose-hr:border-editorial-line">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize]}
          components={{
            // Custom link renderer for internal links
            a: ({ href, children, ...props }) => {
              // Check if it's an internal link (starts with /)
              const isInternal = href?.startsWith('/');
              return (
                <a
                  href={href}
                  onClick={(e) => {
                    if (isInternal && href) {
                      e.preventDefault();
                      window.location.href = href;
                    }
                  }}
                  target={isInternal ? undefined : "_blank"}
                  rel={isInternal ? undefined : "noopener noreferrer"}
                  className="text-editorial-accent font-medium border-b border-editorial-accent/20 hover:border-editorial-accent transition-colors"
                  {...props}
                >
                  {children}
                </a>
              );
            },
            // Prevent hydration errors by unwrapping block elements from paragraphs
            p: ({ children }) => {
              return <div className="mb-6 last:mb-0 leading-relaxed">{children}</div>;
            },
            // Code blocks with syntax highlighting
            code: ({ inline, className, children, ...props }: any) => {
              if (inline) {
                return (
                  <code
                    className="bg-editorial-ink/5 px-1.5 py-0.5 font-mono text-[0.85em] text-editorial-ink/80"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
              return (
                <div className="relative group my-8">
                  <div className="absolute -left-4 top-0 bottom-0 w-px bg-editorial-accent/20" />
                  <pre className="bg-editorial-ink/5 p-6 overflow-x-auto">
                    <code
                      className={`font-mono text-sm leading-relaxed text-editorial-ink/80 ${className || ''}`}
                      {...props}
                    >
                      {children}
                    </code>
                  </pre>
                </div>
              );
            },
            // Overriding typography plugin for specific print feels
            h1: ({ children, ...props }) => (
              <h1 className="text-4xl font-medium mb-12 border-b border-editorial-line pb-6" {...props}>{children}</h1>
            ),
            h2: ({ children, ...props }) => (
              <h2 className="text-2xl font-medium mb-6 mt-12 text-editorial-ink/90" {...props}>{children}</h2>
            ),
            blockquote: ({ children, ...props }) => (
              <blockquote className="border-l-2 border-editorial-accent/30 pl-8 py-2 italic text-xl text-editorial-ink/70 font-serif my-12" {...props}>
                {children}
              </blockquote>
            ),
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}
