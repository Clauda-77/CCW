127.0.0.1/information_schema/COLUMNS/		http://localhost/phpmyadmin/index.php?route=/table/sql&db=information_schema&table=COLUMNS

   Showing rows 0 - 143 (144 total, Query took 0.2714 seconds.) [TABLE_NAME: ADMINAUDITLOGS... - __DRIZZLE_MIGRATIONS...] [ORDINAL_POSITION: 1... - 3...]


SELECT
    c.TABLE_NAME,
    c.ORDINAL_POSITION,
    c.COLUMN_NAME,
    c.COLUMN_TYPE,
    c.IS_NULLABLE,
    c.COLUMN_DEFAULT,
    c.COLUMN_KEY,
    c.EXTRA,
    kcu.REFERENCED_TABLE_NAME,
    kcu.REFERENCED_COLUMN_NAME
FROM information_schema.COLUMNS c
LEFT JOIN information_schema.KEY_COLUMN_USAGE kcu
    ON kcu.TABLE_SCHEMA = c.TABLE_SCHEMA
   AND kcu.TABLE_NAME = c.TABLE_NAME
   AND kcu.COLUMN_NAME = c.COLUMN_NAME
   AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
WHERE c.TABLE_SCHEMA = 'computercenter'
ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION;


TABLE_NAME   	ORDINAL_POSITION	COLUMN_NAME	COLUMN_TYPE	IS_NULLABLE	COLUMN_DEFAULT	COLUMN_KEY	EXTRA	REFERENCED_TABLE_NAME	REFERENCED_COLUMN_NAME	
adminauditlogs	1	id	int(11)	NO	NULL			NULL	NULL	
adminauditlogs	2	actorId	int(11)	NO	NULL			NULL	NULL	
adminauditlogs	3	action	enum('memo_deleted','user_role_changed')	NO	NULL			NULL	NULL	
adminauditlogs	4	entityType	enum('memo','user')	NO	NULL			NULL	NULL	
adminauditlogs	5	entityId	int(11)	NO	NULL			NULL	NULL	
adminauditlogs	6	entityLabel	varchar(255)	YES	NULL			NULL	NULL	
adminauditlogs	7	details	text	YES	NULL			NULL	NULL	
adminauditlogs	8	createdAt	timestamp	NO	current_timestamp()			NULL	NULL	
colleges	1	id	int(11)	NO	NULL			NULL	NULL	
colleges	2	code	varchar(64)	YES	NULL			NULL	NULL	
colleges	3	name	varchar(255)	YES	NULL			NULL	NULL	
colleges	4	notes	text	YES	NULL			NULL	NULL	
colleges	5	isActive	tinyint(1)	YES	NULL			NULL	NULL	
colleges	6	createdAt	timestamp	YES	NULL			NULL	NULL	
colleges	7	updatedAt	timestamp	YES	NULL			NULL	NULL	
financialentries	1	id	int(11)	NO	NULL	PRI	auto_increment	NULL	NULL	
financialentries	2	entryNumber	varchar(128)	NO	NULL	MUL		NULL	NULL	
financialentries	3	entryDate	timestamp	NO	current_timestamp()	MUL	on update current_timestamp()	NULL	NULL	
financialentries	4	warehouseId	int(11)	NO	NULL	MUL		NULL	NULL	
financialentries	5	invoiceNumber	varchar(128)	YES	NULL	MUL		NULL	NULL	
financialentries	6	disbursementNumber	varchar(128)	YES	NULL	MUL		NULL	NULL	
financialentries	7	receiptMemoNumber	varchar(128)	YES	NULL	MUL		NULL	NULL	
financialentries	8	referenceNumber	varchar(128)	YES	NULL			NULL	NULL	
financialentries	9	amount	decimal(18,2)	NO	0.00			NULL	NULL	
financialentries	10	currency	varchar(16)	NO	'SYP'			NULL	NULL	
financialentries	11	description	text	YES	NULL			NULL	NULL	
financialentries	12	source	enum('manual','excel','legacy','memo_auto')	NO	'manual'			NULL	NULL	
financialentries	13	createdBy	int(11)	NO	NULL			NULL	NULL	
financialentries	14	createdAt	timestamp	NO	current_timestamp()			NULL	NULL	
importbatches	1	id	int(11)	NO	NULL			NULL	NULL	
importbatches	2	category	enum('materials','balances','memos','parties')	NO	NULL			NULL	NULL	
importbatches	3	originalFilename	varchar(255)	NO	NULL			NULL	NULL	
importbatches	4	storageKey	varchar(500)	YES	NULL			NULL	NULL	
importbatches	5	status	enum('uploaded','validating','validated','imported...	NO	'uploaded'			NULL	NULL	
importbatches	6	totalRows	int(11)	NO	0			NULL	NULL	
importbatches	7	importedRows	int(11)	NO	0			NULL	NULL	
importbatches	8	errorSummary	text	YES	NULL			NULL	NULL	
importbatches	9	createdBy	int(11)	NO	NULL			NULL	NULL	
importbatches	10	createdAt	timestamp	NO	current_timestamp()			NULL	NULL	
importbatches	11	completedAt	timestamp	YES	NULL			NULL	NULL	
inventorybalances	1	id	int(11)	NO	NULL			NULL	NULL	
inventorybalances	2	materialId	int(11)	NO	NULL	MUL		NULL	NULL	
inventorybalances	3	warehouseId	int(11)	NO	NULL			NULL	NULL	
inventorybalances	4	partyId	int(11)	YES	NULL			NULL	NULL	
inventorybalances	5	openingQuantity	decimal(15,3)	NO	0.000			NULL	NULL	
inventorybalances	6	onHandQuantity	decimal(15,3)	NO	0.000			NULL	NULL	
inventorybalances	7	reservedQuantity	decimal(15,3)	NO	0.000			NULL	NULL	
inventorybalances	8	updatedAt	timestamp	NO	current_timestamp()		on update current_timestamp()	NULL	NULL	
materials	1	id	int(11)	NO	NULL			NULL	NULL	
materials	2	code	varchar(64)	NO	NULL	MUL		NULL	NULL	
materials	3	name	varchar(500)	NO	NULL	MUL		NULL	NULL	
materials	4	description	text	YES	NULL			NULL	NULL	
materials	5	unit	varchar(64)	NO	NULL			NULL	NULL	
materials	6	barcode	varchar(128)	YES	NULL			NULL	NULL	
materials	7	minimumStock	decimal(15,3)	NO	0.000			NULL	NULL	
materials	8	isActive	tinyint(1)	NO	1			NULL	NULL	
materials	9	createdAt	timestamp	NO	current_timestamp()			NULL	NULL	
materials	10	updatedAt	timestamp	NO	current_timestamp()		on update current_timestamp()	NULL	NULL	
memoitems	1	id	int(11)	NO	NULL			NULL	NULL	
memoitems	2	memoId	int(11)	NO	NULL	MUL		NULL	NULL	
memoitems	3	materialId	int(11)	NO	NULL	MUL		NULL	NULL	
memoitems	4	quantity	decimal(15,3)	NO	NULL			NULL	NULL	
memoitems	5	unitPrice	decimal(18,2)	YES	NULL			NULL	NULL	
memoitems	6	notes	text	YES	NULL			NULL	NULL	
memoitems	7	createdAt	timestamp	NO	current_timestamp()			NULL	NULL	
memoreconciliations	1	id	int(11)	NO	NULL	PRI	auto_increment	NULL	NULL	
memoreconciliations	2	memoId	int(11)	NO	NULL	UNI		NULL	NULL	
memoreconciliations	3	financialEntryId	int(11)	YES	NULL			NULL	NULL	
memoreconciliations	4	status	enum('pending','matched','mismatch','not_found','w...	NO	'pending'	MUL		NULL	NULL	
memoreconciliations	5	differenceAmount	decimal(18,2)	NO	0.00			NULL	NULL	
memoreconciliations	6	matchedBy	int(11)	YES	NULL			NULL	NULL	
memoreconciliations	7	matchedAt	timestamp	YES	NULL			NULL	NULL	
memoreconciliations	8	notes	text	YES	NULL			NULL	NULL	
memoreconciliations	9	createdAt	timestamp	NO	current_timestamp()			NULL	NULL	
memos	1	id	int(11)	NO	NULL			NULL	NULL	
memos	2	type	enum('inbound','outbound')	NO	NULL	MUL		NULL	NULL	
memos	3	memoNumber	varchar(64)	NO	NULL			NULL	NULL	
memos	4	status	enum('draft','pending_review','approved','rejected...	NO	'draft'	MUL		NULL	NULL	
memos	5	warehouseId	int(11)	NO	NULL			NULL	NULL	
memos	6	relatedMemoId	int(11)	YES	NULL	MUL		NULL	NULL	
memos	7	partyId	int(11)	YES	NULL			NULL	NULL	
memos	8	referenceNumber	varchar(128)	YES	NULL			NULL	NULL	
memos	9	referenceDate	timestamp	YES	NULL			NULL	NULL	
memos	10	memoDate	timestamp	YES	NULL			NULL	NULL	
memos	11	notes	text	YES	NULL			NULL	NULL	
memos	12	createdBy	int(11)	NO	NULL			NULL	NULL	
memos	13	reviewedBy	int(11)	YES	NULL			NULL	NULL	
memos	14	approvedBy	int(11)	YES	NULL			NULL	NULL	
memos	15	reviewedAt	timestamp	YES	NULL			NULL	NULL	
memos	16	approvedAt	timestamp	YES	NULL			NULL	NULL	
memos	17	printedAt	timestamp	YES	NULL			NULL	NULL	
memos	18	createdAt	timestamp	NO	current_timestamp()			NULL	NULL	
memos	19	updatedAt	timestamp	NO	current_timestamp()		on update current_timestamp()	NULL	NULL	
memos	20	folderNumber	varchar(64)	YES	NULL			NULL	NULL	
memos	21	orderNumber	varchar(128)	YES	NULL			NULL	NULL	
memos	22	orderDate	timestamp	YES	NULL			NULL	NULL	
memos	23	invoiceNumber	varchar(128)	YES	NULL			NULL	NULL	
memos	24	invoiceDate	timestamp	YES	NULL			NULL	NULL	
parties	1	id	int(11)	NO	NULL			NULL	NULL	
parties	2	legacyNumber	varchar(64)	YES	NULL			NULL	NULL	

parties	3	name	varchar(255)	NO	NULL			NULL	NULL	
parties	4	type	enum('supplier','recipient','both','internal')	NO	'both'			NULL	NULL	
parties	5	phone	varchar(64)	YES	NULL			NULL	NULL	
parties	6	address	text	YES	NULL			NULL	NULL	
parties	7	isActive	tinyint(1)	NO	1			NULL	NULL	
parties	8	createdAt	timestamp	NO	current_timestamp()			NULL	NULL	
parties	9	updatedAt	timestamp	NO	current_timestamp()		on update current_timestamp()	NULL	NULL	
stockmovements	1	id	int(11)	NO	NULL			NULL	NULL	
stockmovements	2	materialId	int(11)	NO	NULL	MUL		NULL	NULL	
stockmovements	3	warehouseId	int(11)	NO	NULL			NULL	NULL	
stockmovements	4	partyId	int(11)	YES	NULL			NULL	NULL	
stockmovements	5	memoId	int(11)	YES	NULL			NULL	NULL	
stockmovements	6	memoItemId	int(11)	YES	NULL			NULL	NULL	
stockmovements	7	movementType	enum('opening','inbound','outbound','adjustment','...	NO	NULL			NULL	NULL	
stockmovements	8	quantityIn	decimal(15,3)	NO	0.000			NULL	NULL	
stockmovements	9	quantityOut	decimal(15,3)	NO	0.000			NULL	NULL	
stockmovements	10	occurredAt	timestamp	NO	current_timestamp()	MUL	on update current_timestamp()	NULL	NULL	
stockmovements	11	createdBy	int(11)	YES	NULL			NULL	NULL	
stockmovements	12	createdAt	timestamp	NO	current_timestamp()			NULL	NULL	
users	1	id	int(11)	NO	NULL			NULL	NULL	
users	2	openId	varchar(64)	NO	NULL			NULL	NULL	
users	3	name	text	YES	NULL			NULL	NULL	
users	4	email	varchar(320)	YES	NULL			NULL	NULL	
users	5	loginMethod	varchar(64)	YES	NULL			NULL	NULL	
users	6	role	enum('user','warehouse_keeper','data_entry','revie...	NO	'data_entry'			NULL	NULL	
users	7	createdAt	timestamp	NO	current_timestamp()			NULL	NULL	
users	8	updatedAt	timestamp	NO	current_timestamp()		on update current_timestamp()	NULL	NULL	
users	9	lastSignedIn	timestamp	NO	current_timestamp()			NULL	NULL	
userwarehouses	1	id	int(11)	NO	NULL	PRI	auto_increment	NULL	NULL	
userwarehouses	2	userId	int(11)	NO	NULL	MUL		NULL	NULL	
userwarehouses	3	warehouseId	int(11)	NO	NULL	MUL		NULL	NULL	
userwarehouses	4	assignedBy	int(11)	YES	NULL	MUL		NULL	NULL	
userwarehouses	5	assignedAt	timestamp	NO	current_timestamp()			NULL	NULL	
warehouses	1	id	int(11)	NO	NULL			NULL	NULL	
warehouses	2	code	varchar(64)	NO	NULL			NULL	NULL	
warehouses	3	name	varchar(255)	NO	NULL			NULL	NULL	
warehouses	4	kind	enum('central','branch','storage')	NO	'branch'			NULL	NULL	
warehouses	5	isActive	tinyint(1)	NO	1			NULL	NULL	
warehouses	6	notes	text	YES	NULL			NULL	NULL	
warehouses	7	createdAt	timestamp	NO	current_timestamp()			NULL	NULL	
warehouses	8	updatedAt	timestamp	NO	current_timestamp()		on update current_timestamp()	NULL	NULL	
__drizzle_migrations	1	id	bigint(20) unsigned	NO	NULL			NULL	NULL	
__drizzle_migrations	2	hash	text	NO	NULL			NULL	NULL	
__drizzle_migrations	3	created_at	bigint(20)	YES	NULL			NULL	NULL	
