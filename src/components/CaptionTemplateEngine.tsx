import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ── All 113 templates ──
type Template = { id: string; goal: string; tone: string; lang: 'ar' | 'en'; text: string };

const TEMPLATES: Template[] = [
  // PROMOTION — FUN
  { id:'AR-1', goal:'promotion', tone:'fun', lang:'ar', text:'🔥 عرض ما يتفوّت! {offer} على {product} لفترة محدودة 🏃‍♂️ لا تطوّفها!' },
  { id:'AR-2', goal:'promotion', tone:'fun', lang:'ar', text:'وش تنتظر؟ 😱 {offer} على {product}! روح الحين قبل لا يخلص العرض 💥' },
  { id:'AR-3', goal:'promotion', tone:'fun', lang:'ar', text:'{product} بسعر مجنون 🤯 {offer} بس لهالأسبوع! سيّف قبل لا يروح 🔥' },
  { id:'AR-4', goal:'promotion', tone:'fun', lang:'ar', text:'لو ما تستغل العرض ذا... ما أدري وش أقولك 😂 {offer} على {product} الحين!' },
  { id:'AR-5', goal:'promotion', tone:'fun', lang:'ar', text:'حبايبنا! 💛 جبنالكم {offer} على {product} — العرض للسريعين بس ⚡' },
  { id:'AR-6', goal:'promotion', tone:'fun', lang:'ar', text:'يا هلا بالعروض 🎉 {offer} على {product} — تعال ذوق وأنت الحكم!' },
  { id:'AR-7', goal:'promotion', tone:'fun', lang:'ar', text:'اللي يحب {product} يرفع يده ✋ الحين عندنا {offer}! وش تبي أحلى من كذا؟' },
  { id:'EN-1', goal:'promotion', tone:'fun', lang:'en', text:'🔥 {offer} on {product}! Run, don\'t walk 🏃‍♂️ Limited time only!' },
  { id:'EN-2', goal:'promotion', tone:'fun', lang:'en', text:'Your wallet will thank you later 😏 {offer} on {product} — grab it NOW!' },
  { id:'EN-3', goal:'promotion', tone:'fun', lang:'en', text:'This is NOT a drill 🚨 {offer} on {product} for this week only!' },
  { id:'EN-4', goal:'promotion', tone:'fun', lang:'en', text:'{product} at {offer}?! Yes, you read that right 👀🔥' },
  { id:'EN-5', goal:'promotion', tone:'fun', lang:'en', text:'POV: You just found out about our {offer} on {product} 🤩' },
  { id:'EN-6', goal:'promotion', tone:'fun', lang:'en', text:'Tag someone who NEEDS to see this deal 👇 {offer} on {product}!' },
  { id:'EN-7', goal:'promotion', tone:'fun', lang:'en', text:'Treat yourself. You deserve it 💅 {offer} on {product} — link in bio ⬆️' },
  // PROMOTION — PROFESSIONAL
  { id:'AR-8', goal:'promotion', tone:'professional', lang:'ar', text:'يسعدنا نقدم لكم {offer} على {product}. العرض ساري لفترة محدودة. نتشرف بزيارتكم.' },
  { id:'AR-9', goal:'promotion', tone:'professional', lang:'ar', text:'عرض حصري لعملائنا: {offer} على {product}. التفاصيل والحجز عبر الرابط في البايو.' },
  { id:'AR-10', goal:'promotion', tone:'professional', lang:'ar', text:'بمناسبة {event}، نقدم لكم {offer} على {product}. نسعد بخدمتكم.' },
  { id:'EN-8', goal:'promotion', tone:'professional', lang:'en', text:'We are pleased to offer {offer} on {product}. Available for a limited time.' },
  { id:'EN-9', goal:'promotion', tone:'professional', lang:'en', text:'Exclusive offer: {offer} on {product}. Details via the link in our bio.' },
  { id:'EN-10', goal:'promotion', tone:'professional', lang:'en', text:'Special promotion: enjoy {offer} on {product}. We look forward to serving you.' },
  // PROMOTION — URGENT
  { id:'AR-11', goal:'promotion', tone:'urgent', lang:'ar', text:'⏰ آخر يوم! {offer} على {product} — بكرة يرجع السعر الأصلي!' },
  { id:'AR-12', goal:'promotion', tone:'urgent', lang:'ar', text:'🚨 باقي كمية محدودة! {offer} على {product} — لا تفوّتها!' },
  { id:'AR-13', goal:'promotion', tone:'urgent', lang:'ar', text:'العد التنازلي بدأ ⏳ {offer} على {product} ينتهي خلال 24 ساعة!' },
  { id:'EN-11', goal:'promotion', tone:'urgent', lang:'en', text:'⏰ LAST DAY! {offer} on {product} — back to full price tomorrow!' },
  { id:'EN-12', goal:'promotion', tone:'urgent', lang:'en', text:'🚨 Almost sold out! {offer} on {product} — don\'t miss it!' },
  { id:'EN-13', goal:'promotion', tone:'urgent', lang:'en', text:'24 hours left ⏳ {offer} on {product} ends tonight. Act now!' },
  // NEW PRODUCT — FUN
  { id:'AR-14', goal:'new_product', tone:'fun', lang:'ar', text:'الجديد وصل 🆕 تعرّفوا على {product}! جربوه وقولوا لنا رأيكم 🔥' },
  { id:'AR-15', goal:'new_product', tone:'fun', lang:'ar', text:'شي جديد داخل المنيو 👀 {product} — مستعدين تجربون؟ 😍' },
  { id:'AR-16', goal:'new_product', tone:'fun', lang:'ar', text:'حاجة كنتوا تطلبونها وأخيراً جبناها 🎉 {product} متوفر الحين!' },
  { id:'AR-17', goal:'new_product', tone:'fun', lang:'ar', text:'يا ناس يا حبايب! {product} نزل اليوم 🔥 أول ما تجربه راح تدمن عليه 😂' },
  { id:'EN-14', goal:'new_product', tone:'fun', lang:'en', text:'Say hello to {product} 🆕 Now available! Try it and let us know 🔥' },
  { id:'EN-15', goal:'new_product', tone:'fun', lang:'en', text:'Something new just dropped 👀 Meet {product} — your new obsession 😍' },
  { id:'EN-16', goal:'new_product', tone:'fun', lang:'en', text:'You asked, we delivered 🎉 {product} is HERE! Link in bio ⬆️' },
  { id:'EN-17', goal:'new_product', tone:'fun', lang:'en', text:'Introducing {product} ✨ We are obsessed and you will be too!' },
  // NEW PRODUCT — PROFESSIONAL
  { id:'AR-18', goal:'new_product', tone:'professional', lang:'ar', text:'يسرنا الإعلان عن إضافة {product} الجديد. متوفر الآن في جميع فروعنا.' },
  { id:'AR-19', goal:'new_product', tone:'professional', lang:'ar', text:'نفتخر بتقديم {product} — مصنوع بعناية لتجربة استثنائية.' },
  { id:'EN-18', goal:'new_product', tone:'professional', lang:'en', text:'We are excited to introduce {product}. Now available at all our locations.' },
  { id:'EN-19', goal:'new_product', tone:'professional', lang:'en', text:'Proudly presenting {product} — crafted with care for an exceptional experience.' },
  // BEHIND THE SCENES — FUN
  { id:'AR-20', goal:'behind_scenes', tone:'fun', lang:'ar', text:'تبون تشوفون وش يصير ورا الكواليس؟ 👀 هذي طبختنا السرية 🤫🔥' },
  { id:'AR-21', goal:'behind_scenes', tone:'fun', lang:'ar', text:'الشيف شغّال من الصبح عشانكم 👨‍🍳 محد يقول ما نحبكم 😂❤️' },
  { id:'AR-22', goal:'behind_scenes', tone:'fun', lang:'ar', text:'كذا نجهز {product} كل يوم 🎬 شغل يد وحب واهتمام ✋❤️' },
  { id:'AR-23', goal:'behind_scenes', tone:'fun', lang:'ar', text:'لو تشوفون المطبخ الحين... 🔥 الريحة وصلت للشارع 😍' },
  { id:'AR-24', goal:'behind_scenes', tone:'fun', lang:'ar', text:'ذا اللي يصير قبل لا يوصلك الطلب 📦 كل شي طازج ومحضّر بحب!' },
  { id:'EN-20', goal:'behind_scenes', tone:'fun', lang:'en', text:'Ever wonder what happens behind the scenes? 👀 Here is our secret process 🤫' },
  { id:'EN-21', goal:'behind_scenes', tone:'fun', lang:'en', text:'Our chef has been working since sunrise for you 👨‍🍳 That is dedication! 🔥' },
  { id:'EN-22', goal:'behind_scenes', tone:'fun', lang:'en', text:'This is how we make {product} every single day ✋ Fresh, made with love ❤️' },
  { id:'EN-23', goal:'behind_scenes', tone:'fun', lang:'en', text:'Behind every great dish is a chaotic kitchen 😂 Swipe to see the magic →' },
  { id:'EN-24', goal:'behind_scenes', tone:'fun', lang:'en', text:'From our kitchen to your table — this is the journey of {product} 🎬' },
  // EVENT — FUN
  { id:'AR-25', goal:'event', tone:'fun', lang:'ar', text:'📅 حطوها بالتقويم! {event} يوم {date} في {location} 🎉 لا يفوتكم!' },
  { id:'AR-26', goal:'event', tone:'fun', lang:'ar', text:'مين يجي معنا؟ 🙋‍♂️ {event} — {date} — {location} — بنكون هناك وتكونون معنا!' },
  { id:'AR-27', goal:'event', tone:'fun', lang:'ar', text:'الموعد محجوز 🔒 {event} يوم {date}! وش لابسين؟ 😂' },
  { id:'EN-25', goal:'event', tone:'fun', lang:'en', text:'📅 Save the date! {event} on {date} at {location} 🎉 Don\'t miss it!' },
  { id:'EN-26', goal:'event', tone:'fun', lang:'en', text:'Who is coming? 🙋‍♂️ {event} — {date} — {location} — We will be there, will you?' },
  { id:'EN-27', goal:'event', tone:'fun', lang:'en', text:'It is happening! {event} on {date}. Get ready! 🔥' },
  // EVENT — PROFESSIONAL
  { id:'AR-28', goal:'event', tone:'professional', lang:'ar', text:'يسرنا دعوتكم لحضور {event} يوم {date} في {location}. نتطلع لرؤيتكم.' },
  { id:'EN-28', goal:'event', tone:'professional', lang:'en', text:'We cordially invite you to {event} on {date} at {location}. We look forward to seeing you.' },
  // TIP — FUN
  { id:'AR-29', goal:'tip', tone:'fun', lang:'ar', text:'نصيحة من قلب ❤️ لو تبي {topic} أحسن، جرّب كذا 👇' },
  { id:'AR-30', goal:'tip', tone:'fun', lang:'ar', text:'معلومة ما يعرفها الكثير 🤫 عن {topic}... الحين بقولك السر 👇' },
  { id:'AR-31', goal:'tip', tone:'fun', lang:'ar', text:'3 أشياء تغير {topic} تماماً 🔥 رقم 2 أهم وحدة!' },
  { id:'AR-32', goal:'tip', tone:'fun', lang:'ar', text:'كل يوم نتعلم شي جديد 💡 اليوم نبي نكلمكم عن {topic}' },
  { id:'EN-29', goal:'tip', tone:'fun', lang:'en', text:'Pro tip 💡 If you want better {topic}, try this 👇' },
  { id:'EN-30', goal:'tip', tone:'fun', lang:'en', text:'Did you know? 🤔 Here is something about {topic} most people get wrong...' },
  { id:'EN-31', goal:'tip', tone:'fun', lang:'en', text:'3 things that will change your {topic} game 🔥 #2 is the most important!' },
  { id:'EN-32', goal:'tip', tone:'fun', lang:'en', text:'Daily tip ✨ Let us talk about {topic} today — save this for later! 📌' },
  // ENGAGEMENT QUESTION — FUN
  { id:'AR-33', goal:'engagement', tone:'fun', lang:'ar', text:'سؤال اليوم 🤔 {topic}؟ جاوبونا بالكومنت 👇' },
  { id:'AR-34', goal:'engagement', tone:'fun', lang:'ar', text:'وش تفضلون: {topic}؟ صوّتوا بالإيموجي! 🔥 أو ❤️' },
  { id:'AR-35', goal:'engagement', tone:'fun', lang:'ar', text:'لو تقدر تختار بس وحدة... {topic}؟ 😂 قولوا لنا!' },
  { id:'AR-36', goal:'engagement', tone:'fun', lang:'ar', text:'تحدي 🔥 قول لنا {topic} بدون ما تقول الاسم... يلا نشوف إبداعكم 😂' },
  { id:'AR-37', goal:'engagement', tone:'fun', lang:'ar', text:'أكثر شي تحبونه عندنا؟ 🤩 الأكثر تصويت بنسويله عرض خاص!' },
  { id:'AR-38', goal:'engagement', tone:'fun', lang:'ar', text:'مين جرّب {product}؟ قيّمه من 1 لـ 10 👇🔥' },
  { id:'EN-33', goal:'engagement', tone:'fun', lang:'en', text:'Question of the day 🤔 {topic}? Drop your answer below 👇' },
  { id:'EN-34', goal:'engagement', tone:'fun', lang:'en', text:'What do you prefer: {topic}? Vote with emojis! 🔥 or ❤️' },
  { id:'EN-35', goal:'engagement', tone:'fun', lang:'en', text:'If you could only pick one... {topic}? 😂 Tell us!' },
  { id:'EN-36', goal:'engagement', tone:'fun', lang:'en', text:'Challenge 🔥 Describe {topic} without saying the name... let us see your creativity!' },
  { id:'EN-37', goal:'engagement', tone:'fun', lang:'en', text:'What is your favorite thing about us? 🤩 Most voted gets a special offer!' },
  { id:'EN-38', goal:'engagement', tone:'fun', lang:'en', text:'Who has tried {product}? Rate it 1-10 👇' },
  // ANNOUNCEMENT — FUN
  { id:'AR-39', goal:'announcement', tone:'fun', lang:'ar', text:'📢 خبر حلو! {topic}! تابعونا عشان التفاصيل 👀' },
  { id:'AR-40', goal:'announcement', tone:'fun', lang:'ar', text:'يا ناس عندنا خبر 🔥 {topic}! مستعدين؟ 😍' },
  { id:'AR-41', goal:'announcement', tone:'fun', lang:'ar', text:'أخيراً نقدر نقولها 🎉 {topic}! شاركونا الحماس 🔥' },
  { id:'EN-39', goal:'announcement', tone:'fun', lang:'en', text:'📢 Big news! {topic}! Stay tuned for more details 👀' },
  { id:'EN-40', goal:'announcement', tone:'fun', lang:'en', text:'We have an announcement 🔥 {topic}! Are you ready? 😍' },
  { id:'EN-41', goal:'announcement', tone:'fun', lang:'en', text:'We can finally say it 🎉 {topic}! Share the excitement 🔥' },
  // ANNOUNCEMENT — PROFESSIONAL
  { id:'AR-42', goal:'announcement', tone:'professional', lang:'ar', text:'يسرنا إعلامكم بأن {topic}. نشكركم على دعمكم المستمر.' },
  { id:'AR-43', goal:'announcement', tone:'professional', lang:'ar', text:'إعلان مهم: {topic}. تابعونا للمزيد من التفاصيل.' },
  { id:'EN-42', goal:'announcement', tone:'professional', lang:'en', text:'We are pleased to announce that {topic}. Thank you for your continued support.' },
  { id:'EN-43', goal:'announcement', tone:'professional', lang:'en', text:'Important update: {topic}. Follow us for more details.' },
  // REVIEW — FUN
  { id:'AR-44', goal:'review', tone:'fun', lang:'ar', text:'شوفوا وش قال عميلنا عن {product} 😍 كلام من القلب ❤️' },
  { id:'AR-45', goal:'review', tone:'fun', lang:'ar', text:'لما العميل يقول {product} أفضل شي جربته... نحس إن كل التعب يستاهل 🥹🔥' },
  { id:'AR-46', goal:'review', tone:'fun', lang:'ar', text:'التقييم ذا سوّا يومنا 🤩 شكراً لكل عميل يثق فينا!' },
  { id:'EN-44', goal:'review', tone:'fun', lang:'en', text:'See what our customer said about {product} 😍 Words from the heart ❤️' },
  { id:'EN-45', goal:'review', tone:'fun', lang:'en', text:'When a customer says {product} is the best thing they ever tried... it makes it all worth it 🥹' },
  { id:'EN-46', goal:'review', tone:'fun', lang:'en', text:'This review made our day 🤩 Thank you to every customer who trusts us!' },
  // SEASONAL — FUN
  { id:'AR-47', goal:'promotion', tone:'fun', lang:'ar', text:'رمضان كريم 🌙 جهزنا لكم {product} خاص للإفطار! تعالوا الذوق 😍' },
  { id:'AR-48', goal:'promotion', tone:'fun', lang:'ar', text:'يا هلا بالعيد 🎉 {offer} على {product} بمناسبة عيد الفطر المبارك!' },
  { id:'AR-49', goal:'promotion', tone:'fun', lang:'ar', text:'اليوم الوطني السعودي 🇸🇦💚 عروض خاصة بالمناسبة! {offer} على كل شي 🔥' },
  { id:'AR-50', goal:'promotion', tone:'fun', lang:'ar', text:'صيف وعروض 🏖️ {offer} على {product} — استمتعوا بالصيف معنا!' },
  { id:'AR-51', goal:'announcement', tone:'fun', lang:'ar', text:'موسم الرياض جاي 🎊 بنكون هناك! تابعونا للمفاجآت 👀' },
  { id:'AR-52', goal:'promotion', tone:'fun', lang:'ar', text:'يوم التأسيس 🏰 كل عام وأنتم بخير! {offer} بهالمناسبة 💜' },
  { id:'AR-53', goal:'promotion', tone:'fun', lang:'ar', text:'سحور مع {brand}؟ ليش لا 🌙 {product} جاهز لسحوركم!' },
  { id:'EN-47', goal:'promotion', tone:'fun', lang:'en', text:'Ramadan Kareem 🌙 We have prepared a special {product} for Iftar! Come taste it 😍' },
  { id:'EN-48', goal:'promotion', tone:'fun', lang:'en', text:'Eid Mubarak 🎉 {offer} on {product} to celebrate!' },
  { id:'EN-49', goal:'promotion', tone:'fun', lang:'en', text:'Saudi National Day 🇸🇦💚 Special offers! {offer} on everything 🔥' },
  { id:'EN-50', goal:'promotion', tone:'fun', lang:'en', text:'Summer vibes + summer deals 🏖️ {offer} on {product}!' },
  { id:'EN-51', goal:'announcement', tone:'fun', lang:'en', text:'Riyadh Season is coming 🎊 We will be there! Follow us for surprises 👀' },
  { id:'EN-52', goal:'promotion', tone:'fun', lang:'en', text:'Founding Day 🏰 Celebrating with {offer}! 💜' },
  // MOTIVATIONAL — FUN (map to announcement)
  { id:'AR-54', goal:'announcement', tone:'inspirational', lang:'ar', text:'بدأنا من الصفر والحين وصلنا لهنا 🚀 كل الشكر لكم يا جمهورنا ❤️' },
  { id:'AR-55', goal:'announcement', tone:'inspirational', lang:'ar', text:'١٠٠٠ متابع 🎉 ما وصلنا لهنا إلا بدعمكم! قادم أحلى بإذن الله 🔥' },
  { id:'AR-56', goal:'announcement', tone:'inspirational', lang:'ar', text:'كل تعليق، كل زيارة، كل طلب... يفرق معنا ❤️ شكراً لكم!' },
  { id:'AR-57', goal:'announcement', tone:'inspirational', lang:'ar', text:'الشغف هو اللي يسوقنا كل يوم 💪 شكراً لكل واحد يثق فينا!' },
  { id:'EN-53', goal:'announcement', tone:'inspirational', lang:'en', text:'Started from zero and look where we are now 🚀 All thanks to YOU ❤️' },
  { id:'EN-54', goal:'announcement', tone:'inspirational', lang:'en', text:'1000 followers 🎉 We could not have done it without your support! More to come 🔥' },
  { id:'EN-55', goal:'announcement', tone:'inspirational', lang:'en', text:'Every comment, every visit, every order... means the world to us ❤️ Thank you!' },
  { id:'EN-56', goal:'announcement', tone:'inspirational', lang:'en', text:'Passion drives us every single day 💪 Thank you for believing in us!' },
];

const GOALS = [
  { id: 'promotion', icon: '🏷️', labelKey: 'captionEngine.promotion' },
  { id: 'new_product', icon: '🆕', labelKey: 'captionEngine.newProduct' },
  { id: 'behind_scenes', icon: '🎬', labelKey: 'captionEngine.behindScenes' },
  { id: 'event', icon: '📅', labelKey: 'captionEngine.event' },
  { id: 'tip', icon: '💡', labelKey: 'captionEngine.tip' },
  { id: 'engagement', icon: '❓', labelKey: 'captionEngine.engagement' },
  { id: 'announcement', icon: '📢', labelKey: 'captionEngine.announcement' },
  { id: 'review', icon: '⭐', labelKey: 'captionEngine.review' },
];

const TONES = [
  { id: 'fun', icon: '🔥', labelKey: 'captionEngine.funBold' },
  { id: 'professional', icon: '💼', labelKey: 'captionEngine.professional' },
  { id: 'inspirational', icon: '✨', labelKey: 'captionEngine.inspirational' },
  { id: 'urgent', icon: '⏰', labelKey: 'captionEngine.urgent' },
];

const BTS_KEYS = ['captionEngine.kitchen', 'captionEngine.team', 'captionEngine.process', 'captionEngine.preparation'];
const BTS_VALUES = ['Kitchen', 'Team', 'Process', 'Preparation'];

interface CaptionTemplateEngineProps {
  open: boolean;
  onClose: () => void;
  onUseCaption: (caption: string) => void;
}

export const CaptionTemplateEngine = ({ open, onClose, onUseCaption }: CaptionTemplateEngineProps) => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [tone, setTone] = useState('');
  const [lang, setLang] = useState<'ar' | 'en' | 'both'>('en');
  const [refreshKey, setRefreshKey] = useState(0);

  // Dynamic form fields
  const [product, setProduct] = useState('');
  const [offer, setOffer] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [btsType, setBtsType] = useState('Kitchen');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [topic, setTopic] = useState('');
  const [newsText, setNewsText] = useState('');
  const [reviewer, setReviewer] = useState('');

  const resetAll = () => {
    setStep(1); setGoal(''); setTone(''); setLang('en'); setRefreshKey(0);
    setProduct(''); setOffer(''); setDuration(''); setDescription('');
    setBtsType('Kitchen'); setEventName(''); setEventDate(''); setEventLocation('');
    setTopic(''); setNewsText(''); setReviewer('');
  };

  const fillTemplate = (text: string) => {
    return text
      .replace(/{product}/g, product || '[Product]')
      .replace(/{offer}/g, offer || '[Offer]')
      .replace(/{brand}/g, 'Speeda')
      .replace(/{topic}/g, topic || newsText || '[Topic]')
      .replace(/{event}/g, eventName || '[Event]')
      .replace(/{date}/g, eventDate || '[Date]')
      .replace(/{location}/g, eventLocation || '[Location]');
  };

  const matchingTemplates = useMemo(() => {
    let filtered = TEMPLATES.filter(t => t.goal === goal);
    if (tone) filtered = filtered.filter(t => t.tone === tone);
    if (lang !== 'both') filtered = filtered.filter(t => t.lang === lang);
    // If no exact match for tone, fallback to all tones for that goal
    if (filtered.length === 0) {
      filtered = TEMPLATES.filter(t => t.goal === goal);
      if (lang !== 'both') filtered = filtered.filter(t => t.lang === lang);
    }
    // Shuffle
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, tone, lang, refreshKey]);

  const canProceedStep3 = () => {
    if (goal === 'promotion') return product && offer;
    if (goal === 'new_product') return product;
    if (goal === 'behind_scenes') return true;
    if (goal === 'event') return eventName;
    if (goal === 'tip' || goal === 'engagement') return topic;
    if (goal === 'announcement') return newsText;
    if (goal === 'review') return product;
    return true;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" onClick={e => e.stopPropagation()}>
      <div className="absolute inset-0 bg-foreground/40" onClick={(e) => { e.stopPropagation(); onClose(); resetAll(); }} />
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[500px] max-h-[85vh] overflow-y-auto p-6 z-10"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-bold text-foreground">{t('captionEngine.title')}</h2>
          <button onClick={() => { onClose(); resetAll(); }} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-5">
          {[1,2,3,4,5].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-brand-blue' : 'bg-muted'}`} />
          ))}
        </div>

        {/* Step 1: Goal */}
        {step === 1 && (
          <div>
            <p className="text-[14px] font-semibold text-foreground mb-3">{t('captionEngine.whatAbout')}</p>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map(g => (
                <button key={g.id} onClick={() => { setGoal(g.id); setStep(2); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-start ${goal === g.id ? 'border-brand-blue bg-brand-blue/5' : 'border-border hover:border-brand-blue/50'}`}>
                  <span className="text-[20px]">{g.icon}</span>
                  <span className="text-[13px] font-medium text-foreground">{t(g.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Tone */}
        {step === 2 && (
          <div>
            <p className="text-[14px] font-semibold text-foreground mb-3">{t('captionEngine.chooseTone')}</p>
            <div className="flex flex-wrap gap-2">
              {TONES.map(tn => (
                <button key={tn.id} onClick={() => { setTone(tn.id); setStep(3); }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full border transition-all ${tone === tn.id ? 'border-brand-blue bg-brand-blue/5' : 'border-border'}`}>
                  <span>{tn.icon}</span>
                  <span className="text-[13px] font-medium text-foreground">{t(tn.labelKey)}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="mt-3 text-[12px] text-brand-blue font-medium">← Back</button>
          </div>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-[14px] font-semibold text-foreground">{t('captionEngine.fillDetails')}</p>
            {(goal === 'promotion') && (
              <>
                <input value={product} onChange={e => setProduct(e.target.value)} placeholder={t('captionEngine.productName')} className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-[13px] focus:outline-none focus:border-brand-blue" />
                <input value={offer} onChange={e => setOffer(e.target.value)} placeholder={t('captionEngine.offer')} className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-[13px] focus:outline-none focus:border-brand-blue" />
                <input value={duration} onChange={e => setDuration(e.target.value)} placeholder={t('captionEngine.duration')} className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-[13px] focus:outline-none focus:border-brand-blue" />
              </>
            )}
            {(goal === 'new_product') && (
              <>
                <input value={product} onChange={e => setProduct(e.target.value)} placeholder={t('captionEngine.productName')} className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-[13px] focus:outline-none focus:border-brand-blue" />
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder={t('captionEngine.shortDesc')} className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-[13px] focus:outline-none focus:border-brand-blue" />
              </>
            )}
            {(goal === 'behind_scenes') && (
              <div className="flex flex-wrap gap-2">
                {BTS_VALUES.map((o, idx) => (
                  <button key={o} onClick={() => setBtsType(o)}
                    className={`px-4 py-2 rounded-full text-[13px] font-medium border ${btsType === o ? 'border-brand-blue bg-brand-blue/5 text-brand-blue' : 'border-border text-foreground'}`}>{t(BTS_KEYS[idx])}</button>
                ))}
              </div>
            )}
            {(goal === 'event') && (
              <>
                <input value={eventName} onChange={e => setEventName(e.target.value)} placeholder={t('captionEngine.eventName')} className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-[13px] focus:outline-none focus:border-brand-blue" />
                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-[13px] focus:outline-none focus:border-brand-blue" />
                <input value={eventLocation} onChange={e => setEventLocation(e.target.value)} placeholder={t('captionEngine.location')} className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-[13px] focus:outline-none focus:border-brand-blue" />
              </>
            )}
            {(goal === 'tip' || goal === 'engagement') && (
              <input value={topic} onChange={e => setTopic(e.target.value)} placeholder={t('captionEngine.topic')} className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-[13px] focus:outline-none focus:border-brand-blue" />
            )}
            {(goal === 'announcement') && (
              <input value={newsText} onChange={e => setNewsText(e.target.value)} placeholder={t('captionEngine.whatsNews')} className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-[13px] focus:outline-none focus:border-brand-blue" />
            )}
            {(goal === 'review') && (
              <>
                <input value={product} onChange={e => setProduct(e.target.value)} placeholder={t('captionEngine.productReviewed')} className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-[13px] focus:outline-none focus:border-brand-blue" />
                <input value={reviewer} onChange={e => setReviewer(e.target.value)} placeholder={t('captionEngine.customerName')} className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-[13px] focus:outline-none focus:border-brand-blue" />
              </>
            )}
            <div className="flex gap-2 mt-2">
              <button onClick={() => setStep(2)} className="text-[12px] text-brand-blue font-medium">← Back</button>
              <button onClick={() => canProceedStep3() && setStep(4)} disabled={!canProceedStep3()}
                className="ms-auto px-5 py-2 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold disabled:opacity-50">Next →</button>
            </div>
          </div>
        )}

        {/* Step 4: Language */}
        {step === 4 && (
          <div>
            <p className="text-[14px] font-semibold text-foreground mb-3">{t('captionEngine.chooseLang')}</p>
            <div className="flex gap-2">
              {([
                { id: 'ar' as const, flag: '🇸🇦', labelKey: 'captionEngine.arabic' },
                { id: 'en' as const, flag: '🇬🇧', labelKey: 'captionEngine.english' },
                { id: 'both' as const, flag: '🌐', labelKey: 'captionEngine.both' },
              ]).map(l => (
                <button key={l.id} onClick={() => { setLang(l.id); setStep(5); }}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${lang === l.id ? 'border-brand-blue bg-brand-blue/5' : 'border-border'}`}>
                  <span className="text-[18px]">{l.flag}</span>
                  <span className="text-[13px] font-medium text-foreground">{t(l.labelKey)}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(3)} className="mt-3 text-[12px] text-brand-blue font-medium">← Back</button>
          </div>
        )}

        {/* Step 5: Results */}
        {step === 5 && (
          <div className="space-y-3">
            <p className="text-[14px] font-semibold text-foreground">{t('captionEngine.pickCaption')}</p>
            {matchingTemplates.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">{t('captionEngine.noTemplates')}</p>
            ) : (
              matchingTemplates.map((tpl, i) => {
                const filled = fillTemplate(tpl.text);
                return (
                  <div key={`${tpl.id}-${refreshKey}`} className="bg-background rounded-xl border border-border p-4">
                    <p className="text-[13px] text-foreground leading-[1.6]" dir={tpl.lang === 'ar' ? 'rtl' : 'ltr'}>{filled}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => { navigator.clipboard.writeText(filled); }} className="text-[11px] text-muted-foreground font-medium">📋 {t('common.copy')}</button>
                      <button onClick={() => { onUseCaption(filled); onClose(); resetAll(); }}
                        className="ms-auto px-4 py-1.5 rounded-lg gradient-btn text-primary-foreground text-[12px] font-bold">{t('captionEngine.useThis')}</button>
                    </div>
                  </div>
                );
              })
            )}
            <button onClick={() => setRefreshKey(k => k + 1)} className="w-full text-center text-[13px] text-brand-blue font-semibold mt-2">{t('captionEngine.refresh')}</button>
            <button onClick={() => setStep(4)} className="text-[12px] text-brand-blue font-medium">← Back</button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
