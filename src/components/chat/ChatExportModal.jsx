'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDownload, FiUpload, FiCopy } from 'react-icons/fi';
import { useChatContext } from '@/context/ChatContext';

export default function ChatExportModal({ isOpen, onClose }) {
  const { messages, importMessages } = useChatContext();
  const [exportFormat, setExportFormat] = useState('json');
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState('');
  
  // Generate formatted export content
  const getExportContent = () => {
    switch (exportFormat) {
      case 'json':
        return JSON.stringify(messages, null, 2);
      case 'markdown':
        return messages.map(msg => {
          const role = msg.role === 'user' ? '**You**' : '**AI Peter**';
          return `${role}:\n${msg.content}\n\n`;
        }).join('');
      case 'text':
        return messages.map(msg => {
          const role = msg.role === 'user' ? 'You' : 'AI Peter';
          return `${role}: ${msg.content}\n\n`;
        }).join('');
      default:
        return JSON.stringify(messages);
    }
  };
  
  // Handle downloading the export
  const handleDownload = () => {
    const content = getExportContent();
    const fileExtension = exportFormat === 'json' ? '.json' : 
                          exportFormat === 'markdown' ? '.md' : '.txt';
    const fileName = `ai-peter-chat-export${fileExtension}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Handle copying to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(getExportContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Handle file import
  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        // Try to parse as JSON
        const content = event.target.result;
        const parsedContent = JSON.parse(content);
        
        // Validate the imported data structure
        if (Array.isArray(parsedContent) && 
            parsedContent.length > 0 && 
            parsedContent[0].role && 
            parsedContent[0].content) {
          
          importMessages(parsedContent);
          onClose();
          setImportError('');
        } else {
          setImportError('Invalid chat format. Please import a valid AI Peter export file.');
        }
      } catch (error) {
        console.error('Import error:', error);
        setImportError('Failed to import: The file is not a valid JSON format.');
      }
    };
    
    reader.onerror = () => {
      setImportError('Error reading the file. Please try again.');
    };
    
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="bg-primary-800 rounded-xl shadow-xl max-w-lg w-full mx-auto overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-primary-700">
              <h2 className="text-xl font-semibold text-primary-50">Export/Import Chat</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-primary-700 text-primary-300 hover:text-primary-50 transition-colors"
                aria-label="Close modal"
              >
                <FiX size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4">
              {/* Export Section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-primary-50 mb-2">Export Conversation</h3>
                
                <div className="bg-primary-900 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm text-primary-300">Format:</label>
                    <div className="flex bg-primary-700 rounded-lg p-1">
                      {['json', 'markdown', 'text'].map(format => (
                        <button
                          key={format}
                          onClick={() => setExportFormat(format)}
                          className={`
                            px-3 py-1 text-xs rounded-md transition-colors uppercase
                            ${exportFormat === format ? 'bg-accent text-white' : 'text-primary-300 hover:text-primary-50'}
                          `}
                        >
                          {format}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <button
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-accent hover:bg-accent-light text-white rounded-lg transition-colors"
                    >
                      <FiDownload size={16} />
                      <span>Download</span>
                    </button>
                    
                    <button
                      onClick={handleCopy}
                      className={`
                        flex items-center justify-center gap-2 py-2 px-4 rounded-lg border transition-colors
                        ${copied 
                          ? 'border-green-500 text-green-400' 
                          : 'border-primary-600 text-primary-300 hover:text-primary-50 hover:border-primary-500'
                        }
                      `}
                    >
                      {copied ? 'Copied!' : (
                        <>
                          <FiCopy size={16} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Import Section */}
              <div>
                <h3 className="text-lg font-medium text-primary-50 mb-2">Import Conversation</h3>
                
                <div className="bg-primary-900 rounded-lg p-4">
                  <p className="text-sm text-primary-300 mb-4">
                    Import a previously exported AI Peter conversation in JSON format.
                  </p>
                  
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-primary-600 rounded-lg cursor-pointer hover:border-accent transition-colors">
                    <div className="flex flex-col items-center justify-center">
                      <FiUpload className="text-primary-300 mb-2" size={24} />
                      <p className="text-sm text-primary-300">Click to upload or drag and drop</p>
                      <p className="text-xs text-primary-400 mt-1">JSON files only</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".json"
                      onChange={handleFileImport}
                    />
                  </label>
                  
                  {importError && (
                    <div className="mt-3 text-sm text-red-400">
                      {importError}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-primary-700 text-right">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary-700 hover:bg-primary-600 text-primary-50 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
