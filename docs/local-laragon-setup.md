# تشغيل نظام المستودعات محليًا باستخدام Laragon

هذا المشروع هو تطبيق Node.js، لذلك يستعمل **MySQL في Laragon** فقط. لا تحتاج إلى تشغيل Apache أو إنشاء مشروع PHP/Laravel داخل Laragon.

## 1. تشغيل MySQL في Laragon

افتح Laragon ثم اضغط **Start All**. يكفي أن تصبح خدمة MySQL قيد التشغيل. تأكد من المنفذ من Laragon عبر **Menu → MySQL → my.ini**. المنفذ المعتاد هو `3306`.

## 2. التحقق من قاعدة البيانات

افتح PowerShell داخل مجلد المشروع ثم نفذ الأمر التالي. عدّل مسار `mysql.exe` فقط إذا كان Laragon مثبتًا في مسار مختلف:

```powershell
& "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root -h 127.0.0.1 -P 3306 -e "SHOW DATABASES;"
```

يجب أن ترى قاعدة `warehouse_online`. إن كان إصدار MySQL في Laragon مختلفًا، افتح مجلد `C:\laragon\bin\mysql\` واستبدل جزء اسم الإصدار في المسار باسم المجلد الموجود عندك.

## 3. إعداد ملف `.env`

أنشئ ملفًا اسمه `.env` في جذر المشروع إذا لم يكن موجودًا، ثم ضع فيه ما يلي:

```env
NODE_ENV=development
DATABASE_URL=mysql://root@127.0.0.1:3306/warehouse_online
JWT_SECRET=warehouse-local-secret-2026-change-this
OWNER_NAME=Local Admin
LOCAL_DEV_LOGIN_ENABLED=true
LOCAL_DEV_LOGIN_PASSWORD=0000
```

إذا كان MySQL في Laragon على منفذ مختلف، مثل `3307`، غيّر رقم المنفذ في `DATABASE_URL` فقط. وإذا عيّنت كلمة مرور لمستخدم `root` في Laragon، تصبح الصيغة:

```env
DATABASE_URL=mysql://root:كلمة_المرور@127.0.0.1:3306/warehouse_online
```

## 4. تشغيل التطبيق

داخل PowerShell في مجلد المشروع نفذ:

```powershell
npx pnpm install
npx pnpm dev
```

افتح العنوان الذي يظهر في الطرفية، وغالبًا:

```text
http://localhost:3000
```

سجّل الدخول من القائمة المحلية، واستخدم كلمة المرور `0000`.

> لا تشغّل `php artisan serve` ولا تحتاج Apache. Laragon يوفّر MySQL فقط؛ خادم التطبيق يبدأ بأمر `npx pnpm dev` على المنفذ 3000.
