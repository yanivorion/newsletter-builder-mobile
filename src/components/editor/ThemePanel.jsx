import React, { useState } from 'react';
import {
  Palette,
  Plus,
  X,
  Droplets,
  Trash2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { useTheme } from '../../context/ThemeContext';

function ThemePanel({ onSelectColor, onSelectGradient }) {
  const {
    addCustomColor,
    removeCustomColor,
    addCustomGradient,
    removeCustomGradient,
    getAllColors,
    getAllGradients,
  } = useTheme();

  const [showAddColor, setShowAddColor] = useState(false);
  const [showAddGradient, setShowAddGradient] = useState(false);
  const [newColor, setNewColor] = useState({ name: '', value: '#04D1FC' });
  const [newGradient, setNewGradient] = useState({ name: '', start: '#04D1FC', end: '#17A298' });

  const handleAddColor = () => {
    if (newColor.name && newColor.value) {
      addCustomColor(newColor);
      setNewColor({ name: '', value: '#04D1FC' });
      setShowAddColor(false);
    }
  };

  const handleAddGradient = () => {
    if (newGradient.name && newGradient.start && newGradient.end) {
      addCustomGradient(newGradient);
      setNewGradient({ name: '', start: '#04D1FC', end: '#17A298' });
      setShowAddGradient(false);
    }
  };

  const colors = getAllColors();
  const gradients = getAllGradients();

  // Group colors by category
  const colorsByCategory = colors.reduce((acc, color) => {
    const cat = color.category || 'custom';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(color);
    return acc;
  }, {});

  return (
    <div className="p-4 space-y-6 content-enter">
      {/* Colors Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wide text-zinc-500 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            Colors
          </Label>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAddColor(!showAddColor)}
            className="h-7 px-2"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Add Color Form */}
        {showAddColor && (
          <div className="p-3 bg-zinc-50 rounded-lg space-y-2 animate-fade-in">
            <Input
              placeholder="Color name"
              value={newColor.name}
              onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
              className="h-8 text-xs"
            />
            <div className="flex gap-2">
              <input
                type="color"
                value={newColor.value}
                onChange={(e) => setNewColor({ ...newColor, value: e.target.value })}
                className="w-10 h-8 rounded border border-zinc-200 cursor-pointer"
              />
              <Input
                value={newColor.value}
                onChange={(e) => setNewColor({ ...newColor, value: e.target.value })}
                className="flex-1 h-8 text-xs font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddColor} className="flex-1 h-7 text-xs">
                Add Color
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAddColor(false)} className="h-7 px-2">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Color Grid */}
        {Object.entries(colorsByCategory).map(([category, categoryColors]) => (
          <div key={category} className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">
              {category}
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {categoryColors.map((color) => (
                <button
                  key={color.id || color.name}
                  onClick={() => onSelectColor?.(color.value)}
                  className="group relative aspect-square rounded-lg border border-zinc-200/60 hover:border-zinc-400 overflow-hidden"
                  style={{
                    backgroundColor: color.value,
                    transition: 'border-color 150ms cubic-bezier(0.22, 1, 0.36, 1), transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 250ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                  title={`${color.name}: ${color.value}`}
                >
                  {color.id?.startsWith('custom-') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCustomColor(color.id);
                      }}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Gradients Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wide text-zinc-500 flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5" />
            Gradients
          </Label>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAddGradient(!showAddGradient)}
            className="h-7 px-2"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Add Gradient Form */}
        {showAddGradient && (
          <div className="p-3 bg-zinc-50 rounded-lg space-y-2 animate-fade-in">
            <Input
              placeholder="Gradient name"
              value={newGradient.name}
              onChange={(e) => setNewGradient({ ...newGradient, name: e.target.value })}
              className="h-8 text-xs"
            />
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <p className="text-[10px] text-zinc-400">Start</p>
                <div className="flex gap-1">
                  <input
                    type="color"
                    value={newGradient.start}
                    onChange={(e) => setNewGradient({ ...newGradient, start: e.target.value })}
                    className="w-8 h-8 rounded border border-zinc-200 cursor-pointer"
                  />
                  <Input
                    value={newGradient.start}
                    onChange={(e) => setNewGradient({ ...newGradient, start: e.target.value })}
                    className="flex-1 h-8 text-[10px] font-mono"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-[10px] text-zinc-400">End</p>
                <div className="flex gap-1">
                  <input
                    type="color"
                    value={newGradient.end}
                    onChange={(e) => setNewGradient({ ...newGradient, end: e.target.value })}
                    className="w-8 h-8 rounded border border-zinc-200 cursor-pointer"
                  />
                  <Input
                    value={newGradient.end}
                    onChange={(e) => setNewGradient({ ...newGradient, end: e.target.value })}
                    className="flex-1 h-8 text-[10px] font-mono"
                  />
                </div>
              </div>
            </div>
            {/* Preview */}
            <div 
              className="h-8 rounded-lg"
              style={{ background: `linear-gradient(90deg, ${newGradient.start}, ${newGradient.end})` }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddGradient} className="flex-1 h-7 text-xs">
                Add Gradient
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAddGradient(false)} className="h-7 px-2">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Gradient List */}
        <div className="space-y-1.5">
          {gradients.map((gradient) => (
            <button
              key={gradient.id}
              onClick={() => onSelectGradient?.(gradient.start, gradient.end)}
              className="group w-full h-10 rounded-lg border border-zinc-200/60 hover:border-zinc-400 relative overflow-hidden"
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              style={{ 
                background: `linear-gradient(90deg, ${gradient.start}, ${gradient.end})`,
                transition: 'border-color 150ms cubic-bezier(0.22, 1, 0.36, 1), transform 250ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 250ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                {gradient.name}
              </span>
              {gradient.id?.startsWith('gradient-') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCustomGradient(gradient.id);
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ThemePanel;

