'use client';

import React, { useState } from 'react';
import { Sparkles, Send, Image as ImageIcon, Video, Paperclip, Clock } from 'lucide-react';

export default function QuickPostTab() {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['x', 'instagram']);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  return (
    <div className="w-full space-y-6 text-right font-sans" dir="rtl">
      {/* اختيار المنصات */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-3">
        <label className="text-sm font-bold text-foreground block">
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
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
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

      {/* كتابة المنشور */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
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

        {/* وسائل الإيضاح والوسائط */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
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

      {/* أزرار الإرسال والجدولة */}
      <div className="flex items-center gap-3">
        <button className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-all text-center shadow-md flex items-center justify-center gap-2">
          <Send className="w-5 h-5" />
          <span>نشر الآن</span>
        </button>

        <button className="py-4 px-6 border border-border bg-card text-foreground rounded-2xl font-bold hover:bg-muted transition-all flex items-center justify-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <span>جدولة بوقت لاحق</span>
        </button>
      </div>
    </div>
  );
}