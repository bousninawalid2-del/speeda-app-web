import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { MediaItem } from '../MediaLibrary';

const typeIcon = (type: string) => {
  switch (type) {
    case 'video': return '🎬';
    case 'logo': return '🎨';
    case 'brand': return '🎨';
    default: return '📷';
  }
};

const typeLabel = (type: string) => {
  switch (type) {
    case 'video': return 'Video';
    case 'logo': return 'Logo';
    case 'brand': return 'Brand';
    default: return 'Photo';
  }
};

interface MediaGridProps {
  items: MediaItem[];
  isMobile: boolean;
  mode: 'tab' | 'picker';
  selectedItems: string[];
  onItemClick: (item: MediaItem) => void;
  onUseInPost: (item: MediaItem) => void;
}

export const MediaGrid = ({ items, isMobile, mode, selectedItems, onItemClick, onUseInPost }: MediaGridProps) => {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className={`grid gap-3 ${isMobile ? 'grid-cols-3' : 'grid-cols-4'}`}>
      {items.map(item => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative group cursor-pointer"
          onMouseEnter={() => setHovered(item.id)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onItemClick(item)}
        >
          <div className={`aspect-square rounded-xl bg-gradient-to-br from-muted to-muted/50 overflow-hidden border-2 transition-all ${
            selectedItems.includes(item.id) ? 'border-brand-blue shadow-md' : 'border-transparent'
          }`}>
            <div className="w-full h-full gradient-hero flex items-center justify-center text-3xl">
              {typeIcon(item.type)}
            </div>
          </div>

          {/* Used indicator */}
          {item.usedIn && item.usedIn.length > 0 && (
            <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-brand-blue border-2 border-card" />
          )}

          {/* Type badge */}
          <div className="absolute bottom-8 left-1.5 bg-foreground/70 text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-md">
            {typeIcon(item.type)} {typeLabel(item.type)}
          </div>

          {/* Desktop hover overlay */}
          {!isMobile && hovered === item.id && mode === 'tab' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 rounded-xl bg-foreground/30 flex items-center justify-center">
              <button onClick={(e) => { e.stopPropagation(); onUseInPost(item); }}
                className="px-3 py-1.5 rounded-lg bg-card text-[11px] font-bold text-foreground shadow-lg">
                Use in Post
              </button>
            </motion.div>
          )}

          {/* Selection check */}
          {selectedItems.includes(item.id) && (
            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full gradient-btn flex items-center justify-center">
              <span className="text-primary-foreground text-[10px] font-bold">✓</span>
            </div>
          )}

          {/* File info */}
          <p className="text-[11px] text-muted-foreground mt-1 truncate">{item.name}</p>
          <p className="text-[10px] text-muted-foreground/70">{item.date}</p>
        </motion.div>
      ))}
    </div>
  );
};
