'use client';

import React from 'react';
import CodeBlock from './CodeBlock';

export default function MessageParser({ content }) {
  // Regular expression to match code blocks with triple backticks
  // It captures the language (optional) and the code inside
  const codeBlockRegex = /```([\w-]*)\n([\s\S]*?)```/g;
  
  // Regular expression to match inline code with single backticks
  const inlineCodeRegex = /`([^`]+)`/g;
  
  // Parse the content and split into normal text and code blocks
  const parseContent = () => {
    if (!content) return [{ type: 'text', content: '' }];
    
    const segments = [];
    let lastIndex = 0;
    let match;
    
    // Find all code blocks with triple backticks
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }
      
      // Add code block
      segments.push({
        type: 'codeBlock',
        language: match[1].trim(),
        content: match[2].trim()
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after last code block
    if (lastIndex < content.length) {
      segments.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }
    
    // If no code blocks were found, return entire content as text
    if (segments.length === 0) {
      segments.push({ type: 'text', content });
    }
    
    return segments;
  };
  
  // Process inline code in text segments
  const processInlineCode = (text) => {
    if (!text) return [];
    
    const parts = [];
    let lastIndex = 0;
    let match;
    
    // Find all inline code
    while ((match = inlineCodeRegex.exec(text)) !== null) {
      // Add text before inline code
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }
      
      // Add inline code
      parts.push({
        type: 'inlineCode',
        content: match[1]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after last inline code
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }
    
    // If no inline code was found, return entire text
    if (parts.length === 0) {
      parts.push({ type: 'text', content: text });
    }
    
    return parts;
  };
  
  // Parse all segments
  const segments = parseContent();
  
  return (
    <div className="message-content">
      {segments.map((segment, index) => {
        if (segment.type === 'codeBlock') {
          return (
            <CodeBlock 
              key={index} 
              language={segment.language} 
              code={segment.content} 
            />
          );
        } else if (segment.type === 'text') {
          const inlineParts = processInlineCode(segment.content);
          
          return (
            <div key={index} className="whitespace-pre-wrap">
              {inlineParts.map((part, partIndex) => {
                if (part.type === 'inlineCode') {
                  return (
                    <code 
                      key={partIndex} 
                      className="bg-primary-800 text-primary-200 px-1.5 py-0.5 rounded font-mono text-sm"
                    >
                      {part.content}
                    </code>
                  );
                } else {
                  // Replace newlines with <br /> for proper rendering
                  return <span key={partIndex}>{part.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <br />}
                      {line}
                    </React.Fragment>
                  ))}</span>;
                }
              })}
            </div>
          );
        }
        
        return null;
      })}
    </div>
  );
}
