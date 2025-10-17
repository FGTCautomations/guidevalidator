"use client";

import { useEffect } from "react";

/**
 * Copy Protection Component
 *
 * Adds JavaScript-level protection against copying:
 * - Prevents Ctrl+C / Cmd+C
 * - Prevents Ctrl+A / Cmd+A (select all)
 * - Prevents right-click context menu
 * - Prevents DevTools-based copying
 * - Disables clipboard events
 */
export function CopyProtection() {
  useEffect(() => {
    // Ensure we're in the browser and document is available
    if (typeof window === 'undefined' || !document || !document.body) {
      return;
    }

    // Prevent keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+C, Cmd+C (copy)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        console.log('[Anti-Scraping] Copy attempt blocked');
        return false;
      }

      // Prevent Ctrl+A, Cmd+A (select all)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        console.log('[Anti-Scraping] Select all blocked');
        return false;
      }

      // Prevent Ctrl+U, Cmd+U (view source)
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        console.log('[Anti-Scraping] View source blocked');
        return false;
      }

      // Prevent F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        console.log('[Anti-Scraping] DevTools access blocked');
        return false;
      }

      // Prevent Ctrl+Shift+I, Cmd+Option+I (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        console.log('[Anti-Scraping] DevTools access blocked');
        return false;
      }

      // Prevent Ctrl+Shift+J, Cmd+Option+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        console.log('[Anti-Scraping] Console access blocked');
        return false;
      }

      // Prevent Ctrl+Shift+C, Cmd+Option+C (Inspect element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        console.log('[Anti-Scraping] Inspect element blocked');
        return false;
      }
    };

    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      console.log('[Anti-Scraping] Context menu blocked');
      return false;
    };

    // Prevent copy event
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      console.log('[Anti-Scraping] Copy event blocked');
      return false;
    };

    // Prevent cut event
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      console.log('[Anti-Scraping] Cut event blocked');
      return false;
    };

    // Prevent drag selection
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      console.log('[Anti-Scraping] Drag blocked');
      return false;
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('dragstart', handleDragStart);

    // Disable text selection via JavaScript
    if (document.body) {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      // @ts-ignore
      document.body.style.msUserSelect = 'none';
    }

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('dragstart', handleDragStart);

      if (document.body) {
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        // @ts-ignore
        document.body.style.msUserSelect = '';
      }
    };
  }, []);

  return null; // This component doesn't render anything
}
