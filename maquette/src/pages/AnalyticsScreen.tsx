import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, Check, FileText, X, Download, MessageCircle, Mail, Link2, Copy } from 'lucide-react';
import { InstagramLogo, TikTokLogo, SnapchatLogo, FacebookLogo, XLogo, YouTubeLogo, LinkedInLogo, GoogleLogo, PinterestLogo, ThreadsLogo } from '../components/PlatformLogos';
import { ComingSoonModal } from '../components/ComingSoon';
import { useFreeTier, BlurredLock } from '../components/FreeTier';
import { jsPDF } from 'jspdf';
import speedaLogoWhite from '../assets/speeda-logo-white.png';
import speedaLogoColor from '../assets/speeda-logo-color.png';
import speedaLogoIconBlue from '../assets/speeda-logo-icon-blue.png';

const periodData: Record<string, { kpis: any[]; bars: any[] }> = {
  '7D': {
    kpis: [
      { icon: '👁️', value: '28.3K', label: 'Total Reach', change: '+12%' },
      { icon: '💜', value: '5.1%', label: 'Engagement', change: '+8%' },
      { icon: '🛒', value: '187', label: 'Conversions', change: '+15%' },
      { icon: '💰', value: 'SAR 850', label: 'Ad Spend', change: '+5%' },
    ],
    bars: [
      { day: 'Mon', val: 55 }, { day: 'Tue', val: 68 }, { day: 'Wed', val: 42 },
      { day: 'Thu', val: 79 }, { day: 'Fri', val: 88 }, { day: 'Sat', val: 62 }, { day: 'Sun', val: 74 },
    ],
  },
  '30D': {
    kpis: [
      { icon: '👁️', value: '124.4K', label: 'Total Reach', change: '+18%' },
      { icon: '💜', value: '4.8%', label: 'Engagement', change: '+12%' },
      { icon: '🛒', value: '1,234', label: 'Conversions', change: '+23%' },
      { icon: '💰', value: 'SAR 4,300', label: 'Ad Spend', change: '+15%' },
    ],
    bars: [
      { day: 'Mon', val: 65 }, { day: 'Tue', val: 78 }, { day: 'Wed', val: 52 },
      { day: 'Thu', val: 89 }, { day: 'Fri', val: 95 }, { day: 'Sat', val: 72 }, { day: 'Sun', val: 84 },
    ],
  },
  '90D': {
    kpis: [
      { icon: '👁️', value: '342.7K', label: 'Total Reach', change: '+22%' },
      { icon: '💜', value: '4.5%', label: 'Engagement', change: '+9%' },
      { icon: '🛒', value: '3,891', label: 'Conversions', change: '+28%' },
      { icon: '💰', value: 'SAR 12,800', label: 'Ad Spend', change: '+18%' },
    ],
    bars: [
      { day: 'Mon', val: 70 }, { day: 'Tue', val: 82 }, { day: 'Wed', val: 60 },
      { day: 'Thu', val: 92 }, { day: 'Fri', val: 98 }, { day: 'Sat', val: 78 }, { day: 'Sun', val: 88 },
    ],
  },
  '1Y': {
    kpis: [
      { icon: '👁️', value: '1.2M', label: 'Total Reach', change: '+35%' },
      { icon: '💜', value: '4.2%', label: 'Engagement', change: '+15%' },
      { icon: '🛒', value: '14,230', label: 'Conversions', change: '+42%' },
      { icon: '💰', value: 'SAR 48,500', label: 'Ad Spend', change: '+31%' },
    ],
    bars: [
      { day: 'Mon', val: 75 }, { day: 'Tue', val: 85 }, { day: 'Wed', val: 65 },
      { day: 'Thu', val: 95 }, { day: 'Fri', val: 100 }, { day: 'Sat', val: 82 }, { day: 'Sun', val: 90 },
    ],
  },
};

const platforms = [
  { Logo: InstagramLogo, name: 'Instagram', followers: '12.4K', eng: '5.2%', posts: 24, growth: '+340' },
  { Logo: TikTokLogo, name: 'TikTok', followers: '8.2K', eng: '7.8%', posts: 18, growth: '+520' },
  { Logo: SnapchatLogo, name: 'Snapchat', followers: '3.1K', eng: '3.4%', posts: 12, growth: '+120' },
  { Logo: FacebookLogo, name: 'Facebook', followers: '5.6K', eng: '2.1%', posts: 16, growth: '+85' },
  { Logo: XLogo, name: 'X', followers: '2.8K', eng: '1.9%', posts: 30, growth: '+64' },
  { Logo: YouTubeLogo, name: 'YouTube', followers: '1.5K', eng: '4.3%', posts: 8, growth: '+95' },
  { Logo: LinkedInLogo, name: 'LinkedIn', followers: '980', eng: '3.7%', posts: 10, growth: '+42' },
  { Logo: GoogleLogo, name: 'Google Biz', followers: '245 reviews', eng: '4.1%', posts: 6, growth: '+18' },
  { Logo: PinterestLogo, name: 'Pinterest', followers: '320', eng: '2.8%', posts: 4, growth: '+15' },
  { Logo: ThreadsLogo, name: 'Threads', followers: '560', eng: '3.2%', posts: 5, growth: '+28' },
];

const topContent = [
  { rank: 1, color: 'bg-brand-blue', title: 'Chicken Shawarma Reel', Logo: InstagramLogo, type: 'Reel', reach: '12.4K', eng: '8.2%', likes: '1,234' },
  { rank: 2, color: 'bg-brand-teal', title: 'Kitchen Behind Scenes', Logo: TikTokLogo, type: 'Video', reach: '9.8K', eng: '6.5%', likes: '876' },
  { rank: 3, color: 'bg-green-accent', title: 'Weekend Special Offer', Logo: InstagramLogo, type: 'Post', reach: '7.2K', eng: '4.1%', likes: '543' },
  { rank: 4, color: 'bg-orange-accent', title: 'Customer Review Story', Logo: SnapchatLogo, type: 'Story', reach: '4.5K', eng: '3.8%', likes: '321' },
];

interface AnalyticsScreenProps {
  onNavigate?: (screen: string) => void;
}

export const AnalyticsScreen = ({ onNavigate }: AnalyticsScreenProps) => {
  const [period, setPeriod] = useState('30D');
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);
  const [exportStep, setExportStep] = useState<'idle' | 'loading' | 'done'>('idle');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const data = periodData[period];

  const handleExportPDF = () => {
    setExportStep('loading');
    setTimeout(() => {
      setExportStep('done');
    }, 2000);
  };

  const downloadPDF = async () => {
    // Pre-load logo images as base64
    const loadImg = (src: string): Promise<string> =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          c.getContext('2d')!.drawImage(img, 0, 0);
          resolve(c.toDataURL('image/png'));
        };
        img.onerror = () => resolve('');
        img.src = src;
      });

    const [logoWhiteData, logoColorData, logoIconData] = await Promise.all([
      loadImg(speedaLogoWhite),
      loadImg(speedaLogoColor),
      loadImg(speedaLogoIconBlue),
    ]);

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pw = 210;
    const ph = 297;
    const mx = 20;
    const cw = pw - mx * 2;
    const blue: [number, number, number] = [0, 32, 212];
    const teal: [number, number, number] = [0, 199, 243];
    const dark: [number, number, number] = [26, 26, 46];
    const gray: [number, number, number] = [107, 114, 128];
    const lavender: [number, number, number] = [248, 246, 253];
    const totalPages = 7;

    const addLavenderBg = () => {
      doc.setFillColor(lavender[0], lavender[1], lavender[2]);
      doc.rect(0, 0, pw, ph, 'F');
    };

    const addFooter = (pageNum: number) => {
      doc.setDrawColor(220, 220, 230);
      doc.line(mx, ph - 15, pw - mx, ph - 15);
      doc.setFontSize(8);
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.setFont('helvetica', 'normal');
      doc.text('Speeda AI  —  speeda.ai  —  hello@speeda.ai', pw / 2, ph - 10, { align: 'center' });
      doc.text(`Page ${pageNum} of ${totalPages}`, pw - mx, ph - 10, { align: 'right' });
    };

    const addHeader = () => {
      const steps = 80;
      const lineW = cw / steps;
      for (let i = 0; i < steps; i++) {
        const r = Math.round(blue[0] + (teal[0] - blue[0]) * (i / steps));
        const g = Math.round(blue[1] + (teal[1] - blue[1]) * (i / steps));
        const b = Math.round(blue[2] + (teal[2] - blue[2]) * (i / steps));
        doc.setFillColor(r, g, b);
        doc.rect(mx + i * lineW, 0, lineW + 0.5, 3, 'F');
      }
      if (logoIconData) {
        try { doc.addImage(logoIconData, 'PNG', pw - mx - 8, 6, 8, 9); } catch {}
      }
    };

    // ===== PAGE 1 — Cover =====
    const coverSteps = 120;
    const stripH = ph / coverSteps;
    for (let i = 0; i < coverSteps; i++) {
      const r = Math.round(blue[0] + (teal[0] - blue[0]) * (i / coverSteps));
      const g = Math.round(blue[1] + (teal[1] - blue[1]) * (i / coverSteps));
      const b = Math.round(blue[2] + (teal[2] - blue[2]) * (i / coverSteps));
      doc.setFillColor(r, g, b);
      doc.rect(0, i * stripH, pw, stripH + 0.5, 'F');
    }
    // White logo on cover
    if (logoWhiteData) {
      try { doc.addImage(logoWhiteData, 'PNG', pw / 2 - 30, ph / 2 - 55, 60, 12); } catch {}
    }
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Marketing Performance Report', pw / 2, ph / 2 + 8, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('March 1 — March 25, 2026', pw / 2, ph / 2 + 22, { align: 'center' });
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("Malek's Kitchen", pw / 2, ph / 2 + 38, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by Speeda AI — Your AI Head of Marketing', pw / 2, ph - 30, { align: 'center' });
    doc.setFontSize(9);
    doc.text('speeda.ai  |  hello@speeda.ai', pw / 2, ph - 22, { align: 'center' });

    // ===== PAGE 2 — Executive Summary =====
    doc.addPage();
    addLavenderBg();
    addHeader();
    doc.setTextColor(blue[0], blue[1], blue[2]);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', mx, 22);

    const kpiBoxW = (cw - 6) / 2;
    const kpiBoxH = 32;
    const kpiStartY = 32;
    data.kpis.forEach((kpi: any, i: number) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = mx + col * (kpiBoxW + 6);
      const by = kpiStartY + row * (kpiBoxH + 6);
      doc.setDrawColor(232, 234, 240);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(bx, by, kpiBoxW, kpiBoxH, 3, 3, 'FD');
      doc.setFontSize(10);
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(kpi.label, bx + 8, by + 12);
      doc.setFontSize(18);
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(kpi.value, bx + 8, by + 24);
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129);
      doc.text(`↑ ${kpi.change}`, bx + kpiBoxW - 8, by + 24, { align: 'right' });
    });

    const aiSumY = kpiStartY + 2 * (kpiBoxH + 6) + 12;
    doc.setFontSize(14);
    doc.setTextColor(blue[0], blue[1], blue[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Summary', mx, aiSumY);
    doc.setFontSize(10);
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.setFont('helvetica', 'normal');
    const summaryLines = [
      `Your reach increased by ${data.kpis[0].change} this period driven by strong Reel performance.`,
      `Engagement is above industry average at ${data.kpis[1].value}. Your top-performing content`,
      'type is short-form video, particularly food photography Reels posted between 7-9 PM.',
      'TikTok growth continues to outpace other platforms at 3x the industry benchmark.',
    ];
    summaryLines.forEach((line, i) => doc.text(line, mx, aiSumY + 10 + i * 6));
    addFooter(2);

    // ===== PAGE 3 — Platform Breakdown =====
    doc.addPage();
    addLavenderBg();
    addHeader();
    doc.setFontSize(20);
    doc.setTextColor(blue[0], blue[1], blue[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Platform Performance', mx, 22);

    const platColors: Record<string, [number, number, number]> = {
      Instagram: [225, 48, 108], TikTok: [0, 0, 0], Snapchat: [255, 252, 0],
      Facebook: [24, 119, 242], X: [0, 0, 0], YouTube: [255, 0, 0],
      LinkedIn: [0, 119, 181], 'Google Biz': [66, 133, 244], Pinterest: [230, 0, 35], Threads: [0, 0, 0],
    };
    const colX = [mx, mx + 28, mx + 58, mx + 88, mx + 108, mx + 128];
    const headers = ['Platform', 'Followers', 'Eng. Rate', 'Posts', 'Growth'];
    let ty = 34;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(232, 234, 240);
    doc.roundedRect(mx, ty - 6, cw, 8 + platforms.length * 8 + 4, 3, 3, 'FD');
    doc.setFillColor(245, 246, 250);
    doc.rect(mx + 0.5, ty - 4, cw - 1, 8, 'F');
    doc.setFontSize(8);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.setFont('helvetica', 'bold');
    headers.forEach((h, i) => doc.text(h, colX[i], ty));
    ty += 10;
    doc.setFont('helvetica', 'normal');
    platforms.forEach((p) => {
      const pc: [number, number, number] = platColors[p.name] || dark;
      doc.setFillColor(pc[0], pc[1], pc[2]);
      doc.circle(mx + 2, ty - 1.5, 2, 'F');
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.setFontSize(9);
      doc.text(p.name, colX[0] + 6, ty);
      doc.text(String(p.followers), colX[1], ty);
      doc.text(p.eng, colX[2], ty);
      doc.text(String(p.posts), colX[3], ty);
      doc.setTextColor(16, 185, 129);
      doc.text(p.growth, colX[4], ty);
      doc.setTextColor(dark[0], dark[1], dark[2]);
      ty += 8;
    });

    ty += 8;
    doc.setFontSize(12);
    doc.setTextColor(blue[0], blue[1], blue[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Engagement Rate by Platform', mx, ty);
    ty += 8;
    platforms.slice(0, 6).forEach((p) => {
      const engVal = parseFloat(p.eng);
      const barW = (engVal / 10) * cw * 0.7;
      doc.setFontSize(8);
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(p.name, mx, ty + 3);
      const barX = mx + 30;
      const barSteps = 30;
      const bw = barW / barSteps;
      for (let s = 0; s < barSteps; s++) {
        const r = Math.round(blue[0] + (teal[0] - blue[0]) * (s / barSteps));
        const g = Math.round(blue[1] + (teal[1] - blue[1]) * (s / barSteps));
        const b = Math.round(blue[2] + (teal[2] - blue[2]) * (s / barSteps));
        doc.setFillColor(r, g, b);
        doc.rect(barX + s * bw, ty - 1, bw + 0.3, 5, 'F');
      }
      doc.text(p.eng, barX + barW + 4, ty + 3);
      ty += 9;
    });
    addFooter(3);

    // ===== PAGE 4 — Top Posts =====
    doc.addPage();
    addLavenderBg();
    addHeader();
    doc.setFontSize(20);
    doc.setTextColor(blue[0], blue[1], blue[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Top 5 Posts This Period', mx, 22);

    let py = 34;
    const topPosts = [
      ...topContent,
      { rank: 5, title: 'Happy Hour Deal Post', type: 'Story', reach: '3.1K', eng: '3.2%', likes: '210' },
    ];
    topPosts.forEach((c: any, i: number) => {
      if (i === 0) {
        const barSteps = 20;
        for (let s = 0; s < barSteps; s++) {
          const r = Math.round(blue[0] + (teal[0] - blue[0]) * (s / barSteps));
          const g = Math.round(blue[1] + (teal[1] - blue[1]) * (s / barSteps));
          const b = Math.round(blue[2] + (teal[2] - blue[2]) * (s / barSteps));
          doc.setFillColor(r, g, b);
          doc.rect(mx, py - 4, 3, 28, 'F');
        }
      }
      doc.setDrawColor(232, 234, 240);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(mx + 4, py - 4, cw - 4, 28, 2, 2, 'FD');
      doc.setFontSize(16);
      doc.setTextColor(blue[0], blue[1], blue[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`#${c.rank}`, mx + 10, py + 10);
      doc.setFontSize(11);
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.text(c.title, mx + 26, py + 6);
      doc.setFontSize(8);
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(`${c.type}  •  Reach: ${c.reach}  •  Engagement: ${c.eng}  •  Likes: ${c.likes}`, mx + 26, py + 14);
      doc.text('Published Mar 2026', mx + 26, py + 20);
      py += 34;
    });
    addFooter(4);

    // ===== PAGE 5 — Engagement & Reviews =====
    doc.addPage();
    addLavenderBg();
    addHeader();
    doc.setFontSize(20);
    doc.setTextColor(blue[0], blue[1], blue[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Engagement', mx, 22);

    const engMetrics = [
      { label: 'Total Comments', value: '847' },
      { label: 'Total DMs', value: '312' },
      { label: 'Reviews Received', value: '45' },
      { label: 'Avg Response Time', value: '18 min' },
    ];
    const emBoxW = (cw - 12) / 4;
    engMetrics.forEach((m, i) => {
      const ex = mx + i * (emBoxW + 4);
      doc.setDrawColor(232, 234, 240);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(ex, 32, emBoxW, 24, 2, 2, 'FD');
      doc.setFontSize(8);
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(m.label, ex + 4, 40);
      doc.setFontSize(14);
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(m.value, ex + 4, 50);
    });

    let ry = 68;
    doc.setFontSize(14);
    doc.setTextColor(blue[0], blue[1], blue[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Review Summary', mx, ry);
    ry += 10;
    doc.setFontSize(10);
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('Average Rating: 4.6 / 5.0  ★★★★★', mx, ry);
    ry += 7;
    doc.text('Total Reviews: 45  |  Positive: 38 (84%)  |  Neutral: 5 (11%)  |  Negative: 2 (5%)', mx, ry);
    ry += 14;
    doc.setFontSize(11);
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.text('Action Required — Unresponded Negative Reviews', mx, ry);
    ry += 8;
    doc.setFontSize(9);
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('• Mar 20 — "Food was cold and service was slow" (Google) — Needs response', mx, ry);
    ry += 6;
    doc.text('• Mar 14 — "Waited 40 minutes for delivery" (Instagram) — Needs response', mx, ry);
    addFooter(5);

    // ===== PAGE 6 — MOS Score =====
    doc.addPage();
    addLavenderBg();
    addHeader();
    doc.setFontSize(20);
    doc.setTextColor(blue[0], blue[1], blue[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Marketing Health Score', mx, 22);

    doc.setFontSize(48);
    doc.setTextColor(blue[0], blue[1], blue[2]);
    doc.text('72', pw / 2 - 5, 55, { align: 'center' });
    doc.setFontSize(16);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text('/ 100', pw / 2 + 14, 55, { align: 'center' });
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(pw / 2 - 14, 60, 28, 8, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Strong', pw / 2, 66, { align: 'center' });

    const factors = [
      { label: 'Posting Consistency', score: 80 },
      { label: 'Engagement Rate', score: 85 },
      { label: 'Response Time', score: 60 },
      { label: 'Platform Coverage', score: 70 },
      { label: 'Campaign Performance', score: 65 },
    ];
    let fy = 80;
    factors.forEach((f) => {
      doc.setFontSize(9);
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(f.label, mx, fy);
      doc.text(`${f.score}%`, pw - mx, fy, { align: 'right' });
      doc.setFillColor(235, 237, 242);
      doc.roundedRect(mx, fy + 2, cw, 4, 1, 1, 'F');
      const barW = (f.score / 100) * cw;
      const barSteps = 20;
      const bw = barW / barSteps;
      for (let s = 0; s < barSteps; s++) {
        const r = Math.round(blue[0] + (teal[0] - blue[0]) * (s / barSteps));
        const g = Math.round(blue[1] + (teal[1] - blue[1]) * (s / barSteps));
        const b = Math.round(blue[2] + (teal[2] - blue[2]) * (s / barSteps));
        doc.setFillColor(r, g, b);
        doc.rect(mx + s * bw, fy + 2, bw + 0.3, 4, 'F');
      }
      fy += 14;
    });

    fy += 8;
    doc.setFontSize(14);
    doc.setTextColor(blue[0], blue[1], blue[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Recommendations', mx, fy);
    fy += 10;
    const recs = [
      'Post Reels between 7-9 PM for 40% more reach — your audience peaks during dinner hours.',
      'Respond to DMs within 15 minutes — your current avg is 18 min, reducing it boosts your MOS score.',
      'Expand to Pinterest — food content performs 3x better there than industry average.',
      'Run a Ramadan content campaign (starts in 3 weeks) — plan 14 posts in advance.',
      'Boost your top-performing Reel with SAR 50 — projected to reach 25K additional users.',
    ];
    doc.setFontSize(9);
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.setFont('helvetica', 'normal');
    recs.forEach((r) => {
      doc.text(`•  ${r}`, mx, fy, { maxWidth: cw });
      fy += 10;
    });
    addFooter(6);

    // ===== PAGE 7 — Signature =====
    doc.addPage();
    addLavenderBg();
    const cy = ph / 2 - 40;
    // Colored logo on signature page
    if (logoColorData) {
      try { doc.addImage(logoColorData, 'PNG', pw / 2 - 25, cy - 18, 50, 10); } catch {}
    }

    doc.setFontSize(13);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('This report was generated by Speeda AI', pw / 2, cy + 22, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(blue[0], blue[1], blue[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Your AI Head of Marketing', pw / 2, cy + 32, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('For questions or support:', pw / 2, cy + 52, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(blue[0], blue[1], blue[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('hello@speeda.ai', pw / 2, cy + 62, { align: 'center' });
    doc.text('speeda.ai', pw / 2, cy + 74, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('© 2026 Speeda AI Ltd. All rights reserved.', pw / 2, ph - 30, { align: 'center' });
    doc.text('Dubai (DIFC)  ·  Riyadh  ·  Tunis', pw / 2, ph - 23, { align: 'center' });

    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    setPdfBlobUrl(url);
    return pdfBlob;
  };

  const handleDownload = async () => {
    const blob = await downloadPDF();
    if (blob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'Speeda-Report-Maleks-Kitchen-March-2026.pdf';
      a.click();
      URL.revokeObjectURL(a.href);
    }
    setExportStep('idle');
  };

  const handleShare = async () => {
    let blob: Blob | undefined;
    try { blob = await downloadPDF(); } catch {}
    const fileName = 'Speeda-Report-Maleks-Kitchen-March-2026.pdf';

    if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'application/pdf' })] })) {
      try {
        await navigator.share({
          title: 'Speeda AI Analytics Report',
          text: 'Marketing Performance Report — March 2026',
          files: [new File([blob], fileName, { type: 'application/pdf' })],
        });
        setExportStep('idle');
        return;
      } catch {}
    }
    // Fallback: show share modal
    setShareModalOpen(true);
  };

  const handleShareOption = (option: string) => {
    const fileName = 'Speeda-Report-Maleks-Kitchen-March-2026.pdf';
    if (option === 'download' && pdfBlobUrl) {
      const a = document.createElement('a');
      a.href = pdfBlobUrl;
      a.download = fileName;
      a.click();
    } else if (option === 'copy') {
      navigator.clipboard.writeText('https://speeda.ai/reports/march-2026');
      // Could add toast here
    } else if (option === 'whatsapp') {
      window.open('https://wa.me/?text=' + encodeURIComponent('Check out my Speeda AI Marketing Report: https://speeda.ai/reports/march-2026'), '_blank');
    } else if (option === 'email') {
      window.open('mailto:?subject=' + encodeURIComponent('Speeda AI Marketing Report — March 2026') + '&body=' + encodeURIComponent('Hi,\n\nHere is my marketing performance report generated by Speeda AI.\n\nView: https://speeda.ai/reports/march-2026'), '_blank');
    }
    setShareModalOpen(false);
    setExportStep('idle');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">Analytics</h1>
            <p className="text-[14px] text-muted-foreground">Performance overview</p>
          </div>
          <button onClick={handleExportPDF} className="h-[42px] px-4 rounded-xl bg-card border border-border text-brand-blue text-[13px] font-bold flex items-center gap-1">
            <Share size={14} /> Export
          </button>
        </div>

        {/* Period */}
        <div className="mt-4 bg-card rounded-2xl p-1 border border-border flex">
          {['7D', '30D', '90D', '1Y'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`flex-1 h-9 rounded-xl text-[13px] font-semibold transition-all ${period === p ? 'bg-brand-blue text-primary-foreground' : 'text-muted-foreground'}`}>{p}</button>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {data.kpis.map((kpi: any, i: number) => (
            <motion.div key={`${period}-${i}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} className="bg-card rounded-2xl p-4 border border-border-light">
              <div className="flex items-center justify-between">
                <span className="text-lg">{kpi.icon}</span>
                <span className="text-[11px] font-bold text-green-accent bg-green-soft px-2 py-0.5 rounded-md">↑ {kpi.change}</span>
              </div>
              <p className="text-[22px] font-extrabold text-foreground mt-2 tracking-[-0.02em]">{kpi.value}</p>
              <span className="text-[11px] text-muted-foreground">{kpi.label}</span>
              <div className="flex items-end gap-0.5 mt-2 h-[36px]">
                {[40, 65, 50, 80, 90, 70, 85].map((h, j) => (
                  <motion.div key={j} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.3 + j * 0.06, duration: 0.5 }} className="flex-1 rounded-sm gradient-btn opacity-70" />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Weekly Chart */}
        <div className="mt-5">
          <h2 className="text-[18px] font-bold text-foreground">Weekly Engagement</h2>
          <div className="bg-card rounded-2xl p-5 border border-border-light mt-3">
            <div className="flex items-end gap-2" style={{ height: 160 }}>
              {data.bars.map((bar: any, i: number) => (
                <div key={`${period}-${i}`} className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-[11px] font-bold text-foreground mb-1">{bar.val}%</span>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${bar.val * 1.4}px` }} transition={{ delay: 0.2 + i * 0.06, duration: 0.6 }} className="w-full rounded-t-lg gradient-hero" />
                  <span className="text-[11px] text-muted-foreground mt-1">{bar.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="mt-5">
          <h2 className="text-[18px] font-bold text-foreground">Platform Breakdown</h2>
          <div className="bg-card rounded-2xl border border-border-light mt-3 overflow-hidden">
            {platforms.map((p, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-border-light' : ''}`}>
                <p.Logo size={18} />
                <span className="text-[13px] font-semibold text-foreground w-20">{p.name}</span>
                <span className="text-[11px] text-muted-foreground flex-1">{p.followers}</span>
                <span className="text-[11px] font-semibold text-foreground w-10">{p.eng}</span>
                <span className="text-[11px] text-green-accent font-semibold w-10">{p.growth}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Content */}
        <div className="mt-5">
          <h2 className="text-[18px] font-bold text-foreground">Top Performing Content</h2>
          <div className="mt-3 space-y-2">
            {topContent.map((c, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border-light flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${c.color} flex items-center justify-center text-primary-foreground text-[12px] font-bold`}>#{c.rank}</div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-foreground">{c.title}</p>
                  <div className="flex items-center gap-2 mt-0.5"><c.Logo size={12} /><span className="text-[11px] text-muted-foreground">{c.type} · {c.reach} reach · {c.eng}</span></div>
                </div>
                <span className="text-[12px] text-muted-foreground">❤️ {c.likes}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        {(() => {
          const { isFree } = useFreeTier();
          const insightsContent = (
            <div className="mt-3 space-y-2">
              {[
                { border: 'border-l-purple', icon: '⏰', text: 'Post Reels between 7-9 PM for 40% more reach', cta: 'Schedule Now →', nav: 'create' },
                { border: 'border-l-green-accent', icon: '📈', text: 'Your TikTok is 3x above industry avg', cta: 'Create TikTok Reel →', nav: 'create' },
                { border: 'border-l-orange-accent', icon: '📸', text: 'Food photography posts get 2.5x more saves', cta: 'Use Photo Template →', nav: 'create' },
                { border: 'border-l-brand-teal', icon: '🌙', text: 'Ramadan in 3 weeks — plan content now', cta: 'Generate Ramadan Plan →', nav: 'create' },
              ].map((ins, i) => (
                <div key={i} className={`bg-card rounded-2xl p-4 border border-border-light border-l-4 ${ins.border}`}>
                  <p className="text-[13px] text-foreground">{ins.icon} {ins.text}</p>
                  <button onClick={() => onNavigate?.(ins.nav)} className="text-brand-blue text-[12px] font-bold mt-1">{ins.cta}</button>
                </div>
              ))}
            </div>
          );
          return (
            <div className="mt-5">
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-bold text-foreground">AI Insights</h2>
                <span className="text-[10px] font-bold text-primary-foreground gradient-btn px-2 py-0.5 rounded-md">✦ Powered by AI</span>
              </div>
              {isFree ? (
                <BlurredLock label="AI Insights" onUpgrade={() => onNavigate?.('subscription')}>{insightsContent}</BlurredLock>
              ) : insightsContent}
            </div>
          );
        })()}

        {/* Competitor Benchmark */}
        <div className="mt-5">
          <h2 className="text-[18px] font-bold text-foreground">Competitor Benchmark</h2>
          <div className="bg-card rounded-2xl p-4 border border-border-light mt-3 space-y-3">
            {[
              { label: 'Your Engagement', val: '8.4%', w: '84%', color: 'gradient-hero' },
              { label: 'Industry Avg', val: '7.1%', w: '71%', color: 'bg-muted' },
              { label: 'Top Competitor', val: '6.4%', w: '64%', color: 'bg-red-soft' },
            ].map((b, i) => (
              <div key={i}>
                <div className="flex justify-between text-[12px]"><span className="text-foreground font-medium">{b.label}</span><span className="font-bold text-foreground">{b.val}</span></div>
                <div className="h-2 rounded-full bg-muted mt-1 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: b.w }} transition={{ duration: 0.8, delay: i * 0.1 }} className={`h-full rounded-full ${b.color}`} />
                </div>
              </div>
            ))}
            <div className="bg-green-soft rounded-xl p-3 mt-2">
              <p className="text-[12px] font-semibold text-green-accent">🏆 You're outperforming 78% of restaurants in your area</p>
            </div>
          </div>
        </div>

        {/* Post History & Link Tracking */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button onClick={() => onNavigate?.('postHistory')} className="bg-card rounded-2xl p-4 border border-border-light text-left">
            <span className="text-lg">📋</span>
            <h3 className="text-[15px] font-bold text-foreground mt-2">Post History</h3>
            <p className="text-[12px] text-muted-foreground mt-1">View all published, scheduled & failed posts with retry</p>
          </button>
          <button onClick={() => onNavigate?.('linkTracking')} className="bg-card rounded-2xl p-4 border border-border-light text-left">
            <span className="text-lg">🔗</span>
            <h3 className="text-[15px] font-bold text-foreground mt-2">Link Tracking</h3>
            <p className="text-[12px] text-muted-foreground mt-1">Track clicks on shortened URLs across posts</p>
          </button>
        </div>

        {/* Weekly Report */}
        <div className="mt-5 bg-card rounded-2xl p-4 border border-border-light shadow-card">
          <h3 className="text-[16px] font-bold text-purple">✦ Weekly AI Report</h3>
          <p className="text-[13px] text-muted-foreground mt-1">Your automated performance report for this week is ready</p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => onNavigate?.('weeklyReport')} className="flex-1 h-10 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press">View Report</button>
          <button onClick={handleExportPDF} className="h-10 px-4 rounded-xl border border-border text-muted-foreground text-[13px] font-medium btn-press">Share PDF</button>
          </div>
        </div>
      </div>

      <ComingSoonModal feature={comingSoonFeature || ''} open={!!comingSoonFeature} onClose={() => setComingSoonFeature(null)} />

      {/* Export PDF Modal */}
      <AnimatePresence>
        {exportStep !== 'idle' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-card rounded-3xl max-w-[380px] w-full p-8 text-center shadow-xl relative">
              {exportStep === 'loading' && (
                <>
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-16 h-16 rounded-full gradient-hero mx-auto flex items-center justify-center">
                    <span className="text-primary-foreground text-[24px]">✦</span>
                  </motion.div>
                  <h2 className="text-[18px] font-bold text-foreground mt-4">Generating your report...</h2>
                  <p className="text-[13px] text-muted-foreground mt-2">Compiling analytics data</p>
                  <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 2 }} className="h-full rounded-full gradient-hero" />
                  </div>
                </>
              )}
              {exportStep === 'done' && (
                <>
                  <button onClick={() => setExportStep('idle')} className="absolute top-4 right-4"><X size={20} className="text-muted-foreground" /></button>
                  <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(157 100% 42%), hsl(157 80% 50%))' }}>
                    <Check size={32} className="text-primary-foreground" strokeWidth={3} />
                  </div>
                  <h2 className="text-[20px] font-bold text-foreground mt-4">Report Ready!</h2>
                  <div className="flex items-center gap-3 mt-4 bg-muted rounded-xl p-3 justify-center">
                    <FileText size={20} className="text-red-accent" />
                    <div className="text-left">
                      <p className="text-[13px] font-semibold text-foreground">Speeda-Analytics-Report-March-2026.pdf</p>
                      <p className="text-[11px] text-muted-foreground">~2.4 MB</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button onClick={handleDownload} className="flex-1 h-12 rounded-2xl gradient-btn text-primary-foreground font-bold text-[14px] shadow-btn btn-press flex items-center justify-center gap-2">
                      <Download size={16} /> Download PDF
                    </button>
                    <button onClick={handleShare} className="h-12 px-5 rounded-2xl border border-border text-foreground font-bold text-[14px] btn-press flex items-center gap-2">
                      <Share size={14} /> Share
                    </button>
                  </div>
                  <p className="text-[13px] text-muted-foreground mt-4">Saved to your reports</p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal (desktop fallback) */}
      <AnimatePresence>
        {shareModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="bg-card rounded-t-3xl sm:rounded-3xl max-w-[380px] w-full p-6 relative">
              <button onClick={() => { setShareModalOpen(false); }} className="absolute top-4 right-4"><X size={20} className="text-muted-foreground" /></button>
              <h3 className="text-[18px] font-bold text-foreground">Share Report</h3>
              <p className="text-[13px] text-muted-foreground mt-1">Choose how to share your report</p>
              <div className="grid grid-cols-2 gap-3 mt-5">
                {[
                  { id: 'whatsapp', icon: <MessageCircle size={20} />, label: 'WhatsApp', color: 'bg-[#25D366]' },
                  { id: 'email', icon: <Mail size={20} />, label: 'Email', color: 'bg-brand-blue' },
                  { id: 'download', icon: <Download size={20} />, label: 'Download', color: 'bg-brand-teal' },
                  { id: 'copy', icon: <Copy size={20} />, label: 'Copy Link', color: 'bg-muted-foreground' },
                ].map((opt) => (
                  <button key={opt.id} onClick={() => handleShareOption(opt.id)} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted hover:bg-muted/80 transition-colors btn-press">
                    <div className={`w-10 h-10 rounded-full ${opt.color} flex items-center justify-center text-white`}>{opt.icon}</div>
                    <span className="text-[12px] font-semibold text-foreground">{opt.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
