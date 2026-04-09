// Smart Reply Engine — keyword-based template suggestions
// Replaces AI/LLM-based suggestions with instant template matching

export type MessageType = 'positive' | 'negative' | 'question' | 'neutral';
export type ContextType = 'comment' | 'dm_first' | 'dm_followup' | 'review_positive' | 'review_negative';

const POSITIVE_KEYWORDS = ['love', 'amazing', 'best', 'great', 'delicious', 'perfect', 'awesome', 'fantastic', 'wonderful', 'excellent', '🔥', '❤️', '😍', '👏', 'يجنن', 'روعة', 'ممتاز', 'الله', 'حلو', 'لذيذ', 'رائع', 'جميل', 'أفضل'];
const NEGATIVE_KEYWORDS = ['bad', 'worst', 'terrible', 'expensive', 'horrible', 'never', 'awful', 'disgusting', 'poor', 'slow', '👎', 'سيء', 'غالي', 'زفت', 'ما عجبني', 'مقرف', 'بطيء', 'خراب'];
const QUESTION_KEYWORDS = ['?', 'how', 'when', 'where', 'price', 'much', 'what', 'which', 'can', 'do you', 'is there', 'كم', 'متى', 'وين', 'كيف', 'ايش', 'هل', 'فين', 'ليش'];

export function detectMessageType(text: string): MessageType {
  const t = text.toLowerCase();
  if (NEGATIVE_KEYWORDS.some(k => t.includes(k))) return 'negative';
  if (QUESTION_KEYWORDS.some(k => t.includes(k))) return 'question';
  if (POSITIVE_KEYWORDS.some(k => t.includes(k))) return 'positive';
  return 'neutral';
}

export function detectReviewSentiment(rating: number): 'positive' | 'negative' {
  return rating >= 4 ? 'positive' : 'negative';
}

interface TemplateSet {
  ar: string[];
  en: string[];
}

const TEMPLATES: Record<string, TemplateSet> = {
  comment_positive: {
    ar: [
      'يسعدنا رأيك 🤩 نتمنى نشوفك دايم!',
      'شكراً من القلب ❤️ رأيك يهمنا!',
      'أنت الذوق 🔥 ننتظرك المرة الجاية!',
    ],
    en: [
      'Thank you so much! 🤩 We appreciate your kind words!',
      'So glad you enjoyed it ❤️ See you again soon!',
      'You made our day! 🔥 Thanks for the love!',
    ],
  },
  comment_negative: {
    ar: [
      'نعتذر عن التجربة 🙏 نحب نتواصل معك لحل الموضوع. أرسل لنا رسالة خاصة.',
      'رأيك يهمنا ونأخذه بعين الاعتبار 🙏 نتمنى نعوضك المرة الجاية.',
    ],
    en: [
      'We apologize for your experience 🙏 Please DM us so we can make it right.',
      'Your feedback matters to us. We\'ll look into this and improve. Thank you for letting us know.',
    ],
  },
  comment_question: {
    ar: [
      'أهلاً! تقدر تتواصل معنا على الخاص للتفاصيل 📩',
      'حياك! راسلنا على الواتساب وبنرد عليك بأسرع وقت 📱',
    ],
    en: [
      'Hi! DM us for more details 📩',
      'Great question! Send us a message and we\'ll get back to you ASAP 📱',
    ],
  },
  comment_neutral: {
    ar: [
      'شكراً لتعليقك! نسعد بتواصلك معنا 😊',
      'أهلاً! نحب نسمع رأيك دايم 💬',
    ],
    en: [
      'Thanks for your comment! We love hearing from you 😊',
      'Hey there! We appreciate you reaching out 💬',
    ],
  },
  dm_first: {
    ar: [
      'أهلاً وسهلاً! كيف نقدر نساعدك؟ 😊',
      'حياك الله! شكراً لتواصلك معنا. كيف نخدمك؟',
    ],
    en: [
      'Hi there! How can we help you? 😊',
      'Hello! Thanks for reaching out. What can we do for you?',
    ],
  },
  dm_followup: {
    ar: [
      'شكراً لصبرك 🙏 تم التأكد وبنرسل لك التفاصيل.',
      'تمام! بنتابع الموضوع ونرد عليك بأسرع وقت 👍',
    ],
    en: [
      'Thanks for your patience 🙏 We\'ve checked and here are the details.',
      'Got it! We\'ll follow up and get back to you shortly 👍',
    ],
  },
  review_positive: {
    ar: [
      'شكراً جزيلاً على تقييمك الرائع ⭐ نسعد بزيارتك دائماً!',
      'كلامك يحفزنا نقدم الأفضل 🤩 شكراً لثقتك!',
    ],
    en: [
      'Thank you for the wonderful review ⭐ We look forward to seeing you again!',
      'Your kind words motivate us to keep improving 🤩 Thank you!',
    ],
  },
  review_negative: {
    ar: [
      'نعتذر منك على هالتجربة 🙏 نحب نتواصل معك شخصياً لحل الموضوع.',
      'رأيك مهم لنا جداً ونأخذه بجدية 🙏 نتمنى تعطينا فرصة ثانية ونعوضك.',
    ],
    en: [
      'We sincerely apologize for your experience 🙏 Please contact us so we can make it right.',
      'We take your feedback seriously and will address this immediately. We hope to earn your trust back.',
    ],
  },
};

export function getSmartReplies(context: ContextType, messageText: string, lang: string = 'en'): string[] {
  const l = lang.startsWith('ar') ? 'ar' : 'en';
  
  if (context === 'dm_first') return TEMPLATES.dm_first[l];
  if (context === 'dm_followup') return TEMPLATES.dm_followup[l];
  if (context === 'review_positive') return TEMPLATES.review_positive[l];
  if (context === 'review_negative') return TEMPLATES.review_negative[l];
  
  // For comments, detect type
  const type = detectMessageType(messageText);
  const key = `comment_${type}`;
  return TEMPLATES[key]?.[l] || TEMPLATES.comment_neutral[l];
}
