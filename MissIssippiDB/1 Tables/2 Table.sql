use MissIssippiDB
go
drop table if exists InventoryActivityLog
go
drop table if exists Inventory
go
drop table if exists StyleColor
go
drop table if exists Style
go
drop table if exists Sizes 
go
drop table if exists Color 
go 
drop table if exists Season
go 
drop table if exists ProductType
go

create table dbo.Sizes(
    SizeId int not null identity primary key,
    SizeName varchar(10) not null 
        constraint c_Sizes_Size_name_cannot_be_blank check(SizeName > '')
        constraint u_Sizes_SizeName unique,
    SizeSequence int not null 
        constraint u_Sizes_Size_Sequence unique 
)

create table dbo.Color(
    ColorId int not null identity primary key,
    ColorName varchar(75) not null
     constraint c_Color_Color_name_cannot_be_blank check(ColorName > '')
        constraint u_Color_ColorName unique
        --pantone  
)

create table dbo.Season(
    SeasonId int not null identity primary key,
    SeasonName varchar(4) not null 
        constraint c_Season_Season_name_cannot_be_blank check(SeasonName > '')
        constraint u_Season_SeasonName unique,
    SeasonDateCreated datetime not null,
    Active bit 
)

create table dbo.ProductType(
    ProductTypeId int not null identity primary key,
    ProductTypeName varchar(150) not null 
        constraint c_ProductType_Product_Name_cannot_be_blank check(ProductTypeName > '')
        constraint u_ProductType_ProductTypeName unique
)

create table dbo.Style(
    StyleId int not null identity primary key, 
    StyleNumber varchar(75) not null 
        constraint c_Style_Style_Number_cannot_be_blank check(StyleNumber > ''),
    [Description] varchar(500), 
    ProductTypeId int not null
        constraint f_ProductType_Style foreign key references ProductType(ProductTypeId),
    CostPrice decimal,
    WholesalePrice decimal,
    [Weight] decimal,
    SeasonId int not null 
        constraint f_Season_Style foreign key references Season(SeasonId),
    StyleDateCreated datetime not null,
    InProduction bit not null default 0,
    Constraint u_Style_StyleNumber_SeasonId unique(StyleNumber, SeasonId)
)

create table dbo.StyleColor(
    StyleColorId int not null identity primary key,
    StyleId int not null 
        constraint f_Style_StyleColor foreign key references Style(StyleId),
    ColorId int not null 
        constraint f_Color_StyleColor foreign key references Color(ColorId),
    Constraint u_StyleColor_StyleId_ColorId unique(StyleId, ColorId)
)

create table dbo.Inventory(
    InventoryId int not null identity primary key,
    StyleColorId int not null 
        constraint f_StyleColor_Inventory foreign key references StyleColor(StyleColorId),
    SizeId int not null 
        constraint f_Sizes_Inventory foreign key references Sizes(SizeId),
    Qty int not null,
    InStock as case 
                when Qty > 0 then 1
                else 0
                end
            persisted
)

create table dbo.InventoryActivityLog(
    InventoryActivityLogId int not null identity primary key,
    StyleColorId int not null 
        constraint f_StyleColor_InventoryActivityLog foreign key references StyleColor(StyleColorId),
    SizeId int not null 
        constraint f_Sizes_InventoryActivityLog foreign key references Sizes(SizeId),
    Qty int not null,
    ActionType varchar(150) not null,
    InventoryActivityDate datetime not null,
)

