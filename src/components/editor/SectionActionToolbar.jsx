import React from 'react';
import { Copy, Trash2, ChevronUp, ChevronDown, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStagger } from '../../hooks/useStagger';

const actions = [
  { id: 'duplicate', icon: Copy, label: 'Duplicate section' },
  { id: 'delete', icon: Trash2, label: 'Delete section', danger: true },
  { id: 'settings', icon: Settings, label: 'Section settings — background, padding, layout, blocks' },
  { id: 'up', icon: ChevronUp, label: 'Move up' },
  { id: 'down', icon: ChevronDown, label: 'Move down' },
];

function SectionActionToolbar({
  sectionId,
  onAction,
  visible,
}) {
  const stagger = useStagger(actions.length, {
    delay: 40,
    baseDelay: 80,
    distance: 8,
    key: visible ? sectionId : null,
  });

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: '102%',
        marginLeft: 20,
        top: 20,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        pointerEvents: 'auto',
      }}
    >

      {actions.map((action, i) => (
        <button
          key={action.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAction(action.id, sectionId);
          }}
          title={action.label}
          aria-label={action.label}
          style={{
            ...stagger(i),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            background: 'none',
            border: 'none',
            boxShadow: 'none',
            padding: 0,
            cursor: 'pointer',
            color: action.danger ? '#71717a' : '#71717a',
            transition: 'color 150ms ease-out, opacity 150ms ease-out',
          }}
          onMouseEnter={e => e.currentTarget.style.color = action.danger ? '#dc2626' : '#18181b'}
          onMouseLeave={e => e.currentTarget.style.color = '#71717a'}
        >
          <action.icon size={18} strokeWidth={1.85} />
        </button>
      ))}
    </div>
  );
}

export default SectionActionToolbar;
