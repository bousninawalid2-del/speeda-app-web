// Calendar demo data and types

export type PostStatus = 'scheduled' | 'draft' | 'ai-generated' | 'published' | 'boosted' | 'pending-approval';

export interface CalendarPost {
  id: string;
  time: string;
  platform: string;
  title: string;
  type: string;
  status: PostStatus;
  caption?: string;
  hashtags?: string;
  brandMatch?: number;
  boostMetrics?: { reach: string; clicks: string; roas: string };
  fromStrategy?: boolean;
  fromRss?: boolean;
}

export interface AISuggestion {
  time: string;
  platform: string;
  reason: string;
}

export interface CalendarDay {
  date: Date;
  posts: CalendarPost[];
  suggestions: AISuggestion[];
}

export interface Campaign {
  name: string;
  startDate: Date;
  endDate: Date;
  color: string;
  platforms: string[];
  roas?: string;
  status: string;
}

export interface CalendarEvent {
  name: string;
  emoji: string;
  startDate: Date;
  endDate: Date;
  color: string;
}

export const platformDotColors: Record<string, string> = {
  instagram: '#d62976',
  tiktok: '#000000',
  facebook: '#1877F2',
  snapchat: '#FFFC00',
  youtube: '#FF0000',
  linkedin: '#0A66C2',
  google: '#34A853',
  x: '#000000',
};

function d(day: number): Date {
  return new Date(2026, 2, day);
}

export const demoWeekPosts: Record<number, CalendarPost[]> = {
  17: [
    { id: 'p1', time: '9:00 AM', platform: 'instagram', title: 'New menu item showcase', type: 'Reel', status: 'scheduled', caption: 'Discover our signature Chicken Shawarma — marinated for 24 hours, grilled to perfection, and wrapped with fresh vegetables and our secret garlic sauce. 🔥', hashtags: '#FoodLovers #Riyadh #SaudiFood', brandMatch: 96 },
    { id: 'p2', time: '12:00 PM', platform: 'tiktok', title: 'Behind the kitchen', type: 'Video', status: 'scheduled', caption: 'Take a look behind the scenes at how we prepare our famous dishes every morning.', hashtags: '#BehindTheScenes #Kitchen #FoodTok', brandMatch: 91 },
    { id: 'p3', time: '6:00 PM', platform: 'facebook', title: 'Weekend special offer', type: 'Post', status: 'draft', caption: 'This weekend only! Get our family meal deal for SAR 99 instead of SAR 149.', hashtags: '#WeekendDeal #FamilyMeal', brandMatch: 88 },
    { id: 'p4', time: '7:00 PM', platform: 'instagram', title: 'Smash Burger promo', type: 'Reel', status: 'ai-generated', caption: 'Our Smash Burgers are BACK! Crispy edges, juicy center, topped with our signature sauce.', hashtags: '#SmashBurger #LimitedEdition #Foodie', brandMatch: 94 },
    { id: 'p5', time: '9:00 PM', platform: 'snapchat', title: 'Evening flash deal', type: 'Story', status: 'scheduled', caption: 'Flash deal tonight only! 40% off all desserts until midnight 🌙', hashtags: '#FlashDeal #NightOwl', brandMatch: 87 },
  ],
  18: [
    { id: 'p6', time: '10:00 AM', platform: 'instagram', title: 'Morning coffee vibes', type: 'Story', status: 'scheduled', caption: 'Start your Tuesday right with our specialty coffee ☕', hashtags: '#CoffeeLover #MorningVibes', brandMatch: 90 },
    { id: 'p7', time: '2:00 PM', platform: 'tiktok', title: 'Chef special recipe', type: 'Video', status: 'scheduled', caption: 'Watch Chef Ahmad prepare tonight\'s special 👨‍🍳', hashtags: '#ChefSpecial #FoodTok', brandMatch: 93 },
    { id: 'p8', time: '7:00 PM', platform: 'youtube', title: 'Full kitchen tour', type: 'Short', status: 'scheduled', caption: 'Take a full tour of our kitchen and see where the magic happens! 🎬', hashtags: '#KitchenTour #YouTube', brandMatch: 87 },
  ],
  19: [
    { id: 'p9', time: '9:00 AM', platform: 'instagram', title: 'Fresh ingredients delivery', type: 'Post', status: 'scheduled', caption: 'Fresh produce just arrived from local farms! 🥬🍅', hashtags: '#FreshFood #LocalFarms', brandMatch: 89 },
    { id: 'p10', time: '12:00 PM', platform: 'snapchat', title: 'Midday flash deal', type: 'Story', status: 'scheduled', caption: 'Lunch hour special! 25% off all wraps 🌯', hashtags: '#FlashDeal #Lunch', brandMatch: 85 },
    { id: 'p11', time: '5:00 PM', platform: 'facebook', title: 'Evening menu preview', type: 'Post', status: 'draft', caption: 'Check out what\'s cooking for tonight\'s dinner service 🍽️', hashtags: '#DinnerMenu #Tonight', brandMatch: 86 },
    { id: 'p12', time: '8:00 PM', platform: 'tiktok', title: 'Customer reaction video', type: 'Reel', status: 'scheduled', caption: 'Watch this customer try our spicy challenge! 🌶️😱', hashtags: '#SpicyChallenge #FoodReaction', brandMatch: 92 },
  ],
  20: [
    { id: 'p13', time: '8:00 PM', platform: 'instagram', title: 'Evening special promo', type: 'Reel', status: 'ai-generated', caption: 'Thursday nights are for treating yourself! 🌙✨', hashtags: '#ThursdayNight #FoodSpecial', brandMatch: 95 },
    { id: 'p14', time: '9:00 PM', platform: 'tiktok', title: 'Late night bites compilation', type: 'Video', status: 'scheduled', caption: 'Our best late night bites — which one would you order? 🤤', hashtags: '#LateNight #FoodTok', brandMatch: 90 },
  ],
  21: [
    { id: 'p15', time: '12:00 PM', platform: 'instagram', title: 'Friday lunch special', type: 'Post', status: 'scheduled', caption: 'Jummah Mubarak! Enjoy our Friday special platter 🍛', hashtags: '#FridaySpecial #JummahMubarak', brandMatch: 91 },
  ],
  22: [
    { id: 'p16', time: '10:00 AM', platform: 'instagram', title: 'Weekend brunch menu', type: 'Story', status: 'scheduled', caption: 'Saturday brunch is calling! 🥞☕', hashtags: '#SaturdayBrunch #WeekendVibes', brandMatch: 91 },
    { id: 'p17', time: '2:00 PM', platform: 'youtube', title: 'Weekend cooking show', type: 'Short', status: 'scheduled', caption: 'Learn to make our famous kunafa at home! 🎬', hashtags: '#CookingShow #YouTube', brandMatch: 87 },
    { id: 'p18', time: '6:00 PM', platform: 'snapchat', title: 'Saturday evening vibes', type: 'Story', status: 'scheduled', caption: 'Come spend your Saturday evening with us! 🌆', hashtags: '#SaturdayNight #Vibes', brandMatch: 88 },
  ],
  23: [
    { id: 'p19', time: '10:00 AM', platform: 'linkedin', title: 'Growth update post', type: 'Post', status: 'scheduled', caption: 'Excited to share our Q1 growth — 40% increase in orders! 📈', hashtags: '#Growth #F&B #SaudiBusiness', brandMatch: 93 },
    { id: 'p20', time: '12:00 PM', platform: 'google', title: 'Google Business update', type: 'Post', status: 'scheduled', caption: 'New photos and updated menu on our Google Business profile 📍', hashtags: '#GoogleBusiness #LocalSEO', brandMatch: 86 },
  ],
};

export const demoSuggestions: Record<number, AISuggestion[]> = {
  17: [{ time: '3:00 PM', platform: 'snapchat', reason: 'Your audience peaks at this time' }],
  18: [{ time: '1:00 PM', platform: 'facebook', reason: 'Great time for lunch-hour engagement' }],
  19: [],
  20: [{ time: '12:00 PM', platform: 'snapchat', reason: 'Midday engagement peak for your audience' }],
  21: [
    { time: '4:00 PM', platform: 'tiktok', reason: 'Your followers are most active now' },
  ],
  22: [],
  23: [{ time: '6:00 PM', platform: 'tiktok', reason: 'Sunday evening content performs 35% better' }],
};

export const demoCampaigns: Campaign[] = [
  {
    name: 'Ramadan Special',
    startDate: d(10),
    endDate: d(31),
    color: 'gradient',
    platforms: ['instagram', 'tiktok'],
    roas: '2.8x',
    status: 'Active',
  },
];

export const demoEvents: CalendarEvent[] = [
  { name: 'Ramadan', emoji: '🌙', startDate: new Date(2026, 2, 29), endDate: new Date(2026, 3, 28), color: 'teal' },
];

export function getWeekDates(startDate: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(startDate);
    dd.setDate(startDate.getDate() + i);
    dates.push(dd);
  }
  return dates;
}

export const TODAY = new Date(2026, 2, 17);

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function getPostsForDay(day: number): CalendarPost[] {
  return demoWeekPosts[day] || [];
}

export function getSuggestionsForDay(day: number): AISuggestion[] {
  return demoSuggestions[day] || [];
}
