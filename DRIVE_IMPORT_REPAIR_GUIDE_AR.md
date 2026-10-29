# تصحيح أرقام المذكرات والمستودعات بعد استيراد Drive

## ما الذي يعالجه هذا التصحيح؟

1. يفصل رقم المذكرة الأصلي في ملفات المصدر `BILNO` عن الرقم الداخلي المركب الذي يبقى مفتاحًا فريدًا داخل النظام. ستعرض القائمة والتفاصيل والطباعة الرقم الأصلي، مع إبقاء المفتاح الداخلي في قاعدة البيانات لمنع التصادمات.
2. يحصر المستودعات التشغيلية في 26 مستودعًا فعليًا من المصدر. القيم `0` و`-` ليست مستودعات وتُستبعد.
3. يحافظ على سجلات المستخدمين. لا يحذف جدول `users` أو المستخدمين. إذا كان مستودع زائد مرتبطًا بمستخدم أو قيد مالي، فلن ينقله إلا عند وجود مستودع مصدر واحد بالاسم المطابق بعد التطبيع؛ وإلا يتوقف قبل أي كتابة ويعرض ما يحتاج قرارًا يدويًا.
4. لا يعيد استيراد المواد أو المذكرات، ولا يمس بنود المواد أو الأرصدة. أداة الإصلاح خاصة ببيانات الميتاداتا والعلاقات وعمود رقم المصدر.

## الملفات المطلوب استبدالها/إضافتها

انسخ ملفات الحزمة إلى جذر مشروعك مع الحفاظ على المسارات:

- `drizzle/schema.ts`
- `server/db.ts`
- `client/src/pages/Memos.tsx`
- `client/src/pages/MemoDetails.tsx`
- `client/src/lib/memoPrint.ts`
- `client/src/lib/memoPrint.test.ts`
- `shared/memoSearch.ts`
- `shared/memoSearch.test.ts`
- `scripts/driveImportCore.mjs`
- `scripts/driveReplaceImport.mjs`
- `scripts/repairImportedDriveData.mjs`
- `drizzle/0002_add_source_memo_number.sql`

## خطوات التنفيذ المحلية

### 1. لا تعِد استيراد ملفات Drive الآن

ظهور `EPERM` عند كتابة ملف التقرير حدث بعد خطوة إدخال البيانات في سكربت الاستبدال، وقد تكون الجداول قد استُوردت بالفعل. لا تشغّل `driveReplaceImport.mjs --replace` مرة أخرى قبل التحقق من الحالة الحالية.

### 2. أضف عمود رقم المصدر مرة واحدة

في phpMyAdmin اختر قاعدة البيانات الصحيحة ثم تبويب SQL وشغّل:

```sql
ALTER TABLE `memos`
  ADD COLUMN `sourceMemoNumber` VARCHAR(64) NULL AFTER `memoNumber`;
```

إذا كان العمود موجودًا مسبقًا، لا تكرر الأمر؛ انتقل للخطوة التالية.

### 3. تأكد من إعداد الاتصال

تأكد أن ملف `.env` في مجلد المشروع يحتوي `DATABASE_URL` ويشير إلى قاعدة MySQL المحلية الصحيحة. لا ترسل محتوى `.env` أو كلمة المرور لأحد.

### 4. شغّل المعاينة فقط

من Git Bash، داخل جذر المشروع، استخدم المسار بصيغة `/c/...` أو `C:/...`، وتجنّب وضع تقرير داخل جذر القرص مثل `C:\drive-replace-report.json`:

```bash
node scripts/repairImportedDriveData.mjs --source-dir "C:/CCW_db_source_files"
```

المعاينة لا تعدّل قاعدة البيانات. يجب أن تعرض `sourceWarehouses: 26`، العدد الحالي، عدد أرقام المذكرات التي ستُملأ، والمستودعات الزائدة مع أعداد مراجعها. إذا كانت `canApply` تساوي `false` أو ظهرت `blockers`، **لا تشغّل التطبيق**؛ أرسل مخرجات المعاينة كاملة لنحدد الربط الصحيح بدل التخمين.

### 5. طبّق فقط بعد مراجعة المعاينة

إذا كانت `canApply: true` وكل المستودعات الـ26 موجودة، شغّل:

```bash
node scripts/repairImportedDriveData.mjs --apply --source-dir "C:/CCW_db_source_files"
```

ثم اكتب في موجه التأكيد العبارة التي يعرضها السكربت حرفيًا، مثل:

```text
REPAIR IMPORTED DATA warehouse_online
```

سينشئ السكربت ملف JSON محليًا قبل التعديل داخل `./backups/` للصفوف المتعلقة بالمستودعات وروابطها والمذكرات، ثم ينفذ التغييرات في معاملة واحدة. هذه ليست نسخة SQL كاملة لقاعدة البيانات. إن فشل شرط داخل المعاملة، يتم التراجع عنها.

## التحقق بعد التطبيق

في phpMyAdmin نفّذ:

```sql
SELECT COUNT(*) AS warehouse_count FROM warehouses;
SELECT code, name FROM warehouses ORDER BY CAST(code AS UNSIGNED), code;
SELECT COUNT(*) AS memos_with_source_number
FROM memos
WHERE sourceMemoNumber IS NOT NULL AND sourceMemoNumber <> '';
SELECT COUNT(*) AS memos_still_missing_source_number
FROM memos
WHERE sourceMemoNumber IS NULL OR sourceMemoNumber = '';
```

العدد المتوقع للمستودعات هو `26`. إذا اكتملت المطابقة، تظهر أرقام مثل `34` و`33` و`32` في سجل المذكرات والطباعة بدل أرقام النظام المركبة مثل `SRC-34-20260820-42`.
