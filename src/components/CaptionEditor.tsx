import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface CaptionEditorProps {
  caption: string;
  onUpdate: (caption: string) => void;
}

export const CaptionEditor = ({ caption, onUpdate }: CaptionEditorProps) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(caption);
  const [rewriting, setRewriting] = useState(false);
  const [undoCaption, setUndoCaption] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState(false);

  useEffect(() => { setEditValue(caption); }, [caption]);

  const handleRewrite = () => {
    setRewriting(true);
    setUndoCaption(caption);
    setTimeout(() => {
      const rewritten = caption.replace(/🔥/g, '✨').replace(/!/, ' — don\'t miss it!');
      onUpdate(rewritten);
      setRewriting(false);
      setShowUndo(true);
      setTimeout(() => setShowUndo(false), 5000);
    }, 1500);
  };

  const handleUndo = () => {
    if (undoCaption) {
      onUpdate(undoCaption);
      setShowUndo(false);
      toast.success('Caption restored ✓');
    }
  };

  const handleSaveEdit = () => {
    onUpdate(editValue);
    setIsEditing(false);
  };

  return (
    <div className="relative">
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            className="w-full min-h-[100px] rounded-xl bg-background border border-brand-blue p-3 text-[14px] text-foreground leading-[1.6] focus:outline-none resize-none"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} className="flex-1 h-9 rounded-xl gradient-btn text-primary-foreground text-[12px] font-bold btn-press">
              {t('common.save', 'Save')}
            </button>
            <button onClick={() => { setIsEditing(false); setEditValue(caption); }} className="h-9 px-4 rounded-xl border border-border text-muted-foreground text-[12px] font-medium">
              {t('common.cancel', 'Cancel')}
            </button>
          </div>
        </div>
      ) : (
        <div className="relative group">
          <p className="text-[14px] text-foreground leading-[1.6] whitespace-pre-line cursor-pointer" onClick={() => setIsEditing(true)}>
            {caption}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <button onClick={() => setIsEditing(true)} className="text-[11px] text-brand-blue font-semibold">
              ✏️ {t('common.edit', 'Edit')}
            </button>
            <button onClick={handleRewrite} disabled={rewriting} className="text-[11px] text-brand-blue font-semibold">
              {rewriting ? '✦ Rewriting...' : `✦ ${t('caption.aiRewrite', 'AI Rewrite')}`}
            </button>
          </div>
        </div>
      )}

      {/* Undo toast */}
      <AnimatePresence>
        {showUndo && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-12 start-0 end-0 bg-foreground text-primary-foreground rounded-xl px-4 py-2.5 flex items-center justify-between text-[12px] font-medium shadow-lg z-10">
            <span>Caption rewritten ✓</span>
            <button onClick={handleUndo} className="font-bold underline">Undo (5s)</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
