export const messages = {
  en: {
    home: 'Home', timer: 'Timer', planner: 'Planner', stats: 'Stats', subjects: 'Subjects', history: 'History', profile: 'Profile', settings: 'Settings',
    start: 'Start', pause: 'Pause', resume: 'Resume', finish: 'Finish', cancel: 'Cancel', today: 'Today', tasks: "Today's Tasks", weekly: 'Weekly Progress',
    noSessions: 'No study sessions yet.', startFirst: 'Start your first focus session.', studyTime: 'Study time', sessions: 'Sessions', goal: 'Daily goal', add: 'Add', save: 'Save',
    offline: 'Offline', synced: 'Synced', syncing: 'Syncing', failed: 'Sync failed'
  },
  fa: {
    home: 'خانه', timer: 'تایمر', planner: 'برنامه', stats: 'آمار', subjects: 'درس‌ها', history: 'سابقه', profile: 'پروفایل', settings: 'تنظیمات',
    start: 'شروع', pause: 'توقف', resume: 'ادامه', finish: 'پایان', cancel: 'لغو', today: 'امروز', tasks: 'کارهای امروز', weekly: 'پیشرفت هفتگی',
    noSessions: 'هنوز جلسه مطالعه‌ای ثبت نشده است.', startFirst: 'اولین جلسه تمرکز را شروع کنید.', studyTime: 'زمان مطالعه', sessions: 'جلسه‌ها', goal: 'هدف روزانه', add: 'افزودن', save: 'ذخیره',
    offline: 'آفلاین', synced: 'همگام', syncing: 'در حال همگام‌سازی', failed: 'خطای همگام‌سازی'
  }
} as const;

export type Language = keyof typeof messages;
