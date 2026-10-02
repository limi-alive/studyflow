# StudyFlow — Product & Technical Specification

> اپلیکیشن مدرن مدیریت مطالعه، تایمر تمرکز، برنامه‌ریزی و تحلیل پیشرفت  
> هدف نهایی: قابل استفاده روی موبایل، نصب‌شونده به‌صورت PWA، آنلاین، قابل میزبانی کد روی GitHub و قابل استفاده هم‌زمان توسط دو کاربر مستقل.

---

# 1. هدف پروژه

اپ باید بتواند:

- زمان واقعی مطالعه را ثبت کند.
- مطالعه هر درس و مبحث را جداگانه نگه دارد.
- آمار روزانه، هفتگی، ماهانه و سالانه ارائه دهد.
- برنامه درسی و Task داشته باشد.
- Pomodoro و Stopwatch داشته باشد.
- ظاهر بسیار مدرن و قابل شخصی‌سازی داشته باشد.
- روی موبایل حس یک اپ واقعی داشته باشد.
- بدون اینترنت نیز بخش‌های اصلی آن کار کند.
- بعد از اتصال اینترنت داده‌ها Sync شوند.
- دو کاربر بتوانند حساب جداگانه داشته باشند.
- اطلاعات هر کاربر کاملاً از کاربر دیگر جدا باشد.
- در آینده بدون بازنویسی اساسی بتوان کاربران بیشتری اضافه کرد.
- کد پروژه روی GitHub نگهداری شود.
- نسخه آنلاین به‌صورت خودکار بعد از تغییر کد Deploy شود.

---

# 2. معماری نهایی پیشنهادی

```text
GitHub Repository
        │
        │
        ▼
Frontend / PWA
React + TypeScript
        │
        ├───────────────┐
        │               │
        ▼               ▼
Local Storage       Cloud Database
IndexedDB           Supabase
        │               │
        └────── Sync ───┘
                        │
                Authentication
                        │
                 User A / User B
```

---

# 3. تکنولوژی پیشنهادی

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui یا کامپوننت‌های اختصاصی
- Framer Motion
- Lucide Icons

## State Management

یکی از موارد زیر:

- Zustand
- React Context برای بخش‌های ساده

پیشنهاد:

`Zustand`

---

# 4. Database

## Online Database

پیشنهاد اصلی:

`Supabase PostgreSQL`

دلایل:

- Authentication
- Database
- Row Level Security
- Realtime
- Storage
- API
- Backup
- مناسب پروژه کوچک
- قابلیت رشد در آینده

---

# 5. Authentication

اپ باید قابلیت Login داشته باشد.

## روش‌های ورود

نسخه اول:

- Email + Password

نسخه بعدی:

- Google
- Apple
- Magic Link

---

# 6. حالت دو کاربر

در نسخه اولیه اپ فقط دو کاربر اصلی خواهند داشت.

ولی سیستم نباید Hardcode شود.

یعنی:

❌ اشتباه:

```text
user1
user2
```

در کد.

✅ درست:

هر حساب دارای:

```text
user_id
```

منحصر‌به‌فرد باشد.

تمام داده‌ها توسط `user_id` از هم جدا شوند.

---

# 7. Data Isolation

هر کاربر فقط باید اطلاعات خودش را ببیند.

مثال:

User A:

```text
Subjects
Sessions
Tasks
Goals
Settings
Achievements
```

User B:

```text
Subjects
Sessions
Tasks
Goals
Settings
Achievements
```

هیچ‌کدام نباید داده دیگری را مشاهده کنند مگر اینکه بعداً قابلیت اشتراک‌گذاری عمداً ساخته شود.

---

# 8. Row Level Security

برای تمام جدول‌های کاربری Supabase باید:

`RLS`

فعال باشد.

قاعده:

```text
auth.uid() == user_id
```

یعنی کاربر فقط رکوردهایی را بخواند یا تغییر دهد که متعلق به خودش هستند.

---

# 9. GitHub

تمام پروژه باید داخل GitHub Repository نگهداری شود.

ساختار پیشنهادی:

```text
studyflow/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── features/
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   ├── database/
│   ├── themes/
│   ├── utils/
│   └── types/
│
├── public/
│
├── docs/
│
├── supabase/
│   ├── migrations/
│   └── schema.sql
│
├── .github/
│   └── workflows/
│
├── README.md
├── PRODUCT_SPEC.md
├── CHANGELOG.md
├── package.json
└── vite.config.ts
```

---

# 10. GitHub Workflow

Branch اصلی:

```text
main
```

Branch توسعه:

```text
dev
```

Feature branch:

```text
feature/timer
feature/statistics
feature/themes
feature/authentication
```

Workflow:

```text
Feature Branch
      ↓
Pull Request
      ↓
Dev
      ↓
Test
      ↓
Main
      ↓
Automatic Deploy
```

---

# 11. Automatic Deployment

بعد از Push روی:

```text
main
```

GitHub Actions باید:

1. پروژه را Build کند.
2. تست‌ها را اجرا کند.
3. Production Build بسازد.
4. نسخه جدید را Deploy کند.

---

# 12. Hosting

کد پروژه:

`GitHub`

Frontend می‌تواند روی یکی از این‌ها Deploy شود:

- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages

ساختار سیستم باید مستقل از Hosting باشد تا در آینده بتوان سرویس را تغییر داد.

---

# 13. مهم — GitHub محل Database نیست

GitHub فقط برای:

- Source Code
- Version Control
- Issues
- Releases
- CI/CD

استفاده شود.

اطلاعات کاربران نباید داخل Repository ذخیره شوند.

---

# 14. اطلاعاتی که نباید داخل GitHub قرار بگیرند

هرگز نباید Commit شوند:

- Password
- Private API Key
- Service Role Key
- Database Password
- User Data
- Backup خصوصی
- Token

---

# 15. Environment Variables

فایل:

```text
.env
```

مثال:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

`.env`

باید داخل:

```text
.gitignore
```

باشد.

---

# 16. PWA

اپ باید Progressive Web App باشد.

یعنی کاربر بتواند روی موبایل:

```text
Add to Home Screen
```

انجام دهد.

بعد اپ تقریباً مانند برنامه مستقل باز شود.

---

# 17. PWA Requirements

- Installable
- Mobile First
- App Icon
- Splash Screen
- Offline Support
- Service Worker
- Cache
- Standalone Mode
- Responsive UI
- Theme Color
- Manifest

---

# 18. Offline First

اپ نباید کاملاً وابسته به اینترنت باشد.

بدون اینترنت باید بتوان:

- Timer را اجرا کرد.
- Session ثبت کرد.
- Task ساخت.
- Subject ساخت.
- History مشاهده کرد.
- Statistics مشاهده کرد.
- Goal مشاهده کرد.
- Theme تغییر داد.

---

# 19. Local Database

برای ذخیره اطلاعات Offline:

`IndexedDB`

استفاده شود.

LocalStorage فقط برای داده‌های کوچک استفاده شود.

---

# 20. Offline Sync

وقتی اینترنت قطع باشد:

```text
Session Created
      ↓
IndexedDB
      ↓
Pending Sync
```

وقتی اینترنت برگردد:

```text
Pending Sync
      ↓
Supabase
      ↓
Synced
```

---

# 21. Sync Status

در UI وضعیت Sync نمایش داده شود.

مثال:

```text
✓ Synced
```

```text
⟳ Syncing
```

```text
☁ Offline
```

```text
! Sync Failed
```

---

# 22. جلوگیری از Duplicate

هر رکورد باید UUID داشته باشد.

مثال:

```text
session_id
task_id
subject_id
goal_id
```

در هنگام Sync نباید یک Session دوبار ثبت شود.

---

# 23. Home

صفحه Home شامل:

- Greeting
- Avatar
- Current Date
- Daily Progress
- Quick Start
- Current Streak
- Today's Tasks
- Upcoming Exam
- Weekly Progress
- Subject Summary
- Focus Score

---

# 24. Quick Start

مطالعه باید حداکثر با 1 یا 2 لمس شروع شود.

گزینه‌ها:

- Continue Last Session
- Favorite Subject
- Stopwatch
- Pomodoro
- Custom Timer

---

# 25. Timer Modes

- Stopwatch
- Countdown
- Pomodoro
- Custom Pomodoro
- Open Focus Session
- Deep Focus

---

# 26. Timer Controls

- Start
- Pause
- Resume
- Finish
- Cancel
- Add Time
- Skip Break
- Restart

---

# 27. Timer Reliability

این بخش Critical است.

Timer باید:

- با خاموش شدن Screen ادامه پیدا کند.
- با Minimize شدن اپ از بین نرود.
- بعد از Refresh بازیابی شود.
- بعد از Crash قابل بازیابی باشد.
- زمان را بر اساس Timestamp واقعی محاسبه کند.
- در تغییر Timezone خراب نشود.
- Session تکراری ایجاد نکند.
- Session عبوری از نیمه‌شب را درست مدیریت کند.

---

# 28. Active Session Recovery

اگر کاربر هنگام مطالعه اپ را ببندد:

پس از باز کردن:

```text
Active Session Found

Physics
Started 42 minutes ago

[Continue]
[Finish]
[Discard]
```

---

# 29. Pomodoro

Default:

```text
Focus       25m
Short Break 5m
Long Break  15m
```

قابل شخصی‌سازی:

- Focus Duration
- Short Break
- Long Break
- Sessions Before Long Break
- Auto Start
- Auto Break

---

# 30. Subjects

هر درس:

```text
id
user_id
name
icon
emoji
color
cover
goal
priority
exam_date
created_at
archived
```

---

# 31. Topics

ساختار:

```text
Subject
 ├── Chapter
 │    ├── Topic
 │    └── Topic
 │
 └── Chapter
```

---

# 32. Tasks

هر Task:

```text
id
user_id
subject_id
topic_id
title
description
priority
deadline
estimated_minutes
actual_minutes
status
repeat
created_at
completed_at
```

---

# 33. Task Status

```text
Todo
In Progress
Completed
Skipped
Archived
```

---

# 34. Planner

## Daily

- Tasks
- Planned Study Time
- Completed Study Time

## Weekly

- Weekly Calendar
- Drag & Drop
- Reschedule
- Repeating Tasks

## Monthly

- Exams
- Goals
- Study Overview

---

# 35. Exams

هر Exam:

```text
name
subject
date
priority
target_hours
completed_hours
notes
```

نمایش:

```text
Physics Exam

12 Days Left

18 / 30 Hours
```

---

# 36. Study Sessions

هر Session:

```text
id
user_id
subject_id
topic_id
task_id
start_time
end_time
study_seconds
break_seconds
pause_seconds
timer_type
focus_rating
note
device_id
created_at
updated_at
sync_status
```

---

# 37. Manual Session

کاربر بتواند مطالعه‌ای که بدون Timer انجام شده را دستی ثبت کند.

مثال:

```text
Subject: Math
Date: Today
From: 14:00
To: 15:20

Study Time:
1h 20m
```

---

# 38. Statistics

فیلتر زمانی:

- Today
- Week
- Month
- Year
- Custom Range

---

# 39. Daily Statistics

- Study Time
- Session Count
- Average Session
- Goal Progress
- Subject Distribution

---

# 40. Weekly Statistics

- Weekly Total
- Daily Average
- Best Day
- Most Studied Subject
- Previous Week Comparison

---

# 41. Monthly Statistics

- Monthly Total
- Daily Average
- Active Days
- Best Week
- Subject Breakdown
- Goal Completion

---

# 42. Year Statistics

- Total Hours
- Total Sessions
- Best Month
- Best Day
- Longest Streak
- Favorite Subject

---

# 43. Charts

- Bar Chart
- Line Chart
- Donut Chart
- Area Chart
- Progress Ring
- Heatmap

Charts:

- Interactive
- Animated
- Touch Friendly

---

# 44. Study Heatmap

مشابه GitHub Contribution Graph.

Intensity:

```text
0 min
1–30 min
30–60 min
1–2 h
2–4 h
4+ h
```

---

# 45. Goals

Goal Types:

- Daily Time
- Weekly Time
- Monthly Time
- Subject Time
- Sessions
- Pages
- Questions

---

# 46. Streak

- Current Streak
- Longest Streak
- Rest Day
- Streak Freeze
- Streak Calendar

مثال:

```text
🔥 21 Day Streak
```

---

# 47. Gamification

## XP

مطالعه → XP

## Level

```text
Level 1
Level 2
...
```

## Achievements

- First Session
- 10 Hours
- 50 Hours
- 100 Hours
- 7 Day Streak
- 30 Day Streak
- Deep Focus
- Early Bird
- Night Owl

---

# 48. Virtual Companion

Optional.

انتخاب:

- Pet
- Plant
- Room
- Planet
- City

مطالعه باعث پیشرفت آن شود.

مثال:

```text
Study
  ↓
Coins
  ↓
Upgrade Study Room
```

---

# 49. Focus Score

بر اساس:

- Session Completion
- Pause Count
- Distractions
- Study Duration
- Goal Completion
- Consistency

مثال:

```text
Focus Score

87 / 100
```

---

# 50. Distraction Tracking

دکمه:

```text
I Got Distracted
```

دلیل:

- Instagram
- TikTok
- Messages
- Noise
- Phone
- Thought
- Other

---

# 51. Focus Sounds

- Rain
- Thunder
- Forest
- Ocean
- Fireplace
- Cafe
- Library
- White Noise
- Brown Noise
- Pink Noise

امکان Mix کردن چند صدا.

---

# 52. Design System

جهت طراحی:

- Modern
- Premium
- Minimal
- Liquid UI
- Expressive UI
- Rounded
- Soft Depth
- Floating Controls
- Smooth Motion
- Large Typography

---

# 53. مهم — استفاده کنترل‌شده از Glass

Glass نباید روی همه چیز استفاده شود.

استفاده مناسب:

- Navigation
- Floating Controls
- Modal
- Timer Controls

Content Cardها باید خوانایی بالا داشته باشند.

---

# 54. Themes

اپ باید از ابتدا Theme Engine واقعی داشته باشد.

Theme فقط Background نباشد.

Theme باید تغییر دهد:

- Background
- Surface
- Cards
- Navigation
- Buttons
- Timer
- Typography
- Icons
- Charts
- Effects
- Animation

---

# 55. Initial Themes

نسخه اولیه:

1. Liquid
2. Chrome
3. Pink Chrome
4. Dark Hero
5. AMOLED
6. Aurora
7. Cyber
8. Cozy Study
9. Sakura
10. Minimal
11. Space
12. Forest

---

# 56. Chrome Theme

ویژگی‌ها:

- Silver
- Metallic Surface
- Reflection
- Subtle Glow
- Glass
- Y2K
- Futuristic Typography

---

# 57. Pink Chrome

- Pink Metallic
- Silver
- Light Reflection
- Soft Glow
- Glass Controls

---

# 58. Dark Hero Theme

الهام کلی:

- Black
- Graphite
- Deep Gray
- Cinematic
- Minimal Yellow Accent

نباید Asset دارای Copyright از شخصیت خاصی داخل نسخه عمومی استفاده شود.

---

# 59. AMOLED

- True Black
- Minimal Glow
- High Contrast
- Battery Friendly

---

# 60. Custom Theme Builder

کاربر بتواند تغییر دهد:

- Primary Color
- Secondary Color
- Accent
- Background
- Border Radius
- Blur
- Font
- Timer Style
- Icons

---

# 61. Dynamic Themes

اختیاری:

Theme بر اساس:

- Time
- Subject
- Streak
- Focus Mode

تغییر کند.

---

# 62. Micro Interaction

- Button Scale
- Animated Numbers
- Progress Transition
- Card Morph
- Swipe Feedback
- Tab Animation

---

# 63. Haptics

برای:

- Start
- Pause
- Finish
- Goal Complete
- Achievement
- Navigation

قابل خاموش کردن باشد.

---

# 64. Reduce Motion

در Accessibility:

```text
Reduce Motion
```

وجود داشته باشد.

---

# 65. Widgets

## Small

```text
Today
2h 42m
```

## Medium

```text
Daily Goal
Quick Start
```

## Large

```text
Goal
Tasks
Weekly Progress
Quick Timer
```

---

# 66. Notifications

- Study Reminder
- Break Complete
- Focus Complete
- Exam Reminder
- Daily Goal
- Weekly Goal
- Streak Reminder

هر نوع Notification جداگانه قابل خاموش کردن باشد.

---

# 67. Profile

نمایش:

- Avatar
- Name
- Level
- XP
- Study Hours
- Streak
- Achievements
- Favorite Subject

---

# 68. User Settings Sync

موارد زیر بین دستگاه‌ها Sync شوند:

- Theme
- Language
- Timer Settings
- Pomodoro Settings
- Dashboard Layout
- Notifications Preferences
- Goals

---

# 69. Shared Features Between Two Users

نسخه اول اطلاعات خصوصی است.

در نسخه بعدی امکان Shared Features اضافه شود.

مثلاً:

```text
Shared Challenge
```

```text
Combined Weekly Goal
```

```text
Study Together
```

---

# 70. Study Together

دو کاربر بتوانند Session مشترک آغاز کنند.

نمایش:

```text
You        Focusing  32:18
Partner    Focusing  28:41
```

بدون Chat مزاحم هنگام Focus.

---

# 71. Shared Challenge

مثال:

```text
30 Hour Weekly Challenge

User A: 18h 20m
User B: 15h 45m

Combined:
34h 05m
```

---

# 72. Friend / Partner System

در آینده:

```text
friendships
```

جدول جدا داشته باشد.

و کاربران با تأیید دوطرفه به هم متصل شوند.

---

# 73. Privacy Between Two Users

حتی اگر دو نفر Friend باشند:

نباید به‌صورت پیش‌فرض بتوانند مشاهده کنند:

- Notes
- Full History
- Private Tasks
- Personal Goals

فقط داده‌ای نمایش داده شود که کاربر Share کرده است.

---

# 74. Live Presence

در آینده:

```text
Currently Studying
```

نمایش داده شود.

مثلاً:

```text
● Sara is focusing
```

قابل خاموش کردن باشد.

---

# 75. Weekly Review

مثال:

```text
Weekly Review

Study Time:
18h 22m

↑ 14%

Best Day:
Tuesday

Top Subject:
Physics

Goal:
92%

Streak:
11 days
```

---

# 76. Monthly Wrapped

ظاهر Story مانند.

مثال:

```text
September Wrapped

42h 18m
127 Sessions
21 Day Streak
Top Subject: Biology
Best Day: Sep 17
```

---

# 77. Yearly Wrapped

اسلایدهای:

1. Total Hours
2. Total Sessions
3. Best Month
4. Favorite Subject
5. Longest Streak
6. Most Productive Time
7. Achievements

---

# 78. Share Card

کارت تصویری قابل دانلود.

مثال:

```text
5h 12m
Studied Today
```

کاربر مشخص کند چه اطلاعاتی نمایش داده شود.

---

# 79. Persian Support

از ابتدا:

- Persian
- English

---

# 80. RTL

تمام UI فارسی باید Native RTL باشد.

نه صرفاً:

```css
text-align: right;
```

بلکه کل Layout RTL شود.

---

# 81. Number Format

انتخاب:

```text
123
```

یا:

```text
۱۲۳
```

---

# 82. Calendar

انتخاب:

- Jalali
- Gregorian

---

# 83. Week Start

انتخاب:

- Saturday
- Sunday
- Monday

---

# 84. Onboarding

حداکثر 4 تا 5 مرحله.

## Step 1

```text
What are you studying for?
```

- School
- University
- Exam
- Language
- Personal

## Step 2

Subjects

## Step 3

Daily Goal

## Step 4

Theme

## Step 5

Start Studying

---

# 85. Account Creation

در اولین باز شدن اپ نباید اجباری باشد.

گزینه:

```text
Continue Offline
```

و:

```text
Sign In
```

---

# 86. Upgrade Offline Account

اگر کاربر ابتدا Offline استفاده کرد و بعد Login کرد:

اطلاعات Local او باید به حساب Online منتقل شود.

---

# 87. Conflict Resolution

اگر داده Local و Cloud متفاوت بود:

سیستم نباید کورکورانه یکی را پاک کند.

Strategy:

```text
Newest Update Wins
```

برای موارد ساده.

برای Conflict مهم:

```text
Keep Local
Keep Cloud
Keep Both
```

---

# 88. Dashboard Customization

کاربر بتواند Cardها را Drag کند.

مثلاً:

```text
Daily Goal
Streak
Tasks
Weekly Chart
Exam
Focus Score
```

و هر کدام را:

- Move
- Hide
- Show

کند.

---

# 89. Global Quick Add

دکمه `+`

گزینه‌ها:

- Start Study
- Add Task
- Add Subject
- Add Exam
- Add Session

---

# 90. Search

Global Search:

- Subject
- Topic
- Task
- Session
- Note

---

# 91. Empty States

هیچ صفحه‌ای نباید خالی و مرده باشد.

مثال:

```text
No study sessions yet.

Start your first focus session.
```

Button:

```text
Start Studying
```

---

# 92. Undo

بعد از Delete:

```text
Session Deleted

UNDO
```

---

# 93. Error Handling

هیچ خطایی نباید باعث از دست رفتن داده شود.

وضعیت‌ها:

```text
Saved
Saving
Offline
Syncing
Failed
```

---

# 94. Database Tables

حداقل:

```text
profiles
subjects
topics
tasks
study_sessions
goals
exams
achievements
user_achievements
user_settings
themes
user_themes
distractions
sync_metadata
friendships
shared_challenges
challenge_members
```

---

# 95. Profiles Table

```text
profiles

id
username
display_name
avatar_url
created_at
updated_at
```

`id`

باید همان `auth.users.id` باشد.

---

# 96. Subjects Table

```text
subjects

id
user_id
name
icon
emoji
color
goal_minutes
exam_date
priority
archived
created_at
updated_at
```

---

# 97. Study Sessions Table

```text
study_sessions

id
user_id
subject_id
topic_id
task_id

start_time
end_time

study_seconds
break_seconds
pause_seconds

timer_type
focus_rating
notes

device_id

created_at
updated_at
```

---

# 98. Goals Table

```text
goals

id
user_id

type
target
period
subject_id

start_date
end_date

created_at
updated_at
```

---

# 99. Settings Table

```text
user_settings

user_id

language
calendar_type
number_format
week_start

theme_id

default_timer
pomodoro_focus
pomodoro_short_break
pomodoro_long_break

notifications
haptics
sounds
reduce_motion

updated_at
```

---

# 100. Database Indexes

Index روی:

```text
user_id
subject_id
start_time
created_at
updated_at
```

برای Performance.

---

# 101. Soft Delete

برای داده‌های مهم بهتر است ابتدا:

```text
deleted_at
```

استفاده شود.

به‌جای حذف فوری.

این امکان Undo و Restore می‌دهد.

---

# 102. Backup

کاربر بتواند Backup بگیرد.

Formats:

- JSON
- CSV

در آینده:

- PDF Report

---

# 103. Full Data Export

گزینه:

```text
Export My Data
```

باید شامل:

- Subjects
- Tasks
- Sessions
- Goals
- Settings

باشد.

---

# 104. Import

کاربر بتواند Backup قبلی را Import کند.

قبل از Import:

```text
Create Safety Backup
```

---

# 105. Security

- HTTPS
- Supabase RLS
- No Secrets in Frontend
- Input Validation
- Rate Limiting where needed
- Secure Authentication
- Session Expiration
- Safe Logout

---

# 106. Authorization

Authentication:

```text
Who are you?
```

Authorization:

```text
What are you allowed to access?
```

هر دو باید پیاده‌سازی شوند.

---

# 107. Admin

نسخه اولیه نیاز به Admin Panel کامل ندارد.

اما Database باید امکان Admin در آینده را داشته باشد.

Role:

```text
user
admin
```

---

# 108. Testing

حداقل Tests:

## Timer

- Pause
- Resume
- Background
- Refresh
- Midnight
- Offline

## Database

- Create
- Update
- Delete
- Sync

## Security

- User A cannot access User B data.

## Statistics

- Daily totals
- Weekly totals
- Monthly totals

---

# 109. Two-User Security Test

اجباری:

```text
Login User A
→ Attempt access User B data
→ Must fail
```

و برعکس.

---

# 110. Responsive Design

اندازه‌ها:

- Small Phone
- Large Phone
- Tablet
- Desktop

ولی اولویت:

`Mobile First`

---

# 111. Mobile Navigation

5 Tab:

```text
Home
Timer
Planner
Stats
Profile
```

---

# 112. Desktop Navigation

Sidebar:

```text
Home
Timer
Planner
Statistics
Subjects
History
Profile
Settings
```

---

# 113. Performance

هدف:

- Fast Initial Load
- Lazy Loading
- Code Splitting
- Optimized Images
- Minimal Bundle
- IndexedDB Cache
- Efficient Queries

---

# 114. Animation Performance

Animation فقط روی:

```text
transform
opacity
```

تا حد امکان.

از Animationهای سنگین هنگام Focus جلوگیری شود.

---

# 115. Accessibility

- Screen Reader
- Keyboard Navigation
- Large Text
- High Contrast
- Reduced Motion
- Reduced Transparency
- Accessible Labels
- Color Blind Safe Charts

---

# 116. Theme Accessibility

هر Theme باید Minimum Contrast مناسب داشته باشد.

Theme زیبا ولی ناخوانا قابل قبول نیست.

---

# 117. App Personality

اپ باید:

- Modern
- Premium
- Calm
- Personal
- Motivating
- Smooth

باشد.

نباید:

- Childish
- Overloaded
- Corporate
- Old-fashioned
- Distracting

باشد.

---

# 118. Main UX Principle

```text
Start Studying First.
Configure Later.
```

---

# 119. Second UX Principle

هیچ کاربری نباید برای شروع Timer مجبور باشد 5 صفحه جلو برود.

هدف:

```text
Home
 ↓
Start
```

---

# 120. Focus Mode Principle

هنگام مطالعه:

کمترین UI ممکن.

نمایش فقط:

```text
Subject
Timer
Progress
Pause
Finish
```

---

# 121. Initial Home Screen

```text
┌─────────────────────────────┐
│ Good evening 👋        👤   │
│                             │
│ TODAY                       │
│                             │
│          03:42              │
│         of 5:00             │
│                             │
│        [ START ]            │
│                             │
│ 🔥 12 Days     ⚡ Level 8   │
│                             │
│ Today's Tasks               │
│                             │
│ Physics              45m    │
│ Math                 60m    │
│                             │
│ Weekly Progress             │
│ ▁ ▃ ▆ ▅ █ ▂ ▃             │
│                             │
│ Home Timer Plan Stats Me    │
└─────────────────────────────┘
```

---

# 122. Focus Screen

```text
┌─────────────────────────────┐
│                             │
│          PHYSICS            │
│                             │
│                             │
│          42:18              │
│                             │
│        ◯◯◯◯◯◯◯             │
│                             │
│       Chapter 4             │
│                             │
│                             │
│        [ Pause ]            │
│                             │
│    Finish        •••        │
│                             │
└─────────────────────────────┘
```

---

# 123. Priority V1

## MUST HAVE

- Home
- Stopwatch
- Countdown
- Pomodoro
- Subjects
- Topics
- Tasks
- Planner
- Study History
- Manual Session
- Daily Stats
- Weekly Stats
- Monthly Stats
- Goals
- Heatmap
- Streak
- Themes
- Dark Mode
- Persian
- English
- RTL
- Jalali
- Notifications
- Offline Mode
- IndexedDB
- Login
- Two Separate Users
- Supabase
- RLS
- Cloud Sync
- Backup
- PWA
- GitHub Repository
- Automatic Deployment
- Accurate Timer

---

# 124. Priority V1.5

## SHOULD HAVE

- Widgets
- XP
- Achievements
- Coins
- Focus Score
- Distraction Tracking
- Ambient Sounds
- Weekly Review
- Monthly Wrapped
- Theme Store
- Shared Challenge

---

# 125. Priority V2

## NICE TO HAVE

- AI Study Assistant
- Virtual Companion
- Study Together
- Friends
- Live Presence
- App Blocking
- Calendar Integration
- Yearly Wrapped
- Advanced Social Features

---

# 126. AI Assistant

در آینده می‌تواند:

- Study Plan ایجاد کند.
- Weekly Summary بدهد.
- Study Pattern تحلیل کند.
- پیشنهاد Break بدهد.
- زمان مناسب Focus پیشنهاد دهد.
- Overloaded Schedule تشخیص دهد.

AI نباید برای عملکرد اصلی اپ اجباری باشد.

---

# 127. GitHub Issues

برای مدیریت توسعه:

Labels:

```text
bug
feature
ui
backend
database
security
performance
enhancement
priority-high
priority-medium
priority-low
```

---

# 128. Versioning

نسخه‌ها:

```text
v0.1.0
v0.2.0
v1.0.0
```

از Semantic Versioning استفاده شود.

---

# 129. Release Notes

برای هر Release:

```text
Added
Changed
Fixed
Removed
```

---

# 130. README

README شامل:

- Project Description
- Screenshots
- Features
- Installation
- Development
- Environment Variables
- Deployment
- Database Setup
- Contribution
- License

---

# 131. Development Commands

پروژه در نهایت باید چیزی شبیه این داشته باشد:

```bash
npm install
npm run dev
npm run build
npm run test
npm run lint
```

---

# 132. Code Quality

استفاده شود:

- ESLint
- Prettier
- TypeScript Strict Mode

قبل از Merge:

```text
Lint
Type Check
Tests
Build
```

باید Pass شوند.

---

# 133. GitHub Actions

Pipeline:

```text
Push
 ↓
Install
 ↓
Lint
 ↓
Type Check
 ↓
Test
 ↓
Build
 ↓
Deploy
```

---

# 134. Development Rule

هیچ Feature جدیدی نباید:

- Timer را خراب کند.
- Data Loss ایجاد کند.
- Offline Mode را خراب کند.
- Security را کاهش دهد.
- Sync را Duplicate کند.

---

# 135. Data Ownership

هر داده باید مشخص کند متعلق به چه کسی است.

تقریباً همه Tableهای کاربری باید:

```text
user_id
```

داشته باشند.

---

# 136. Future Scalability

هرچند در ابتدا فقط دو کاربر وجود دارند، معماری باید بتواند:

```text
2 Users
↓
10 Users
↓
100 Users
↓
1000+ Users
```

را بدون تغییر بنیادی پشتیبانی کند.

---

# 137. No Hardcoded User Limit

نباید داخل Code چیزی مانند:

```text
MAX_USERS = 2
```

وجود داشته باشد.

محدود بودن به دو نفر فقط وضعیت استفاده فعلی پروژه است، نه محدودیت معماری.

---

# 138. Deployment Goal

هدف نهایی:

کاربر لینک را روی موبایل باز کند:

```text
https://example-domain.com
```

سپس:

```text
Add to Home Screen
```

و اپ مانند App مستقل اجرا شود.

---

# 139. Final System

```text
                 GitHub
                    │
                    │ Source Code
                    ▼
             GitHub Actions
                    │
                    ▼
                Hosting
                    │
                    ▼
              StudyFlow PWA
               /          \
              /            \
       IndexedDB          Supabase
        Offline            Online
              \            /
               \          /
                  Sync
                    │
             ┌──────┴──────┐
             │             │
           User A        User B
```

---

# 140. Non-Negotiable Requirements

این موارد نباید قربانی ظاهر یا Featureهای اضافی شوند:

1. Timer دقیق باشد.
2. Data هیچ‌وقت بدون هشدار از بین نرود.
3. User A نتواند اطلاعات User B را ببیند.
4. Offline Mode واقعاً کار کند.
5. Sync داده تکراری نسازد.
6. UI روی موبایل سریع باشد.
7. شروع Study بسیار سریع باشد.
8. اپ بعد از Refresh Session فعال را فراموش نکند.
9. هیچ Secret داخل GitHub قرار نگیرد.
10. Themeها خوانایی را خراب نکنند.
11. Login تنها راه استفاده از اپ نباشد.
12. معماری به دو کاربر Hardcode نشود.

---

# 141. Final Product Vision

این اپ نباید فقط یک Timer باشد.

باید ترکیبی باشد از:

```text
Focus Timer
+
Study Tracker
+
Planner
+
Analytics
+
Personalization
+
Gamification
+
Offline App
+
Cloud Sync
+
Private Multi-user System
```

هدف این است که کاربر اپ را به‌عنوان مرکز اصلی مدیریت مطالعه خود استفاده کند.

ظاهر باید آن‌قدر جذاب باشد که کاربر بخواهد اپ را باز کند.

رابط باید آن‌قدر ساده باشد که بدون آموزش قابل استفاده باشد.

آمار باید آن‌قدر کاربردی باشد که کاربر واقعاً متوجه الگوی مطالعه خود شود.

و زیرساخت باید آن‌قدر قابل اعتماد باشد که کاربر بدون نگرانی تمام سابقه مطالعه خود را داخل آن نگه دارد.