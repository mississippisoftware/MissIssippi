use MissIssippiDB
go

drop table if exists ItemImage
go
drop table if exists Sku
go
drop table if exists InventoryActivityLog
go
drop table if exists Inventory
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

create table dbo.Color(
    ColorId int not null identity primary key,
    ColorName varchar(75) not null
     constraint c_Color_Color_name_cannot_be_blank check(ColorName > '')
        constraint u_Color_ColorName unique,
    SeasonId int null
        constraint f_Season_Color foreign key references Season(SeasonId),
    PantoneColor varchar(50) null,
    HexValue varchar(7) null
        constraint c_Color_HexValue_format check(HexValue is null or HexValue like '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]')
        --pantone  
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
    Constraint u_ItemColor_ItemId_ColorId unique(ItemId, ColorId)
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

create table dbo.InventoryActivityLog(
    InventoryActivityLogId int not null identity primary key,
    ItemColorId int not null 
        constraint f_ItemColor_InventoryActivityLog foreign key references ItemColor(ItemColorId),
    SizeId int not null 
        constraint f_Sizes_InventoryActivityLog foreign key references Sizes(SizeId),
    Qty int not null,
    ActionType varchar(150) not null,
    InventoryActivityDate datetime not null
)

