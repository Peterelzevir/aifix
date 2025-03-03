'use client';

import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';

// Import language components
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-markup'; // HTML
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-swift';

// Mapping between common language codes and Prism's language codes
const languageMap = {
  'js': 'javascript',
  'py': 'python',
  'ts': 'typescript',
  'html': 'markup',
  'xml': 'markup',
  'sh': 'bash',
  'shell': 'bash',
  'yml': 'yaml',
  'md': 'markdown',
  'cs': 'csharp',
  'csharp': 'csharp',
  'cpp': 'cpp',
  'c++': 'cpp',
};

export default function PrismSyntaxHighlighter({ code, language }) {
  const codeRef = useRef(null);
  
  useEffect(() => {
    if (codeRef.current) {
      // Map the language to Prism's language if needed
      const prismLanguage = languageMap[language?.toLowerCase()] || language || 'text';
      
      // Set the language class
      codeRef.current.className = `language-${prismLanguage}`;
      
      // Highlight the code
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);
  
  return (
    <pre className="!bg-transparent !p-0 !m-0 !border-0">
      <code ref={codeRef} className={`language-${language || 'text'}`}>
        {code}
      </code>
    </pre>
  );
}
