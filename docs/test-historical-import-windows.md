# اختبار الاستيراد التاريخي محليًا بأمان

> **لا تختبر على قاعدة `warehouse_online`.** استخدم قاعدة اختبار منفصلة، ثم أعد ملف `.env` إلى القاعدة الأصلية عند الانتهاء.

## استيراد مباشر على `warehouse_online` بعد النسخ الاحتياطي

إذا قررت الاستيراد على قاعدة التشغيل الأصلية نفسها، لا تغيّر ملف `.env`؛ نفّذ النسخة الاحتياطية التالية أولًا من PowerShell داخل مجلد المشروع:

```powershell
$dump = "C:\xampp\mysql\bin\mysqldump.exe"
$backupDir = "C:\Backups\warehouse-online-before-import"
New-Item -ItemType Directory -Force $backupDir
& $dump --single-transaction --routines --triggers --default-character-set=utf8mb4 -u root -h 127.0.0.1 -P 3306 warehouse_online --result-file="$backupDir\warehouse_online_before_import.sql"
Get-Item "$backupDir\warehouse_online_before_import.sql" | Select-Object FullName, Length, LastWriteTime
```

لا تضغط **اعتماد الدفعة التراكمية** قبل أن تعرض الشاشة نتيجة فحص صحيحة. بعد النسخة الاحتياطية، افتح **أدوات ← ترحيل البيانات القديمة** واتبع الترتيب الموجود في الجدول أدناه: الجهات، المواد، الأرصدة، ثم ملفا المذكرات معًا. أوقف العملية فورًا إذا ظهر `غير مرتبط` أكبر من صفر أو إذا كانت عينة الصفوف لا تطابق الملف المتوقع. إذا حدث ذلك، لا تحاول إصلاح البيانات يدويًا؛ احتفظ بنسخة الخطأ وأرسل النتيجة للمراجعة.

## 1. إنشاء قاعدة اختبار من مخطط القاعدة فقط

افتح PowerShell داخل مجلد المشروع، ثم نفّذ الأوامر التالية. لا تستخدم اسم قاعدة موجودة سابقًا؛ اسم القاعدة أدناه مخصص للتجربة فقط.

```powershell
$mysql = "C:\xampp\mysql\bin\mysql.exe"
$dump = "C:\xampp\mysql\bin\mysqldump.exe"
$backupDir = "C:\Backups\warehouse-import-test"
$testDb = "warehouse_import_test_20260819"

New-Item -ItemType Directory -Force $backupDir

# نسخة احتياطية نصية لقاعدة التشغيل الأصلية، من دون تغييرها.
& $dump --single-transaction --routines --triggers -u root -h 127.0.0.1 -P 3306 warehouse_online --result-file="$backupDir\warehouse_online_before_import_test.sql"

# إنشاء قاعدة اختبار جديدة فارغة ثم نسخ المخطط فقط، لا البيانات التاريخية.
& $mysql -u root -h 127.0.0.1 -P 3306 -e "CREATE DATABASE $testDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
& $dump --no-data --routines --triggers -u root -h 127.0.0.1 -P 3306 warehouse_online --result-file="$backupDir\warehouse_import_schema.sql"
Get-Content -Raw -Encoding utf8 "$backupDir\warehouse_import_schema.sql" | & $mysql --default-character-set=utf8mb4 -u root -h 127.0.0.1 -P 3306 $testDb

# نسخ حسابات الدخول والمستودعات فقط إلى قاعدة الاختبار.
& $mysql -u root -h 127.0.0.1 -P 3306 -e "INSERT INTO $testDb.users SELECT * FROM warehouse_online.users; INSERT INTO $testDb.warehouses SELECT * FROM warehouse_online.warehouses;"
```

إذا ظهر خطأ أن قاعدة `$testDb` موجودة، **لا تحذفها**. غيّر قيمة `$testDb` إلى اسم جديد، مثل `warehouse_import_test_20260820`، ثم أعد التنفيذ.

## 2. توجيه التطبيق إلى قاعدة الاختبار مؤقتًا

خذ نسخة من `.env` ثم بدّل قاعدة البيانات فقط.

```powershell
Copy-Item .env .env.warehouse_online.backup -Force
(Get-Content .env) -replace '^DATABASE_URL=.*$', "DATABASE_URL=mysql://root@127.0.0.1:3306/$testDb" | Set-Content .env -Encoding utf8
```

أوقف الخادم بالضغط على `Ctrl + C` ثم شغّله من جديد:

```powershell
npx pnpm dev
```

سجّل دخولك بالحساب المحلي الإداري المعتاد. ستظهر قاعدة اختبار فارغة من المواد والمذكرات، لكنها تحتوي حسابات الدخول والمستودعات اللازمة.

## 3. إجراء تجربة الاستيراد من الواجهة

افتح **أدوات ← ترحيل البيانات القديمة**. لكل ملف، اضغط أولًا **فحص الأعمدة والصفوف**، وراجع عينة الصفوف والحقول المطلوبة قبل الضغط على **اعتماد الدفعة التراكمية**.

| الترتيب | الفئة في الشاشة | الملف أو الملفات | ما يجب أن تكون نتيجته |
|---:|---|---|---|
| 1 | الجهات | `MOUARIDIN.xls` ثم `NAMEKOU.xls` إن كان موجودًا | `غير مرتبط: 0` |
| 2 | دليل المواد | `INVENTRY.xls` | مواد جديدة بعدد مناسب، و`غير مرتبط: 0` |
| 3 | أرصدة المخزون | `DETINVENTRY.xls` | الرصيد مرتبط بالمواد والمستودعات، و`غير مرتبط: 0` |
| 4 | المذكرات | ملفا `MSTBIL*.xls` و`DETBIL*.xls` معًا | رأس واحد لكل رقم مذكرة، و`بنود غير مرتبطة: 0` |

لا تقبل أي دفعة تعطي عددًا غير صفري في **غير مرتبط**. في ملفات المذكرات، يجب اختيار ملف الرؤوس وملف البنود معًا؛ لا يقبل النظام رأسًا بلا بنود.

## 4. فحص النتيجة بعد الاعتماد

افتح الصفحات التالية في قاعدة الاختبار وتأكد من النتيجة قبل تجربة ملفات أخرى:

1. **المواد**: ابحث عن ثلاثة رموز ومواد من الملف القديم وتأكد من الاسم والوحدة.
2. **حركة المواد**: تحقق من ثلاثة أرصدة في مستودعات مختلفة.
3. **المذكرات**: تأكد من ظهور رأس واحد لكل رقم، ومن ظهور البنود في المعاينة والطباعة.
4. **الاستيراد**: راجع عدادات `جديد` و`متجاوز` و`غير مرتبط` لكل دفعة.

## 5. العودة إلى قاعدة التشغيل الأصلية

بعد انتهاء التجربة، أوقف الخادم ثم أعد ملف البيئة الأصلي وشغّل النظام من جديد:

```powershell
Copy-Item .env.warehouse_online.backup .env -Force
npx pnpm dev
```

تبقى قاعدة الاختبار `warehouse_import_test_20260819` موجودة للمراجعة ويمكنك حذفها لاحقًا من phpMyAdmin بعد التأكد من عدم الحاجة إليها. قاعدة `warehouse_online` الأصلية لا تتغير خلال هذه التجربة.
