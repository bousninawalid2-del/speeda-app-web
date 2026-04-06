import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './en';
import { ar } from './ar';
import { fr } from './fr';

const savedLang = (typeof window !== 'undefined' && localStorage.getItem('speeda-lang')) || 'en';

type AppLang = 'en' | 'ar' | 'fr';

const runtimeDictionaries: Record<Exclude<AppLang, 'en'>, Record<string, string>> = {
  ar: {
    // Navigation
    Home: 'الرئيسية',
    Create: 'إنشاء',
    AI: 'الذكاء الاصطناعي',
    Ads: 'الإعلانات',
    Stats: 'الإحصائيات',
    Settings: 'الإعدادات',
    Notifications: 'الإشعارات',
    Profile: 'الملف الشخصي',
    // Content Studio tabs
    Calendar: 'التقويم',
    'Quick Post': 'منشور سريع',
    Strategy: 'الاستراتيجية',
    Media: 'الوسائط',
    '📅 Calendar': '📅 التقويم',
    '📁 Media': '📁 الوسائط',
    // Common actions
    Upload: 'رفع',
    Download: 'تحميل',
    Edit: 'تعديل',
    Delete: 'حذف',
    Save: 'حفظ',
    Cancel: 'إلغاء',
    Confirm: 'تأكيد',
    Search: 'بحث',
    Filter: 'تصفية',
    'Sort by': 'ترتيب حسب',
    'Show more': 'عرض المزيد',
    Back: 'رجوع',
    Close: 'إغلاق',
    Share: 'مشاركة',
    Connect: 'ربط',
    Disconnect: 'إلغاء الربط',
    Connected: 'متصل',
    Reconnect: 'إعادة الربط',
    Export: 'تصدير',
    'View Report': 'عرض التقرير',
    'Share PDF': 'مشاركة PDF',
    // Auth
    'Coming Soon': 'قريباً',
    'Learn More': 'اعرف المزيد',
    'Check your inbox': 'تحقّق من بريدك',
    'Email Verified': 'تم تأكيد البريد الإلكتروني',
    'Create Account': 'إنشاء حساب',
    'Sign In': 'تسجيل الدخول',
    'Sign Up': 'إنشاء حساب',
    'Forgot Password': 'نسيت كلمة المرور',
    'Reset Password': 'إعادة تعيين كلمة المرور',
    'Session Expired': 'انتهت الجلسة',
    'Sign In Again': 'تسجيل الدخول مجدداً',
    'Continue to Setup': 'الاستمرار في الإعداد',
    // Notifications screen
    'Mark all read': 'تحديد الكل كمقروء',
    Today: 'اليوم',
    Yesterday: 'أمس',
    Earlier: 'سابقاً',
    'Campaign Milestone': 'إنجاز الحملة',
    'AI Content Ready': 'محتوى AI جاهز',
    'New Reviews': 'تقييمات جديدة',
    'Budget Alert': 'تنبيه الميزانية',
    'RSS Auto-Post': 'نشر RSS تلقائي',
    'Weekly Report': 'التقرير الأسبوعي',
    'Engagement Milestone': 'إنجاز التفاعل',
    'Platform Disconnected': 'انقطاع المنصة',
    'Campaign Completed': 'اكتملت الحملة',
    'Your Ramadan campaign reached 15K people today': 'حملتك الرمضانية وصلت إلى 15 ألف شخص اليوم',
    '3 new posts generated for your approval': '3 منشورات جديدة بانتظار موافقتك',
    'You received 4 new Google reviews': 'حصلت على 4 تقييمات Google جديدة',
    'Instagram ad budget 80% consumed': 'ميزانية إعلان Instagram مستهلكة بنسبة 80%',
    'Your weekly analytics report is ready': 'تقرير التحليلات الأسبوعي جاهز',
    'You hit 10K total followers across platforms': 'وصلت إلى 10 آلاف متابع عبر المنصات',
    'Weekend Special campaign ended with 2.3x ROI': 'حملة عرض نهاية الأسبوع انتهت بعائد 2.3x',
    'X (Twitter) connection lost — tap to reconnect': 'انقطع اتصال X (Twitter) — اضغط لإعادة الربط',
    // Time labels
    '10m ago': 'منذ 10 دقائق',
    '1h ago': 'منذ ساعة',
    '2h ago': 'منذ ساعتين',
    '3h ago': 'منذ 3 ساعات',
    '4h ago': 'منذ 4 ساعات',
    '5h ago': 'منذ 5 ساعات',
    '2 days ago': 'منذ يومين',
    '3 days ago': 'منذ 3 أيام',
    '4 days ago': 'منذ 4 أيام',
    '30m ago': 'منذ 30 دقيقة',
    '45m ago': 'منذ 45 دقيقة',
    '5m ago': 'منذ 5 دقائق',
    '15m ago': 'منذ 15 دقيقة',
    // Campaigns screen
    Campaigns: 'الحملات',
    '3 active campaigns': '3 حملات نشطة',
    New: 'جديد',
    'My Campaigns': 'حملاتي',
    'Ads Manager': 'مدير الإعلانات',
    Active: 'نشط',
    Scheduled: 'مجدول',
    Completed: 'مكتمل',
    Drafts: 'مسودات',
    'No drafts yet': 'لا مسودات بعد',
    'Create your first campaign': 'أنشئ حملتك الأولى',
    'Create Campaign': 'إنشاء حملة',
    'Total Budget': 'إجمالي الميزانية',
    'Total Reach': 'إجمالي الوصول',
    'Avg. ROI': 'متوسط العائد',
    Budget: 'الميزانية',
    Spent: 'المنفق',
    Reach: 'الوصول',
    ROI: 'العائد',
    'Ad Balance': 'رصيد الإعلانات',
    '+ Top Up': '+ شحن الرصيد',
    'Active Ads': 'الإعلانات النشطة',
    Impr: 'مشاهدات',
    Clicks: 'نقرات',
    Resume: 'استئناف',
    Pause: 'إيقاف مؤقت',
    'Edit Budget': 'تعديل الميزانية',
    'Launch Quick Ad': 'إطلاق إعلان سريع',
    Learning: 'قيد التعلم',
    Paused: 'متوقف',
    // Analytics screen
    Analytics: 'التحليلات',
    'Performance overview': 'نظرة عامة على الأداء',
    'Weekly Engagement': 'التفاعل الأسبوعي',
    'Platform Breakdown': 'تفصيل المنصات',
    'Top Performing Content': 'المحتوى الأفضل أداءً',
    'AI Insights': 'رؤى AI',
    'Competitor Benchmark': 'مقارنة المنافسين',
    Engagement: 'التفاعل',
    Conversions: 'التحويلات',
    'Ad Spend': 'الإنفاق الإعلاني',
    'Post History': 'سجل المنشورات',
    'Link Tracking': 'تتبع الروابط',
    'View all published, scheduled & failed posts with retry': 'عرض جميع المنشورات المنشورة والمجدولة والفاشلة مع إعادة المحاولة',
    'Track clicks on shortened URLs across posts': 'تتبع النقرات على الروابط المختصرة عبر المنشورات',
    'Generating your report...': 'جاري إنشاء التقرير...',
    'Compiling analytics data': 'جمع بيانات التحليلات',
    'Report Ready!': 'التقرير جاهز!',
    'Download PDF': 'تحميل PDF',
    'Saved to your reports': 'تم حفظه في تقاريرك',
    'Your Engagement': 'تفاعلك',
    'Industry Avg': 'متوسط المجال',
    'Top Competitor': 'أعلى منافس',
    "You're outperforming 78% of restaurants in your area": 'أنت تتفوق على 78% من المطاعم في منطقتك',
    '✦ Powered by AI': '✦ مدعوم بالذكاء الاصطناعي',
    '✦ Weekly AI Report': '✦ تقرير AI الأسبوعي',
    'Your automated performance report for this week is ready': 'تقرير الأداء الأسبوعي التلقائي جاهز',
    reach: 'وصول',
    // AI Insights texts
    'Post Reels between 7-9 PM for 40% more reach': 'انشر ريلز بين 7-9 مساءً للحصول على 40% وصول إضافي',
    'Your TikTok is 3x above industry avg': 'TikTok الخاص بك أعلى 3 مرات من متوسط المجال',
    'Food photography posts get 2.5x more saves': 'منشورات تصوير الطعام تحصل على 2.5x حفظ أكثر',
    'Ramadan in 3 weeks — plan content now': 'رمضان بعد 3 أسابيع — خطط للمحتوى الآن',
    'Schedule Now →': 'جدوِل الآن ←',
    'Create TikTok Reel →': 'أنشئ ريلز TikTok ←',
    'Use Photo Template →': 'استخدم قالب الصورة ←',
    'Generate Ramadan Plan →': 'أنشئ خطة رمضان ←',
    // AI Optimization log
    '✦ AI Optimization Log': '✦ سجل تحسين AI',
    'Budget shifted +200 SAR to Instagram (higher ROAS)': 'تحويل +200 ريال إلى Instagram (عائد أعلى)',
    'Targeting refined: removed 18-21 age group (low conversion)': 'تحسين الاستهداف: إزالة فئة 18-21 سنة (تحويل منخفض)',
    'Paused Facebook ad (ROAS below 1.0)': 'إيقاف إعلان Facebook (عائد أقل من 1.0)',
    'Creative A outperforming B by 40% — shifted 80% budget': 'التصميم A يتفوق على B بنسبة 40% — تحويل 80% من الميزانية',
    // Social Media screen
    'Social Media': 'وسائل التواصل الاجتماعي',
    'Total Followers': 'إجمالي المتابعين',
    Platforms: 'المنصات',
    Accounts: 'الحسابات',
    'Post Queue': 'قائمة المنشورات',
    '+ Schedule New Post': '+ جدولة منشور جديد',
    '⚠️ Connection issue': '⚠️ مشكلة في الاتصال',
    '⚠️ Token expiring soon': '⚠️ الرمز ينتهي قريباً',
    '✓ Connected': '✓ متصل',
    'Limited features — Stories only': 'ميزات محدودة — القصص فقط',
    connected: 'متصل',
    of: 'من',
    // Engagement screen
    All: 'الكل',
    Comments: 'التعليقات',
    DMs: 'الرسائل الخاصة',
    Reviews: 'التقييمات',
    Comment: 'تعليق',
    Review: 'تقييم',
    '✦ AI SUGGESTED RESPONSE': '✦ رد AI المقترح',
    'Send Response': 'إرسال الرد',
    'SUGGESTED RESPONSE': 'الرد المقترح',
    'AI Responses': 'ردود AI',
    'Type a message...': 'اكتب رسالة...',
    'Search messages...': 'بحث في الرسائل...',
    'Select a conversation': 'اختر محادثة',
    '✦ Generate Response': '✦ إنشاء رد',
    Send: 'إرسال',
    // Tokens screen agent names
    Content: 'المحتوى',
    Engagement2: 'التفاعل',
    Optimization: 'التحسين',
    Brand: 'العلامة التجارية',
    'Content generation — Instagram post': 'إنشاء محتوى — منشور Instagram',
    'Ad creative — Ramadan campaign': 'تصميم إعلاني — حملة رمضان',
    'A/B variations — Weekend offer': 'نسخ A/B — عرض نهاية الأسبوع',
    'Smart metadata — TikTok video': 'بيانات وصفية ذكية — فيديو TikTok',
    'AI response — Google review': 'رد AI — تقييم Google',
    'Content generation — Snapchat story': 'إنشاء محتوى — قصة Snapchat',
    'Strategy plan — March campaign': 'خطة استراتيجية — حملة مارس',
    'Brand voice analysis': 'تحليل هوية العلامة التجارية',
    'Weekly analytics report': 'تقرير تحليلات أسبوعي',
    // Engagement messages
    'This looks amazing! What time do you close?': 'هذا رائع! متى تغلقون؟',
    'Food was cold when delivered. Very disappointed with the service.': 'الطعام وصل بارداً. محبط جداً من الخدمة.',
    'How much is the family meal deal?': 'كم سعر عرض الوجبة العائلية؟',
    'Best shawarma in Riyadh! 5 stars!': 'أفضل شاورما في الرياض! 5 نجوم!',
    'Do you have any vegan options on the menu?': 'هل لديكم خيارات نباتية في القائمة؟',
    'I want to place a catering order for 50 people next Friday': 'أريد طلب تموين لـ 50 شخصاً يوم الجمعة القادم',
    'Can I book a table for tonight?': 'هل يمكنني حجز طاولة لليلة؟',
    // Content titles
    'Chicken Shawarma Reel': 'ريلز شاورما الدجاج',
    'Kitchen Behind Scenes': 'خلف كواليس المطبخ',
    'Weekend Special Offer': 'عرض نهاية الأسبوع',
    'Customer Review Story': 'قصة تقييم عميل',
    Reel: 'ريلز',
    Video: 'فيديو',
    Post: 'منشور',
    Story: 'قصة',
    Thread: 'ثريد',
    Short: 'فيديو قصير',
    Carousel: 'كاروسيل',
    Draft: 'مسودة',
    Published: 'منشور',
    'AI Generated': 'أنشأه AI',
    Pending: 'قيد الانتظار',
    Failed: 'فشل',
    // Day names
    Mon: 'الاثنين',
    Tue: 'الثلاثاء',
    Wed: 'الأربعاء',
    Thu: 'الخميس',
    Fri: 'الجمعة',
    Sat: 'السبت',
    Sun: 'الأحد',
    // Post Queue items
    'New menu item showcase': 'عرض عنصر قائمة جديد',
    'Behind the kitchen': 'خلف كواليس المطبخ',
    'Weekend special offer': 'عرض نهاية الأسبوع',
    'Our story — how we started': 'قصتنا — كيف بدأنا',
    'Customer testimonial': 'شهادة عميل',
    '30-sec shawarma prep': 'تحضير شاورما 30 ثانية',
    // Webhook notifications
    'Webhook: Post Published': 'ويب هوك: تم نشر المنشور',
    'Webhook: Boost Complete': 'ويب هوك: اكتمال التعزيز',
    'Webhook: Post Failed': 'ويب هوك: فشل النشر',
    'Your scheduled post went live on Instagram successfully': 'منشورك المجدول نُشر بنجاح على Instagram',
    'Your boosted post reached 12.4K impressions': 'منشورك المعزز وصل إلى 12.4 ألف مشاهدة',
    'TikTok post failed — media format error': 'فشل منشور TikTok — خطأ في تنسيق الوسائط',
    // Settings RSS
    'Add Feed': 'إضافة خلاصة',
    'No RSS feeds connected': 'لا توجد خلاصات RSS متصلة',
    'Auto-publish blog posts to your social accounts': 'نشر مقالات المدونة تلقائياً على حساباتك',
    '+ Add RSS Feed': '+ إضافة خلاصة RSS',
    // Link Tracking
    '🔗 Link Tracking': '🔗 تتبع الروابط',
    'Track every click from your social media posts': 'تتبع كل نقرة من منشوراتك',
    'Total Links Created': 'إجمالي الروابط المنشأة',
    'Total Clicks This Month': 'إجمالي النقرات هذا الشهر',
    'Unique Clicks': 'نقرات فريدة',
    'Top Performing Link': 'أفضل رابط أداءً',
    'Click Trend (30 Days)': 'اتجاه النقرات (30 يوم)',
    'All Links': 'كل الروابط',
    'Short URL': 'رابط مختصر',
    'Original URL': 'الرابط الأصلي',
    Platform: 'المنصة',
    'Unique': 'فريدة',
    'Top Source': 'المصدر الأول',
    Created: 'تاريخ الإنشاء',
    Actions: 'الإجراءات',
    View: 'عرض',
    Copy: 'نسخ',
    'Create Short Link': 'إنشاء رابط مختصر',
    '+ Create Short Link': '+ إنشاء رابط مختصر',
    'Paste your URL here...': 'الصق الرابط هنا...',
    'Shorten Link': 'اختصار الرابط',
    Advanced: 'متقدم',
    'Campaign Name': 'اسم الحملة',
    Source: 'المصدر',
    Medium: 'الوسيط',
    // Account Health
    'Account Health': 'صحة الحسابات',
    'Social Account Health': 'صحة حسابات التواصل',
    healthy: 'سليم',
    warning: 'تحذير',
    error: 'خطأ',
    'Reconnect Now': 'أعد الربط الآن',
    // MOS Score
    'Marketing Score': 'نقاط التسويق',
    Beginner: 'مبتدئ',
    Growing: 'في نموّ',
    Strong: 'قوي',
    Elite: 'متميّز',
    'Weekly Quests': 'مهام الأسبوع',
    followers: 'متابعون',
    reviews: 'تقييمات',
    // Week/Month toggle
    Week: 'أسبوع',
    Month: 'شهر',
  },
  fr: {
    // Navigation
    Home: 'Accueil',
    Create: 'Créer',
    AI: 'IA',
    Ads: 'Publicités',
    Stats: 'Statistiques',
    Settings: 'Paramètres',
    Notifications: 'Notifications',
    Profile: 'Profil',
    // Content Studio tabs
    Calendar: 'Calendrier',
    'Quick Post': 'Post Rapide',
    Strategy: 'Stratégie',
    Media: 'Médias',
    '📅 Calendar': '📅 Calendrier',
    '📁 Media': '📁 Médias',
    // Common actions
    Upload: 'Télécharger',
    Download: 'Télécharger',
    Edit: 'Modifier',
    Delete: 'Supprimer',
    Save: 'Enregistrer',
    Cancel: 'Annuler',
    Confirm: 'Confirmer',
    Search: 'Rechercher',
    Filter: 'Filtrer',
    'Sort by': 'Trier par',
    'Show more': 'Voir plus',
    Back: 'Retour',
    Close: 'Fermer',
    Share: 'Partager',
    Connect: 'Connecter',
    Disconnect: 'Déconnecter',
    Connected: 'Connecté',
    Reconnect: 'Reconnecter',
    Export: 'Exporter',
    'View Report': 'Voir le rapport',
    'Share PDF': 'Partager le PDF',
    // Auth
    'Coming Soon': 'Bientôt Disponible',
    'Learn More': 'En Savoir Plus',
    'Check your inbox': 'Vérifiez votre boîte mail',
    'Email Verified': 'E-mail vérifié',
    'Create Account': 'Créer un compte',
    'Sign In': 'Se connecter',
    'Sign Up': 'Créer un compte',
    'Forgot Password': 'Mot de passe oublié',
    'Reset Password': 'Réinitialiser le mot de passe',
    'Session Expired': 'Session expirée',
    'Sign In Again': 'Se reconnecter',
    'Continue to Setup': 'Continuer la configuration',
    // Notifications screen
    'Mark all read': 'Tout marquer comme lu',
    Today: "Aujourd'hui",
    Yesterday: 'Hier',
    Earlier: 'Précédent',
    'Campaign Milestone': 'Jalon de campagne',
    'AI Content Ready': 'Contenu IA prêt',
    'New Reviews': 'Nouveaux avis',
    'Budget Alert': 'Alerte budget',
    'RSS Auto-Post': 'Publication RSS automatique',
    'Weekly Report': 'Rapport hebdomadaire',
    'Engagement Milestone': "Jalon d'engagement",
    'Platform Disconnected': 'Plateforme déconnectée',
    'Campaign Completed': 'Campagne terminée',
    'Your Ramadan campaign reached 15K people today': 'Votre campagne Ramadan a atteint 15K personnes aujourd\'hui',
    '3 new posts generated for your approval': '3 nouveaux posts générés pour votre approbation',
    'You received 4 new Google reviews': 'Vous avez reçu 4 nouveaux avis Google',
    'Instagram ad budget 80% consumed': 'Budget pub Instagram consommé à 80%',
    'Your weekly analytics report is ready': 'Votre rapport analytique hebdomadaire est prêt',
    'You hit 10K total followers across platforms': 'Vous avez atteint 10K abonnés sur toutes les plateformes',
    'Weekend Special campaign ended with 2.3x ROI': 'La campagne Weekend Special s\'est terminée avec un ROI de 2.3x',
    'X (Twitter) connection lost — tap to reconnect': 'Connexion X (Twitter) perdue — appuyez pour reconnecter',
    // Time labels
    '10m ago': 'il y a 10 min',
    '1h ago': 'il y a 1h',
    '2h ago': 'il y a 2h',
    '3h ago': 'il y a 3h',
    '4h ago': 'il y a 4h',
    '5h ago': 'il y a 5h',
    '2 days ago': 'il y a 2 jours',
    '3 days ago': 'il y a 3 jours',
    '4 days ago': 'il y a 4 jours',
    '30m ago': 'il y a 30 min',
    '45m ago': 'il y a 45 min',
    '5m ago': 'il y a 5 min',
    '15m ago': 'il y a 15 min',
    // Campaigns screen
    Campaigns: 'Campagnes',
    '3 active campaigns': '3 campagnes actives',
    New: 'Nouveau',
    'My Campaigns': 'Mes Campagnes',
    'Ads Manager': 'Gestionnaire de Publicités',
    Active: 'Actif',
    Scheduled: 'Programmé',
    Completed: 'Terminé',
    Drafts: 'Brouillons',
    'No drafts yet': 'Aucun brouillon',
    'Create your first campaign': 'Créez votre première campagne',
    'Create Campaign': 'Créer une campagne',
    'Total Budget': 'Budget total',
    'Total Reach': 'Portée totale',
    'Avg. ROI': 'ROI moyen',
    Budget: 'Budget',
    Spent: 'Dépensé',
    Reach: 'Portée',
    ROI: 'ROI',
    'Ad Balance': 'Solde publicitaire',
    '+ Top Up': '+ Recharger',
    'Active Ads': 'Publicités actives',
    Impr: 'Impr.',
    Clicks: 'Clics',
    Resume: 'Reprendre',
    Pause: 'Suspendre',
    'Edit Budget': 'Modifier le budget',
    'Launch Quick Ad': 'Lancer une pub rapide',
    Learning: 'En apprentissage',
    Paused: 'Suspendu',
    // Analytics screen
    Analytics: 'Analytique',
    'Performance overview': 'Aperçu des performances',
    'Weekly Engagement': 'Engagement hebdomadaire',
    'Platform Breakdown': 'Répartition par plateforme',
    'Top Performing Content': 'Meilleurs contenus',
    'AI Insights': 'Analyses IA',
    'Competitor Benchmark': 'Benchmark concurrentiel',
    Engagement: 'Engagement',
    Conversions: 'Conversions',
    'Ad Spend': 'Dépenses pub',
    'Post History': 'Historique des posts',
    'Link Tracking': 'Suivi des liens',
    'View all published, scheduled & failed posts with retry': 'Voir tous les posts publiés, programmés et échoués avec reprise',
    'Track clicks on shortened URLs across posts': 'Suivre les clics sur les URLs raccourcies dans les posts',
    'Generating your report...': 'Génération de votre rapport...',
    'Compiling analytics data': 'Compilation des données analytiques',
    'Report Ready!': 'Rapport prêt !',
    'Download PDF': 'Télécharger le PDF',
    'Saved to your reports': 'Enregistré dans vos rapports',
    'Your Engagement': 'Votre engagement',
    'Industry Avg': 'Moyenne du secteur',
    'Top Competitor': 'Premier concurrent',
    "You're outperforming 78% of restaurants in your area": 'Vous surpassez 78% des restaurants de votre zone',
    '✦ Powered by AI': '✦ Propulsé par l\'IA',
    '✦ Weekly AI Report': '✦ Rapport IA hebdomadaire',
    'Your automated performance report for this week is ready': 'Votre rapport de performance automatisé est prêt',
    reach: 'portée',
    // AI Insights texts
    'Post Reels between 7-9 PM for 40% more reach': 'Publiez des Reels entre 19h et 21h pour 40% de portée en plus',
    'Your TikTok is 3x above industry avg': 'Votre TikTok est 3x supérieur à la moyenne du secteur',
    'Food photography posts get 2.5x more saves': 'Les photos culinaires obtiennent 2.5x plus de sauvegardes',
    'Ramadan in 3 weeks — plan content now': 'Ramadan dans 3 semaines — planifiez votre contenu',
    'Schedule Now →': 'Planifier maintenant →',
    'Create TikTok Reel →': 'Créer un Reel TikTok →',
    'Use Photo Template →': 'Utiliser un modèle photo →',
    'Generate Ramadan Plan →': 'Générer un plan Ramadan →',
    // AI Optimization log
    '✦ AI Optimization Log': '✦ Journal d\'optimisation IA',
    'Budget shifted +200 SAR to Instagram (higher ROAS)': 'Budget déplacé +200 SAR vers Instagram (meilleur ROAS)',
    'Targeting refined: removed 18-21 age group (low conversion)': 'Ciblage affiné : groupe 18-21 ans retiré (conversion faible)',
    'Paused Facebook ad (ROAS below 1.0)': 'Pub Facebook suspendue (ROAS inférieur à 1.0)',
    'Creative A outperforming B by 40% — shifted 80% budget': 'Créatif A surpasse B de 40% — 80% du budget redirigé',
    // Social Media screen
    'Social Media': 'Réseaux Sociaux',
    'Total Followers': 'Total abonnés',
    Platforms: 'Plateformes',
    Accounts: 'Comptes',
    'Post Queue': "File d'attente",
    '+ Schedule New Post': '+ Programmer un nouveau post',
    '⚠️ Connection issue': '⚠️ Problème de connexion',
    '⚠️ Token expiring soon': '⚠️ Jeton expirant bientôt',
    '✓ Connected': '✓ Connecté',
    'Limited features — Stories only': 'Fonctionnalités limitées — Stories uniquement',
    connected: 'connecté',
    of: 'de',
    // Engagement screen
    All: 'Tout',
    Comments: 'Commentaires',
    DMs: 'Messages privés',
    Reviews: 'Avis',
    Comment: 'Commentaire',
    Review: 'Avis',
    '✦ AI SUGGESTED RESPONSE': '✦ RÉPONSE SUGGÉRÉE PAR L\'IA',
    'Send Response': 'Envoyer la réponse',
    'SUGGESTED RESPONSE': 'RÉPONSE SUGGÉRÉE',
    'AI Responses': 'Réponses IA',
    'Type a message...': 'Tapez un message...',
    'Search messages...': 'Rechercher des messages...',
    'Select a conversation': 'Sélectionnez une conversation',
    '✦ Generate Response': '✦ Générer une réponse',
    Send: 'Envoyer',
    // Tokens screen agent names
    Content: 'Contenu',
    Optimization: 'Optimisation',
    Brand: 'Marque',
    'Content generation — Instagram post': 'Génération de contenu — post Instagram',
    'Ad creative — Ramadan campaign': 'Créatif pub — campagne Ramadan',
    'A/B variations — Weekend offer': 'Variations A/B — offre weekend',
    'Smart metadata — TikTok video': 'Métadonnées — vidéo TikTok',
    'AI response — Google review': 'Réponse IA — avis Google',
    'Content generation — Snapchat story': 'Génération de contenu — story Snapchat',
    'Strategy plan — March campaign': 'Plan stratégique — campagne mars',
    'Brand voice analysis': 'Analyse de la voix de marque',
    'Weekly analytics report': 'Rapport analytique hebdomadaire',
    // Engagement messages
    'This looks amazing! What time do you close?': 'C\'est magnifique ! À quelle heure fermez-vous ?',
    'Food was cold when delivered. Very disappointed with the service.': 'La nourriture était froide à la livraison. Très déçu du service.',
    'How much is the family meal deal?': 'Combien coûte le menu familial ?',
    'Best shawarma in Riyadh! 5 stars!': 'Meilleur shawarma de Riyad ! 5 étoiles !',
    'Do you have any vegan options on the menu?': 'Avez-vous des options véganes au menu ?',
    'I want to place a catering order for 50 people next Friday': 'Je souhaite commander un traiteur pour 50 personnes vendredi prochain',
    'Can I book a table for tonight?': 'Puis-je réserver une table pour ce soir ?',
    // Content titles
    'Chicken Shawarma Reel': 'Reel Shawarma Poulet',
    'Kitchen Behind Scenes': 'Coulisses de la Cuisine',
    'Weekend Special Offer': 'Offre Spéciale Weekend',
    'Customer Review Story': 'Story Avis Client',
    Reel: 'Reel',
    Video: 'Vidéo',
    Post: 'Post',
    Story: 'Story',
    Thread: 'Thread',
    Short: 'Short',
    Carousel: 'Carrousel',
    Draft: 'Brouillon',
    Published: 'Publié',
    'AI Generated': 'Généré par l\'IA',
    Pending: 'En attente',
    Failed: 'Échoué',
    // Day names
    Mon: 'Lun',
    Tue: 'Mar',
    Wed: 'Mer',
    Thu: 'Jeu',
    Fri: 'Ven',
    Sat: 'Sam',
    Sun: 'Dim',
    // Post Queue items
    'New menu item showcase': 'Présentation nouveau plat',
    'Behind the kitchen': 'Coulisses de la cuisine',
    'Weekend special offer': 'Offre spéciale weekend',
    'Our story — how we started': 'Notre histoire — nos débuts',
    'Customer testimonial': 'Témoignage client',
    '30-sec shawarma prep': 'Préparation shawarma 30 sec',
    // Webhook notifications
    'Webhook: Post Published': 'Webhook : Post publié',
    'Webhook: Boost Complete': 'Webhook : Boost terminé',
    'Webhook: Post Failed': 'Webhook : Échec de publication',
    'Your scheduled post went live on Instagram successfully': 'Votre post programmé a été publié sur Instagram avec succès',
    'Your boosted post reached 12.4K impressions': 'Votre post boosté a atteint 12.4K impressions',
    'TikTok post failed — media format error': 'Échec du post TikTok — erreur de format média',
    // Settings RSS
    'Add Feed': 'Ajouter un flux',
    'No RSS feeds connected': 'Aucun flux RSS connecté',
    'Auto-publish blog posts to your social accounts': 'Publier automatiquement les articles sur vos comptes sociaux',
    '+ Add RSS Feed': '+ Ajouter un flux RSS',
    // Link Tracking
    '🔗 Link Tracking': '🔗 Suivi des liens',
    'Track every click from your social media posts': 'Suivez chaque clic depuis vos posts sur les réseaux sociaux',
    'Total Links Created': 'Total de liens créés',
    'Total Clicks This Month': 'Total de clics ce mois',
    'Unique Clicks': 'Clics uniques',
    'Top Performing Link': 'Lien le plus performant',
    'Click Trend (30 Days)': 'Tendance des clics (30 jours)',
    'All Links': 'Tous les liens',
    'Short URL': 'URL courte',
    'Original URL': 'URL originale',
    Platform: 'Plateforme',
    'Unique': 'Unique',
    'Top Source': 'Source principale',
    Created: 'Créé',
    Actions: 'Actions',
    View: 'Voir',
    Copy: 'Copier',
    'Create Short Link': 'Créer un lien court',
    '+ Create Short Link': '+ Créer un lien court',
    'Paste your URL here...': 'Collez votre URL ici...',
    'Shorten Link': 'Raccourcir le lien',
    Advanced: 'Avancé',
    'Campaign Name': 'Nom de la campagne',
    Source: 'Source',
    Medium: 'Support',
    // Account Health
    'Account Health': 'Santé des comptes',
    'Social Account Health': 'Santé des comptes sociaux',
    healthy: 'sain',
    warning: 'attention',
    error: 'erreur',
    'Reconnect Now': 'Reconnecter maintenant',
    // MOS Score
    'Marketing Score': 'Score Marketing',
    Beginner: 'Débutant',
    Growing: 'En croissance',
    Strong: 'Fort',
    Elite: 'Élite',
    'Weekly Quests': 'Objectifs de la semaine',
    followers: 'abonnés',
    reviews: 'avis',
    // Week/Month toggle
    Week: 'Semaine',
    Month: 'Mois',
  },
};

const textOriginalMap = new WeakMap<Text, string>();
const attrOriginalMap = new WeakMap<Element, Record<string, string>>();
const localizableAttrs = ['placeholder', 'title', 'aria-label'];
let localizeObserver: MutationObserver | null = null;
let isApplyingLocalization = false;
let activeRuntimeLang: AppLang = (savedLang as AppLang) || 'en';

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const translateFromSource = (source: string, lang: AppLang) => {
  if (!source || lang === 'en') return source;
  const dict = runtimeDictionaries[lang as Exclude<AppLang, 'en'>];
  if (!dict) return source;

  const orderedEntries = Object.entries(dict).sort((a, b) => b[0].length - a[0].length);
  return orderedEntries.reduce((acc, [from, to]) => acc.replace(new RegExp(escapeRegExp(from), 'g'), to), source);
};

const localizeTextNode = (node: Text, lang: AppLang) => {
  const currentText = node.textContent ?? '';
  const baseText = textOriginalMap.get(node) ?? currentText;
  if (!textOriginalMap.has(node)) textOriginalMap.set(node, baseText);
  const translated = translateFromSource(baseText, lang);
  if (translated !== currentText) node.textContent = translated;
};

const localizeElementAttributes = (el: Element, lang: AppLang) => {
  if (!(el instanceof HTMLElement || el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;

  const originals = attrOriginalMap.get(el) ?? {};
  for (const attr of localizableAttrs) {
    const value = el.getAttribute(attr);
    if (!value) continue;
    if (!originals[attr]) originals[attr] = value;
    const translated = translateFromSource(originals[attr], lang);
    if (translated !== value) el.setAttribute(attr, translated);
  }
  attrOriginalMap.set(el, originals);
};

const localizeSubtree = (root: Node, lang: AppLang) => {
  if (root instanceof Text) {
    if (root.parentElement && ['SCRIPT', 'STYLE'].includes(root.parentElement.tagName)) return;
    localizeTextNode(root, lang);
    return;
  }

  if (!(root instanceof Element)) return;
  localizeElementAttributes(root, lang);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node instanceof Text && node.parentElement && !['SCRIPT', 'STYLE'].includes(node.parentElement.tagName)) {
      localizeTextNode(node, lang);
    }
    node = walker.nextNode();
  }

  root.querySelectorAll('*').forEach((el) => localizeElementAttributes(el, lang));
};

const applyRuntimeLocalization = (lang: string) => {
  if (typeof document === 'undefined' || !document.body) return;
  activeRuntimeLang = (lang as AppLang) || 'en';

  isApplyingLocalization = true;
  localizeSubtree(document.body, activeRuntimeLang);
  isApplyingLocalization = false;

  if (!localizeObserver) {
    localizeObserver = new MutationObserver((mutations) => {
      if (isApplyingLocalization) return;

      isApplyingLocalization = true;
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData' && mutation.target instanceof Text) {
          localizeTextNode(mutation.target, activeRuntimeLang);
          return;
        }

        if (mutation.type === 'attributes' && mutation.target instanceof Element) {
          localizeElementAttributes(mutation.target, activeRuntimeLang);
          return;
        }

        mutation.addedNodes.forEach((node) => localizeSubtree(node, activeRuntimeLang));
      });
      isApplyingLocalization = false;
    });

    localizeObserver.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: localizableAttrs,
    });
  }
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    fr: { translation: fr },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Apply dir attribute on init and language change
const applyDir = (lang: string) => {
  if (typeof document === 'undefined') return;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.documentElement.style.fontFamily = lang === 'ar'
    ? "'IBM Plex Sans Arabic', 'Poppins', sans-serif"
    : "'Poppins', sans-serif";
};

if (typeof window !== 'undefined') {
  applyDir(savedLang);
  applyRuntimeLocalization(savedLang);
}

i18n.on('languageChanged', (lang) => {
  if (typeof window !== 'undefined') localStorage.setItem('speeda-lang', lang);
  applyDir(lang);
  applyRuntimeLocalization(lang);
});

export default i18n;
