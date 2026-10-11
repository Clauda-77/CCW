ALTER TABLE `adminAuditLogs` MODIFY COLUMN `action` enum('memo_deleted','user_role_changed','user_created','material_created','material_updated','material_deactivated','material_deleted','warehouse_created','warehouse_updated','warehouse_deactivated','warehouse_deleted','party_created','party_updated','party_deactivated','college_created','college_updated','college_deactivated','memo_created','memo_reviewed','memo_cancelled','memo_approved','import_committed','memo_import_committed') NOT NULL;--> statement-breakpoint
ALTER TABLE `adminAuditLogs` MODIFY COLUMN `action` enum(
  'memo_deleted','user_role_changed','user_created',
  'material_created','material_updated','material_deactivated','material_deleted',
  'warehouse_created','warehouse_updated','warehouse_deactivated','warehouse_deleted',
  'party_created','party_updated','party_deactivated',
  'college_created','college_updated','college_deactivated',
  'memo_created','memo_reviewed','memo_cancelled','memo_approved',
  'import_committed','memo_import_committed'
) NOT NULL;
--> statement-breakpoint
ALTER TABLE `adminAuditLogs` MODIFY COLUMN `entityType` enum('memo','user','material','warehouse','party','college','import_batch') NOT NULL;
