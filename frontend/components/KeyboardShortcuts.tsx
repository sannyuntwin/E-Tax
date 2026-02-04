'use client'

import { useEffect } from 'react'

interface KeyboardShortcutsProps {
  onCreateInvoice: () => void
  onSaveDraft: () => void
  onSearch: () => void
  onToggleDarkMode: () => void
  onExportData: () => void
}

export default function KeyboardShortcuts({ 
  onCreateInvoice, 
  onSaveDraft, 
  onSearch, 
  onToggleDarkMode, 
  onExportData 
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input field
      const activeElement = document.activeElement as HTMLElement
      const isInputField = activeElement?.tagName === 'INPUT' || 
                           activeElement?.tagName === 'TEXTAREA' || 
                           activeElement?.contentEditable === 'true'

      // Only apply shortcuts when not typing in input fields
      if (!isInputField) {
        // Ctrl/Cmd + N: New Invoice
        if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
          event.preventDefault()
          onCreateInvoice()
        }
        
        // Ctrl/Cmd + S: Save Draft
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
          event.preventDefault()
          onSaveDraft()
        }
        
        // Ctrl/Cmd + F: Search
        if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
          event.preventDefault()
          onSearch()
        }
        
        // Ctrl/Cmd + D: Toggle Dark Mode
        if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
          event.preventDefault()
          onToggleDarkMode()
        }
        
        // Ctrl/Cmd + E: Export Data
        if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
          event.preventDefault()
          onExportData()
        }
      }

      // Escape: Close modals
      if (event.key === 'Escape') {
        const modals = document.querySelectorAll('[role="dialog"], .fixed.inset-0')
        modals.forEach(modal => {
          const closeButton = modal.querySelector('button[aria-label="Close"], button[title="Close"], button:has(svg), button:has(.X)')
          if (closeButton) {
            (closeButton as HTMLButtonElement).click()
          }
        })
      }

      // ? : Show keyboard shortcuts help
      if (event.key === '?' && !isInputField) {
        event.preventDefault()
        showKeyboardHelp()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCreateInvoice, onSaveDraft, onSearch, onToggleDarkMode, onExportData])

  const showKeyboardHelp = () => {
    const shortcuts = [
      { key: 'Ctrl/Cmd + N', description: 'Create New Invoice' },
      { key: 'Ctrl/Cmd + S', description: 'Save Draft' },
      { key: 'Ctrl/Cmd + F', description: 'Focus Search' },
      { key: 'Ctrl/Cmd + D', description: 'Toggle Dark Mode' },
      { key: 'Ctrl/Cmd + E', description: 'Export Data' },
      { key: 'Escape', description: 'Close Modal' },
      { key: '?', description: 'Show This Help' },
    ]

    const helpHtml = `
      <div id="keyboard-help" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg max-w-md w-full mx-4 p-6">
          <h3 class="text-lg font-semibold mb-4">Keyboard Shortcuts</h3>
          <div class="space-y-2">
            ${shortcuts.map(shortcut => `
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <kbd class="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm">${shortcut.key}</kbd>
                <span class="text-sm text-gray-600">${shortcut.description}</span>
              </div>
            `).join('')}
          </div>
          <button onclick="document.getElementById('keyboard-help').remove()" 
                  class="mt-4 w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
            Got it!
          </button>
        </div>
      </div>
    `
    
    // Remove existing help if present
    const existingHelp = document.getElementById('keyboard-help')
    if (existingHelp) {
      existingHelp.remove()
    }
    
    // Add new help
    document.body.insertAdjacentHTML('beforeend', helpHtml)
  }

  return null // This component doesn't render anything, it just handles keyboard events
}
