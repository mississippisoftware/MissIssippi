use MissIssippiDB
go

drop table if exists ItemImage
go
drop table if exists Sku
go
drop table if exists InventoryActivityLog
go
drop table if exists InventoryUploadBatch
go
drop table if exists InventoryAdjustmentBatch
go
drop table if exists Inventory
go
drop table if exists ItemColorSecondaryColor
go
drop table if exists ItemColor
go
drop table if exists Item
go
drop table if exists ImageType
go
drop table if exists Sizes 
go
drop table if exists Color 
go 
drop table if exists Collection
go
drop table if exists Season
go 

create table dbo.Sizes(
    SizeId int not null identity primary key,
    SizeName varchar(10) not null 
        constraint c_Sizes_Size_name_cannot_be_blank check(SizeName > '')
        constraint u_Sizes_SizeName unique,
    SizeSequence int not null 
        constraint u_Sizes_Size_Sequence unique 
)

create table dbo.Season(
    SeasonId int not null identity primary key,
    SeasonName varchar(10) not null 
        constraint c_Season_Season_name_cannot_be_blank check(SeasonName > '')
        constraint u_Season_SeasonName unique,
    SeasonDateCreated datetime not null,
    Active bit 
)

create table dbo.Collection(
    CollectionId int not null identity primary key,
    CollectionName varchar(75) not null
        constraint c_Collection_Collection_name_cannot_be_blank check(CollectionName > '')
        constraint u_Collection_CollectionName unique
)

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
        constraint c_Color_HexValue_format check(HexValue is null or HexValue like '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]')
        --pantone  
    ,
    constraint u_Color_ColorName_SeasonId_CollectionId unique (ColorName, SeasonId, CollectionId)
)

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
)

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
)

create table dbo.ItemColorSecondaryColor(
    ItemColorId int not null
        constraint f_ItemColor_ItemColorSecondaryColor foreign key references ItemColor(ItemColorId),
    SecondaryColorId int not null
        constraint f_Color_ItemColorSecondaryColor foreign key references Color(ColorId),
    SortOrder int not null
        constraint DF_ItemColorSecondaryColor_SortOrder default (1),
    constraint PK_ItemColorSecondaryColor primary key (ItemColorId, SecondaryColorId)
)

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
)

create table dbo.ImageType(
    ImageTypeId int not null identity primary key,
    [Type] varchar(50) not null
        constraint c_ImageType_Type_cannot_be_blank check([Type] > ''),
    Sequence int not null
        constraint u_ImageType_Sequence unique,
    constraint u_ImageType_Type unique([Type])
)

create table dbo.ItemImage(
    ItemImageId int not null identity primary key,
    ItemColorId int not null
        constraint f_ItemColor_ItemImage foreign key references ItemColor(ItemColorId),
    ImageTypeId int not null
        constraint f_ImageType_ItemImage foreign key references ImageType(ImageTypeId),
    ImageUrl varchar(500) null,
    ImageSequenceWithinType int not null,
    ImageSequence int not null
)

create table dbo.Inventory(
    InventoryId int not null identity primary key,
    ItemColorId int not null 
        constraint f_ItemColor_Inventory foreign key references ItemColor(ItemColorId),
    SizeId int not null 
        constraint f_Sizes_Inventory foreign key references Sizes(SizeId),
    Qty int not null
    ,
     InStock as case 
                when Qty > 0 then 1
                else 0
                end
            persisted
)

create table dbo.InventoryAdjustmentBatch(
    BatchId uniqueidentifier not null
        constraint PK_InventoryAdjustmentBatch primary key
        constraint DF_InventoryAdjustmentBatch_BatchId default newsequentialid(),
    BatchTimestamp datetime2(3) not null
        constraint DF_InventoryAdjustmentBatch_BatchTimestamp default sysutcdatetime(),
    Source varchar(30) not null,
    Notes varchar(200) null
)

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
)

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
)

-- INVENTORY 
CREATE UNIQUE INDEX UX_Inventory_ItemColorId_SizeId
ON dbo.Inventory(ItemColorId, SizeId);

-- INVENTORY ACTIVITY LOG (history lookups)
CREATE INDEX IX_InventoryActivityLog_BatchId
ON dbo.InventoryActivityLog(BatchId);

CREATE INDEX IX_InventoryActivityLog_LogTimestamp
ON dbo.InventoryActivityLog(LogTimestamp);

CREATE INDEX IX_InventoryActivityLog_ItemColorId_LogTimestamp
ON dbo.InventoryActivityLog(ItemColorId, LogTimestamp);

CREATE INDEX IX_InventoryActivityLog_ItemColorId_SizeId_LogTimestamp
ON dbo.InventoryActivityLog(ItemColorId, SizeId, LogTimestamp);

-- ADJUSTMENT BATCH (filter by timestamp + source)
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

-- IMAGES (fetch images for a style-color quickly)
CREATE INDEX IX_ItemImage_ItemColorId_ImageTypeId
ON dbo.ItemImage(ItemColorId, ImageTypeId);

GO
