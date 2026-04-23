import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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

interface MediaDetailPanelProps {
  item: MediaItem | null;
  mode: 'tab' | 'picker';
  isMobile: boolean;
  onClose: () => void;
  onSelect?: (items: MediaItem[]) => void;
}

export const MediaDetailPanel = ({ item, mode, isMobile, onClose, onSelect }: MediaDetailPanelProps) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {item && mode === 'tab' && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-foreground/30 z-50" />
          <motion.div
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            className={isMobile
              ? 'fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl max-h-[90vh] overflow-y-auto'
              : 'fixed top-0 end-0 bottom-0 w-[400px] z-50 bg-card border-s border-border overflow-y-auto'
            }
          >
            {isMobile && <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-muted" />}
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-foreground">{t('media.details', 'Media Details')}</h3>
                <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
              </div>

              {/* Preview */}
              <div className="w-full aspect-square rounded-xl gradient-hero flex items-center justify-center text-5xl overflow-hidden">
                {item.url ? (
                  item.type === 'video' ? (
                    <video src={item.url} className="w-full h-full object-cover" controls playsInline preload="metadata" />
                  ) : (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                  )
                ) : (
                  typeIcon(item.type)
                )}
              </div>

              {/* Info */}
              <div className="space-y-2">
                {[
                  { label: t('media.filename', 'Filename'), value: item.name },
                  { label: t('media.fileSize', 'File size'), value: item.size },
                  { label: t('media.dimensions', 'Dimensions'), value: item.dimensions ?? '—' },
                  { label: t('media.uploaded', 'Uploaded'), value: item.date },
                  { label: t('media.type', 'Type'), value: typeLabel(item.type) },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="text-foreground font-medium">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div>
                <label className="text-[13px] font-medium text-foreground">{t('media.description', 'Description')}</label>
                <textarea className="w-full mt-1 rounded-xl bg-background border border-border p-3 text-[13px] resize-none h-[60px] focus:border-primary focus:outline-none"
                  placeholder={t('media.addDescription', 'Add a description...')} defaultValue={item.description} />
              </div>

              {/* Used in */}
              {item.usedIn && item.usedIn.length > 0 && (
                <div>
                  <label className="text-[13px] font-medium text-foreground">{t('media.usedIn', 'Used in')}</label>
                  <div className="mt-1 space-y-1">
                    {item.usedIn.map((post, i) => (
                      <div key={i} className="bg-muted rounded-lg px-3 py-2 text-[12px] text-brand-blue font-medium cursor-pointer hover:bg-muted/70">{post}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button onClick={() => { onSelect?.([item]); onClose(); toast.success('Opening Quick Post...'); }}
                  className="w-full h-11 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press">
                  {t('media.useInNewPost', 'Use in New Post')}
                </button>
                <div className="flex gap-2">
                  <button className="flex-1 h-10 rounded-xl border border-border text-foreground text-[12px] font-medium flex items-center justify-center gap-1.5">
                    <Download size={13} /> {t('media.download', 'Download')}
                  </button>
                  <button className="flex-1 h-10 rounded-xl border border-red-accent/30 text-red-accent text-[12px] font-medium flex items-center justify-center gap-1.5">
                    <Trash2 size={13} /> {t('common.delete', 'Delete')}
                  </button>
                </div>
                <button className="w-full h-10 rounded-xl border border-border text-foreground text-[12px] font-medium flex items-center justify-center gap-1.5">
                  📐 {t('media.resizeForPlatform', 'Resize for Platform')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
