# یادداشت فنی یکپارچه‌سازی StudyFlow 14.0.1

- مبنا: آرشیو اصلی دریافت‌شده؛ `main` در `c8ebf27`.
- اصلاح ادغام: رویه v13.8 در `useMonthlyReward.ts` و `Settings.tsx` بخش‌هایی از Sync و ریاضی جایزه را حذف می‌کرد. این بخش‌ها از `main` حفظ شدند و فقط نمایش تاریخ شمسی به آنها اضافه شد.
- در `History.tsx` فراخوانی `requestSync` پس از ثبت Session دستی حفظ شد.
- v14 `StudyOS.tsx` یک اشکال TypeScript درباره متغیر `reviewSubject` و یک import بلااستفاده داشت؛ اصلاح شدند.
- برای کاهش شلوغی، GrowthHub و SocialChallenge از Home به `/progress` منتقل شدند.
- فرمت `Admin.dateLabel` به شمسی تبدیل شد.
- هیچ فایل SQL یا داده‌ای در Supabase تغییر نکرده است.

## آزمون‌ها در محیط تولید بسته

- TypeScript: موفق (`tsc -b --pretty false` با کتابخانه‌های استخراج‌شده از آرشیو ویندوز).
- ESLint: موفق.
- Logic smoke: موفق (شمسی/نوروز، سه timezone، اعتبارسنجی دعوت، اولویت StudyOS و ایزوله‌سازی حساب).
- Vitest/Vite build: *در محیط بسته‌سازی اجرا نشد*؛ وابستگی باینری `@rollup/rollup-linux-x64-gnu` در آرشیو Windows موجود نبود. اسکریپت روی ویندوز با `npm ci` این تست‌ها را **اجباری** اجرا می‌کند.
- Supabase دو دستگاه و مرورگر آیفون: آزمایش نشده؛ نیازمند QA پیش از Merge.

## برگشت

تا قبل از Merge، شاخه `main` تغییری نمی‌کند. اگر PR ایراد داشت آن را Merge نکن. در صورت Merge، از GitHub Revert برای همان Commit/PR استفاده کن. تاریخچه و پوشه قبلی را به‌عنوان Backup نگه دار.
