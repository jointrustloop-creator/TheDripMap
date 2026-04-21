import React from 'react';

interface JsonNode {
  type?: string;
  _type?: string;
  style?: string;
  content?: JsonNode[];
  children?: JsonNode[];
  text?: string;
  marks?: unknown[];
  attrs?: Record<string, unknown>;
}

export function JsonRenderer({ content }: { content: unknown }) {
  if (!content) return null;

  // Handle arrays (Portable Text usually starts as an array)
  if (Array.isArray(content)) {
    return (
      <>
        {content.map((node, i) => (
          <RenderNode key={i} node={node as JsonNode} />
        ))}
      </>
    );
  }

  const typedContent = content as JsonNode;

  // Handle Tiptap/Prosemirror document structure
  if (typedContent.type === 'doc' && typedContent.content) {
    return (
      <>
        {typedContent.content.map((node, i) => (
          <RenderNode key={i} node={node} />
        ))}
      </>
    );
  }

  // Fallback to stringified version if structure is unknown
  return <pre className="whitespace-pre-wrap">{JSON.stringify(content, null, 2)}</pre>;
}

function RenderNode({ node }: { node: JsonNode }) {
  const type = node.type || node._type;
  
  if (!type) {
    if (node.text) return <span>{node.text}</span>;
    return null;
  }

  const children = node.content || node.children;

  switch (type) {
    case 'heading':
      const level = (node.attrs?.level as number) || 1;
      const Level = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      return (
        <Level className="font-bold my-4">
          <RenderChildren nodes={children} />
        </Level>
      );
    case 'paragraph':
    case 'block':
      return (
        <p className="my-4">
          <RenderChildren nodes={children} />
        </p>
      );
    case 'bulletList':
      return (
        <ul className="list-disc ml-6 my-4">
          <RenderChildren nodes={children} />
        </ul>
      );
    case 'orderedList':
      return (
        <ol className="list-decimal ml-6 my-4">
          <RenderChildren nodes={children} />
        </ol>
      );
    case 'listItem':
      return (
        <li>
          <RenderChildren nodes={children} />
        </li>
      );
    case 'text':
      let element = <>{node.text}</>;
      if (node.marks) {
        node.marks.forEach(mark => {
          const m = mark as Record<string, unknown>;
          const mType = typeof m === 'string' ? m : m.type;
          const mattrs = m.attrs as Record<string, unknown> | undefined;
          if (mType === 'bold' || mType === 'strong') element = <strong>{element}</strong>;
          if (mType === 'italic' || mType === 'em') element = <em>{element}</em>;
          if (mType === 'link') element = <a href={(mattrs?.href as string) || '#'} className="text-wellness-600 underline">{element}</a>;
        });
      }
      return element;
    case 'image':
      return (
        <div className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={(node.attrs?.src as string) || (node.attrs?.url as string) || ''} 
            alt={(node.attrs?.alt as string) || ''} 
            className="rounded-2xl shadow-lg"
          />
        </div>
      );
    default:
      if (children) return <RenderChildren nodes={children} />;
      if (node.text) return <span>{node.text}</span>;
      return null;
  }
}

function RenderChildren({ nodes }: { nodes?: JsonNode[] }) {
  if (!nodes) return null;
  return (
    <>
      {nodes.map((child, i) => (
        <RenderNode key={i} node={child} />
      ))}
    </>
  );
}
