'use client';

import React, { useState } from 'react';
import { Calendar, Send, Sparkles, Image as ImageIcon, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CreateStudioPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'calendar' | 'quick' | 'strategy' | 'media'>('calendar');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  return (
    <div className="w-full min-h-screen bg-background p-6 text-right dir-rtl font-sans" dir="rtl">
      {/* En-tête de la page */}
      <div className="mb-8 text-right">
        <h1 className="text-3xl font-bold text-foreground">استوديو المحتوى</h1>
        <p className="text-muted-foreground text-sm mt-1">
          أنشئ محتوى مدعوم بالذكاء الاصطناعي لأي منصة بسرعة وفعالية
        </p>
      </div>

      {/* Barre de navigation / Tabs */}
      <div className="flex items-center justify-between bg-card border border-border rounded-2xl p-1.5 mb-6 shadow-sm">
        <div className="flex items-center gap-2 w-full">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'calendar'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>التقويم</span>
          </button>

          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'quick'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>منشور سريع</span>
          </button>

          <button
            onClick={() => setActiveTab('strategy')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'strategy'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>الاستراتيجية</span>
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'media'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>الوسائط</span>
          </button>
        </div>
      </div>

      {/* Contenu principal / Vue التقويم */}
      {activeTab === 'calendar' && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          {/* Controls de vue et dates */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-foreground">17 — 23 مارس 2026</span>
            </div>

            <div className="flex items-center bg-muted rounded-xl p-1 gap-1">
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                أسبوع
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                شهر
              </button>
            </div>
          </div>

          {/* Grille des jours de la semaine */}
          <div className="grid grid-cols-7 gap-2">
            {[
              { day: 'الإثنين', date: '17', active: true },
              { day: 'الثلاثاء', date: '18', active: false },
              { day: 'الأربعاء', date: '19', active: false },
              { day: 'الخميس', date: '20', active: false },
              { day: 'الجمعة', date: '21', active: false },
              { day: 'السبت', date: '22', active: false },
              { day: 'الأحد', date: '23', active: false },
            ].map((item, index) => (
              <div
                key={index}
                className={`p-3 rounded-xl border text-center transition-all ${
                  item.active
                    ? 'bg-primary text-primary-foreground border-primary font-bold shadow-sm'
                    : 'bg-background border-border text-foreground hover:border-primary/50'
                }`}
              >
                <div className="text-xs opacity-80">{item.day}</div>
                <div className="text-lg mt-1">{item.date}</div>
              </div>
            ))}
          </div>

          {/* Section الجدول اليومي */}
          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-lg font-bold text-foreground mb-4">جدول اليوم</h3>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
              <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                <Clock className="w-4 h-4" />
                <span>3:00 مساءً — الوقت المثالي لنشر قصة سناب شات</span>
              </div>
              <p className="text-xs text-muted-foreground">
                تفاعل المتابعين يصل لأعلى ذروة في هذا الوقت بناءً على تحليلات الذكاء الاصطناعي.
              </p>
              <button className="text-xs font-semibold text-primary hover:underline">
                + إنشاء محتوى الان
              </button>
            </div>
          </div>

          {/* Bouton d'action principal */}
          <button className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all text-center">
            + جدولة منشور جديد
          </button>
        </div>
      )}
    </div>
  );
}