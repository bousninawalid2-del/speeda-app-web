'use client';

import React, { useState } from 'react';
import { Calendar, Zap, Target, Image as ImageIcon, Sparkles, Send, Video, Paperclip, Clock } from 'lucide-react';

export default function CreateStudioPage() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'quick' | 'strategy' | 'media'>('quick');
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['x', 'instagram']);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6 text-right font-sans" dir="rtl">
      {/* En-tête : Titre et sous-titre alignés à droite */}
      <div className="space-y-1 text-right">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">استوديو المحتوى</h1>
        <p className="text-sm text-muted-foreground">أنشئ محتوى مدعومًا بالذكاء الاصطناعي لأي منصة</p>
      </div>

      {/* Barre d'onglets (Tabs) adaptative Mobile & Desktop */}
      <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 min-w-[100px] py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'calendar' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>التقويم</span>
        </button>

        <button
          onClick={() => setActiveTab('quick')}
          className={`flex-1 min-w-[100px] py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'quick' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>منشور سريع</span>
        </button>

        <button
          onClick={() => setActiveTab('strategy')}
          className={`flex-1 min-w-[100px] py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'strategy' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>الاستراتيجية</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 min-w-[100px] py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'media' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>الوسائط</span>
        </button>
      </div>

      {/* Contenu de l'onglet المنشور السريع (Quick Post) */}
      {activeTab === 'quick' && (
        <div className="space-y-6">
          {/* Sélection des plateformes */}
          <div className="bg-card p-4 md:p-6 rounded-2xl border border-border shadow-sm space-y-3">
            <label className="text-sm font-bold text-foreground block text-right">
              اختر منصات التواصل الاجتماعي
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'x', name: 'منصة X (تويتر)' },
                { id: 'instagram', name: 'إنستغرام' },
                { id: 'snapchat', name: 'سناب شات' },
                { id: 'tiktok', name: 'تيك توك' },
                { id: 'linkedin', name: 'لينكد إن' },
              ].map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {platform.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rédaction du texte */}
          <div className="bg-card p-4 md:p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-foreground">نص المنشور</label>
              <button className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                <Sparkles className="w-4 h-4" />
                <span>تحسين النص بالذكاء الاصطناعي</span>
              </button>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب تفاصيل منشورك هنا أو دع الذكاء الاصطناعي يساعدك..."
              rows={5}
              className="w-full p-4 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-right"
              dir="rtl"
            />

            {/* Ajout de fichiers */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <button className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex items-center gap-2 text-xs font-medium">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span>صورة</span>
                </button>
                <button className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex items-center gap-2 text-xs font-medium">
                  <Video className="w-4 h-4 text-primary" />
                  <span>فيديو</span>
                </button>
                <button className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex items-center gap-2 text-xs font-medium">
                  <Paperclip className="w-4 h-4" />
                  <span>مرفق</span>
                </button>
              </div>

              <span className="text-xs text-muted-foreground">{content.length} / 280 حرف</span>
            </div>
          </div>

          {/* Boutons d'action (Nouveau / الجدولة) */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            <button className="w-full md:flex-1 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-all text-center shadow-md flex items-center justify-center gap-2">
              <Send className="w-5 h-5" />
              <span>نشر الآن</span>
            </button>

            <button className="w-full md:w-auto py-3.5 px-6 border border-border bg-card text-foreground rounded-2xl font-bold hover:bg-muted transition-all flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span>جدولة بوقت لاحق</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}