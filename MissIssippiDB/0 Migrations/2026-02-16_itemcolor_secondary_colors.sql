use MissIssippiDB
GO

IF OBJECT_ID('dbo.ItemColorSecondaryColor', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ItemColorSecondaryColor(
        ItemColorId int not null
            constraint f_ItemColor_ItemColorSecondaryColor foreign key references ItemColor(ItemColorId),
        SecondaryColorId int not null
            constraint f_Color_ItemColorSecondaryColor foreign key references Color(ColorId),
        SortOrder int not null
            constraint DF_ItemColorSecondaryColor_SortOrder default (1),
        constraint PK_ItemColorSecondaryColor primary key (ItemColorId, SecondaryColorId)
    );
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_ItemColorSecondaryColor_ItemColorId'
      AND object_id = OBJECT_ID('dbo.ItemColorSecondaryColor')
)
BEGIN
    CREATE INDEX IX_ItemColorSecondaryColor_ItemColorId
    ON dbo.ItemColorSecondaryColor(ItemColorId);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_ItemColorSecondaryColor_SecondaryColorId'
      AND object_id = OBJECT_ID('dbo.ItemColorSecondaryColor')
)
BEGIN
    CREATE INDEX IX_ItemColorSecondaryColor_SecondaryColorId
    ON dbo.ItemColorSecondaryColor(SecondaryColorId);
END
GO
