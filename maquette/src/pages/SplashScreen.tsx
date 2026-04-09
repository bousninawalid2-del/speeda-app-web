import { motion } from 'framer-motion';
import speedaLogoWhite from '@/assets/speeda-logo-white.png';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  return (
    <motion.div
      className="fixed inset-0 gradient-hero flex flex-col items-center justify-center z-[100]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 2500);
      }}
    >
      {/* Radial glow */}
      <div className="absolute w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
        className="relative z-10"
      >
        <img src={speedaLogoWhite} alt="Speeda AI" className="w-[120px] h-[120px] object-contain" />
      </motion.div>
      <p className="absolute bottom-8 text-[12px] text-primary-foreground/30">speeda.ai</p>
    </motion.div>
  );
};
