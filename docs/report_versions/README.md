# سجل وإرشادات إصدارات تقارير التقويم التعليمي (Report Versions Registry)

هذا المجلد مخصص لحفظ وتوثيق كافة الإصدارات المعتمدة لشكل بطاقة تقويم الأعمال التطبيقية (مادة الإعلام الآلي — السنة أولى ثانوي 1AS).

> [!IMPORTANT]
> **اعتماد الذكاء الاصطناعي (AI Assistant Mandate)**:
> عند طلب المستخدم العودة إلى شكل أو إصدار معين، أو عند الاستفسار عن التصميم المعتمد للتقرير، يجب على أي نموذج ذكاء اصطناعي (AI) قراءة هذا الملف والملف المرجعي المقابل للإصدار المطلوب، وتطبيق الكود والقواعد المحددة فيه بدقة دون أي اجتهاد عشوائي يُخرب الهوامش أو الأعمدة أو التنسيق.

---

## 📋 سجل الإصدارات المعتمدة (Version Registry)

| رقم الإصدار (Version) | التاريخ والتوقيت (Timestamp) | الملف المرجعي الموثق (Specification) | الملف الاستعراضي التفاعلي (Live Preview) | الحالة (Status) | الملاحظات الأساسية |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **v2.4-canonical** | `2026-11-27 15:30:00 +01:00` | [`REPORT_SPEC_v2.4_2026-11-27_15-30-00.md`](file:///d:/enseignement/dev_tools/settings_projects/003/docs/report_versions/REPORT_SPEC_v2.4_2026-11-27_15-30-00.md) | [`REPORT_SPEC_v2.4_2026-11-27_15-30-00.preview.html`](file:///d:/enseignement/dev_tools/settings_projects/003/docs/report_versions/REPORT_SPEC_v2.4_2026-11-27_15-30-00.preview.html) | ⭐ **المرجع النهائي المعتمد (Active Canonical Master)** | التوازن الحسابي العمودي التام (الكاملة - الضائع = الممنوحة)، تغيير أسماء الأعمدة إلى (النقطة الكاملة \| الممنوحة \| الضائع)، الفصل القاطع بين نقاط الأداء (من 23) والخصومات الجزائية (من 20)، وبطاقات الشرح المنهجي الثلاثية الملونة في القسم (ج). |
| **v2.3-archive** | `2026-11-27 12:15:00 +01:00` | [`REPORT_SPEC_v2.3_2026-11-27_12-15-00.md`](file:///d:/enseignement/dev_tools/settings_projects/003/docs/report_versions/REPORT_SPEC_v2.3_2026-11-27_12-15-00.md) | [`REPORT_SPEC_v2.3_2026-11-27_12-15-00.preview.html`](file:///d:/enseignement/dev_tools/settings_projects/003/docs/report_versions/REPORT_SPEC_v2.3_2026-11-27_12-15-00.preview.html) | 📦 أرشيف معتمد سابق | ضمان تحميل ورسم شعار الأستاذ 100% عبر `ensureLogoReady`، منع خروج النصوص وتداخلها قطعياً (قص سطر المجاميع وجدول خصومات مقصوص بـ 5 أعمدة)، تكبير خطوط التقرير عامة للطباعة والشاشات، نظام تخطي الأسئلة (تخطي هذا السؤال / تخطي كل الأسئلة مع التأكيد والتصفير وفق القاعدة الثلاثية)، والحظر التام لكلمة «بيداغوجي». |
| **v2.2-archive** | `2026-11-27 11:15:00 +01:00` | [`REPORT_SPEC_v2.2_2026-11-27_11-15-00.md`](file:///d:/enseignement/dev_tools/settings_projects/003/docs/report_versions/REPORT_SPEC_v2.2_2026-11-27_11-15-00.md) | [`REPORT_SPEC_v2.2_2026-11-27_11-15-00.preview.html`](file:///d:/enseignement/dev_tools/settings_projects/003/docs/report_versions/REPORT_SPEC_v2.2_2026-11-27_11-15-00.preview.html) | 📦 أرشيف معتمد سابق | الشعار مقتصر حصراً على اختيار الأستاذ من `inf.dll`، إبراز بطاقتي العلامة والوقت في أعلى التقرير فوراً، جدول منسق للمشاركين (# \| اللقب \| الاسم)، حماية تاريخ الإنجاز داخل الإطار مع هامش أمان (>48px)، جدول مخصص ومفصل للخصومات الجزائية (ج)، الحظر التام لكلمة «بيداغوجي» واستبدالها بلغة عربية واضحة، وتذييل برقم الصفحة. |
| **v2.1-archive** | `2026-11-27 09:45:00 +01:00` | [`REPORT_SPEC_v2.1_2026-11-27_09-45-00.md`](file:///d:/enseignement/dev_tools/settings_projects/003/docs/report_versions/REPORT_SPEC_v2.1_2026-11-27_09-45-00.md) | [`REPORT_SPEC_v2.1_2026-11-27_09-45-00.preview.html`](file:///d:/enseignement/dev_tools/settings_projects/003/docs/report_versions/REPORT_SPEC_v2.1_2026-11-27_09-45-00.preview.html) | 📦 أرشيف معتمد سابق | شارات دقيقة لاستنفاد محاولات الأسئلة، تفصيل الخصومات في الخطوة 5. |
| **v2.0-archive** | `2026-11-27 09:15:29 +01:00` | [`REPORT_SPEC_v2.0_2026-11-27_09-15-29.md`](file:///d:/enseignement/dev_tools/settings_projects/003/docs/report_versions/REPORT_SPEC_v2.0_2026-11-27_09-15-29.md) | [`REPORT_SPEC_v2.0_2026-11-27_09-15-29.preview.html`](file:///d:/enseignement/dev_tools/settings_projects/003/docs/report_versions/REPORT_SPEC_v2.0_2026-11-27_09-15-29.preview.html) | 📦 أرشيف معتمد سابق | استعادة جدول بيانات التلميذ والجلسة 3 أعمدة (أ)، بطاقتي التمييز العريضتين للعلامة والوقت، جدول 9 أعمدة (ب). |

---

## 🔄 بروتوكول الذكاء الاصطناعي لاسترجاع أو إضافة إصدار (AI Protocols)

### 1. بروتوكول استرجاع إصدار سابق (Reversion Protocol)
عندما يطلب المستخدم: *"عد إلى الإصدار v2.0 من التقرير"* أو *"استعد شكل التقرير المعتمد في تاريخ كذا"*:
1. افتح الملف المرجعي المحدد لذلك الإصدار (مثلاً `REPORT_SPEC_v2.0_2026-11-27_09-15-29.md`).
2. راجع قسم **الهيكلية البرمجية (Code Implementation)** في `js/pedagogy/report.js`.
3. انسخ التوليد البرمجي لـ `buildA4Html` و `renderA4ReportCanvas` بما يتطابق 100% مع مواصفات ذلك الإصدار.
4. تأكد من تشغيل كافة الاختبارات عبر:
   ```bash
   node test/test-participant-removal-and-3col-report.js
   node test/test-report-redesign.js
   node test/test-student-edit-audit-and-report.js
   ```

### 2. بروتوكول توثيق إصدار جديد عند التعديل (New Version Protocol)
إذا طلب المستخدم مستقبلاً تعديلاً رسمياً جديداً على شكل التقرير وتم اعتماده:
1. توليد اسم ملف جديد مختوم بالتاريخ والوقت ورقم الإصدار:
   `REPORT_SPEC_v[X.Y]_[YYYY-MM-DD]_[HH-mm-ss].md`
   `REPORT_SPEC_v[X.Y]_[YYYY-MM-DD]_[HH-mm-ss].preview.html`
2. توثيق الفروق والتعديلات الجديدة عن الإصدار السابق في الملف.
3. إضافة سطر الإصدار الجديد في جدول `📋 سجل الإصدارات المعتمدة` أعلاه.
