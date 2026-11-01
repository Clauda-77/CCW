-- نفّذ هذا الملف مرة واحدة فقط بعد اختيار قاعدة warehouse_online في phpMyAdmin.
-- يضيف حقول الدخول المحلي فقط؛ لا يحذف المستخدمين الحاليين ولا يغيّر الأدوار أو الإسنادات.
-- اترك الأعمدة NULL للحسابات الحالية إلى أن يهيئ المدير اسم دخول وكلمة مرور لكل مستخدم.
ALTER TABLE `users`
  ADD COLUMN `username` VARCHAR(64) NULL,
  ADD COLUMN `passwordHash` VARCHAR(255) NULL,
  ADD COLUMN `authVersion` INT NOT NULL DEFAULT 0,
  ADD UNIQUE KEY `users_username_uq` (`username`);
