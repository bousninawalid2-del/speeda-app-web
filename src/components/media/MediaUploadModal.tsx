import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface MediaUploadModalProps {
  open: boolean;
  onClose: () => void;
}

export const MediaUploadModal = ({ open, onClose }: MediaUploadModalProps) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      onClose();
      toast.success('✓ Uploaded successfully');
    }, 1500);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-foreground/30 z-50" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-card rounded-3xl p-6 shadow-xl max-w-[500px] mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-bold text-foreground">{t('media.uploadTitle', 'Upload Media')}</h3>
              <button onClick={onClose}><X size={20} className="text-muted-foreground" /></button>
            </div>
            <div className="border-2 border-dashed border-brand-blue/25 rounded-2xl h-[200px] flex flex-col items-center justify-center gap-3 hover:bg-muted/30 transition-colors cursor-pointer" onClick={handleUpload}>
              <Upload size={32} className="text-brand-blue" />
              <p className="text-[14px] font-bold text-foreground">{t('media.dragDrop', 'Drag photos or videos here')}</p>
              <p className="text-[12px] text-muted-foreground">{t('media.orBrowse', 'Or browse files')}</p>
              <p className="text-[10px] text-muted-foreground">JPG, PNG, WebP, GIF, MP4, MOV · Max 50MB video, 10MB images</p>
            </div>
            {uploading && (
              <div className="mt-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.5 }} className="h-full gradient-btn rounded-full" />
                  </div>
                  <span className="text-[12px] text-muted-foreground">Uploading...</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
