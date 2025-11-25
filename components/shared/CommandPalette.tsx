/**
 * Command Palette Component
 * Quick action menu with fuzzy search (Cmd+K / Ctrl+K)
 */

'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { useToast } from './Toast';
import { generateRandomPattern, createDefaultPattern } from '@/lib/utils/patternUtils';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Command {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  action: () => void;
  category: string;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const filteredCommandsRef = useRef<Command[]>([]);
  const selectedIndexRef = useRef(0);
  const { showToast } = useToast();

  // Store actions - Zustand selectors for functions are stable
  const addPattern = useStore((state) => state.addPattern);
  const saveToHistory = useStore((state) => state.saveToHistory);
  const practicePadMode = useStore((state) => state.practicePadMode);
  const setBPM = useStore((state) => state.setBPM);
  const bpm = useStore((state) => state.bpm);

  // Use refs to avoid dependency issues - initialize once and update synchronously
  const onCloseRef = useRef(onClose);
  const showToastRef = useRef(showToast);
  const bpmRef = useRef(bpm);
  const setBPMRef = useRef(setBPM);
  const addPatternRef = useRef(addPattern);
  const saveToHistoryRef = useRef(saveToHistory);
  const practicePadModeRef = useRef(practicePadMode);

  // Update refs synchronously (not in useEffect to avoid loops)
  onCloseRef.current = onClose;
  showToastRef.current = showToast;
  bpmRef.current = bpm;
  setBPMRef.current = setBPM;
  addPatternRef.current = addPattern;
  saveToHistoryRef.current = saveToHistory;
  practicePadModeRef.current = practicePadMode;

  // Define available commands - use refs to avoid dependency issues
  const allCommands: Command[] = useMemo(() => [
    {
      id: 'add-pattern',
      label: 'Add Pattern',
      icon: 'fas fa-plus',
      shortcut: 'Ctrl+N',
      category: 'Patterns',
      action: () => {
        const pattern = createDefaultPattern();
        addPatternRef.current(pattern);
        saveToHistoryRef.current();
        onCloseRef.current();
        showToastRef.current('Pattern added', 'success');
      },
    },
    {
      id: 'random-pattern',
      label: 'Generate Random Pattern',
      icon: 'fas fa-dice',
      shortcut: 'Ctrl+Shift+N',
      category: 'Patterns',
      action: () => {
        const newPattern = generateRandomPattern(practicePadModeRef.current, false);
        addPatternRef.current(newPattern);
        saveToHistoryRef.current();
        onCloseRef.current();
        showToastRef.current('Random pattern generated', 'success');
      },
    },
    {
      id: 'increase-bpm',
      label: 'Increase BPM',
      icon: 'fas fa-plus',
      category: 'Playback',
      action: () => {
        setBPMRef.current(Math.min(260, bpmRef.current + 5));
        onCloseRef.current();
      },
    },
    {
      id: 'decrease-bpm',
      label: 'Decrease BPM',
      icon: 'fas fa-minus',
      category: 'Playback',
      action: () => {
        setBPMRef.current(Math.max(40, bpmRef.current - 5));
        onCloseRef.current();
      },
    },
    {
      id: 'export-midi',
      label: 'Export as MIDI',
      icon: 'fas fa-download',
      category: 'Export',
      action: () => {
        showToastRef.current('MIDI export coming soon', 'info');
        onCloseRef.current();
      },
    },
  ], []); // Empty dependency array - refs are always current

  // Filter commands based on search query
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) {
      filteredCommandsRef.current = allCommands;
      return allCommands;
    }

    const query = searchQuery.toLowerCase();
    const result = allCommands.filter(cmd => 
      cmd.label.toLowerCase().includes(query) ||
      cmd.category.toLowerCase().includes(query) ||
      cmd.shortcut?.toLowerCase().includes(query)
    );
    filteredCommandsRef.current = result;
    return result;
  }, [allCommands, searchQuery]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Update ref synchronously
  selectedIndexRef.current = selectedIndex;

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentCommands = filteredCommandsRef.current;
      const currentIndex = selectedIndexRef.current;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const maxIndex = currentCommands.length > 0 ? currentCommands.length - 1 : 0;
          return Math.min(prev + 1, maxIndex);
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const command = currentCommands[currentIndex];
        if (command) {
          command.action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands.length]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '20vh',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--dpgen-card)',
          borderRadius: 'var(--dpgen-radius)',
          boxShadow: 'var(--dpgen-shadow)',
          border: '1px solid var(--dpgen-border)',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '60vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalEnter 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--dpgen-border)' }}>
          <div style={{ position: 'relative' }}>
            <i
              className="fas fa-search"
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--dpgen-muted)',
              }}
            />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a command or search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                border: '1px solid var(--dpgen-border)',
                borderRadius: '6px',
                fontSize: '1rem',
                background: 'var(--dpgen-bg)',
                color: 'var(--dpgen-text)',
              }}
              className="dpgen-input"
            />
          </div>
        </div>

        {/* Commands List */}
        <div
          style={{
            overflowY: 'auto',
            maxHeight: '50vh',
          }}
        >
          {Object.keys(groupedCommands).length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--dpgen-muted)' }}>
              <i className="fas fa-search" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
              <p>No commands found</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, commands]) => (
              <div key={category}>
                <div
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--dpgen-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: 'var(--dpgen-bg)',
                  }}
                >
                  {category}
                </div>
                {commands.map((cmd, index) => {
                  const globalIndex = filteredCommands.indexOf(cmd);
                  const isSelected = globalIndex === selectedIndex;
                  
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: isSelected ? 'var(--dpgen-primary)' : 'transparent',
                        color: isSelected ? 'white' : 'var(--dpgen-text)',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <i className={cmd.icon} style={{ width: '20px', textAlign: 'center' }} />
                      <span style={{ flex: 1 }}>{cmd.label}</span>
                      {cmd.shortcut && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            opacity: 0.7,
                            display: 'flex',
                            gap: '0.25rem',
                          }}
                        >
                          {cmd.shortcut.split('+').map((key, i) => (
                            <kbd
                              key={i}
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'var(--dpgen-bg)',
                                border: `1px solid ${isSelected ? 'rgba(255, 255, 255, 0.3)' : 'var(--dpgen-border)'}`,
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                              }}
                            >
                              {key}
                            </kbd>
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid var(--dpgen-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'var(--dpgen-muted)',
            background: 'var(--dpgen-bg)',
          }}
        >
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span>
              <kbd style={{ padding: '0.25rem 0.5rem', background: 'var(--dpgen-card)', border: '1px solid var(--dpgen-border)', borderRadius: '4px' }}>↑</kbd>
              <kbd style={{ padding: '0.25rem 0.5rem', background: 'var(--dpgen-card)', border: '1px solid var(--dpgen-border)', borderRadius: '4px', marginLeft: '0.25rem' }}>↓</kbd>
              {' '}Navigate
            </span>
            <span>
              <kbd style={{ padding: '0.25rem 0.5rem', background: 'var(--dpgen-card)', border: '1px solid var(--dpgen-border)', borderRadius: '4px' }}>Enter</kbd>
              {' '}Select
            </span>
          </div>
          <span>
            <kbd style={{ padding: '0.25rem 0.5rem', background: 'var(--dpgen-card)', border: '1px solid var(--dpgen-border)', borderRadius: '4px' }}>Esc</kbd>
            {' '}Close
          </span>
        </div>
      </div>
    </div>
  );
}

