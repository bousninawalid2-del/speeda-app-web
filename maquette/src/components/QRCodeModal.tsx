import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useIsMobile } from '../hooks/use-mobile';
import QRCodeStyling from 'qr-code-styling';
import speedaIcon from '../assets/speeda-logo-icon.svg';

interface QRCodeModalProps {
  url: string;
  onClose: () => void;
}

const SIZE_OPTIONS = [
  { label: 'Small', value: 512 },
  { label: 'Medium', value: 1024 },
  { label: 'Large', value: 2048 },
] as const;

export const QRCodeModal = ({ url, onClose }: QRCodeModalProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const qrRef = useRef<HTMLDivElement>(null);
  const qrInstance = useRef<QRCodeStyling | null>(null);

  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [addLogo, setAddLogo] = useState(false);
  const [downloadSize, setDownloadSize] = useState(1024);
  const [showCustomize, setShowCustomize] = useState(false);

  const createQR = useCallback(() => {
    const qr = new QRCodeStyling({
      width: 200,
      height: 200,
      data: url.startsWith('http') ? url : `https://${url}`,
      dotsOptions: { color: fgColor, type: 'rounded' },
      backgroundOptions: { color: bgColor },
      cornersSquareOptions: { type: 'extra-rounded' },
      cornersDotOptions: { type: 'dot' },
      qrOptions: { errorCorrectionLevel: addLogo ? 'H' : 'M' },
      ...(addLogo ? {
        image: speedaIcon,
        imageOptions: { crossOrigin: 'anonymous', margin: 4, imageSize: 0.2 },
      } : {}),
    });
    qrInstance.current = qr;
    if (qrRef.current) {
      qrRef.current.innerHTML = '';
      qr.append(qrRef.current);
    }
  }, [url, fgColor, bgColor, addLogo]);

  useEffect(() => {
    createQR();
  }, [createQR]);

  const downloadQR = (ext: 'png' | 'svg') => {
    if (!qrInstance.current) return;
    // Create a high-res version for download
    const dlQR = new QRCodeStyling({
      width: downloadSize,
      height: downloadSize,
      data: url.startsWith('http') ? url : `https://${url}`,
      dotsOptions: { color: fgColor, type: 'rounded' },
      backgroundOptions: { color: bgColor },
      cornersSquareOptions: { type: 'extra-rounded' },
      cornersDotOptions: { type: 'dot' },
      qrOptions: { errorCorrectionLevel: addLogo ? 'H' : 'M' },
      ...(addLogo ? {
        image: speedaIcon,
        imageOptions: { crossOrigin: 'anonymous', margin: 8, imageSize: 0.2 },
      } : {}),
    });
    dlQR.download({ name: `qr-${url.replace(/[^a-zA-Z0-9]/g, '-')}`, extension: ext });
    toast.success(t('qr.downloaded', 'Downloaded ✓'));
  };

  const copyQR = async () => {
    if (!qrInstance.current) return;
    try {
      const blob = await qrInstance.current.getRawData('png');
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        toast.success(t('qr.copied', 'QR code copied ✓'));
      }
    } catch {
      toast.error(t('qr.copyFailed', 'Copy failed'));
    }
  };

  const content = (
    <div className="space-y-4">
      {/* QR Preview */}
      <div className="flex justify-center">
        <div className="bg-white rounded-2xl p-6 border border-border-light inline-block">
          <div ref={qrRef} className="w-[200px] h-[200px]" />
        </div>
      </div>

      <p className="text-center text-[13px] font-semibold text-brand-blue">{url}</p>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button onClick={() => downloadQR('png')} className="flex-1 h-10 rounded-xl bg-card border border-border-light text-[12px] font-semibold flex items-center justify-center gap-1.5 hover:bg-muted transition-colors">
          <Download size={14} /> {t('qr.downloadPng', 'Download PNG')}
        </button>
        <button onClick={() => downloadQR('svg')} className="flex-1 h-10 rounded-xl bg-card border border-border-light text-[12px] font-semibold flex items-center justify-center gap-1.5 hover:bg-muted transition-colors">
          <Download size={14} /> {t('qr.downloadSvg', 'Download SVG')}
        </button>
        <button onClick={copyQR} className="flex-1 h-10 rounded-xl bg-card border border-border-light text-[12px] font-semibold flex items-center justify-center gap-1.5 hover:bg-muted transition-colors">
          <Copy size={14} /> {t('qr.copyImage', 'Copy Image')}
        </button>
      </div>

      {/* Customize Section */}
      <button onClick={() => setShowCustomize(!showCustomize)} className="text-[12px] text-brand-blue font-medium flex items-center gap-1 w-full">
        <ChevronDown size={14} className={`transition-transform ${showCustomize ? 'rotate-180' : ''}`} />
        {t('qr.customize', 'Customize QR Code')}
      </button>

      <AnimatePresence>
        {showCustomize && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3">
            {/* Foreground color */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-foreground">{t('qr.fgColor', 'QR Color')}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setFgColor('#000000')} className={`w-6 h-6 rounded-full bg-black border-2 ${fgColor === '#000000' ? 'border-brand-blue' : 'border-border-light'}`} />
                <button onClick={() => setFgColor('#0020d4')} className={`w-6 h-6 rounded-full border-2 ${fgColor === '#0020d4' ? 'border-brand-blue' : 'border-border-light'}`} style={{ background: '#0020d4' }} />
                <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="w-6 h-6 rounded-full cursor-pointer border-0 p-0" />
              </div>
            </div>

            {/* Background color */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-foreground">{t('qr.bgColor', 'Background')}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setBgColor('#ffffff')} className={`w-6 h-6 rounded-full bg-white border-2 ${bgColor === '#ffffff' ? 'border-brand-blue' : 'border-border-light'}`} />
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-6 h-6 rounded-full cursor-pointer border-0 p-0" />
              </div>
            </div>

            {/* Add Logo */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-foreground">{t('qr.addLogo', 'Add Logo')}</span>
              <button onClick={() => setAddLogo(!addLogo)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors ${addLogo ? 'bg-green-accent' : 'bg-border'}`}>
                <div className={`w-4 h-4 rounded-full bg-card shadow transition-transform ${addLogo ? 'translate-x-4 rtl:-translate-x-4' : ''}`} />
              </button>
            </div>

            {/* Size Selector */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-foreground">{t('qr.downloadSize', 'Download Size')}</span>
              <div className="flex gap-1.5">
                {SIZE_OPTIONS.map(s => (
                  <button key={s.value} onClick={() => setDownloadSize(s.value)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${downloadSize === s.value ? 'bg-brand-blue text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-foreground/30 z-50" />
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-xl max-h-[85vh] flex flex-col">
          <div className="p-5 pb-3 flex items-center justify-between border-b border-border-light">
            <h3 className="text-[16px] font-bold text-foreground">{t('qr.generate', 'Generate QR Code')}</h3>
            <button onClick={onClose}><X size={20} className="text-muted-foreground" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{content}</div>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-foreground/30 z-50" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl shadow-xl w-[400px] max-h-[85vh] flex flex-col">
        <div className="p-5 pb-3 flex items-center justify-between border-b border-border-light">
          <h3 className="text-[16px] font-bold text-foreground">{t('qr.generate', 'Generate QR Code')}</h3>
          <button onClick={onClose}><X size={20} className="text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{content}</div>
      </motion.div>
    </>
  );
};
