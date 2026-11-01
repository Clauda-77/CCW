-- تحقق للقراءة فقط؛ اختر warehouse_online في phpMyAdmin قبل التشغيل.
SELECT DATABASE() AS selected_database;

SHOW COLUMNS FROM `users` LIKE 'username';
SHOW COLUMNS FROM `users` LIKE 'passwordHash';
SHOW COLUMNS FROM `users` LIKE 'authVersion';

SELECT
  COUNT(*) AS existing_users,
  SUM(`username` IS NOT NULL) AS users_with_username,
  SUM(`passwordHash` IS NOT NULL) AS users_with_local_password
FROM `users`;

SELECT COUNT(*) AS existing_user_warehouse_assignments
FROM `userwarehouses`;
