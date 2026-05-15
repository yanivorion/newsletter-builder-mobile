import React from 'react';
import {
  Type,
  Image,
  Layers,
  LayoutList,
  Proportions,
  CircleDot,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStagger } from '../../hooks/useStagger';

const STYLE_ACTIONS = [
  { id: 'name', icon: Type, label: 'Section name' },
  { id: 'background', icon: Image, label: 'Background' },
  { id: 'padding', icon: Proportions, label: 'Padding' },
  { id: 'layout', icon: Layers, label: 'Layout & height' },
  { id: 'radius', icon: CircleDot, label: 'Corner radius' },
  { id: 'blocks', icon: LayoutList, label: 'Blocks' },
];

/**
 * Style & layout dock on the section's left edge (mirrors {@link SectionActionToolbar} on the right).
 */
function SectionStyleToolbar({ sectionId, visible, onStyleAction }) {
  const stagger = useStagger(STYLE_ACTIONS.length, {
    delay: 40,
    baseDelay: 80,
    distance: 8,
    key: visible ? `style-${sectionId}` : null,
  });

  if (!visible) return null;

  return (
    <div
      data-editor-style-dock="true"
      style={{
        position: 'absolute',
        right: '102%',
        marginRight: 20,
        top: 20,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        pointerEvents: 'auto',
      }}
    >
      {STYLE_ACTIONS.map((action, i) => (
        <button
          key={action.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onStyleAction(action.id, sectionId);
          }}
          title={action.label}
          aria-label={action.label}
          className={cn(
            'btn-spring flex h-10 w-10 items-center justify-center rounded-full border',
            'border-zinc-200/80 bg-white text-zinc-600 shadow-sm',
            'hover:border-zinc-300/90 hover:bg-zinc-50 hover:text-zinc-900'
          )}
          style={{
            ...stagger(i),
            boxShadow: '0 2px 8px rgba(15,23,42,0.08)',
          }}
        >
          <action.icon className="h-4 w-4" strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}

export default SectionStyleToolbar;
