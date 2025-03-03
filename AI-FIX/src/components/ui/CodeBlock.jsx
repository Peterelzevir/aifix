'use client';

import React, { useState, useEffect } from 'react';
import { FiCopy, FiCheck, FiDownload, FiMaximize, FiMinimize } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import PrismSyntaxHighlighter from './PrismSyntaxHighlighter';

// List of language names to display
const languageNames = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  python: 'Python',
  py: 'Python',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  cs: 'C#',
  csharp: 'C#',
  php: 'PHP',
  ruby: 'Ruby',
  go: 'Go',
  rust: 'Rust',
  swift: 'Swift',
  kotlin: 'Kotlin',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  jsx: 'JSX',
  tsx: 'TSX',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  xml: 'XML',
  yaml: 'YAML',
  yml: 'YAML',
  markdown: 'Markdown',
  md: 'Markdown',
  sql: 'SQL',
  bash: 'Bash',
  sh: 'Shell',
  shell: 'Shell',
  powershell: 'PowerShell',
  ps: 'PowerShell',
  dockerfile: 'Dockerfile',
  docker: 'Docker',
  plaintext: 'Plain Text',
  text: 'Plain Text',
};

// Detect line count to decide if we should show the expand/collapse button
const LINE_THRESHOLD = 15;

export default function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  
  // Count lines on mount
  useEffect(() => {
    if (code) {
      setLineCount(code.split('\n').length);
    }
  }, [code]);
  
  // Display either the full language name or the language code
  const displayLanguage = languageNames[language?.toLowerCase()] || language || 'Code';
  
  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  // Handle download as file
  const handleDownload = () => {
    // Create file extension based on language
    let fileExtension = '.txt';
    switch(language?.toLowerCase()) {
      case 'javascript':
      case 'js':
        fileExtension = '.js';
        break;
      case 'python':
      case 'py':
        fileExtension = '.py';
        break;
      case 'html':
        fileExtension = '.html';
        break;
      case 'css':
        fileExtension = '.css';
        break;
      case 'java':
        fileExtension = '.java';
        break;
      case 'cpp':
        fileExtension = '.cpp';
        break;
      case 'typescript':
      case 'ts':
        fileExtension = '.ts';
        break;
      case 'jsx':
        fileExtension = '.jsx';
        break;
      case 'json':
        fileExtension = '.json';
        break;
      // Add more languages as needed
    }
    
    // Create file name
    const fileName = `code-snippet${fileExtension}`;
    
    // Create blob and download
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  return (
    <div className="relative group rounded-lg overflow-hidden my-3 w-full bg-primary-900 border border-primary-700 shadow-md">
      {/* Header with language and actions */}
      <div className="flex items-center justify-between bg-primary-800 px-4 py-2 border-b border-primary-700">
        {/* Language badge */}
        <div className="text-primary-300 text-xs font-mono flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-1.5"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1.5"></div>
          <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
          {displayLanguage}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {/* Expand/Collapse button - only show if code is long */}
          {lineCount > LINE_THRESHOLD && (
            <motion.button
              className="text-primary-300 hover:text-primary-50 p-1 rounded"
              onClick={toggleExpanded}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={expanded ? "Collapse code" : "Expand code"}
            >
              {expanded ? <FiMinimize size={16} /> : <FiMaximize size={16} />}
            </motion.button>
          )}
          
          {/* Download button */}
          <motion.button
            className="text-primary-300 hover:text-primary-50 p-1 rounded"
            onClick={handleDownload}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Download code"
          >
            <FiDownload size={16} />
          </motion.button>
          
          {/* Copy button */}
          <motion.button
            className="text-primary-300 hover:text-primary-50 p-1 rounded flex items-center space-x-1"
            onClick={handleCopy}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={copied ? "Copied!" : "Copy code"}
          >
            {copied ? (
              <>
                <FiCheck size={16} className="text-green-400" />
                <span className="text-xs text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <FiCopy size={16} />
                <span className="text-xs hidden sm:inline">Copy</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
      
      {/* Code container with improved styling and syntax highlighting */}
      <div 
        className={`
          relative overflow-auto text-sm px-4 py-3 font-mono bg-primary-900
          ${!expanded && lineCount > LINE_THRESHOLD ? 'max-h-[300px]' : ''}
          pl-12 sm:pl-14
        `}
      >
        {/* Line numbers */}
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-10 bg-primary-800/30 border-r border-primary-700/30 text-right pr-2 pt-3 select-none">
          {code.split('\n').map((_, i) => (
            <div key={i} className="text-xs text-primary-500 leading-relaxed">
              {i + 1}
            </div>
          ))}
        </div>
        
        {/* Code with syntax highlighting */}
        <PrismSyntaxHighlighter code={code} language={language} />
      </div>
      
      {/* Fade out gradient for collapsed code */}
      <AnimatePresence>
        {!expanded && lineCount > LINE_THRESHOLD && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-primary-900 to-transparent pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
