# Schema — MissIssippiDB

> **Purpose:** Canonical DDL for the inventory database. Source of truth for both production (`MississippiDB`) and staging (`MississippiDB-Staging`).
>
> **When to update this file:** Whenever a migration changes the schema. The file should always reflect the current shape of production.
>
> **How to use:** When applying to a new/empty database, run only against the intended target. When applying to an existing database with data, do **not** run the `drop table` block — write a focused migration script instead.

---

## How to apply this safely

1. Open SSMS → connect to the target server
2. **Right-click the target database** in Object Explorer → **New Query** (this scopes the query to that database)
3. In the new query window, run this single line first to confirm the database context:
   ```sql
   SELECT DB_NAME() AS CurrentDatabase;
   ```
4. Verify the result is what you expect before running anything else.
5. Only then paste and run the script below.

> The `drop table if exists` block at the top wipes all listed tables. **Never run this on a database that contains data you want to keep.**

---

## DDL

```sql
-- ============================================================
-- Drop existing tables in dependency order (safe ONLY on empty DB)
-- ============================================================
drop table if exists ItemImage;
drop table if exists Sku;
drop table if exists InventoryActivityLog;
drop table if exists InventoryUploadBatch;
drop table if exists InventoryAdjustmentBatch;
drop table if exists Inventory;
drop table if exists ItemColorSecondaryColor;
drop table if exists ItemColor;
drop table if exists Item;
drop table if exists ImageType;
drop table if exists Sizes;
drop table if exists Color;
drop table if exists Collection;
drop table if exists Season;
GO

-- ============================================================
-- Reference / lookup tables
-- ============================================================
create table dbo.Sizes(
    SizeId int not null identity primary key,
    SizeName varchar(10) not null
        constraint c_Sizes_Size_name_cannot_be_blank check(SizeName > '')
        constraint u_Sizes_SizeName unique,
    SizeSequence int not null
        constraint u_Sizes_Size_Sequence unique
);

create table dbo.Season(
    SeasonId int not null identity primary key,
    SeasonName varchar(10) not null
        constraint c_Season_Season_name_cannot_be_blank check(SeasonName > '')
        constraint u_Season_SeasonName unique,
    SeasonDateCreated datetime not null,
    Active bit
);

create table dbo.Collection(
    CollectionId int not null identity primary key,
    CollectionName varchar(75) not null
        constraint c_Collection_Collection_name_cannot_be_blank check(CollectionName > '')
        constraint u_Collection_CollectionName unique
);

create table dbo.Color(
    ColorId int not null identity primary key,
    ColorName varchar(75) not null
        constraint c_Color_Color_name_cannot_be_blank check(ColorName > ''),
    SeasonId int null
        constraint f_Season_Color foreign key references Season(SeasonId),
    CollectionId int null
        constraint f_Collection_Color foreign key references Collection(CollectionId),
    PantoneColor varchar(50) null,
    HexValue varchar(7) null
        constraint c_Color_HexValue_format check(HexValue is null or HexValue like '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
    constraint u_Color_ColorName_SeasonId_CollectionId unique (ColorName, SeasonId, CollectionId)
);

-- ============================================================
-- Merchandising / catalog
-- ============================================================
create table dbo.Item(
    ItemId int not null identity primary key,
    ItemNumber varchar(75) not null
        constraint c_Item_Item_Number_cannot_be_blank check(ItemNumber > ''),
    [Description] varchar(500) not null
        constraint c_Item_Description_cannot_be_blank check([Description] > ''),
    CostPrice decimal,
    WholesalePrice decimal,
    [Weight] decimal,
    SeasonId int not null
        constraint f_Season_Item foreign key references Season(SeasonId),
    ItemDateCreated datetime not null,
    InProduction bit not null default 0,
    Constraint u_Item_ItemNumber_SeasonId unique(ItemNumber, SeasonId)
);

create table dbo.ItemColor(
    ItemColorId int not null identity primary key,
    ItemId int not null
        constraint f_Item_ItemColor foreign key references Item(ItemId),
    ColorId int not null
        constraint f_Color_ItemColor foreign key references Color(ColorId),
    Active bit not null
        constraint DF_ItemColor_Active default (1),
    CompositeSignature varchar(500) not null
        constraint DF_ItemColor_CompositeSignature default (''),
    Constraint u_ItemColor_ItemId_ColorId_CompositeSignature unique(ItemId, ColorId, CompositeSignature)
);

create table dbo.ItemColorSecondaryColor(
    ItemColorId int not null
        constraint f_ItemColor_ItemColorSecondaryColor foreign key references ItemColor(ItemColorId),
    SecondaryColorId int not null
        constraint f_Color_ItemColorSecondaryColor foreign key references Color(ColorId),
    SortOrder int not null
        constraint DF_ItemColorSecondaryColor_SortOrder default (1),
    constraint PK_ItemColorSecondaryColor primary key (ItemColorId, SecondaryColorId)
);

create table dbo.Sku(
    SkuId int not null identity primary key,
    ItemColorId int not null
        constraint f_ItemColor_Sku foreign key references ItemColor(ItemColorId),
    SizeId int not null
        constraint f_Sizes_Sku foreign key references Sizes(SizeId),
    Sku varchar(25) not null
        constraint c_Sku_Sku_cannot_be_blank check(Sku > ''),
    constraint u_Sku_Sku unique(Sku),
    constraint u_Sku_ItemColorId_SizeId unique(ItemColorId, SizeId)
);

create table dbo.ImageType(
    ImageTypeId int not null identity primary key,
    [Type] varchar(50) not null
        constraint c_ImageType_Type_cannot_be_blank check([Type] > ''),
    Sequence int not null
        constraint u_ImageType_Sequence unique,
    constraint u_ImageType_Type unique([Type])
);

create table dbo.ItemImage(
    ItemImageId int not null identity primary key,
    ItemColorId int not null
        constraint f_ItemColor_ItemImage foreign key references ItemColor(ItemColorId),
    ImageTypeId int not null
        constraint f_ImageType_ItemImage foreign key references ImageType(ImageTypeId),
    ImageUrl varchar(500) null,
    ImageSequenceWithinType int not null,
    ImageSequence int not null
);

-- ============================================================
-- Inventory
-- ============================================================
create table dbo.Inventory(
    InventoryId int not null identity primary key,
    ItemColorId int not null
        constraint f_ItemColor_Inventory foreign key references ItemColor(ItemColorId),
    SizeId int not null
        constraint f_Sizes_Inventory foreign key references Sizes(SizeId),
    Qty int not null,
    InStock as case
                when Qty > 0 then 1
                else 0
                end
            persisted
);

create table dbo.InventoryAdjustmentBatch(
    BatchId uniqueidentifier not null
        constraint PK_InventoryAdjustmentBatch primary key
        constraint DF_InventoryAdjustmentBatch_BatchId default newsequentialid(),
    BatchTimestamp datetime2(3) not null
        constraint DF_InventoryAdjustmentBatch_BatchTimestamp default sysutcdatetime(),
    Source varchar(30) not null,
    Notes varchar(200) null
);

create table dbo.InventoryUploadBatch(
    UploadBatchId uniqueidentifier not null
        constraint PK_InventoryUploadBatch primary key
        constraint DF_InventoryUploadBatch_UploadBatchId default newsequentialid(),
    CreatedAt datetime2(3) not null
        constraint DF_InventoryUploadBatch_CreatedAt default sysutcdatetime(),
    Status varchar(30) not null,
    Mode varchar(20) not null,
    DatasetHash varchar(64) not null,
    IdempotencyKey varchar(120) null,
    [RowCount] int not null
        constraint DF_InventoryUploadBatch_RowCount default (0),
    ProcessedRows int not null
        constraint DF_InventoryUploadBatch_ProcessedRows default (0),
    ErrorCount int not null
        constraint DF_InventoryUploadBatch_ErrorCount default (0),
    WarningCount int not null
        constraint DF_InventoryUploadBatch_WarningCount default (0),
    CreatedSkus int not null
        constraint DF_InventoryUploadBatch_CreatedSkus default (0),
    CreatedItemColors int not null
        constraint DF_InventoryUploadBatch_CreatedItemColors default (0),
    CreatedInventory int not null
        constraint DF_InventoryUploadBatch_CreatedInventory default (0),
    UpdatedInventory int not null
        constraint DF_InventoryUploadBatch_UpdatedInventory default (0),
    IsUndone bit not null
        constraint DF_InventoryUploadBatch_IsUndone default (0),
    UndoneAt datetime2(3) null,
    DuplicateOfUploadBatchId uniqueidentifier null,
    InventoryHistoryBatchId uniqueidentifier null,
    UndoHistoryBatchId uniqueidentifier null,
    Message varchar(500) null,
    ResultJson nvarchar(max) null
);

create table dbo.InventoryActivityLog(
    InventoryActivityLogId int not null identity primary key,
    BatchId uniqueidentifier not null
        constraint f_InventoryAdjustmentBatch_InventoryActivityLog
        foreign key references InventoryAdjustmentBatch(BatchId),
    ItemColorId int not null
        constraint f_ItemColor_InventoryActivityLog foreign key references ItemColor(ItemColorId),
    SizeId int not null
        constraint f_Sizes_InventoryActivityLog foreign key references Sizes(SizeId),
    Qty int not null,
    OldQty int not null
        constraint DF_InventoryActivityLog_OldQty default (0),
    NewQty int not null
        constraint DF_InventoryActivityLog_NewQty default (0),
    Delta int not null
        constraint DF_InventoryActivityLog_Delta default (0),
    ActionType varchar(150) not null,
    InventoryActivityDate datetime not null,
    LogTimestamp datetime2(3) not null
        constraint DF_InventoryActivityLog_LogTimestamp default (sysutcdatetime())
);
GO

-- ============================================================
-- Indexes
-- ============================================================
CREATE UNIQUE INDEX UX_Inventory_ItemColorId_SizeId
    ON dbo.Inventory(ItemColorId, SizeId);

CREATE INDEX IX_InventoryActivityLog_BatchId
    ON dbo.InventoryActivityLog(BatchId);

CREATE INDEX IX_InventoryActivityLog_LogTimestamp
    ON dbo.InventoryActivityLog(LogTimestamp);

CREATE INDEX IX_InventoryActivityLog_ItemColorId_LogTimestamp
    ON dbo.InventoryActivityLog(ItemColorId, LogTimestamp);

CREATE INDEX IX_InventoryActivityLog_ItemColorId_SizeId_LogTimestamp
    ON dbo.InventoryActivityLog(ItemColorId, SizeId, LogTimestamp);

CREATE INDEX IX_InventoryAdjustmentBatch_BatchTimestamp
    ON dbo.InventoryAdjustmentBatch(BatchTimestamp);

CREATE INDEX IX_InventoryAdjustmentBatch_Source_BatchTimestamp
    ON dbo.InventoryAdjustmentBatch(Source, BatchTimestamp);

CREATE INDEX ix_InventoryUploadBatch_CreatedAt
    ON dbo.InventoryUploadBatch(CreatedAt DESC);

CREATE INDEX ix_InventoryUploadBatch_Hash_Mode_Undone
    ON dbo.InventoryUploadBatch(DatasetHash, Mode, IsUndone);

CREATE UNIQUE INDEX u_InventoryUploadBatch_IdempotencyKey
    ON dbo.InventoryUploadBatch(IdempotencyKey)
    WHERE IdempotencyKey IS NOT NULL;

CREATE INDEX IX_Item_SeasonId
    ON dbo.Item(SeasonId);

CREATE INDEX IX_Color_SeasonId
    ON dbo.Color(SeasonId);

CREATE INDEX IX_Color_CollectionId
    ON dbo.Color(CollectionId);

CREATE INDEX IX_ItemColor_ItemId
    ON dbo.ItemColor(ItemId);

CREATE INDEX IX_ItemColor_ColorId
    ON dbo.ItemColor(ColorId);

CREATE INDEX IX_ItemColorSecondaryColor_ItemColorId
    ON dbo.ItemColorSecondaryColor(ItemColorId);

CREATE INDEX IX_ItemColorSecondaryColor_SecondaryColorId
    ON dbo.ItemColorSecondaryColor(SecondaryColorId);

CREATE INDEX IX_ItemImage_ItemColorId_ImageTypeId
    ON dbo.ItemImage(ItemColorId, ImageTypeId);
GO

-- ============================================================
-- Verification
-- ============================================================
SELECT COUNT(*) AS UserTableCount, DB_NAME() AS DatabaseName
FROM sys.tables
WHERE is_ms_shipped = 0;
-- Expected: UserTableCount = 14
```

---

## Table inventory

| # | Table | Purpose |
|---|---|---|
| 1 | Sizes | Size catalog with display ordering |
| 2 | Season | Seasonal drop labels (e.g., SS26, FW25) |
| 3 | Collection | Sub-grouping within season (Casual, Elegant) |
| 4 | Color | Color palette with Pantone + hex |
| 5 | Item | Style master (the merchandising unit) |
| 6 | ItemColor | A style in a colorway |
| 7 | ItemColorSecondaryColor | Secondary colors for prints/patterns |
| 8 | Sku | The inventory unit (ItemColor × Size) |
| 9 | ImageType | Image classification (front, back, swatch, etc.) |
| 10 | ItemImage | Images attached to ItemColor |
| 11 | Inventory | Current quantity by ItemColor × Size |
| 12 | InventoryAdjustmentBatch | Batch envelope for adjustments (scan/manual/upload) |
| 13 | InventoryUploadBatch | Audit of file uploads (hash, idempotency, undo state) |
| 14 | InventoryActivityLog | Line-by-line history with old/new/delta |

---

*Last updated: 2026-04-27 — applied to `MississippiDB-Staging` for the first time.*
