import { useCallback, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useIsMobile } from '../hooks/use-mobile';
import { useMedia, useUploadMedia } from '@/hooks/useMedia';
import type { MediaTypeFilter } from '@/services/media.service';
import { MediaGrid } from './media/MediaGrid';
import { MediaDetailPanel } from './media/MediaDetailPanel';

export interface MediaItem {
  id: string;
  name: string;
  type: 'photo' | 'video' | 'logo' | 'brand';
  url?: string;
  size: string;
  dimensions?: string;
  date: string;
  description?: string;
  usedIn?: string[];
}

const filters = ['All', 'Photos', 'Videos', 'Logos', 'Brand Kit'];
const UNKNOWN_VALUE = '—';
const queryFilterMap: Record<string, MediaTypeFilter | undefined> = {
  All: undefined,
  Photos: 'photo',
  Videos: 'video',
  Logos: undefined,
  'Brand Kit': undefined,
};

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
  const [selectedDetail, setSelectedDetail] = useState<MediaItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMedia = useUploadMedia();
  const currentTypeFilter = queryFilterMap[activeFilter];
  const { data, isLoading, isError, error } = useMedia(currentTypeFilter);

  const media = useMemo<MediaItem[]>(
    () => (data?.items ?? []).map(item => ({
      id: item.id,
      name: item.filename,
      type: item.mimetype.startsWith('video/') ? 'video' : 'photo',
      url: `/api/media?id=${item.id}`,
      size: formatBytes(item.size),
      dimensions: UNKNOWN_VALUE,
      date: formatDate(item.createdAt),
    })),
    [data?.items],
  );

  const filtered = useMemo(() => {
    if (activeFilter === 'Logos' || activeFilter === 'Brand Kit') return [];
    return media;
  }, [activeFilter, media]);

  const uploadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const results = await Promise.allSettled(files.map(file => uploadMedia.mutateAsync(file)));
    const uploadedCount = results.filter(result => result.status === 'fulfilled').length;
    const failedCount = results.length - uploadedCount;

    if (uploadedCount > 0) toast.success(t('media.uploadedCount', `${uploadedCount} file(s) uploaded ✓`));
    if (failedCount > 0) toast.error(t('media.uploadFailedCount', `Failed to upload ${failedCount} file(s)`));
    if (activeFilter === 'Logos' || activeFilter === 'Brand Kit') {
      toast.info(t('media.logosBrandKitUploadInfo', 'Uploaded files are available in All/Photos/Videos.'));
    }
  }, [activeFilter, t, uploadMedia]);

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
    const files = Array.from(e.dataTransfer.files ?? []);
    void uploadFiles(files);
  }, [uploadFiles]);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    void uploadFiles(files);
    event.target.value = '';
  };

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
        <div className="flex items-center gap-2">
          {mode === 'picker' && onClose && (
            <button onClick={onClose} className="h-9 w-9 rounded-xl border border-border text-muted-foreground flex items-center justify-center">
              <X size={16} />
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-9 px-4 rounded-xl gradient-btn text-primary-foreground text-[12px] font-bold flex items-center gap-1.5 disabled:opacity-60"
            disabled={uploadMedia.isPending}
          >
            <Plus size={14} /> {uploadMedia.isPending ? t('media.uploading', 'Uploading...') : t('media.upload', 'Upload')}
          </button>
          <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
        </div>
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

      {activeFilter === 'Logos' || activeFilter === 'Brand Kit' ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-[14px] font-semibold text-foreground">
            {t('media.categoryComingSoonTitle', 'Category tabs are not available yet')}
          </p>
          <p className="text-[12px] text-muted-foreground mt-1">
            {t('media.categoryComingSoonDescription', 'Use All / Photos / Videos for now.')}
          </p>
        </div>
      ) : isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center text-[13px] text-muted-foreground">
          {t('common.loading', 'Loading...')}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-[13px] text-red-accent">
            {error instanceof Error ? error.message : t('common.error', 'Something went wrong')}
          </p>
        </div>
      ) : (
        <MediaGrid
          items={filtered}
          isMobile={isMobile}
          mode={mode}
          selectedItems={selectedItems}
          onItemClick={(item) => mode === 'picker' ? toggleSelect(item.id) : setSelectedDetail(item)}
          onUseInPost={(item) => { onSelect?.([item]); toast.success('Added to post'); }}
        />
      )}

      {/* Picker confirm button */}
      {mode === 'picker' && selectedItems.length > 0 && (
        <div className="sticky bottom-0 pt-3 bg-background">
          <button onClick={handleConfirmSelection}
            className="w-full h-12 rounded-2xl gradient-btn text-primary-foreground text-[14px] font-bold btn-press">
            {t('media.useSelected', 'Use Selected')} ({selectedItems.length})
          </button>
        </div>
      )}

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

function formatBytes(size: number): string {
  if (size < 1024) return `${Math.floor(size)} B`;
  const units = ['KB', 'MB', 'GB'];
  let current = size / 1024;
  let unitIndex = 0;
  while (current >= 1024 && unitIndex < units.length - 1) {
    current /= 1024;
    unitIndex += 1;
  }
  return `${current.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
