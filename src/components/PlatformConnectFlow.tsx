import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Lock, MoreVertical } from 'lucide-react';

type FlowStep = 'connecting' | 'success' | 'error';

interface PlatformConnectFlowProps {
  platformName: string;
  platformLogo: React.ReactNode;
  onComplete: () => void;
  onCancel: () => void;
}

export const PlatformConnectFlow = ({ platformName, platformLogo, onComplete, onCancel }: PlatformConnectFlowProps) => {
  const [step, setStep] = useState<FlowStep>('connecting');

  useEffect(() => {
    if (step === 'connecting') {
      const timer = setTimeout(() => setStep('success'), 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center px-8"
    >
      <AnimatePresence mode="wait">
        {step === 'connecting' && (
          <motion.div key="connecting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center text-center">
            <div className="w-16 h-16 flex items-center justify-center mb-6">{platformLogo}</div>
            <h2 className="text-[20px] font-bold text-foreground mb-4">{platformName}</h2>
            
            {/* Animated progress bar */}
            <div className="w-48 h-1.5 rounded-full bg-muted overflow-hidden mb-4">
              <motion.div
                className="h-full gradient-btn rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3, ease: 'linear' }}
              />
            </div>
            
            <p className="text-[14px] text-muted-foreground mb-2">Connecting your {platformName} account…</p>
            <p className="text-[13px] text-muted-foreground/70 max-w-[300px]">
              You'll be redirected to securely authorize access. This takes about 30 seconds.
            </p>
            
            <div className="flex items-center gap-1.5 mt-8">
              <Lock size={12} className="text-muted-foreground/50" />
              <span className="text-[11px] text-muted-foreground/50">Secured by Ayrshare</span>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center text-center">
            {/* Confetti particles */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: ['#0020d4', '#00c7f3', '#00d68f', '#f7c948', '#ff6b6b'][i % 5],
                  top: '40%',
                  left: '50%',
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: (Math.random() - 0.5) * 300,
                  y: (Math.random() - 0.5) * 300,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 2, delay: i * 0.05, ease: 'easeOut' }}
              />
            ))}
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-16 h-16 rounded-full bg-green-accent flex items-center justify-center mb-4"
            >
              <Check size={32} className="text-primary-foreground" strokeWidth={3} />
            </motion.div>
            
            <div className="relative mb-4">
              <div className="w-10 h-10 flex items-center justify-center">{platformLogo}</div>
              <div className="absolute -bottom-1 -end-1 w-5 h-5 rounded-full bg-green-accent flex items-center justify-center">
                <Check size={10} className="text-primary-foreground" strokeWidth={3} />
              </div>
            </div>
            
            <h2 className="text-[20px] font-bold text-green-accent mb-2">{platformName} Connected!</h2>
            <p className="text-[14px] text-muted-foreground mb-4">Your account @maleks_kitchen is now linked</p>
            
            {/* Account info card */}
            <div className="bg-card rounded-2xl border border-border-light p-4 w-full max-w-[300px] mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center">{platformLogo}</div>
                <div className="text-start">
                  <p className="text-[14px] font-bold text-foreground">@maleks_kitchen</p>
                  <p className="text-[12px] text-muted-foreground">12.4K followers</p>
                  <p className="text-[11px] text-muted-foreground">Last post: 2 days ago</p>
                </div>
              </div>
            </div>
            
            <button onClick={onComplete} className="w-full max-w-[300px] h-[52px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press">
              Continue
            </button>
          </motion.div>
        )}

        {step === 'error' && (
          <motion.div key="error" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center mb-4"
            >
              <X size={32} className="text-primary-foreground" strokeWidth={3} />
            </motion.div>
            
            <h2 className="text-[20px] font-bold text-destructive mb-2">Connection Failed</h2>
            <p className="text-[14px] text-muted-foreground max-w-[300px] mb-6">
              We couldn't connect your {platformName}. This usually happens if the authorization was cancelled.
            </p>
            
            <button onClick={() => setStep('connecting')} className="w-full max-w-[300px] h-[52px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mb-3">
              Try Again
            </button>
            <button onClick={onCancel} className="text-muted-foreground text-[13px] font-medium">Skip for Now</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Disconnect confirmation dialog
interface DisconnectDialogProps {
  platformName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DisconnectDialog = ({ platformName, onConfirm, onCancel }: DisconnectDialogProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] bg-foreground/40 flex items-center justify-center px-6"
    onClick={onCancel}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      onClick={e => e.stopPropagation()}
      className="bg-card rounded-3xl p-6 w-full max-w-[380px] text-center"
    >
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
        <X size={24} className="text-destructive" />
      </div>
      <h3 className="text-[18px] font-bold text-foreground mb-2">Disconnect {platformName}?</h3>
      <p className="text-[13px] text-muted-foreground mb-6">
        Are you sure you want to disconnect {platformName}? You won't be able to post or track analytics for this platform.
      </p>
      <button onClick={onConfirm} className="w-full h-[48px] rounded-2xl bg-destructive text-primary-foreground font-bold text-[14px] mb-2">
        Disconnect
      </button>
      <button onClick={onCancel} className="w-full h-[48px] rounded-2xl text-foreground font-medium text-[14px]">
        Cancel
      </button>
    </motion.div>
  </motion.div>
);

// Platform manage menu (3 dots)
interface PlatformManageMenuProps {
  platformName: string;
  onDisconnect: () => void;
  onClose: () => void;
}

export const PlatformManageMenu = ({ platformName, onDisconnect, onClose }: PlatformManageMenuProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[99] bg-foreground/20 flex items-end justify-center"
    onClick={onClose}
  >
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      onClick={e => e.stopPropagation()}
      className="bg-card rounded-t-3xl w-full max-w-[430px] p-5 pb-8"
    >
      <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />
      <h3 className="text-[16px] font-bold text-foreground mb-3">{platformName}</h3>
      <button className="w-full text-start px-4 py-3.5 rounded-xl text-[14px] text-foreground hover:bg-muted transition-colors">
        View Account
      </button>
      <button onClick={onDisconnect} className="w-full text-start px-4 py-3.5 rounded-xl text-[14px] text-destructive hover:bg-destructive/5 transition-colors">
        Disconnect
      </button>
    </motion.div>
  </motion.div>
);
