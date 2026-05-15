import React, { useState } from 'react';
import { 
  Star, Heart, Zap, Rocket, Gift, Bell, Check, Award, Trophy, Flame,
  Sparkles, Crown, Gem, Target, Lightbulb, Megaphone, PartyPopper, Calendar,
  Clock, Mail, Send, ThumbsUp, Users, TrendingUp, Sun, Moon, Cloud,
  Music, Camera, Coffee, X, Search, Plus
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

const AVAILABLE_ICONS = [
  { name: 'star', icon: Star },
  { name: 'heart', icon: Heart },
  { name: 'zap', icon: Zap },
  { name: 'rocket', icon: Rocket },
  { name: 'gift', icon: Gift },
  { name: 'bell', icon: Bell },
  { name: 'check', icon: Check },
  { name: 'award', icon: Award },
  { name: 'trophy', icon: Trophy },
  { name: 'flame', icon: Flame },
  { name: 'sparkles', icon: Sparkles },
  { name: 'crown', icon: Crown },
  { name: 'gem', icon: Gem },
  { name: 'target', icon: Target },
  { name: 'lightbulb', icon: Lightbulb },
  { name: 'megaphone', icon: Megaphone },
  { name: 'party', icon: PartyPopper },
  { name: 'calendar', icon: Calendar },
  { name: 'clock', icon: Clock },
  { name: 'mail', icon: Mail },
  { name: 'send', icon: Send },
  { name: 'thumbsup', icon: ThumbsUp },
  { name: 'users', icon: Users },
  { name: 'trending', icon: TrendingUp },
  { name: 'sun', icon: Sun },
  { name: 'moon', icon: Moon },
  { name: 'cloud', icon: Cloud },
  { name: 'music', icon: Music },
  { name: 'camera', icon: Camera },
  { name: 'coffee', icon: Coffee },
];

function IconPicker({ onSelectIcon, onClose }) {
  const [search, setSearch] = useState('');
  
  const filteredIcons = AVAILABLE_ICONS.filter(({ name }) => 
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-zinc-200 overflow-hidden">
      {/* Header */}
      <div className="p-2 border-b border-zinc-100 flex items-center gap-2">
        <Search className="w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search icons..."
          className="flex-1 text-sm outline-none bg-transparent"
          autoFocus
        />
        <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded">
          <X className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* Icons Grid */}
      <div className="p-2 max-h-48 overflow-y-auto">
        <div className="grid grid-cols-6 gap-1">
          {filteredIcons.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => {
                onSelectIcon(`[icon:${name}]`);
                onClose();
              }}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-lg",
                "hover:bg-[#04D1FC]/10 hover:text-[#04D1FC] transition-colors",
                "text-zinc-600"
              )}
              title={name}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
        
        {filteredIcons.length === 0 && (
          <p className="text-xs text-zinc-400 text-center py-4">No icons found</p>
        )}
      </div>

      {/* Common Emojis */}
      <div className="p-2 border-t border-zinc-100">
        <p className="text-[10px] text-zinc-400 mb-2">Quick emojis</p>
        <div className="flex flex-wrap gap-1">
          {['🎉', '⭐', '🚀', '💡', '🔥', '✨', '💫', '🎯', '🏆', '💪', '👋', '❤️'].map(emoji => (
            <button
              key={emoji}
              onClick={() => {
                onSelectIcon(emoji);
                onClose();
              }}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-100 text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function IconPickerButton({ onSelectIcon }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 gap-1"
      >
        <Plus className="w-3.5 h-3.5" />
        <Sparkles className="w-3.5 h-3.5" />
        Add Icon
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <IconPicker 
            onSelectIcon={onSelectIcon} 
            onClose={() => setIsOpen(false)} 
          />
        </>
      )}
    </div>
  );
}

export default IconPicker;
