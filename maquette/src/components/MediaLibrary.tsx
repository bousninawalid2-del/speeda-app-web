import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Download, Trash2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useIsMobile } from '../hooks/use-mobile';
import { MediaGrid } from './media/MediaGrid';
import { MediaDetailPanel } from './media/MediaDetailPanel';
import { MediaUploadModal } from './media/MediaUploadModal';
import { BrandKitSection } from './media/BrandKitSection';

export interface MediaItem {
  id: string;
  name: string;
  type: 'photo' | 'video' | 'logo' | 'brand';
  url?: string;
  size: string;
  dimensions: string;
  date: string;
  description?: string;
  usedIn?: string[];
}

const demoMedia: MediaItem[] = [
  { id: '1', name: 'shawarma_hero.jpg', type: 'photo', size: '2.4 MB', dimensions: '1080x1080', date: 'Mar 18', usedIn: ['Instagram Reel'] },
  { id: '2', name: 'smash_burger.jpg', type: 'photo', size: '3.1 MB', dimensions: '1080x1350', date: 'Mar 17', usedIn: ['Instagram Post'] },
  { id: '3', name: 'kitchen_bts.mp4', type: 'video', size: '24.5 MB', dimensions: '1080x1920', date: 'Mar 16' },
  { id: '4', name: 'logo_gradient.png', type: 'logo', size: '156 KB', dimensions: '512x512', date: 'Mar 15' },
  { id: '5', name: 'brand_pattern.png', type: 'brand', size: '890 KB', dimensions: '2048x2048', date: 'Mar 14' },
  { id: '6', name: 'kunafa_close.jpg', type: 'photo', size: '1.8 MB', dimensions: '1080x1080', date: 'Mar 14' },
  { id: '7', name: 'team_photo.jpg', type: 'photo', size: '2.9 MB', dimensions: '1920x1080', date: 'Mar 13' },
  { id: '8', name: 'promo_video.mp4', type: 'video', size: '18.2 MB', dimensions: '1080x1080', date: 'Mar 12' },
  { id: '9', name: 'menu_photo.jpg', type: 'photo', size: '3.4 MB', dimensions: '1080x1350', date: 'Mar 11' },
  { id: '10', name: 'interior_shot.jpg', type: 'photo', size: '4.1 MB', dimensions: '1920x1280', date: 'Mar 10' },
  { id: '11', name: 'logo_white.svg', type: 'logo', size: '12 KB', dimensions: '256x256', date: 'Mar 9' },
  { id: '12', name: 'brunch_reel.mp4', type: 'video', size: '32.1 MB', dimensions: '1080x1920', date: 'Mar 8' },
];

const filters = ['All', 'Photos', 'Videos', 'Logos', 'Brand Kit'];
const filterMap: Record<string, string | null> = { All: null, Photos: 'photo', Videos: 'video', Logos: 'logo', 'Brand Kit': 'brand' };

interface MediaLibraryProps {
  mode?: 'tab' | 'picker';
  onSelect?: (items: MediaItem[]) => void;
  multiSelect?: boolean;
  onClose?: () => void;
}

export const MediaLibrary = ({ mode = 'tab', onSelect, multiSelect = false, onClose }: MediaLibraryProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [activeFilter, setActiveFilter] = useState('All');
  const [media] = useState<MediaItem[]>(demoMedia);
  const [selectedDetail, setSelectedDetail] = useState<MediaItem | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const filtered = activeFilter === 'Brand Kit'
    ? media.filter(m => m.type === 'brand' || m.type === 'logo')
    : filterMap[activeFilter]
      ? media.filter(m => m.type === filterMap[activeFilter])
      : media;

  const toggleSelect = (id: string) => {
    if (multiSelect) {
      setSelectedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    } else {
      setSelectedItems([id]);
    }
  };

  const handleConfirmSelection = () => {
    const items = media.filter(m => selectedItems.includes(m.id));
    onSelect?.(items);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      toast.success(`${files.length} file(s) uploaded ✓`);
    }
  }, []);

  return (
    <div className="space-y-4" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-brand-blue/10 border-4 border-dashed border-brand-blue rounded-3xl flex items-center justify-center pointer-events-none">
            <div className="bg-card rounded-2xl p-8 shadow-xl text-center">
              <Upload size={40} className="mx-auto text-brand-blue mb-3" />
              <p className="text-[16px] font-bold text-foreground">Drop files to upload</p>
              <p className="text-[13px] text-muted-foreground mt-1">JPG, PNG, WebP, GIF, MP4, MOV</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[18px] font-bold text-foreground">
            {t('media.title', 'Media Library')}
          </h3>
          <p className="text-[14px] text-muted-foreground">{filtered.length} {t('media.files', 'files')}</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="h-9 px-4 rounded-xl gradient-btn text-primary-foreground text-[12px] font-bold flex items-center gap-1.5">
          <Plus size={14} /> {t('media.upload', 'Upload')}
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {filters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`rounded-3xl px-4 py-2 text-[12px] font-semibold whitespace-nowrap transition-all ${
              activeFilter === f ? 'gradient-btn text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}>
            {t(`media.filter${f.replace(/\s/g, '')}`, f)}
          </button>
        ))}
      </div>

      {/* Brand Kit section when that filter is active */}
      {activeFilter === 'Brand Kit' && <BrandKitSection />}

      {/* Media grid */}
      <MediaGrid
        items={filtered}
        isMobile={isMobile}
        mode={mode}
        selectedItems={selectedItems}
        onItemClick={(item) => mode === 'picker' ? toggleSelect(item.id) : setSelectedDetail(item)}
        onUseInPost={(item) => { onSelect?.([item]); toast.success('Added to post'); }}
      />

      {/* Picker confirm button */}
      {mode === 'picker' && selectedItems.length > 0 && (
        <div className="sticky bottom-0 pt-3 bg-background">
          <button onClick={handleConfirmSelection}
            className="w-full h-12 rounded-2xl gradient-btn text-primary-foreground text-[14px] font-bold btn-press">
            {t('media.useSelected', 'Use Selected')} ({selectedItems.length})
          </button>
        </div>
      )}

      {/* Upload modal */}
      <MediaUploadModal open={showUpload} onClose={() => setShowUpload(false)} />

      {/* Detail view */}
      <MediaDetailPanel
        item={selectedDetail}
        mode={mode}
        isMobile={isMobile}
        onClose={() => setSelectedDetail(null)}
        onSelect={onSelect}
      />
    </div>
  );
};
