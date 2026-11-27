# وثيقة اعتماد وتوصيف تقرير التقويم الرسمي — الإصدار v2.0
**Official Pedagogical Assessment Report Specification (v2.0-canonical)**

- **رقم الإصدار (Version)**: `v2.0-canonical`
- **تاريخ وتوقيت الاعتماد (Timestamp)**: `2026-11-27 09:15:29 +01:00`
- **الحالة (Status)**: معتمد نهائياً كمعيار أساسي (Canonical Standard)
- **المرجع البصري والوثائقي (Origin Reference)**:
  - الصورة المعتمدة 1 (بطاقة تقويم 14.78 / 20.00 — وقت 00:07:48).
  - الملف التنفيذي المرجعي المرفق: `5_9.57_00-01-50_atik_mohamed_lamine.pdf`.
- **المجال التعلمي والمستوى**: مادة الإعلام الآلي — السنة أولى ثانوي (جذع مشترك علوم وتكنولوجيا / آداب) — لوحة التحكم وإعدادات Windows 11.

---

> [!IMPORTANT]
> ### تعليمات إلزامية لأي نموذج ذكاء اصطناعي (AI Prompt & Contract)
> إذا طلب المستخدم منك مستقبلاً العودة إلى هذا الإصدار أو ضبط التقرير ليكون مطابقاً للنسخة المعتمدة، **يجب عليك الالتزام التام بالقواعد التالية دون أي تغيير عشوائي**:
> 1. **عدم تخريب الأعمدة أو الهوامش**: جدول المهام (القسم ب) يتألف حصرياً من **9 أعمدة** واضحة العناوين والنسب.
> 2. **ثبات بطاقتي التمييز العريضتين في الأعلى**: البطاقتان بنسبة 50%/50% أسفل بيانات التلميذ مباشرة (اليمنى للعلامة النهائية من 20، واليسرى للوقت وحالة الجلسة)، بخطوط عريضة متباينة وشارات ملونة معتمدة.
> 3. **فصل اللقب عن الاسم دائماً**: إدراج وسم `<span style="color:#64748B;font-weight:600;">اللقب:</span>` ثم اللقب بخط عريض، يليه `&nbsp;|&nbsp;` ثم `<span style="color:#64748B;font-weight:600;">الاسم:</span>` ثم الاسم بخط عريض.
> 4. **استيعاب العمل المشترك (الشركاء)**: عند وجود أكثر من تلميذ في الجلسة، يتحول عمود الاسم إلى قائمة مرقمة رأسياً `1) اللقب: ... الاسم: ... <br> 2) اللقب: ... الاسم: ...` مع وسم `(عمل مشترك)`.
> 5. **القسم (ج) 5 خطوات حسابية**: خطوات التفكيك الحسابي تتوقف عند الخطوة 5 (مجموع الخصومات)، ولا يتم تكرار بطاقة العلامة النهائية في الأسفل لوجودها في البطاقة العريضة العلوية.
> 6. **القسم (د) المشروط**: سجل التدقيق لا يظهر نهائياً في الجلسة النزيهة العادية، ويظهر فقط عند تعديل البيانات أو استبعاد تلميذ، ويوثق صراحة عدد المهام المنجزة عند لحظة الاستبعاد.
> 7. **عدم فرض الشعار افتراضياً**: لا يُدرج أي شعار داخل التقرير إلا إذا تم رفعه وتفعيله من إعدادات الأستاذ في ملف `inf.dll`.

---

## 📐 الهيكلية المعمارية للتقرير (Detailed Architectural Anatomy)

```
+----------------------------------------------------------------------------------------------------+
| الجمهورية الجزائرية الديمقراطية الشعبية — وزارة التربية الوطنية                                     |
| المؤسسة: مدرسة الشهيد قورين محمد الأغواط             [الشعار]       Année scolaire: 2026 / 2027    |
| الأستاذ المشرف: أستاذ مادة المعلوماتية                               Niveau: السنة أولى ثانوي...    |
+----------------------------------------------------------------------------------------------------+
| بطاقة تقويم الأعمال التطبيقية — مادة الإعلام الآلي                                                  |
| المجال التعلمي: بيئة التعامل مع الحاسوب (لوحة التحكم وإعدادات نظام التشغيل Windows 11)             |
+----------------------------------------------------------------------------------------------------+
| القسم (أ): بيانات التلميذ والجلسة التقويمية (جدول a4-info-table داخل a4-student-box)               |
| [36%] اسم ولقب التلميذ: اللقب: ... | الاسم: ...     | [32%] الفوج ورقم الجهاز: 5 | حاسوب #06       |
|       (أو قائمة المشاركين 1) ... 2) ... )           | [32%] طبيعة النشاط: تطبيقي تدريبي            |
|----------------------------------------------------------------------------------------------------|
| [36%] المشرف والمؤسسة: أستاذ المعلوماتية | قورين    | [32%] تاريخ وتوقيت الإنجاز: 27 نوفمبر 2026   |
|                                                     | [32%] الوقت الإجمالي وحالة الجلسة: 00:07:48  |
+----------------------------------------------------------------------------------------------------+
| بطاقتي التمييز العريضتين (a4-top-summary-card)                                                     |
| [50% يمين] العلامة النهائية المستحقة:               | [50% يسار] الوقت المستغرق وحالة الجلسة:     |
| 14.78 / 20.00   (14.78 من أصل 20.00)                | 00:07:48                                     |
| ✔ مستوفٍ لمعيار النجاح — معتمد                      | ✔ جلسة مكتملة ومستوفاة لكافة المهام (6 / 6)  |
+----------------------------------------------------------------------------------------------------+
| القسم (ب): جدول التفصيل الدقيق للمهام العملية والأسئلة التقويمية (9 أعمدة)                         |
| # | المهمة التطبيقية أو السؤال التقويمي | النوع | الحالة | المحاولات | المعامل الأقصى | الممنوحة | الخصم | الملاحظات وتفاصيل الإنجاز |
| 1 | تخصيص الخلفية ولون التمييز         | مهمة  | مكتملة | 1         | 3.00          | 3.00     | 0.00  | تم إنجاز كافة الخطوات     |
| س1| سؤال تقويم الكفاءة المرحلية...     | سؤال  | معطل   | -         | 1.00          | 0.00     | -1.00 | تم إلغاء تفعيل الأسئلة... |
|...|------------------------------------+-------+--------+-----------+---------------+----------+-------+---------------------------|
| المجموع الكلي لمعاملات ونقاط المهام والأسئلة:                       | 23.00         | 17.00    | -6.00 | استيفاء 17.00 من 23.00    |
+----------------------------------------------------------------------------------------------------+
| القسم (ج): التفكيك الحسابي للعلامة (كيف تم احتساب المعدل خطوة بخطوة)                               |
| 1. مجموع معاملات المهام العملية: 17.00 نقطة (حصلت على 17.00)                                       |
| 2. مجموع معاملات الأسئلة: 6.00 نقطة (حصلت على 0.00)                                                |
| 3. مجموع النقاط التي حصلت عليها (معاملات): 17.00 / 23.00 نقطة                                       |
| 4. العلامة قبل الخصم (من 20): 14.78 / 20 (القاعدة الثلاثية: (17.00 ÷ 23.00) × 20)                 |
| 5. مجموع الخصومات: 0.00 نقطة (أداء نظامي سليم بدون خصومات)                                         |
+----------------------------------------------------------------------------------------------------+
| القسم (د): سجل تدقيق وتعديل بيانات الهوية والجلسة (مشروط بوجود تعديل أو حذف أثناء الجلسة)          |
| المرحلة | توقيت النظام | وقت المحاكاة | نسبة الإنجاز | البيان المعدل | تفاصيل التغيير (سابق -> جديد)     |
+----------------------------------------------------------------------------------------------------+
| القسم (هـ): توجيهات وملاحظات الأستاذ(ة) المشرف(ة) — التاريخ والتوقيع والختم الرسمي                  |
+----------------------------------------------------------------------------------------------------+
```

---

## 💻 الكود المصدري البرمجي المعتمد (Implementation Code)

### 1. توليد كود HTML في `js/pedagogy/report.js`:

```javascript
// ==========================================
// SECTION A: STUDENT INFO BOX & TABLE (EXACT CANONICAL PDF LAYOUT)
// ==========================================
var isMultiStudent = Array.isArray(stu.participants) && stu.participants.length > 1;
var studentBoxHtml = '';
var studentCellContent = '';

if (isMultiStudent) {
    var pListStr = stu.participants.map(function (p, idx) {
        var l = String(p.lastName || '—').trim().toUpperCase();
        var f = String(p.firstName || '—').trim().toUpperCase();
        return (idx + 1) + ') <span style="color:#64748B;font-weight:600;">' + bidi('اللقب:') + '</span> <strong>' + bidi(l) + '</strong> &nbsp;<span style="color:#64748B;font-weight:600;">' + bidi('الاسم:') + '</span> <strong>' + bidi(f) + '</strong>';
    }).join('<br>');
    studentCellContent = pListStr;
} else {
    var sL = String(stu.lastName || '—').trim().toUpperCase();
    var sF = String(stu.firstName || stu.fullName || '—').trim().toUpperCase();
    studentCellContent = '<span style="color:#64748B;font-weight:600;">' + bidi('اللقب:') + '</span> <strong>' + bidi(sL) + '</strong> &nbsp;&nbsp;|&nbsp;&nbsp; <span style="color:#64748B;font-weight:600;">' + bidi('الاسم:') + '</span> <strong>' + bidi(sF) + '</strong>';
}

studentBoxHtml =
    '<div class="a4-section-title">' +
        '<span>' + bidi('القسم (أ): بيانات التلميذ والجلسة التقويمية') + '</span>' +
        '<span style="font-size:11px;color:#475569;font-weight:normal;">' + bidi('بيانات رسمية معتمدة') + '</span>' +
    '</div>' +
    '<div class="a4-student-box">' +
        '<table class="a4-info-table">' +
            '<tbody>' +
                '<tr>' +
                    '<td style="width:36%;">' +
                        '<div class="a4-cell-lbl">' + bidi(isMultiStudent ? 'المشاركون في العمل التطبيقي:' : 'اسم ولقب التلميذ(ة):') + '</div>' +
                        '<div class="a4-cell-val" style="font-size:13px;font-weight:700;color:#0F172A;">' + studentCellContent + '</div>' +
                    '</td>' +
                    '<td style="width:32%;">' +
                        '<div class="a4-cell-lbl">' + bidi('الفوج التربوي ورقم الجهاز:') + '</div>' +
                        '<div class="a4-cell-val"><strong>' + bidi(stu.classGroup) + '</strong> &nbsp;|&nbsp; <span>' + bidi('حاسوب') + ' <bdi dir="ltr">#' + pcNum + '</bdi></span></div>' +
                    '</td>' +
                    '<td style="width:32%;">' +
                        '<div class="a4-cell-lbl">' + bidi('طبيعة النشاط ونمط المحاكاة:') + '</div>' +
                        '<div class="a4-cell-val"><strong>' + bidi(sessionLabel) + '</strong>' + (isMultiStudent ? (' <span style="font-size:10.5px;color:#0284C7;font-weight:700;">(' + bidi('عمل مشترك') + ')</span>') : '') + '</div>' +
                    '</td>' +
                '</tr>' +
                '<tr>' +
                    '<td>' +
                        '<div class="a4-cell-lbl">' + bidi('المشرف البيداغوجي والمؤسسة (inf.dll):') + '</div>' +
                        '<div class="a4-cell-val"><strong>' + bidi(cfg.teacher_name || 'أستاذ مادة المعلوماتية') + '</strong> &nbsp;|&nbsp; <span>' + bidi(cfg.institution_name || 'مؤسسة أبي بكر الحاج عيسى (الأغواط)') + '</span></div>' +
                    '</td>' +
                    '<td>' +
                        '<div class="a4-cell-lbl">' + bidi('تاريخ وتوقيت الإنجاز:') + '</div>' +
                        '<div class="a4-cell-val"><strong><bdi dir="ltr">' + bidi(dateFormatted) + '</bdi></strong></div>' +
                    '</td>' +
                    '<td>' +
                        '<div class="a4-cell-lbl">' + bidi('الوقت الإجمالي المستغرق:') + '</div>' +
                        '<div class="a4-cell-val"><strong><bdi dir="ltr">' + bidi(totalDurationStr) + '</bdi></strong> &nbsp;|&nbsp; ' + sessionProgressBadgeHtml + '</div>' +
                    '</td>' +
                '</tr>' +
            '</tbody>' +
        '</table>' +
    '</div>';

// ==========================================
// TOP SCORE & DURATION HIGHLIGHT CARD
// ==========================================
var durSubText = isAllDone
    ? 'تم تثبيت وقت الإنجاز النهائي لكافة المهام'
    : timeClarifierText;
var durBadgeText = isAllDone
    ? ('✔ جلسة مكتملة ومستوفاة لكافة المهام (' + doneTasksCount + ' / ' + enabledTasks.length + ' مهام — 100%)')
    : timeBadgeText;

var topSummaryCardHtml =
    '<div class="a4-top-summary-card">' +
        '<div class="a4-tsc-score ' + (isPassed ? 'is-pass' : 'is-fail') + '">' +
            '<div class="a4-tsc-title">' + bidi('العلامة النهائية المستحقة:') + '</div>' +
            '<div class="a4-tsc-grade" dir="ltr" style="direction:ltr !important;"><bdi dir="ltr"><span class="a4-score-earned">' + finalScoreStr + '</span> <span class="a4-tsc-out">/ 20.00</span></bdi></div>' +
            '<div style="font-size:11px;font-weight:700;color:' + (isPassed ? '#15803D' : '#B45309') + ';margin:2px 0;"><bdi dir="ltr">(' + finalScoreStr + ' ' + bidi('من أصل') + ' 20.00)</bdi></div>' +
            '<div class="a4-tsc-badge"><span class="a4-pass-badge ' + (isPassed ? 'is-pass' : 'is-fail') + '" style="display:inline-flex;align-items:center;justify-content:center;gap:4px;">' + passBadgeIcon + ' <span>' + bidi(passBadgeText) + '</span></span></div>' +
        '</div>' +
        '<div class="a4-tsc-time ' + (isAllDone ? 'is-done' : 'is-partial') + '">' +
            '<div class="a4-tsc-title">' + bidi('الوقت المستغرق وحالة الجلسة:') + '</div>' +
            '<div class="a4-tsc-grade"><bdi dir="ltr">' + bidi(totalDurationStr) + '</bdi></div>' +
            '<div style="font-size:11px;font-weight:600;color:' + (isAllDone ? '#15803D' : '#B45309') + ';margin:2px 0;">' + bidi(durSubText) + '</div>' +
            '<div class="a4-tsc-badge"><span class="a4-badge ' + (isAllDone ? 'is-done' : 'is-partial') + '" style="display:inline-flex;align-items:center;justify-content:center;gap:4px;"><span>' + bidi(durBadgeText) + '</span></span></div>' +
        '</div>' +
    '</div>';

// ==========================================
// SECTION B: BREAKDOWN TABLE HEADERS (9 COLUMNS)
// ==========================================
// <thead>
//     <tr>
//         <th style="width:3.5%;text-align:center;">#</th>
//         <th style="width:26%;text-align:right;">المهمة التطبيقية أو السؤال التقويمي</th>
//         <th style="width:8%;text-align:center;">النوع</th>
//         <th style="width:10%;text-align:center;">الحالة</th>
//         <th style="width:6.5%;text-align:center;">المحاولات</th>
//         <th style="width:8%;text-align:center;">المعامل الأقصى</th>
//         <th style="width:8%;text-align:center;">الممنوحة</th>
//         <th style="width:7%;text-align:center;">الخصم</th>
//         <th style="width:23%;text-align:right;">الملاحظات وتفاصيل الإنجاز</th>
//     </tr>
// </thead>
```

---

## 🎨 جدول التنسيقات والأنماط (CSS Style Definitions)

| الصنف (Class Selector) | الاستخدام والغرض البيداغوجي | الخصائص الأساسية |
| :--- | :--- | :--- |
| `.a4-section-title` | عناوين الأقسام الرئيسية (أ، ب، ج، د، هـ) | `background: #F1F5F9; border-right: 4px solid #1E3A8A; font-size: 12.5px; font-weight: 700;` |
| `.a4-info-table` | جدول بيانات التلميذ والجلسة التقويمية | `width: 100%; border-collapse: collapse; font-size: 11px; background: #FFF; border: 1px solid #CBD5E1;` |
| `.a4-top-summary-card` | حاضنة بطاقتي التمييز العريضتين | `display: flex; gap: 10px; margin: 8px 0 12px 0; align-items: stretch;` |
| `.a4-tsc-score` | البطاقة اليمنى للعلامة النهائية المستحقة | `flex: 1 1 50%; background: #F0FDF4; border: 2px solid #16A34A; border-radius: 6px;` |
| `.a4-tsc-time` | البطاقة اليسرى لتوقيت الإنجاز وحالة الجلسة | `flex: 1 1 50%; background: #EFF6FF; border: 2px solid #2563EB; border-radius: 6px;` |
| `.a4-report-table` | جدول المهام العملية والأسئلة التقويمية | `width: 100%; border-collapse: collapse; font-size: 10.5px; line-height: 1.45;` |
| `.a4-math-steps` | شبكة تفكيك خطوات احتساب المعدل خطوة بخطوة | `display: flex; flex-direction: column; gap: 4px; font-size: 11px;` |
| `.a4-audit-table` | سجل مكافحة الانتحال وتعديل المشاركين | `border: 1px solid #F59E0B; background: #FFF; font-size: 10.5px;` |

---

## 🧪 اختبارات الجودة المعتمدة للتحقق (Validation Test Suite)

للتأكد البرمجي من أن أي تغيير مستقبلي لم يكسر هذا الإصدار:
```powershell
node test/test-participant-removal-and-3col-report.js
node test/test-report-redesign.js
node test/test-student-edit-audit-and-report.js
node test/test-multi-participants-and-session-reset.js
node test/test-hud-close-and-reactivity.js
node test/test-filename-template-and-inf-detect.js
node test/test-silent-boot-and-defaults.js
```
**شرط النجاح**: اجتياز 100% من الاختبارات دون أي تحذير أو فشل.
