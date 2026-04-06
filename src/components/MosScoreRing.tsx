import { motion } from 'framer-motion';

interface MosScoreRingProps {
  score: number;
  size?: number;
}

export const MosScoreRing = ({ score, size = 64 }: MosScoreRingProps) => {
  const strokeWidth = 4;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColor = () => {
    if (score >= 81) return '#ffd700';
    if (score >= 61) return 'hsl(157,100%,42%)';
    if (score >= 31) return '#ff9f43';
    return '#ff4757';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative rounded-full mos-pulse-glow" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={center} cy={center} r={radius} fill="none" stroke="hsl(var(--border-light))" strokeWidth={strokeWidth} />
          <motion.circle
            cx={center} cy={center} r={radius} fill="none"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-lg font-extrabold"
            style={{ color: getColor() }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
        </div>
      </div>
      <span className="text-[9px] text-muted-foreground font-semibold mt-1.5">MOS Score</span>
    </div>
  );
};
