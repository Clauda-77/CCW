# تشغيل النسخة المحلية على Windows

عند تنزيل نسخة مشروع أحدث، فك الضغط فوق مجلد المشروع أو انسخ الملفات الجديدة إليه، ثم افتح PowerShell داخل المجلد. **لا تستبدل قاعدة `warehouse_online` الموجودة ولا تستورد نسخة SQL كاملة فوقها**؛ فالتحديثات الأخيرة للواجهة والطباعة لا تمسح أو تستبدل البيانات المحلية. كذلك لا تحذف ملف `.env` المحلي إذا كان يحتوي على إعدادات XAMPP.

## إعداد البيئة

إذا لم يكن ملف `.env` موجودًا، أنشئه يدويًا في جذر المشروع (بجوار `package.json`) ثم استخدم إعدادات MySQL المحلية الآتية. لا يلزم وجود ملف `.env.example`:

```env
NODE_ENV=development
DATABASE_URL=mysql://root@127.0.0.1:3306/warehouse_online
JWT_SECRET=غيّر_هذه_القيمة_إلى_سر_طويل
LOCAL_DEV_LOGIN_ENABLED=true
LOCAL_DEV_LOGIN_PASSWORD=اختر_كلمة_مرور_للدخول_المحلي
```

لا تضع كلمة مرور قاعدة البيانات مكان `LOCAL_DEV_LOGIN_PASSWORD`. كلمة مرور الدخول المحلي يحددها صاحب الجهاز، وهي مشتركة مع المستخدمين الذين تظهر أسماؤهم في القائمة. السطر `LOCAL_DEV_LOGIN_ENABLED=true` مطلوب لتفعيل هذا النمط محليًا.

## تثبيت وتشغيل

تأكد من تشغيل Apache وMySQL من XAMPP. إذا لم يكن `pnpm` مثبتًا، استخدم `corepack enable` أو `npx pnpm`. بعد ذلك نفّذ:

```powershell
npx pnpm install
npx pnpm dev
```

لأن المشروع يستخدم `cross-env`، يعمل أمر التطوير على Windows دون تعديل يدوي لسطر `NODE_ENV`.

## استيراد نسخة قاعدة البيانات

لإنشاء نسخة احتياطية من القاعدة المحلية استخدم مسار XAMPP الكامل:

```powershell
& "C:\xampp\mysql\bin\mysqldump.exe" --default-character-set=utf8mb4 -u root -h 127.0.0.1 -P 3306 warehouse_online > "C:\Backups\warehouse_online_backup.sql"
```

لا تستخدم عامل إعادة التوجيه `<` مباشرة في PowerShell. للاستيراد استخدم `cmd.exe`:

```powershell
cmd.exe /c '"C:\xampp\mysql\bin\mysql.exe" --binary-mode=1 --default-character-set=utf8mb4 -u root -h 127.0.0.1 -P 3306 warehouse_online < C:\Backups\warehouse_project.sql'
```

تحقق بعد الاستيراد:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -h 127.0.0.1 -P 3306 warehouse_online -e "SHOW TABLES;"
```

لا تشغّل أي أمر `DROP`, ولا تستورد فوق قاعدة تحتوي بيانات مهمة قبل أخذ نسخة احتياطية. افتح الموقع على `http://localhost:3000` واختر المستخدم من القائمة ثم أدخل قيمة `LOCAL_DEV_LOGIN_PASSWORD`.

## عند تحديث المشروع فقط

لا تحتاج قاعدة `warehouse_online` إلى أي تعديل لتغييرات الشريط العلوي أو الطباعة أو التصدير الأخيرة. احتفظ بالقاعدة نفسها ثم نفّذ فقط:

```powershell
npx pnpm install
npx pnpm dev
```

إذا ظهرت في الموقع رسالة تخص جدولًا مفقودًا، تحقّق أولًا من وجود جدولي `colleges` و`adminAuditLogs`:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -h 127.0.0.1 -P 3306 warehouse_online -e "SHOW TABLES LIKE 'colleges'; SHOW TABLES LIKE 'adminAuditLogs';"
```

إذا أظهر جدول `__drizzle_migrations` ثلاث سجلات فقط، وظهر أن جدولي `colleges` و`adminAuditLogs` مفقودان، خذ نسخة احتياطية ثم طبّق **الترحيلات الموجودة فقط** بهذا الأمر:

```powershell
$env:DATABASE_URL = "mysql://root@127.0.0.1:3306/warehouse_online"
npx pnpm exec drizzle-kit migrate
Remove-Item Env:DATABASE_URL
```

سيضيف هذا الأمر جدول `colleges` وجدول `adminAuditLogs` ويسجل الترحيلين 0003 و0004، من دون تعديل صفوف `users` أو مواد أو مذكرات أو حركات قديمة.

إذا كان جدول `adminAuditLogs` موجودًا بالفعل وكان التحديث يتضمن الملف `drizzle\0005_pale_siren.sql`، طبّق هذا الترحيل وحده لتوسيع أنواع العمليات المسجلة (المواد، المستودعات، الجهات، الكليات، المذكرات والاستيراد). لا يحذف الترحيل أي سجل أو يغيّر بياناته:

```powershell
cmd.exe /c 'C:\xampp\mysql\bin\mysql.exe -u root -h 127.0.0.1 -P 3306 warehouse_online < drizzle\0005_pale_siren.sql'
```

مع Laragon استبدل المسار `C:\xampp\mysql\bin\mysql.exe` بمسار `mysql.exe` داخل مجلد Laragon لديك. لا تشغّل `npx pnpm db:push`، ولا تستورد ملف SQL كاملًا من جديد.
