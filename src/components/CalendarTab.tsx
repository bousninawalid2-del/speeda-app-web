'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';

export default function CalendarTab() {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  return (
    <div className="w-full space-y-6 text-right dir-rtl font-sans" dir="rtl">
      {/* Contrôles de dates & filtres */}
      <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-muted rounded-xl transition-colors">
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
            <button className="p-2 hover:bg-muted rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          </div>
          <span className="text-lg font-bold text-foreground">17 — 23 مارس 2026</span>
        </div>

        <div className="flex items-center bg-muted p-1 rounded-xl gap-1">
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'week' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            أسبوع
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'month' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
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
            className={`p-3 rounded-2xl border text-center transition-all ${
              item.active
                ? 'bg-primary text-primary-foreground border-primary font-bold shadow-md'
                : 'bg-card border-border text-foreground hover:border-primary/50'
            }`}
          >
            <div className="text-xs opacity-80">{item.day}</div>
            <div className="text-xl font-bold mt-1">{item.date}</div>
          </div>
        ))}
      </div>

      {/* Planning quotidien */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-foreground">جدول اليوم</h3>

        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
          <div className="flex items-center gap-2 text-primary text-sm font-bold">
            <Clock className="w-4 h-4" />
            <span>3:00 مساءً — الوقت المثالي لنشر قصة سناب شات</span>
          </div>
          <p className="text-xs text-muted-foreground pr-6">
            تفاعل الجمهور يصل لأعلى ذروة في هذا الوقت بناءً sur les تحليلات الذكاء الاصطناعي.
          </p>
          <button className="text-xs font-bold text-primary hover:underline pr-6 flex items-center gap-1 pt-1">
            <Plus className="w-3.5 h-3.5" />
            <span>إنشاء محتوى الآن</span>
          </button>
        </div>
      </div>

      {/* Bouton d'action principal */}
      <button className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-all text-center shadow-md flex items-center justify-center gap-2">
        <Plus className="w-5 h-5" />
        <span>جدولة منشور جديد</span>
      </button>
    </div>
  );
}