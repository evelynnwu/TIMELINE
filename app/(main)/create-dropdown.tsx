'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function CreateDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-4 py-1.5 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <span>+</span> Create
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 bg-background border border-border rounded-md shadow-lg z-50">
          <Link
            href="/upload"
            onClick={() => setIsOpen(false)}
            className="block w-full px-4 py-2 text-left text-sm border-b border-border hover:bg-muted-foreground hover:bg-opacity-10 transition-colors"
          >
            <span className="mr-2">✱</span> Thread
          </Link>
          <Link
            href="/upload"
            onClick={() => setIsOpen(false)}
            className="block w-full px-4 py-2 text-left text-sm hover:bg-muted-foreground hover:bg-opacity-10 transition-colors"
          >
            <span className="mr-2">@</span> Post
          </Link>
        </div>
      )}
    </div>
  );
}
