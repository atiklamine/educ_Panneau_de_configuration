/**
 * Algerian 1AS Pedagogical Assessment Engine & Time-Based Evaluation (RAM-only Student State)
 */
(function (global) {
    'use strict';

    var TASK_SECTION_MAP = {
        timeLanguage: [1, 3],
        devices: [2],
        personalization: [4],
        apps: [5],
        accounts: [6]
    };

    var SECTION_TITLE_AR = {
        timeLanguage: 'الوقت واللغة',
        devices: 'الأجهزة والفأرة',
        personalization: 'التخصيص والمظهر',
        apps: 'التطبيقات والميزات',
        accounts: 'حسابات المستخدمين'
    };

    var TASK_SUBSTEPS_CATALOG = {
        1: [
            { id: 0, labelAr: 'تغيير لغة عرض واجهة Windows من الإعدادات', labelFr: 'Modifier la langue d\'affichage' }
        ],
        2: [
            { id: 0, labelAr: 'ضبط سرعة النقر المزدوج على "سريعة"', labelFr: 'Régler la vitesse du double-clic sur Rapide' },
            { id: 1, labelAr: 'اختيار نظام مؤشر مخصص (LimeGreen أو Noir)', labelFr: 'Choisir le curseur LimeGreen ou Noir' }
        ],
        3: [
            { id: 0, labelAr: 'إضافة لغة الإدخال العربية (الجزائر) إلى لوحات المفاتيح', labelFr: 'Ajouter la langue Arabe (Algérie)' },
            { id: 1, labelAr: 'ضبط المنطقة الزمنية على الجزائر (GMT+1)', labelFr: 'Régler le fuseau horaire sur GMT+1' }
        ],
        4: [
            { id: 0, labelAr: 'تغيير الخلفية باختيار إحدى الصور المعروضة في نافذة الإعدادات', labelFr: 'Choisir une image parmi celles affichées dans la fenêtre' },
            { id: 1, labelAr: 'تغيير الخلفية باختيار صورة من مجلد الصور (Pictures) عبر زر "استعراض صور"', labelFr: 'Choisir une image dans le dossier Pictures via Parcourir' },
            { id: 2, labelAr: 'تغيير لون التمييز للنظام (Accent Color)', labelFr: 'Modifier la couleur d\'accentuation' }
        ],
        5: [
            { id: 0, labelAr: 'تشغيل ملف LabTools_Setup.exe وتثبيت البرنامج', labelFr: 'Exécuter LabTools_Setup.exe et installer' },
            { id: 1, labelAr: 'فتح تطبيق LabTools من قائمة ابدأ لتجربته ثم إغلاقه', labelFr: 'Ouvrir LabTools depuis Démarrer et fermer' },
            { id: 2, labelAr: 'إلغاء تثبيت التطبيق من الإعدادات ← التطبيقات المثبتة', labelFr: 'Désinstaller l\'application' },
            { id: 3, labelAr: 'فتح قائمة ابدأ للتحقق من اختفاء التطبيق بعد حذفه', labelFr: 'Vérifier la disparition de LabTools de Démarrer' },
            { id: 4, labelAr: 'تفعيل ميزة اختيارية (Paint/Notepad/Games) من الميزات الاختيارية', labelFr: 'Activer une fonctionnalité facultative' },
            { id: 5, labelAr: 'فتح الميزة المفعلة (كالرسام) من قائمة ابدأ لتجربتها ثم إغلاقها', labelFr: 'Ouvrir la fonctionnalité depuis Démarrer et fermer' },
            { id: 6, labelAr: 'إزالة/تعطيل الميزة الاختيارية من الإعدادات', labelFr: 'Désactiver la fonctionnalité facultative' },
            { id: 7, labelAr: 'فتح قائمة ابدأ للتحقق من اختفاء الميزة بعد تعطيلها', labelFr: 'Vérifier la disparition de la fonctionnalité de Démarrer' }
        ],
        6: [
            { id: 0, labelAr: '(A) إنشاء حسابين قياسيين (Standard) ثم حذفهما', labelFr: 'A: Créer et supprimer 2 comptes standard' },
            { id: 1, labelAr: '(B) إنشاء حسابي مسؤول وحذف القديم MENIAI وإبقاء آخر مسؤول', labelFr: 'B: Créer 2 admins, garder le dernier' },
            { id: 2, labelAr: '(C) تفعيل حساب الضيف واختبار قيود الصلاحيات وحظر UAC', labelFr: 'C: Activer Invité et tester blocage UAC' },
            { id: 3, labelAr: '(D) إنشاء حساب قياسي جديد محمي بكلمة مرور', labelFr: 'D: Créer un compte avec mot de passe' },
            { id: 4, labelAr: '(E) تسجيل الدخول للحساب القياسي بكلمة المرور ثم الخروج', labelFr: 'E: Connexion et déconnexion' },
            { id: 5, labelAr: '(F) العودة للمسؤول وتعديل كلمة مرور الحساب القياسي', labelFr: 'F: Modification du mot de passe par l\'admin' },
            { id: 6, labelAr: '(G) الدخول مجدداً للحساب القياسي بكلمة المرور الجديدة', labelFr: 'G: Vérification avec nouveau mot de passe' },
            { id: 7, labelAr: '(H) تحديث الصورة الرمزية للحساب (Avatar)', labelFr: 'H: Changer l\'avatar du compte' }
        ]
    };

    function getDefaultConfig() {
        return {
            institution_name: 'ثانوية الشهيد أحمد رضا حوحو',
            teacher_name: 'الأستاذ حاج عيسى',
            target_level: 'السنة أولى ثانوي (جذع مشترك علوم وتكنولوجيا / آداب)',
            academic_year: '2026 / 2027',
            wallpaper_source_folder: 'C:\\Users\\<user>\\Pictures\\',
            mode: 'training', // 'training' (Exploration) | 'exam'
            filename_template: 'Class_{class}_Score_{score}_Time_{time}_Student_{student_lastname}_{student_firstname}',
            device_numbers: ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20'],
            default_device: '01',
            exam_time_limit_min: 0,
            pass_threshold: 10.0,
            tasks_config: [
                { id: 1, enabled: true, coefficient: 1, weight: 1, complexity: 'simple', critical: false, disabled_subtasks: [], subtasks_order: [0] },
                { id: 2, enabled: true, coefficient: 2, weight: 2, complexity: 'simple', critical: false, disabled_subtasks: [], subtasks_order: [0, 1] },
                { id: 3, enabled: true, coefficient: 3, weight: 3, complexity: 'medium', critical: false, disabled_subtasks: [], subtasks_order: [0, 1] },
                { id: 4, enabled: true, coefficient: 4, weight: 4, complexity: 'medium', critical: false, disabled_subtasks: [], subtasks_order: [0, 1, 2] },
                { id: 5, enabled: true, coefficient: 4, weight: 4, complexity: 'medium', critical: false, disabled_subtasks: [], subtasks_order: [0, 1, 2, 3, 4, 5, 6, 7] },
                { id: 6, enabled: true, coefficient: 6, weight: 6, complexity: 'complex', critical: false, disabled_subtasks: [], subtasks_order: [0, 1, 2, 3, 4, 5, 6, 7] }
            ],
            ui_language_default: 'ar',
            theme_lock: false,
            multi_user_mode: true,
            lock_fullscreen_in_exam: false,
            report_logo_b64: '',
            show_mistakes: true,
            show_penalties: true,
            show_time: true,
            show_competency: true,
            show_partial_scores: true,
            show_ranking_criteria: true,
            penalty_hint: 0.25,
            penalty_error: 0.25,
            penalty_skip: 0,
            quiz_enabled: true,
            show_no_quiz_note: true,
            quiz_options_count: 4,
            quiz_disabled_tasks: [],
            custom_quiz_questions: [],
            quiz_disabled_questions: [],
            quiz_disabled_distractors: {},
            class_groups: [
                '1AS_ST_G1',
                '1AS_ST_G2',
                '1AS_ST_G3',
                '1AS_ST_G4',
                '1AS_L_G1',
                '1AS_L_G2'
            ]
        };
    }

    var config = getDefaultConfig();

    // Encrypted inf.dll sidecar state held strictly in volatile RAM (never written unencrypted to disk)
    var infState = {
        status: 'missing', // 'missing' | 'loaded' | 'legacy' | 'tampered'
        format: null,
        errorReason: '',
        loadedEnvelope: null,
        activePassword: null,
        vault: { verifier: 'W11_VAULT_OK_V2', audit_log: [] }
    };

    var student = {
        activeSession: false,
        paused: false,
        pauseReason: null,
        lastName: 'Eleve',
        firstName: 'Demo',
        fullName: 'Eleve Demo',
        classGroup: config.class_groups[0],
        pcNumber: '01',
        mode: 'training', // 'training' | 'exam'
        quizOptIn: true,
        elapsedSeconds: 0,
        suspendedSeconds: 0,
        startedAtIso: null,
        activeSection: null,
        completionElapsedSeconds: null,
        allCompleted: false,
        quizResults: []
    };

    var sectionTimings = {};

    var tasks = [
        {
            id: 1,
            maxPoints: 1.0,
            complexity: 'simple',
            critical: false,
            titleAr: 'تغيير لغة عرض واجهة Windows',
            titleFr: 'Changer la langue d\'affichage Windows',
            titleEn: 'Change Windows Display Language',
            instrAr: 'من الإعدادات ← الوقت واللغة ← اللغة والمنطقة، غيّر "لغة عرض واجهة Windows" (إلى الفرنسية أو الإنجليزية).',
            instrFr: 'Dans Heure et langue > Langue et région, modifiez la « Langue d\'affichage Windows ».',
            instrEn: 'In Time & language > Language & region, switch the Windows display language.',
            hintAr: 'افتح الإعدادات ← الوقت واللغة ← اللغة والمنطقة ← اختر من قائمة "لغة عرض واجهة Windows".',
            hintFr: 'Paramètres > Heure et langue > Langue d\'affichage Windows.',
            hintEn: 'Settings > Time & language > Language & region > Windows display language.',
            earnedPoints: 0,
            deductedPoints: 0,
            deductReasons: [],
            completed: false,
            skipped: false,
            lockedDone: false,
            startedAt: null,
            endedAt: null,
            durationSeconds: 0
        },
        {
            id: 2,
            maxPoints: 2.0,
            complexity: 'simple',
            critical: false,
            titleAr: 'ضبط خصائص الفأرة',
            titleFr: 'Propriétés de la souris',
            titleEn: 'Mouse Properties',
            instrAr: 'ادخل إلى إعدادات الفأرة، واضبط سرعة النقر المزدوج على "سريعة"، ثم اختر مؤشراً مخصصاً (LimeGreen أو Noir).',
            instrFr: 'Ouvrez les paramètres de la souris, réglez le double-clic sur Rapide, puis choisissez LimeGreen ou Noir.',
            instrEn: 'Go to Mouse settings, set double-click speed to Fast, and choose Noir or LimeGreen pointer.',
            hintAr: 'من الإعدادات افتح "Bluetooth والأجهزة" ثم "الفأرة" (أو عبر لوحة التحكم الكلاسيكية).',
            hintFr: 'Paramètres > Bluetooth et appareils > Souris.',
            hintEn: 'Settings > Bluetooth & devices > Mouse.',
            earnedPoints: 0,
            deductedPoints: 0,
            deductReasons: [],
            completed: false,
            skipped: false,
            lockedDone: false,
            startedAt: null,
            endedAt: null,
            durationSeconds: 0
        },
        {
            id: 3,
            maxPoints: 3.0,
            complexity: 'medium',
            critical: false,
            titleAr: 'إضافة لغة إدخال وضبط المنطقة الزمنية',
            titleFr: 'Langue de saisie et fuseau horaire',
            titleEn: 'Input Language & Time Zone',
            instrAr: 'أضف لغة الإدخال "العربية - الجزائر" إلى لوحات المفاتيح، واضبط المنطقة الزمنية على الجزائر (GMT+1).',
            instrFr: 'Ajoutez la langue de saisie Arabe (Algérie) aux claviers et réglez le fuseau horaire sur Alger (GMT+1).',
            instrEn: 'Add Arabic (Algeria) input language and set time zone to Algiers (GMT+1).',
            hintAr: 'من قسم "الوقت واللغة" افتح "إضافة لغة" واتبع المعالج، ثم حدد GMT+1 في التاريخ والوقت.',
            hintFr: 'Heure et langue > Ajouter une langue, puis Date et heure > GMT+1.',
            hintEn: 'Time & language > Add a language wizard, then Date & time > GMT+1.',
            earnedPoints: 0,
            deductedPoints: 0,
            deductReasons: [],
            completed: false,
            skipped: false,
            lockedDone: false,
            startedAt: null,
            endedAt: null,
            durationSeconds: 0
        },
        {
            id: 4,
            maxPoints: 4.0,
            complexity: 'medium',
            critical: false,
            titleAr: 'تخصيص الخلفية (الصور المعروضة ومجلد الصور) ولون التمييز',
            titleFr: 'Fond d\'écran (images de la fenêtre et dossier Images) et accentuation',
            titleEn: 'Background (Preset & Pictures) & Accent Color',
            instrAr: '1) غيّر الخلفية باختيار إحدى الصور المعروضة مباشرة في نافذة الإعدادات. 2) غيّر الخلفية باختيار صورة من مجلد الصور (Pictures) عبر زر "استعراض صور". 3) غيّر لون التمييز للنظام.',
            instrFr: '1) Choisissez une image d\'arrière-plan affichée dans la fenêtre. 2) Choisissez une image dans le dossier Pictures via Parcourir. 3) Modifiez la couleur d\'accentuation.',
            instrEn: '1) Choose a background from the images displayed in the window. 2) Choose an image from the Pictures folder via Browse photos. 3) Change accent color.',
            hintAr: 'افتح الإعدادات ← التخصيص ← الخلفية: اختر صورة معروضة، ثم انقر زر "استعراض صور" لاختيار صورة من مجلد الصور (Pictures)، ثم بدّل لون التمييز.',
            hintFr: 'Paramètres > Personnalisation > Arrière-plan : choisissez une image affichée, puis cliquez sur Parcourir pour choisir une image dans Images, puis modifiez la couleur.',
            hintEn: 'Settings > Personalization > Background: choose a preset image, then click Browse photos to pick from Pictures, then change accent color.',
            earnedPoints: 0,
            deductedPoints: 0,
            deductReasons: [],
            completed: false,
            skipped: false,
            lockedDone: false,
            startedAt: null,
            endedAt: null,
            durationSeconds: 0
        },
        {
            id: 5,
            maxPoints: 4.0,
            complexity: 'medium',
            critical: false,
            titleAr: 'تثبيت وإزالة البرامج والميزات الاختيارية',
            titleFr: 'Installation, désinstallation et fonctionnalités facultatives',
            titleEn: 'App Setup, Uninstall & Optional Features',
            instrAr: '1) شغّل ملف LabTools_Setup.exe من سطح المكتب وثبّت التطبيق، ثم افتحه من قائمة ابدأ لتجربته وأغلقه، ثم احذفه من الإعدادات وتأكد من اختفائه من قائمة ابدأ. 2) ادخل إلى الميزات الاختيارية وفعّل ميزة (Paint أو Notepad أو Games) ثم افتحها من قائمة ابدأ لتجربتها وأغلقها، ثم عطّلها من الإعدادات وتأكد من اختفائها من قائمة ابدأ.',
            instrFr: '1) Exécutez LabTools_Setup.exe, ouvrez depuis Démarrer puis fermez, désinstallez et vérifiez dans Démarrer. 2) Activez Paint/Notepad/Games dans Fonctionnalités facultatives, ouvrez depuis Démarrer puis fermez, désactivez et vérifiez dans Démarrer.',
            instrEn: '1) Run LabTools_Setup.exe, open from Start Menu then close, uninstall and verify gone from Start. 2) Enable Paint/Notepad/Games in Optional Features, open from Start then close, disable and verify gone from Start.',
            hintAr: 'ثبّت وجرّب LabTools من ابدأ ثم احذفه، وفعّل ميزة (كالرسام) من الميزات الاختيارية وجرّبها من ابدأ ثم عطّلها، مع التحقق دائماً من قائمة ابدأ.',
            hintFr: 'Exécutez LabTools_Setup.exe puis allez dans Paramètres > Applications > Fonctionnalités facultatives et menu Démarrer.',
            hintEn: 'Run LabTools_Setup.exe, verify in Settings > Apps, then toggle Optional Features and inspect Start Menu.',
            earnedPoints: 0,
            deductedPoints: 0,
            deductReasons: [],
            completed: false,
            skipped: false,
            lockedDone: false,
            startedAt: null,
            endedAt: null,
            durationSeconds: 0
        },
        {
            id: 6,
            maxPoints: 6.0,
            complexity: 'complex',
            critical: false,
            titleAr: 'إدارة حسابات المستخدمين والصلاحيات (A–G)',
            titleFr: 'Scénario complet des comptes utilisateurs (A–G)',
            titleEn: 'Comprehensive User Accounts Scenario (A–G)',
            instrAr: '(A) أنشئ حسابين قياسيين واحذفهما. (B) أنشئ حسابَي مسؤول واحذف القديم MENIAI وأحد الجديدين ليبقى آخر مسؤول منشأ فقط. (C) فعّل حساب الضيف وبدّل إليه وجرّب إجراءً إدارياً للتحقق من الحظر. (D) أنشئ حساباً قياسياً بكلمة مرور. (E) سجّل الدخول إليه بها ثم الخروج. (F) بدّل للمسؤول وغيّر كلمة مروره. (G) ادخل بكلمة المرور الجديدة. (H) غيّر الصورة الرمزية.',
            instrFr: 'A: Créez/supprimez 2 Standard. B: Créez 2 Admins, gardez le dernier créé. C: Activez Invité, basculez et testez le blocage UAC. D-G: Créez Standard avec mot de passe, connectez/déconnectez, modifiez le mot de passe en Admin, reconnectez-vous + changez l\'avatar.',
            instrEn: 'A: Create & delete 2 Standard users. B: Create 2 Admins, keep only the last created Admin. C: Enable & switch to Guest, verify UAC denial. D-G: Password-protected Standard user login/logout, Admin password change, re-login with new password + Avatar update.',
            hintAr: 'ابدأ من الإعدادات > الحسابات: طبّق الخطوات A إلى G بالتسلسل، ولا تنس التبديل إلى آخر مسؤول قبل حذف MENIAI.',
            hintFr: 'Paramètres > Comptes : suivez les étapes A à G dans l\'ordre.',
            hintEn: 'Settings > Accounts: complete steps A through G sequentially.',
            earnedPoints: 0,
            deductedPoints: 0,
            deductReasons: [],
            completed: false,
            skipped: false,
            lockedDone: false,
            startedAt: null,
            endedAt: null,
            durationSeconds: 0
        }
    ];

    var mistakes = [];
    var listeners = [];
    var tickTimer = null;
    var activeTaskIndex = 0;
    var lastSeenSignatures = {};
    var activationSignatures = {};
    var activeTouchedMap = {};
    var earlyTaintedMap = {};
    var skippedSubSteps = {};
    var lastEvalUser = null;
    var offTaskToastTimer = null;

    function dismissOffTaskToast() {
        if (offTaskToastTimer) {
            clearTimeout(offTaskToastTimer);
            offTaskToastTimer = null;
        }
        if (typeof document === 'undefined' || !document.getElementById) return;
        var existing = document.getElementById('off-task-warning-toast');
        if (existing && existing.parentNode) {
            existing.parentNode.removeChild(existing);
        }
    }

    function showOffTaskToast(messageAr) {
        if (typeof document === 'undefined' || !document.body) return;
        dismissOffTaskToast();
        var bidi = global.Win11I18N ? global.Win11I18N.bidiHtml : function (s) { return s; };
        var toast = document.createElement('div');
        toast.id = 'off-task-warning-toast';
        toast.className = 'off-task-warning-toast';
        toast.setAttribute('role', 'alert');
        toast.innerHTML =
            '<span class="off-task-toast-icon">' + (global.Win11Icons ? global.Win11Icons.get('warning', 18) : '!') + '</span>' +
            '<span class="off-task-toast-text">' + bidi(messageAr) + '</span>' +
            '<button type="button" class="off-task-toast-close" aria-label="Close">&times;</button>';
        var closeBtn = toast.querySelector('.off-task-toast-close');
        if (closeBtn) {
            closeBtn.onclick = dismissOffTaskToast;
        }
        document.body.appendChild(toast);
        offTaskToastTimer = setTimeout(dismissOffTaskToast, 7000);
    }

    function getTaskSignature(taskId, st) {
        if (!st) return '';
        if (taskId === 1) {
            return String(st.displayLanguage || '') + '|' + (st.hasChangedDisplayLanguage ? '1' : '0');
        }
        if (taskId === 2) {
            return String(st.mouseDoubleClickSpeed || '') + '|' + String(st.pointerScheme || '') + '|' + (st.mouseButtonsInverted ? '1' : '0');
        }
        if (taskId === 3) {
            var langs = (st.installedLanguages || []).map(function (l) { return l.id; }).join(',');
            return langs + '|' + String(st.timeZoneId || '');
        }
        if (taskId === 4) {
            var bm = st.wallpaperBrowseMeta || {};
            return String(st.wallpaperId || '') + '|' + String(st.accentColor || '') + '|' + (bm.usedBrowse ? '1' : '0') + '|' + String(bm.selectedFolder || '');
        }
        if (taskId === 5) {
            var sf = st.setupFlow || {};
            var ff = st.featureFlow || {};
            var progs = (st.installedPrograms || []).map(function (p) { return p.id; }).join(',');
            var feats = (st.optionalFeatures || []).map(function (f) { return f.id + ':' + (f.installed ? 1 : 0); }).join(',');
            return progs + '|' + feats + '|' +
                (sf.installed ? 1 : 0) + (sf.verifiedInstalled ? 1 : 0) + (sf.uninstalled ? 1 : 0) + (sf.verifiedUninstalled ? 1 : 0) + '|' +
                (ff.enabledOnce ? 1 : 0) + (ff.disabledAfterEnable ? 1 : 0);
        }
        if (taskId === 6) {
            var sc = st.accountScenario || {};
            var accs = (st.userAccounts || []).map(function (a) {
                return a.name + ':' + a.type + ':' + (a.enabled ? 1 : 0) + ':' + (a.hasPassword ? 1 : 0) + ':' + (a.avatarId || '');
            }).join(',');
            return accs + '|' + String(st.currentUser || '') + '|' +
                (sc.stepA ? 1 : 0) + (sc.stepB ? 1 : 0) + (sc.stepC ? 1 : 0) + (sc.stepD ? 1 : 0) +
                (sc.stepE ? 1 : 0) + (sc.stepF ? 1 : 0) + (sc.stepG ? 1 : 0) + (sc.stepH ? 1 : 0) + '|' +
                (sc.standardCreatedNames || []).length + '|' + (sc.adminCreatedNames || []).length + '|' +
                (sc.adminDeletedNames || []).length + '|' + (sc.loggedInStdInitial ? 1 : 0);
        }
        return '';
    }

    function initPedagogyFlow() {
        var st = global.Win11State ? global.Win11State.get() : null;
        activeTaskIndex = 0;
        lastSeenSignatures = {};
        activationSignatures = {};
        activeTouchedMap = {};
        earlyTaintedMap = {};
        skippedSubSteps = {};
        lastEvalUser = st ? String(st.currentUser || 'MENIAI') : 'MENIAI';
        dismissOffTaskToast();
        for (var i = 0; i < tasks.length; i++) {
            tasks[i].earnedPoints = 0;
            tasks[i].deductedPoints = 0;
            tasks[i].deductReasons = [];
            tasks[i].subSteps = [];
            tasks[i].doneStepsCount = 0;
            tasks[i].totalStepsCount = 0;
            tasks[i].progressPercent = 0;
            tasks[i].completed = false;
            tasks[i].skipped = false;
            tasks[i].lockedDone = false;
            var sig = getTaskSignature(tasks[i].id, st);
            lastSeenSignatures[tasks[i].id] = sig;
            activationSignatures[tasks[i].id] = sig;
        }
    }

    function notify() {
        for (var i = 0; i < listeners.length; i++) {
            try { listeners[i](); } catch (e) { }
        }
    }

    function hasMistake(taskId, title) {
        for (var i = 0; i < mistakes.length; i++) {
            if (mistakes[i].taskId === taskId && mistakes[i].title === title) return true;
        }
        return false;
    }

    function pad2(n) {
        return (n < 10 ? '0' : '') + String(n);
    }

    function formatDuration(secs) {
        var s = Math.max(0, Math.floor(Number(secs) || 0));
        var h = Math.floor(s / 3600);
        var m = Math.floor((s % 3600) / 60);
        var rem = s % 60;
        return pad2(h) + ':' + pad2(m) + ':' + pad2(rem);
    }

    function formatDurationToken(secs) {
        var s = Math.max(0, Math.floor(Number(secs) || 0));
        var h = Math.floor(s / 3600);
        var m = Math.floor((s % 3600) / 60);
        var rem = s % 60;
        return pad2(h) + '-' + pad2(m) + '-' + pad2(rem);
    }

    function recordMistake(taskId, title, desc, penalty, type) {
        var tkTitle = '';
        for (var i = 0; i < tasks.length; i++) {
            if (tasks[i].id === taskId) { tkTitle = tasks[i].titleAr; break; }
        }
        // Strict Section 7.2 rule: every recorded mistake causes a positive deduction (>= 0.25)
        var rawPen = Number(penalty);
        var effPen = (!isNaN(rawPen) && rawPen > 0) ? rawPen : 0.25;
        mistakes.push({
            time: formatDuration(student.elapsedSeconds),
            taskId: taskId,
            taskTitle: tkTitle || 'مهام عامة للنظام',
            type: type || 'error',
            title: title,
            desc: desc,
            penalty: Number(effPen.toFixed(2))
        });
        notify();
    }

    function syncTaskTimer(task, hasActivity) {
        if ((hasActivity || task.earnedPoints > 0) && task.startedAt === null) {
            task.startedAt = student.elapsedSeconds;
        }
        if (task.completed) {
            if (task.startedAt === null) task.startedAt = student.elapsedSeconds;
            if (task.endedAt === null) task.endedAt = student.elapsedSeconds;
            task.durationSeconds = Math.max(0, task.endedAt - task.startedAt);
        } else {
            task.endedAt = null;
            task.durationSeconds = (task.startedAt !== null) ? Math.max(0, student.elapsedSeconds - task.startedAt) : 0;
        }
    }

    function enterSection(sectionId) {
        if (!sectionId) return;
        student.activeSection = sectionId;
        if (!sectionTimings[sectionId]) {
            sectionTimings[sectionId] = { activeSeconds: 0, visits: 0 };
        }
        sectionTimings[sectionId].visits += 1;
        var mappedIds = TASK_SECTION_MAP[sectionId] || [];
        for (var mi = 0; mi < mappedIds.length; mi++) {
            var tk = tasks[mappedIds[mi] - 1];
            if (tk && tk.startedAt === null) {
                tk.startedAt = student.elapsedSeconds;
            }
        }
        // Section 4: Show non-blocking contextual warning when visiting an off-task section (NO deduction until action is committed)
        if (student.activeSession && mappedIds.length > 0) {
            var ordered = syncConfiguredTasks();
            var enabledList = [];
            for (var ei = 0; ei < ordered.length; ei++) {
                if (ordered[ei].enabled !== false) enabledList.push(ordered[ei]);
            }
            var curActive = (activeTaskIndex < enabledList.length) ? enabledList[activeTaskIndex] : null;
            if (curActive && mappedIds.indexOf(curActive.id) === -1) {
                var warnMsg = (sectionId === 'personalization')
                    ? ('أنت الآن في مهمة "' + curActive.titleAr + '". تغيير الخلفية الآن سيؤدي إلى خصم نقاط.')
                    : ('أنت الآن في مهمة "' + curActive.titleAr + '". إجراء تعديل في قسم "' + (SECTION_TITLE_AR[sectionId] || sectionId) + '" الآن سيؤدي إلى خصم نقاط.');
                showOffTaskToast(warnMsg);
            } else if (curActive) {
                dismissOffTaskToast();
            }
        }
        notify();
    }

    function scoreTaskWithReasons(tk, checks) {
        var partialEnabled = (config.show_partial_scores !== false);
        var earnedWeight = 0;
        var totalWeight = 0;
        var doneCount = 0;
        var skippedCount = 0;
        var stepSkippedMap = skippedSubSteps[tk.id] || {};
        var disabledList = Array.isArray(tk.disabled_subtasks) ? tk.disabled_subtasks : [];
        var reasons = [];
        var subSteps = [];
        var allDone = true;

        var order = [];
        if (Array.isArray(tk.subtasks_order) && tk.subtasks_order.length > 0) {
            for (var oi = 0; oi < tk.subtasks_order.length; oi++) {
                var oVal = Number(tk.subtasks_order[oi]);
                if (!isNaN(oVal) && oVal >= 0 && oVal < checks.length && order.indexOf(oVal) === -1) {
                    order.push(oVal);
                }
            }
        }
        for (var fi = 0; fi < checks.length; fi++) {
            if (order.indexOf(fi) === -1) order.push(fi);
        }

        for (var oIndex = 0; oIndex < order.length; oIndex++) {
            var i = order[oIndex];
            if (disabledList.indexOf(i) !== -1) {
                // Sub-task is disabled by teacher: exclude from evaluation
                continue;
            }
            var c = checks[i];
            if (!c) continue;
            var w = c.weight || 1;
            var isSkipped = !c.ok && (!!stepSkippedMap[i] || !!stepSkippedMap[oIndex]);
            totalWeight += w;
            if (c.ok) {
                earnedWeight += w;
                doneCount += 1;
            } else {
                allDone = false;
                if (isSkipped) {
                    skippedCount += 1;
                }
                if (c.reason) reasons.push(c.reason);
            }
            subSteps.push({
                origIndex: i,
                orderIndex: oIndex,
                labelAr: c.labelAr || c.reason || ('الخطوة ' + (subSteps.length + 1)),
                labelFr: c.labelFr || c.labelAr || c.reason || ('Étape ' + (subSteps.length + 1)),
                labelEn: c.labelEn || c.labelAr || c.reason || ('Step ' + (subSteps.length + 1)),
                ok: !!c.ok,
                skipped: isSkipped
            });
        }
        var ratio = totalWeight > 0 ? (earnedWeight / totalWeight) : 1;
        tk.subSteps = subSteps;
        tk.doneStepsCount = doneCount;
        tk.skippedStepsCount = skippedCount;
        tk.totalStepsCount = subSteps.length;
        tk.allStepsResolved = (subSteps.length > 0 && (doneCount + skippedCount) === subSteps.length);
        tk.progressPercent = Math.round(ratio * 100);
        tk.completed = (subSteps.length > 0) ? allDone : true;

        var taskCoef = (tk.enabled !== false) ? Math.floor(Math.max(1, Number(tk.coefficient) || Number(tk.maxPoints) || 1)) : 0;
        tk.coefficient = taskCoef;
        tk.maxPoints = taskCoef;

        if (tk.enabled === false) {
            tk.earnedPoints = 0;
            tk.deductedPoints = 0;
            tk.deductReasons = [];
            return;
        }

        if (tk.critical && !allDone) {
            tk.earnedPoints = 0;
            reasons.unshift('مهمة حرجة (الكل أو لا شيء): يشترط استيفاء جميع العناصر.');
        } else if (!partialEnabled && !allDone) {
            tk.earnedPoints = 0;
        } else {
            tk.earnedPoints = Number((taskCoef * ratio).toFixed(2));
        }
        tk.deductedPoints = Number(Math.max(0, taskCoef - tk.earnedPoints).toFixed(2));
        tk.deductReasons = reasons;
    }

    function evaluateSingleTask(tk, st) {
        if (tk.id === 1) {
            // Task 1: Display Language (Simple — 1 step)
            var changedDispSettings = !!st.hasChangedDisplayLanguage;
            var okLang1 = changedDispSettings && (!earlyTaintedMap[1] || activeTouchedMap[1]);
            scoreTaskWithReasons(tk, [
                {
                    ok: okLang1,
                    weight: 1,
                    labelAr: 'تغيير "لغة عرض واجهة Windows" من الإعدادات ← الوقت واللغة',
                    labelFr: 'Modifier la langue d\'affichage Windows',
                    labelEn: 'Switch Windows display language',
                    reason: 'لم يتم تغيير لغة عرض واجهة Windows أثناء تفعيل هذه المهمة'
                }
            ]);
            syncTaskTimer(tk, okLang1);
        } else if (tk.id === 2) {
            // Task 2: Mouse Properties (Simple — 2 equal sub-stages, 50% each)
            var allowMouse = (!earlyTaintedMap[2] || activeTouchedMap[2]);
            var ptrOk = allowMouse && (st.pointerScheme === 'LimeGreen' || st.pointerScheme === 'Noir');
            var spdOk = allowMouse && (st.mouseDoubleClickSpeed === 'Rapide');
            if (allowMouse && st.mouseButtonsInverted && !hasMistake(2, 'تبديل أزرار الفأرة خلافاً للمطلوب')) {
                recordMistake(2, 'تبديل أزرار الفأرة خلافاً للمطلوب', 'تم تفعيل تبديل الزر الأساسي للفأرة وهو غير مطلوب في التعليمات.', config.penalty_error, 'setting');
            }
            scoreTaskWithReasons(tk, [
                {
                    ok: spdOk,
                    weight: 1,
                    labelAr: 'ضبط سرعة النقر المزدوج على "سريعة"',
                    labelFr: 'Régler le double-clic sur Rapide',
                    labelEn: 'Set double-click speed to Fast',
                    reason: 'سرعة النقر المزدوج ليست مضبوطة على "سريعة"'
                },
                {
                    ok: ptrOk,
                    weight: 1,
                    labelAr: 'اختيار نظام مؤشر مخصص (LimeGreen أو Noir)',
                    labelFr: 'Choisir le curseur LimeGreen ou Noir',
                    labelEn: 'Select LimeGreen or Noir mouse pointer',
                    reason: 'نظام المؤشر ليس LimeGreen أو Noir'
                }
            ]);
            syncTaskTimer(tk, ptrOk || spdOk || (allowMouse && st.mouseButtonsInverted));
        } else if (tk.id === 3) {
            // Task 3: Input Language + Time Zone GMT+1 (Medium — 2 equal sub-stages, 50% each)
            var allowLT = (!earlyTaintedMap[3] || activeTouchedMap[3]);
            var hasAr = allowLT && st.installedLanguages.some(function (l) {
                return l.code === 'AR' || (l.display && (l.display.indexOf('العربية') !== -1 || l.display.indexOf('Arabe') !== -1));
            });
            var isGmt1 = allowLT && (st.timeZoneId === 'GMT+1');
            scoreTaskWithReasons(tk, [
                {
                    ok: hasAr,
                    weight: 1,
                    labelAr: 'إضافة لغة الإدخال "العربية - الجزائر" إلى لوحات المفاتيح',
                    labelFr: 'Ajouter la langue de saisie Arabe (Algérie)',
                    labelEn: 'Add Arabic (Algeria) input language',
                    reason: 'لم تُضف لغة الإدخال العربية (الجزائر)'
                },
                {
                    ok: isGmt1,
                    weight: 1,
                    labelAr: 'ضبط المنطقة الزمنية على الجزائر (GMT+1)',
                    labelFr: 'Régler le fuseau horaire sur Alger (GMT+1)',
                    labelEn: 'Set time zone to Algiers (GMT+1)',
                    reason: 'المنطقة الزمنية غير مضبوطة على GMT+1'
                }
            ]);
            syncTaskTimer(tk, hasAr || isGmt1);
        } else if (tk.id === 4) {
            // Task 4: Personalization (Preset Image + Browse Pictures + Accent Color)
            var allowPers = (!earlyTaintedMap[4] || activeTouchedMap[4]);
            var browseMeta = st.wallpaperBrowseMeta || {};
            var wpNotDefault = allowPers && (st.wallpaperId !== 'bg_00');
            var wpFromPictures = allowPers && (!!st.hasChosenPicturesWallpaper || (wpNotDefault && !!st.customWallpaper && (browseMeta.selectedFolder === 'pictures' || (st.customWallpaper && st.customWallpaper.folder === 'pictures'))));
            var wpFromPreset = allowPers && (!!st.hasChosenPresetWallpaper || (wpNotDefault && !st.customWallpaper));
            var accChanged = allowPers && (st.accentColor && st.accentColor.toUpperCase() !== '#0067C0');

            scoreTaskWithReasons(tk, [
                {
                    ok: wpFromPreset,
                    weight: 1,
                    labelAr: 'تغيير الخلفية باختيار إحدى الصور المعروضة في نافذة الإعدادات',
                    labelFr: 'Choisir une image parmi celles affichées dans la fenêtre',
                    labelEn: 'Choose an image from presets in Settings window',
                    reason: 'لم يتم تغيير الخلفية باختيار إحدى الصور المعروضة في نافذة الإعدادات'
                },
                {
                    ok: wpFromPictures,
                    weight: 1,
                    labelAr: 'تغيير الخلفية باختيار صورة من مجلد الصور (Pictures) عبر زر "استعراض صور"',
                    labelFr: 'Choisir une image dans le dossier Pictures via le bouton Parcourir',
                    labelEn: 'Choose an image from Pictures folder via Browse photos',
                    reason: 'لم تُختر صورة من مجلد الصور (Pictures) عبر زر استعراض صور'
                },
                {
                    ok: accChanged,
                    weight: 1,
                    labelAr: 'تغيير لون التمييز للنظام (Accent Color)',
                    labelFr: 'Modifier la couleur d\'accentuation',
                    labelEn: 'Change system Accent Color',
                    reason: 'لم يتم تغيير لون التمييز (Accent)'
                }
            ]);
            syncTaskTimer(tk, wpFromPreset || wpFromPictures || accChanged);
        } else if (tk.id === 5) {
            // Task 5: Setup.exe Install/Open/Uninstall/Verify + Optional Features Enable/Open/Disable/Verify (8 granular sub-stages)
            var allowApps = (!earlyTaintedMap[5] || activeTouchedMap[5]);
            var sf = st.setupFlow || {};
            var ff = st.featureFlow || {};
            var step0Install = allowApps && !!sf.installed;
            var step1OpenApp = allowApps && !!sf.openedApp;
            var step2Uninstall = allowApps && !!sf.uninstalled;
            var step3GoneStart = allowApps && !!sf.verifiedGoneInStart;
            var step4EnableFeat = allowApps && !!ff.enabledOnce;
            var step5OpenFeat = allowApps && !!ff.openedApp;
            var step6DisableFeat = allowApps && !!ff.disabledAfterEnable;
            var step7FeatGoneStart = allowApps && !!ff.verifiedGoneInStart;
            scoreTaskWithReasons(tk, [
                {
                    ok: step0Install,
                    weight: 1,
                    labelAr: 'تشغيل ملف LabTools_Setup.exe وتثبيت البرنامج',
                    labelFr: 'Exécuter LabTools_Setup.exe et installer',
                    labelEn: 'Run LabTools_Setup.exe and install app',
                    reason: 'لم يُنفذ تثبيت البرنامج عبر ملف LabTools_Setup.exe على سطح المكتب'
                },
                {
                    ok: step1OpenApp,
                    weight: 1,
                    labelAr: 'فتح تطبيق LabTools من قائمة ابدأ لتجربته ثم إغلاقه',
                    labelFr: 'Ouvrir LabTools depuis le menu Démarrer et fermer',
                    labelEn: 'Open LabTools from Start Menu and close it',
                    reason: 'لم يتم فتح تطبيق LabTools من قائمة ابدأ لتجربته'
                },
                {
                    ok: step2Uninstall,
                    weight: 1,
                    labelAr: 'إلغاء تثبيت التطبيق من الإعدادات ← التطبيقات المثبتة',
                    labelFr: 'Désinstaller l\'application depuis Paramètres',
                    labelEn: 'Uninstall app from Settings > Installed apps',
                    reason: 'لم يتم إلغاء تثبيت التطبيق من الإعدادات'
                },
                {
                    ok: step3GoneStart,
                    weight: 1,
                    labelAr: 'فتح قائمة ابدأ للتحقق من اختفاء التطبيق بعد حذفه',
                    labelFr: 'Vérifier la disparition de l\'application du menu Démarrer',
                    labelEn: 'Verify app is removed from Start Menu',
                    reason: 'لم يتم فتح قائمة ابدأ للتأكد من اختفاء التطبيق المحذوف'
                },
                {
                    ok: step4EnableFeat,
                    weight: 1,
                    labelAr: 'تفعيل ميزة اختيارية (Paint أو Notepad أو Games) من الميزات الاختيارية',
                    labelFr: 'Activer une fonctionnalité facultative',
                    labelEn: 'Enable an Optional Feature',
                    reason: 'لم تُفعّل ميزة اختيارية من الإعدادات'
                },
                {
                    ok: step5OpenFeat,
                    weight: 1,
                    labelAr: 'فتح الميزة المفعلة (كالرسام) من قائمة ابدأ لتجربتها ثم إغلاقها',
                    labelFr: 'Ouvrir la fonctionnalité depuis Démarrer et fermer',
                    labelEn: 'Open the activated feature from Start Menu and close it',
                    reason: 'لم يتم فتح الميزة المفعلة (مثل الرسام) من قائمة ابدأ وتجربتها'
                },
                {
                    ok: step6DisableFeat,
                    weight: 1,
                    labelAr: 'إزالة/تعطيل الميزة الاختيارية من الإعدادات',
                    labelFr: 'Désactiver la fonctionnalité facultative',
                    labelEn: 'Disable Optional Feature from Settings',
                    reason: 'لم يتم تعطيل الميزة الاختيارية بعد تجربتها'
                },
                {
                    ok: step7FeatGoneStart,
                    weight: 1,
                    labelAr: 'فتح قائمة ابدأ للتحقق من اختفاء الميزة بعد تعطيلها',
                    labelFr: 'Vérifier la disparition de la fonctionnalité de Démarrer',
                    labelEn: 'Verify Optional Feature is removed from Start Menu',
                    reason: 'لم يتم فتح قائمة ابدأ للتأكد من اختفاء الميزة بعد تعطيلها'
                }
            ]);
            syncTaskTimer(tk, step0Install || step1OpenApp || step2Uninstall || step3GoneStart || step4EnableFeat || step5OpenFeat || step6DisableFeat || step7FeatGoneStart);
        } else if (tk.id === 6) {
            // Task 6: Comprehensive User Accounts A–G + Avatar (Complex — 8 equal sub-stages, 12.5% each)
            var allowAcc = (!earlyTaintedMap[6] || activeTouchedMap[6]);
            var sc = st.accountScenario || {};
            scoreTaskWithReasons(tk, [
                {
                    ok: allowAcc && !!sc.stepA,
                    weight: 1,
                    labelAr: '(A) إنشاء حسابين قياسيين (Standard) ثم حذفهما',
                    labelFr: '(A) Créer et supprimer 2 comptes Standard',
                    labelEn: '(A) Create & delete 2 Standard accounts',
                    reason: 'الخطوة (A): إنشاء وحذف حسابين قياسيين (Standard)'
                },
                {
                    ok: allowAcc && !!sc.stepB,
                    weight: 1,
                    labelAr: '(B) إنشاء حسابي مسؤول وحذف MENIAI وأحد الجديدين لإبقاء آخر مسؤول فقط',
                    labelFr: '(B) Créer 2 Admins et ne garder que le dernier créé',
                    labelEn: '(B) Create 2 Admins, delete MENIAI & keep latest Admin',
                    reason: 'الخطوة (B): إنشاء حسابي مسؤول وحذف القديم MENIAI وأحد الجديدين مع إبقاء آخر مسؤول فقط'
                },
                {
                    ok: allowAcc && !!sc.stepC,
                    weight: 1,
                    labelAr: '(C) تفعيل حساب الضيف والتبديل إليه واختبار حظر UAC',
                    labelFr: '(C) Activer Invité, basculer et tester le blocage UAC',
                    labelEn: '(C) Enable & switch to Guest and test UAC block',
                    reason: 'الخطوة (C): تفعيل حساب الضيف والتبديل إليه واختبار حظر UAC'
                },
                {
                    ok: allowAcc && !!sc.stepD,
                    weight: 1,
                    labelAr: '(D) إنشاء حساب قياسي جديد محمي بكلمة مرور',
                    labelFr: '(D) Créer un compte Standard protégé par mot de passe',
                    labelEn: '(D) Create password-protected Standard user',
                    reason: 'الخطوة (D): إنشاء حساب قياسي محمي بكلمة مرور'
                },
                {
                    ok: allowAcc && !!sc.stepE,
                    weight: 1,
                    labelAr: '(E) تسجيل الدخول للحساب القياسي بكلمة المرور ثم الخروج',
                    labelFr: '(E) Se connecter au compte Standard puis se déconnecter',
                    labelEn: '(E) Sign in to Standard account then Sign out',
                    reason: 'الخطوة (E): تسجيل الدخول للحساب القياسي بكلمة المرور ثم الخروج'
                },
                {
                    ok: allowAcc && !!sc.stepF,
                    weight: 1,
                    labelAr: '(F) العودة للمسؤول وتغيير كلمة مرور الحساب القياسي',
                    labelFr: '(F) Revenir en Admin et modifier le mot de passe du compte Standard',
                    labelEn: '(F) Switch to Admin and reset Standard password',
                    reason: 'الخطوة (F): عودة المسؤول وتغيير كلمة مرور الحساب القياسي'
                },
                {
                    ok: allowAcc && !!sc.stepG,
                    weight: 1,
                    labelAr: '(G) الدخول مجدداً للحساب القياسي بكلمة المرور الجديدة',
                    labelFr: '(G) Se reconnecter avec le nouveau mot de passe',
                    labelEn: '(G) Re-login with new password',
                    reason: 'الخطوة (G): تسجيل الدخول مجدداً بكلمة المرور الجديدة'
                },
                {
                    ok: allowAcc && !!sc.stepH,
                    weight: 1,
                    labelAr: '(H) تغيير الصورة الرمزية للحساب (Avatar)',
                    labelFr: '(H) Changer l\'avatar du compte',
                    labelEn: '(H) Change account Avatar',
                    reason: 'الخطوة (H): تحديث الصورة الرمزية (Avatar) وفق الصلاحيات'
                }
            ]);
            var anyAccActivity = !!sc.stepA || !!sc.stepB || !!sc.stepC || !!sc.stepD || !!sc.stepH || (st.userAccounts && st.userAccounts.length > 2);
            syncTaskTimer(tk, allowAcc && anyAccActivity);
        }
    }

    function evaluate() {
        if (student.timeExpired) return;
        var ordered = syncConfiguredTasks();
        var enabledList = [];
        for (var ei = 0; ei < ordered.length; ei++) {
            if (ordered[ei].enabled !== false) enabledList.push(ordered[ei]);
        }
        var st = global.Win11State.get();

        // Enforce sequential Active Task rule (Section 2):
        // 1. Freeze already completed or skipped tasks (< activeTaskIndex) globally across user switches (Section 6.5)
        for (var cIdx = 0; cIdx < activeTaskIndex && cIdx < enabledList.length; cIdx++) {
            enabledList[cIdx].lockedDone = true;
            if (!enabledList[cIdx].skipped && !(enabledList[cIdx].skippedStepsCount > 0)) {
                enabledList[cIdx].completed = true;
            }
        }

        // If user switched accounts (e.g. Task 6 multi-user steps), resync non-active task signatures so per-user profiles don't trigger false off-task penalties
        var curUserNow = st ? String(st.currentUser || 'MENIAI') : 'MENIAI';
        if (lastEvalUser !== null && curUserNow !== lastEvalUser) {
            for (var sIdx = 0; sIdx < enabledList.length; sIdx++) {
                if (sIdx !== activeTaskIndex) {
                    lastSeenSignatures[enabledList[sIdx].id] = getTaskSignature(enabledList[sIdx].id, st);
                }
            }
        }
        lastEvalUser = curUserNow;
        var isGuestNow = (curUserNow.toLowerCase() === 'invité');

        // 2. Detect committed Off-Task / premature actions across ALL non-active tasks
        var curActiveTk = (activeTaskIndex < enabledList.length) ? enabledList[activeTaskIndex] : null;
        for (var oIdx = 0; oIdx < enabledList.length; oIdx++) {
            if (oIdx === activeTaskIndex) continue;
            var otherTk = enabledList[oIdx];
            var otherSig = getTaskSignature(otherTk.id, st);
            if (lastSeenSignatures[otherTk.id] === undefined) {
                lastSeenSignatures[otherTk.id] = otherSig;
            } else if (otherSig !== lastSeenSignatures[otherTk.id]) {
                lastSeenSignatures[otherTk.id] = otherSig;
                if (!isGuestNow && student.activeSession) {
                    var penAmt = Math.max(0.25, config.penalty_error || 0.25);
                    if (oIdx > activeTaskIndex) {
                        if (otherTk.id === 1 && String(st.displayLanguage || '') === 'ar') {
                            // Reverting display language to Arabic before reaching task is not an early violation
                            continue;
                        }
                        earlyTaintedMap[otherTk.id] = true;
                        activeTouchedMap[otherTk.id] = false;
                        recordMistake(
                            otherTk.id,
                            'إجراء مبكر',
                            'محاولة تنفيذ إجراء يخص (' + otherTk.titleAr + ') قبل إتمام المهمة النشطة الحالية (' + (curActiveTk ? curActiveTk.titleAr : '') + ').',
                            penAmt,
                            'early'
                        );
                        showOffTaskToast('تم خصم نقاط: إجراء مبكر يخص (' + otherTk.titleAr + ') قبل إتمام (' + (curActiveTk ? curActiveTk.titleAr : '') + ').');
                    } else if (curActiveTk) {
                        // Display language adjustments (Task 1) - e.g. reverting to Arabic for comfort - are exempt from off-task penalty
                        if (otherTk.id === 1) {
                            continue;
                        }
                        recordMistake(
                            curActiveTk.id,
                            'تعديل خارج المهمة النشطة (' + otherTk.titleAr + ')',
                            'تم تنفيذ تعديل يخص (' + otherTk.titleAr + ') أثناء تفعيل مهمة (' + curActiveTk.titleAr + ').',
                            penAmt,
                            'off_task'
                        );
                        showOffTaskToast('تم خصم نقاط: أنت الآن في مهمة "' + curActiveTk.titleAr + '" وليس "' + otherTk.titleAr + '".');
                    }
                }
            }
            if (oIdx > activeTaskIndex) {
                otherTk.earnedPoints = 0;
                otherTk.deductedPoints = otherTk.maxPoints;
                otherTk.progressPercent = 0;
                otherTk.subSteps = [];
                otherTk.doneStepsCount = 0;
                otherTk.totalStepsCount = 0;
                otherTk.completed = false;
                otherTk.deductReasons = ['مهمة مقيدة — أتمم المهمة النشطة الحالية أولاً'];
            }
        }

        // 3. Evaluate ONLY the currently active task
        if (curActiveTk) {
            var actSig = getTaskSignature(curActiveTk.id, st);
            if (actSig !== lastSeenSignatures[curActiveTk.id]) {
                lastSeenSignatures[curActiveTk.id] = actSig;
                activeTouchedMap[curActiveTk.id] = true;
                earlyTaintedMap[curActiveTk.id] = false;
            }
            evaluateSingleTask(curActiveTk, st);
            if (curActiveTk.completed || curActiveTk.allStepsResolved) {
                if (!curActiveTk.completed && curActiveTk.doneStepsCount === 0) {
                    curActiveTk.skipped = true;
                }
                curActiveTk.lockedDone = true;

                // VERSION 2.0 QUIZ INTERCEPTION:
                // Present quiz modal before advancing to next task unless disabled or student opted out
                var isQuizOn = (config.quiz_enabled !== false) &&
                    (student.quizOptIn !== false) &&
                    (!Array.isArray(config.quiz_disabled_tasks) || config.quiz_disabled_tasks.indexOf(curActiveTk.id) === -1);

                if (isQuizOn && !curActiveTk.quizCompleted && !curActiveTk.skipped && global.Win11Quiz) {
                    if (!curActiveTk.quizActive) {
                        curActiveTk.quizActive = true;
                        var qOpts = {
                            taskTitle: curActiveTk.titleAr,
                            maxPoints: 1.0,
                            optionsCount: config.quiz_options_count || 4
                        };
                        global.Win11Quiz.presentQuizForTask(curActiveTk.id, qOpts, function (resData) {
                            curActiveTk.quizActive = false;
                            curActiveTk.quizCompleted = true;
                            curActiveTk.quizResult = resData;
                            if (resData) {
                                student.quizResults = student.quizResults || [];
                                student.quizResults.push(resData);
                            }
                            advanceToNextTask(enabledList, st);
                            if (activeTaskIndex < enabledList.length) {
                                evaluateSingleTask(enabledList[activeTaskIndex], st);
                            }
                            evaluate();
                            notify();
                        });
                    }
                    // Retain on current task until quiz is completed
                } else {
                    advanceToNextTask(enabledList, st);
                    if (activeTaskIndex < enabledList.length) {
                        evaluateSingleTask(enabledList[activeTaskIndex], st);
                    }
                }
            }
        }

        // Check if all enabled tasks are fully completed
        var allTasksDone = true;
        var maxTaskEndedAt = 0;
        if (enabledList.length === 0) {
            allTasksDone = false;
        } else {
            for (var chkI = 0; chkI < enabledList.length; chkI++) {
                var chkTk = enabledList[chkI];
                var qDone = (config.quiz_enabled === false) ||
                    (student.quizOptIn === false) ||
                    (Array.isArray(config.quiz_disabled_tasks) && config.quiz_disabled_tasks.indexOf(chkTk.id) !== -1) ||
                    chkTk.quizCompleted || chkTk.skipped;
                if (!chkTk.completed || !qDone) {
                    allTasksDone = false;
                }
                if (chkTk.endedAt && chkTk.endedAt > maxTaskEndedAt) {
                    maxTaskEndedAt = chkTk.endedAt;
                }
            }
        }

        if (allTasksDone) {
            student.allCompleted = true;
            if (student.completionElapsedSeconds === null) {
                student.completionElapsedSeconds = (maxTaskEndedAt > 0) ? maxTaskEndedAt : student.elapsedSeconds;
            }
        } else {
            student.allCompleted = false;
            student.completionElapsedSeconds = null;
        }

        notify();
    }

    function advanceToNextTask(enabledList, st) {
        activeTaskIndex += 1;
        if (activeTaskIndex < enabledList.length) {
            var nextTk = enabledList[activeTaskIndex];
            var nextSig = getTaskSignature(nextTk.id, st);
            lastSeenSignatures[nextTk.id] = nextSig;
            activationSignatures[nextTk.id] = nextSig;
            if (nextTk.startedAt === null) {
                nextTk.startedAt = student.elapsedSeconds;
            }
        }
    }

    /**
     * Marks the active task as skipped ("غير منجزة"), retains any partial credit
     * earned prior to skipping, applies configurable skip penalty if > 0, and advances.
     */
    function skipActiveTask() {
        if (student.timeExpired) return false;
        evaluate();
        var ordered = syncConfiguredTasks();
        var enabledList = [];
        for (var ei = 0; ei < ordered.length; ei++) {
            if (ordered[ei].enabled !== false) enabledList.push(ordered[ei]);
        }
        if (activeTaskIndex >= enabledList.length) return false;
        var st = global.Win11State.get();
        var tk = enabledList[activeTaskIndex];
        evaluateSingleTask(tk, st);
        if (tk.completed) {
            tk.lockedDone = true;
            advanceToNextTask(enabledList, st);
            notify();
            return true;
        }
        tk.skipped = true;
        tk.completed = false;
        tk.lockedDone = true;
        if (tk.startedAt === null) tk.startedAt = student.elapsedSeconds;
        tk.endedAt = student.elapsedSeconds;
        tk.durationSeconds = Math.max(0, tk.endedAt - tk.startedAt);
        var skipNote = 'تم تخطي المهمة يدوياً (غير منجزة)';
        if (!Array.isArray(tk.deductReasons)) tk.deductReasons = [];
        if (tk.deductReasons.indexOf(skipNote) === -1) tk.deductReasons.unshift(skipNote);

        var skipPen = Number(config.penalty_skip) || 0;
        if (skipPen > 0) {
            recordMistake(tk.id, 'تخطي المهمة', tk.titleAr, skipPen, 'skip');
        }
        advanceToNextTask(enabledList, st);
        evaluate();
        return true;
    }

    /**
     * Marks a single pending sub-step in the active multi-step task as skipped (0 pts),
     * while leaving all remaining sub-steps active and completable.
     */
    function skipSubStep(taskId, stepIndex) {
        if (student.timeExpired) return false;
        evaluate();
        var ordered = syncConfiguredTasks();
        var enabledList = [];
        for (var ei = 0; ei < ordered.length; ei++) {
            if (ordered[ei].enabled !== false) enabledList.push(ordered[ei]);
        }
        if (activeTaskIndex >= enabledList.length) return false;
        var tk = enabledList[activeTaskIndex];
        if (Number(tk.id) !== Number(taskId)) return false;
        var st = global.Win11State.get();
        evaluateSingleTask(tk, st);
        var idx = Number(stepIndex);
        if (!Array.isArray(tk.subSteps) || isNaN(idx) || idx < 0 || idx >= tk.subSteps.length) {
            return false;
        }
        var targetStep = tk.subSteps[idx];
        if (targetStep.ok || targetStep.skipped) return false;
        var origIdx = (targetStep.origIndex !== undefined) ? targetStep.origIndex : idx;
        if (!skippedSubSteps[tk.id]) skippedSubSteps[tk.id] = {};
        skippedSubSteps[tk.id][origIdx] = true;
        skippedSubSteps[tk.id][idx] = true;
        if (tk.startedAt === null) tk.startedAt = student.elapsedSeconds;
        evaluate();
        return true;
    }

    function syncConfiguredTasks() {
        var list = config.tasks_config;
        if (!Array.isArray(list) || list.length === 0) return tasks;
        var map = {};
        for (var i = 0; i < tasks.length; i++) map[tasks[i].id] = tasks[i];
        var ordered = [];
        for (var j = 0; j < list.length; j++) {
            var item = list[j];
            var tk = map[item.id];
            if (tk) {
                tk.enabled = (item.enabled !== false);
                tk.critical = !!item.critical;
                tk.disabled_subtasks = Array.isArray(item.disabled_subtasks) ? item.disabled_subtasks.slice() : [];
                tk.subtasks_order = Array.isArray(item.subtasks_order) ? item.subtasks_order.slice() : null;
                var c = (item.coefficient !== undefined && item.coefficient !== null) ? Number(item.coefficient) : Number(item.weight);
                if (isNaN(c) || c < 1) {
                    c = (item.complexity === 'complex') ? 3 : 1;
                }
                c = Math.floor(c);
                tk.coefficient = tk.enabled ? c : 0;
                tk.maxPoints = tk.coefficient;
                ordered.push(tk);
                delete map[item.id];
            }
        }
        for (var k in map) {
            if (Object.prototype.hasOwnProperty.call(map, k)) {
                map[k].enabled = true;
                map[k].disabled_subtasks = [];
                map[k].subtasks_order = null;
                var defC = (map[k].complexity === 'complex') ? 3 : 1;
                map[k].coefficient = defC;
                map[k].maxPoints = defC;
                ordered.push(map[k]);
            }
        }
        return ordered;
    }

    function saveConfig(newCfg) {
        config = global.Win11Compat.assign(getDefaultConfig(), newCfg);
        if (global.Win11QuizBank) {
            config.custom_quiz_questions = global.Win11QuizBank.getAllQuestions().filter(function (q) {
                return !!q.isCustom;
            });
            config.quiz_disabled_questions = global.Win11QuizBank.getAllQuestions().filter(function (q) {
                return q.enabled === false;
            }).map(function (q) { return q.id; });
        }
        student.mode = config.mode || 'training';
        if (config.class_groups && config.class_groups.length > 0 && config.class_groups.indexOf(student.classGroup) === -1) {
            student.classGroup = config.class_groups[0];
        }
        notify();
    }

    function encodeBase64Utf8(str) {
        if (global.TextEncoder) {
            var bytes = new global.TextEncoder().encode(str);
            var bin = '';
            for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
            return global.btoa(bin);
        }
        return global.btoa(unescape(encodeURIComponent(str)));
    }

    function decodeBase64Utf8(b64) {
        var bin = global.atob(String(b64).trim());
        if (global.TextDecoder) {
            var arr = new Uint8Array(bin.length);
            for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
            return new global.TextDecoder('utf-8').decode(arr);
        }
        return decodeURIComponent(escape(bin));
    }

    function startTickLoop() {
        if (tickTimer) clearInterval(tickTimer);
        tickTimer = setInterval(function () {
            if (!student.activeSession || student.timeExpired) return;
            if (student.allCompleted) return;
            if (student.paused) {
                student.suspendedSeconds += 1;
            } else {
                student.elapsedSeconds += 1;
                var limitMin = Number(config.exam_time_limit_min) || 0;
                if (limitMin > 0 && student.elapsedSeconds >= (limitMin * 60)) {
                    student.timeExpired = true;
                    student.paused = true;
                    student.pauseReason = 'time_expired';
                    if (global.Win11Dialogs && !global.Win11Dialogs.isOpen()) {
                        global.Win11Dialogs.showMessage(
                            global.Win11I18N.t('pedagogy.title'),
                            'انتهى الوقت المحدد لهذه الجلسة (' + limitMin + ' دقيقة). يمكنك الآن عرض بطاقة التقييم.',
                            'warning'
                        );
                    }
                }
                if (student.activeSection && !student.timeExpired) {
                    if (!sectionTimings[student.activeSection]) {
                        sectionTimings[student.activeSection] = { activeSeconds: 0, visits: 0 };
                    }
                    sectionTimings[student.activeSection].activeSeconds += 1;
                }
                for (var tIdx = 0; tIdx < tasks.length; tIdx++) {
                    var tk = tasks[tIdx];
                    if (!tk.completed && !tk.skipped && tk.startedAt !== null) {
                        tk.durationSeconds = Math.max(0, student.elapsedSeconds - tk.startedAt);
                    }
                }
            }
            notify();
        }, 1000);
    }

    function resetTimersOnly() {
        student.elapsedSeconds = 0;
        student.suspendedSeconds = 0;
        student.completionElapsedSeconds = null;
        student.allCompleted = false;
        student.paused = false;
        student.pauseReason = null;
        student.startedAtIso = new Date().toISOString();
        student.quizResults = [];
        sectionTimings = {};
        for (var i = 0; i < tasks.length; i++) {
            tasks[i].startedAt = null;
            tasks[i].endedAt = null;
            tasks[i].durationSeconds = 0;
            tasks[i].quizActive = false;
            tasks[i].quizCompleted = false;
            tasks[i].quizResult = null;
        }
    }

    function getEffectiveElapsedSeconds() {
        if (student.allCompleted && student.completionElapsedSeconds !== null && student.completionElapsedSeconds !== undefined) {
            return student.completionElapsedSeconds;
        }
        return student.elapsedSeconds || 0;
    }

    /**
     * Tie-break comparator: higher net score first, then shortest active elapsedSeconds,
     * then fewer mistakes, then shorter suspendedSeconds.
     */
    function compareStudents(a, b) {
        var scoreA = Number(a && a.net !== undefined ? a.net : (a && a.netScore)) || 0;
        var scoreB = Number(b && b.net !== undefined ? b.net : (b && b.netScore)) || 0;
        if (Math.abs(scoreB - scoreA) > 0.0001) return scoreB - scoreA;

        var timeA = Number(a && a.elapsedSeconds) || 0;
        var timeB = Number(b && b.elapsedSeconds) || 0;
        if (timeA !== timeB) return timeA - timeB;

        var errA = Number(a && a.mistakesCount) || 0;
        var errB = Number(b && b.mistakesCount) || 0;
        if (errA !== errB) return errA - errB;

        return (Number(a && a.suspendedSeconds) || 0) - (Number(b && b.suspendedSeconds) || 0);
    }

    function applyLoadedSidecar(rawBytes) {
        if (!rawBytes || rawBytes.length === 0) {
            infState.status = 'missing';
            infState.loadedEnvelope = null;
            config = getDefaultConfig();
            return { ok: false, status: 'missing', config: config };
        }
        var parsed = global.Win11Crypto
            ? global.Win11Crypto.parseRuntimeInfDll(rawBytes)
            : { ok: false, status: 'tampered', reason: 'Crypto module unavailable' };

        if (!parsed.ok) {
            infState.status = parsed.status || 'tampered';
            infState.format = null;
            infState.errorReason = parsed.reason || 'Corrupt inf.dll';
            infState.loadedEnvelope = null;
            config = getDefaultConfig();
            notify();
            return { ok: false, status: infState.status, reason: infState.errorReason, config: config };
        }

        infState.status = (parsed.format === 'legacy_v1') ? 'legacy' : 'loaded';
        infState.format = parsed.format;
        infState.errorReason = '';
        infState.loadedEnvelope = parsed;
        config = global.Win11Compat.assign(getDefaultConfig(), parsed.config);
        if (global.Win11QuizBank) {
            if (Array.isArray(config.custom_quiz_questions)) {
                for (var cqi = 0; cqi < config.custom_quiz_questions.length; cqi++) {
                    global.Win11QuizBank.addQuestion(config.custom_quiz_questions[cqi]);
                }
            }
            if (Array.isArray(config.quiz_disabled_questions)) {
                for (var dqi = 0; dqi < config.quiz_disabled_questions.length; dqi++) {
                    global.Win11QuizBank.toggleQuestionEnabled(config.quiz_disabled_questions[dqi], false);
                }
            }
        }
        student.classGroup = (config.class_groups && config.class_groups[0]) || student.classGroup;
        student.mode = config.mode || 'training';
        notify();
        return { ok: true, status: infState.status, format: parsed.format, config: config };
    }

    function exportBinaryInfDll(passwordOverride) {
        var pwd = passwordOverride || infState.activePassword;
        if (!pwd || !global.Win11Crypto) {
            throw new Error('Teacher password required to encrypt inf.dll');
        }
        var bin = global.Win11Crypto.encryptInfDll(config, pwd, infState.vault);
        infState.activePassword = pwd;
        var reParsed = global.Win11Crypto.parseRuntimeInfDll(bin);
        if (reParsed && reParsed.ok) {
            infState.status = 'loaded';
            infState.format = 'v2';
            infState.errorReason = '';
            infState.loadedEnvelope = reParsed;
        }
        return bin;
    }

    function fetchSidecarFromHost(doneCb) {
        var finish = function () {
            if (!config.report_logo_b64 && global.location && global.location.protocol && global.location.protocol.indexOf('http') === 0 && global.fetch) {
                try {
                    global.fetch('/api/logo').then(function (r) {
                        if (r.ok && typeof FileReader !== 'undefined') {
                            return r.blob().then(function (blob) {
                                var reader = new FileReader();
                                reader.onload = function () {
                                    if (reader.result) config.report_logo_b64 = String(reader.result);
                                };
                                reader.readAsDataURL(blob);
                            });
                        }
                    }).catch(function () { });
                } catch (eLogo) { }
            }
            if (typeof doneCb === 'function') doneCb();
        };
        var host = (global.location && global.location.hostname) ? String(global.location.hostname) : '';

        // Check native COM bridge first (Trident / WinForms host)
        try {
            if (global.external && (typeof global.external.ReadInfBase64 === 'unknown' || typeof global.external.ReadInfBase64 === 'function')) {
                var b64 = global.external.ReadInfBase64();
                if (b64 && typeof b64 === 'string') {
                    applyLoadedSidecar(global.Win11Crypto.base64ToBytes(b64));
                    finish();
                    return;
                }
            }
        } catch (eBridge) { }

        if (global.location && global.location.protocol && global.location.protocol.indexOf('http') === 0 && global.fetch && host.indexOf('github.io') === -1) {
            var hasFinished = false;
            var safeFinish = function () {
                if (hasFinished) return;
                hasFinished = true;
                finish();
            };
            var fetchTimer = setTimeout(function () {
                safeFinish();
            }, 2000);

            global.fetch('/api/inf', { cache: 'no-store' }).then(function (resp) {
                clearTimeout(fetchTimer);
                if (resp.status === 204 || resp.status === 404) {
                    applyLoadedSidecar(new Uint8Array(0));
                    safeFinish();
                    return;
                }
                if (!resp.ok) {
                    safeFinish();
                    return;
                }
                return resp.arrayBuffer().then(function (buf) {
                    applyLoadedSidecar(new Uint8Array(buf));
                    safeFinish();
                });
            }).catch(function () {
                clearTimeout(fetchTimer);
                safeFinish();
            });
            return;
        }
        // Optional injected preloaded sidecar over file:// (no keys/passwords)
        if (global.__WIN11_EMBEDDED_INF__) {
            try {
                applyLoadedSidecar(global.Win11Crypto.base64ToBytes(global.__WIN11_EMBEDDED_INF__));
            } catch (e) { }
        }
        finish();
    }

    function saveSidecarToHost(passwordOverride, cb) {
        var bin;
        try {
            bin = exportBinaryInfDll(passwordOverride);
        } catch (err) {
            if (typeof cb === 'function') cb({ ok: false, error: err.message });
            return;
        }

        // Check native COM bridge first
        try {
            if (global.external && (typeof global.external.WriteInfBase64 === 'unknown' || typeof global.external.WriteInfBase64 === 'function')) {
                var b64Data = global.Win11Crypto.bytesToBase64(bin);
                var written = global.external.WriteInfBase64(b64Data);
                if (written) {
                    if (typeof cb === 'function') cb({ ok: true, savedToHost: true, bytes: bin });
                    return;
                }
            }
        } catch (eBridgeWrite) { }

        if (global.location && global.location.protocol && global.location.protocol.indexOf('http') === 0 && global.fetch) {
            global.fetch('/api/inf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/octet-stream' },
                body: bin
            }).then(function (resp) {
                if (typeof cb === 'function') cb({ ok: resp.ok, savedToHost: resp.ok, bytes: bin });
            }).catch(function () {
                if (typeof cb === 'function') cb({ ok: false, savedToHost: false, bytes: bin });
            });
            return;
        }
        if (typeof cb === 'function') cb({ ok: true, savedToHost: false, bytes: bin });
    }

    function verifyTeacherPassword(enteredPassword) {
        if (!infState.loadedEnvelope || infState.status === 'missing') {
            return { ok: false, status: 'missing' };
        }
        if (infState.status === 'tampered') {
            return { ok: false, status: 'tampered' };
        }
        var res = global.Win11Crypto.unlockVault(infState.loadedEnvelope, enteredPassword);
        if (!res.ok) {
            return { ok: false, error: res.error || 'wrong_password' };
        }
        infState.activePassword = String(enteredPassword);
        infState.vault = res.vault || { verifier: 'W11_VAULT_OK_V2', audit_log: [] };
        if (!Array.isArray(infState.vault.audit_log)) infState.vault.audit_log = [];
        infState.vault.audit_log.unshift({ at: new Date().toISOString(), action: 'unlock' });
        if (infState.vault.audit_log.length > 30) infState.vault.audit_log.pop();
        return { ok: true, vault: infState.vault };
    }

    function getInfStatus() {
        return {
            status: infState.status,
            format: infState.format,
            errorReason: infState.errorReason,
            hasActivePassword: !!infState.activePassword,
            auditLogCount: (infState.vault && infState.vault.audit_log) ? infState.vault.audit_log.length : 0
        };
    }

    global.Win11State.on('*', evaluate);

    global.Win11Assessment = {
        getConfig: function () { return config; },
        getDefaultConfig: getDefaultConfig,
        saveConfig: saveConfig,
        updateConfig: saveConfig,
        getVault: function () { return infState.vault; },
        getStudent: function () { return student; },
        getTasks: function () { return syncConfiguredTasks(); },
        getActiveTaskIndex: function () { return activeTaskIndex; },
        getActiveTaskId: function () {
            var list = syncConfiguredTasks().filter(function (x) { return x.enabled !== false; });
            return (activeTaskIndex < list.length) ? list[activeTaskIndex].id : null;
        },
        getEffectiveElapsedSeconds: getEffectiveElapsedSeconds,
        getElapsedString: function () { return formatDuration(getEffectiveElapsedSeconds()); },
        getMistakes: function () { return mistakes; },
        getSectionTimings: function () { return sectionTimings; },
        enterSection: enterSection,
        recordMistake: recordMistake,
        evaluate: evaluate,
        skipActiveTask: skipActiveTask,
        skipSubStep: skipSubStep,
        formatDuration: formatDuration,
        formatDurationToken: formatDurationToken,
        compareStudents: compareStudents,
        getInfStatus: getInfStatus,
        loadInfBytes: applyLoadedSidecar,
        exportBinaryInfDll: exportBinaryInfDll,
        fetchSidecarFromHost: fetchSidecarFromHost,
        saveSidecarToHost: saveSidecarToHost,
        verifyTeacherPassword: verifyTeacherPassword,
        setActivePasswordInRam: function (pwd) { infState.activePassword = pwd ? String(pwd) : null; },
        getActivePasswordInRam: function () { return infState.activePassword; },
        encodeInfDll: function (pwd) {
            var pass = pwd || infState.activePassword || 'admin123';
            return global.Win11Crypto.bytesToBase64(exportBinaryInfDll(pass));
        },
        importInfDll: function (rawInput, pwd) {
            var input = rawInput;
            if (typeof input === 'string' && global.Win11Crypto) {
                try {
                    var decoded = global.Win11Crypto.base64ToBytes(input.trim());
                    if (decoded.length >= 5 && decoded[0] === 0x57 && decoded[1] === 0x31 && decoded[2] === 0x31 && decoded[3] === 0x53) {
                        input = decoded;
                    }
                } catch (e) { }
            }
            var res = applyLoadedSidecar(input);
            if (!res.ok) throw new Error(res.reason || 'Invalid or tampered inf.dll');
            if (pwd) {
                var chk = verifyTeacherPassword(pwd);
                if (!chk.ok) throw new Error('Wrong password for imported inf.dll');
            }
            return config;
        },
        initSessionLifecycle: function () {
            // Section 3: Wait cleanly at 00:00:00 until Student Info Form is submitted
            student.activeSession = false;
            student.mode = config.mode || 'training';
            initPedagogyFlow();
            resetTimersOnly();
            evaluate();
        },
        pauseTimer: function (reason) {
            if (!student.activeSession) return;
            student.paused = true;
            student.pauseReason = reason || 'suspended';
            notify();
        },
        resumeTimer: function () {
            if (!student.activeSession) return;
            student.paused = false;
            student.pauseReason = null;
            notify();
        },
        startSession: function (studentInfo) {
            var lName = String((studentInfo && studentInfo.lastName) || '').trim();
            var fName = String((studentInfo && studentInfo.firstName) || '').trim();
            var rawFull = String((studentInfo && studentInfo.fullName) || '').trim();
            if ((!lName || !fName) && rawFull) {
                var nameParts = rawFull.split(/\s+/);
                if (!lName) lName = nameParts[0] || '';
                if (!fName) fName = nameParts.slice(1).join(' ') || '';
            }
            student.lastName = lName || 'Eleve';
            student.firstName = fName || (rawFull ? '' : 'Demo');
            student.fullName = rawFull || (student.lastName + (student.firstName ? ' ' + student.firstName : ''));
            student.classGroup = (studentInfo && studentInfo.classGroup) || config.class_groups[0];
            student.pcNumber = (studentInfo && studentInfo.pcNumber) || config.default_device || '01';
            student.mode = (studentInfo && studentInfo.mode) || config.mode || 'training';
            student.quizOptIn = (studentInfo && studentInfo.quizOptIn !== undefined) ? !!studentInfo.quizOptIn : true;
            student.activeSession = true;
            student.timeExpired = false;
            mistakes = [];
            initPedagogyFlow();
            resetTimersOnly();
            startTickLoop();
            evaluate();
        },
        updateStudentInfo: function (studentInfo) {
            if (!studentInfo) return;
            var lName = String(studentInfo.lastName || '').trim();
            var fName = String(studentInfo.firstName || '').trim();
            var rawFull = String(studentInfo.fullName || '').trim();
            if ((!lName || !fName) && rawFull) {
                var nameParts = rawFull.split(/\s+/);
                if (!lName) lName = nameParts[0] || '';
                if (!fName) fName = nameParts.slice(1).join(' ') || '';
            }
            if (lName) student.lastName = lName;
            if (fName) student.firstName = fName;
            student.fullName = rawFull || (student.lastName + (student.firstName ? ' ' + student.firstName : ''));
            if (studentInfo.classGroup) student.classGroup = studentInfo.classGroup;
            if (studentInfo.pcNumber) student.pcNumber = studentInfo.pcNumber;
            if (studentInfo.quizOptIn !== undefined) student.quizOptIn = !!studentInfo.quizOptIn;
            notify();
        },
        getOverallProgress: function () {
            var activeTasks = syncConfiguredTasks();
            var doneTasks = 0;
            var totalTasks = 0;
            var earnedPoints = 0;
            var totalMax = 0;
            for (var i = 0; i < activeTasks.length; i++) {
                var tk = activeTasks[i];
                if (tk.enabled !== false) {
                    totalTasks += 1;
                    totalMax += (Number(tk.maxPoints) || 0);
                    earnedPoints += (Number(tk.earnedPoints) || 0);
                    if (tk.completed) doneTasks += 1;
                }
            }
            var pct = totalMax > 0 ? Math.min(100, Math.max(0, Math.round((earnedPoints / totalMax) * 100))) : 0;
            return {
                doneTasks: doneTasks,
                totalTasks: totalTasks,
                earnedPoints: Number(earnedPoints.toFixed(2)),
                totalMax: Number(totalMax.toFixed(2)),
                percent: pct
            };
        },
        startNewSimulation: function () {
            // Section 1.3: Retain student metadata & loaded inf.dll config; clear windows, settings, tasks & reset timers to 00:00:00
            if (global.Win11Shell && typeof global.Win11Shell.closeAllFlyouts === 'function') {
                global.Win11Shell.closeAllFlyouts();
            }
            if (global.Win11State && typeof global.Win11State.reset === 'function') {
                global.Win11State.reset();
            }
            mistakes = [];
            student.activeSession = true;
            student.timeExpired = false;
            initPedagogyFlow();
            resetTimersOnly();
            startTickLoop();
            evaluate();
            notify();
        },
        resetDemoSession: function () {
            if (global.Win11State && typeof global.Win11State.reset === 'function') {
                global.Win11State.reset();
            }
            mistakes = [];
            student.lastName = 'Eleve';
            student.firstName = 'Demo';
            student.fullName = 'Eleve Demo';
            student.mode = config.mode || 'training';
            student.timeExpired = false;
            initPedagogyFlow();
            resetTimersOnly();
            startTickLoop();
            evaluate();
            notify();
        },
        getScores: function () {
            var activeTasks = syncConfiguredTasks();
            var totalWeight = 0;
            var earnedWeight = 0;
            var totalQuizMax = 0;
            var totalQuizEarned = 0;
            var deductionRows = [];
            for (var i = 0; i < activeTasks.length; i++) {
                var atk = activeTasks[i];
                if (atk.enabled !== false) {
                    var coef = Math.floor(Math.max(1, Number(atk.coefficient) || Number(atk.maxPoints) || 1));
                    atk.coefficient = coef;
                    atk.maxPoints = coef;
                    totalWeight += coef;
                    var taskEarned = Math.min(coef, Math.max(0, Number(atk.earnedPoints) || 0));
                    earnedWeight += taskEarned;
                    var missScaled = Number((coef - taskEarned).toFixed(2));
                    if (missScaled > 0) {
                        var why = (atk.deductReasons && atk.deductReasons.length > 0) ? atk.deductReasons.join('؛ ') : 'نقص في إنجاز خطوات المهمة';
                        deductionRows.push({
                            taskTitle: atk.titleAr,
                            reason: why,
                            points: Number(missScaled.toFixed(2))
                        });
                    }

                    // VERSION 2.0: Tally quiz points per task
                    var isQuizOn = (config.quiz_enabled !== false) &&
                        (!Array.isArray(config.quiz_disabled_tasks) || config.quiz_disabled_tasks.indexOf(atk.id) === -1);
                    if (isQuizOn) {
                        var qMax = 1.0;
                        totalQuizMax += qMax;
                        var qEarned = (student.quizOptIn !== false && atk.quizResult && typeof atk.quizResult.earnedPoints === 'number')
                            ? atk.quizResult.earnedPoints
                            : 0;
                        totalQuizEarned += qEarned;
                    }
                } else {
                    atk.coefficient = 0;
                    atk.maxPoints = 0;
                    atk.earnedPoints = 0;
                    atk.deductedPoints = 0;
                }
            }

            // Rule of Three (القاعدة الثلاثية):
            // Combined practical weight + quiz weight
            var grandTotalMax = totalWeight + totalQuizMax;
            var grandTotalEarned = earnedWeight + totalQuizEarned;
            var baseScore = grandTotalMax > 0 ? Number(((grandTotalEarned / grandTotalMax) * 20).toFixed(2)) : 0;
            var gross = baseScore;

            var pen = 0;
            for (var j = 0; j < mistakes.length; j++) {
                var mp = Math.max(0.25, Number(mistakes[j].penalty) || 0);
                pen += mp;
                deductionRows.push({
                    taskTitle: mistakes[j].taskTitle || 'مهمة النظام',
                    reason: mistakes[j].title + (mistakes[j].desc ? (': ' + mistakes[j].desc) : ''),
                    points: Number(mp.toFixed(2))
                });
            }
            pen = Number(pen.toFixed(2));

            // Final_Score = Base_Score_Out_of_20 - Total_Deductions
            // Constraint: If Final_Score < 0, set Final_Score = 0 (No negative grades).
            // Prevent 20/20 whenever any mistake exists.
            var rawFinal = baseScore - pen;
            if (rawFinal < 0) {
                rawFinal = 0;
            }
            if (mistakes.length > 0 && rawFinal >= 20) {
                rawFinal = 19.75;
            }
            var finalScore = Number(global.Win11Compat.clamp(rawFinal, 0, 20).toFixed(2));
            var net = finalScore;

            var totalDeductions = 0;
            for (var d = 0; d < deductionRows.length; d++) {
                totalDeductions += deductionRows[d].points;
            }
            totalDeductions = Number(totalDeductions.toFixed(2));

            var threshold = Number(config.pass_threshold);
            if (isNaN(threshold)) threshold = 10.0;
            var app = 'دون المتوسط';
            var lvl = 'غير مكتسب (صعوبات تتطلب المراجعة والدعم)';
            var lvlShort = 'غير مكتسب';
            if (net >= 16) {
                app = 'ممتاز';
                lvl = 'مكتسب بجدارة (تحكم شامل وسريع في إعدادات النظام)';
                lvlShort = 'مكتسب بجدارة';
            } else if (net >= 14) {
                app = 'جيد جداً';
                lvl = 'مكتسب (تحكم جيد في معظم الوظائف والخصائص)';
                lvlShort = 'مكتسب';
            } else if (net >= 12) {
                app = 'جيد';
                lvl = 'مكتسب (تحكم مقبول مع وجود بعض النقائص البسيطة)';
                lvlShort = 'مكتسب';
            } else if (net >= 10) {
                app = 'متوسط';
                lvl = 'في طريق الاكتساب (تحكم جزئي يتطلب مزيداً من الممارسة)';
                lvlShort = 'في طريق الاكتساب';
            } else if (net >= 8) {
                app = 'قريب من المتوسط';
                lvl = 'غير مكتسب (صعوبات جزئية في إنجاز بعض المهام)';
                lvlShort = 'غير مكتسب';
            }

            return {
                totalWeight: totalWeight,
                earnedWeight: Number(earnedWeight.toFixed(2)),
                totalQuizMax: totalQuizMax,
                totalQuizEarned: Number(totalQuizEarned.toFixed(2)),
                grandTotalMax: grandTotalMax,
                grandTotalEarned: Number(grandTotalEarned.toFixed(2)),
                practicalEarned: Number(earnedWeight.toFixed(2)),
                practicalMax: totalWeight,
                quizEarned: Number(totalQuizEarned.toFixed(2)),
                quizMax: totalQuizMax,
                baseScore: baseScore,
                finalScore: finalScore,
                gross: gross,
                penalties: pen,
                net: net,
                deductions: deductionRows,
                totalDeductions: totalDeductions,
                passed: net >= threshold,
                passThreshold: threshold,
                appreciation: app,
                performanceLevel: lvl,
                levelShort: lvlShort,
                mistakes: mistakes.slice(),
                quizOptIn: student.quizOptIn !== false,
                quizResults: (student.quizResults || []).slice(),
                rankingKey: [net.toFixed(2), getEffectiveElapsedSeconds(), mistakes.length]
            };
        },
        getSubstepsCatalog: function () {
            return TASK_SUBSTEPS_CATALOG;
        },
        onUpdate: function (fn) { listeners.push(fn); }
    };
})(window);

