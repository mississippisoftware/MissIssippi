use MissIssippiDB
GO

-- Rename legacy Style tables to Item names when present
IF OBJECT_ID('dbo.Style', 'U') IS NOT NULL AND OBJECT_ID('dbo.Item', 'U') IS NULL
BEGIN
    EXEC sp_rename 'dbo.Style', 'Item';
END
GO

IF OBJECT_ID('dbo.StyleColor', 'U') IS NOT NULL AND OBJECT_ID('dbo.ItemColor', 'U') IS NULL
BEGIN
    EXEC sp_rename 'dbo.StyleColor', 'ItemColor';
END
GO

-- Rename columns on Item
IF COL_LENGTH('dbo.Item', 'StyleId') IS NOT NULL AND COL_LENGTH('dbo.Item', 'ItemId') IS NULL
    EXEC sp_rename 'dbo.Item.StyleId', 'ItemId', 'COLUMN';
IF COL_LENGTH('dbo.Item', 'StyleNumber') IS NOT NULL AND COL_LENGTH('dbo.Item', 'ItemNumber') IS NULL
    EXEC sp_rename 'dbo.Item.StyleNumber', 'ItemNumber', 'COLUMN';
IF COL_LENGTH('dbo.Item', 'StyleDateCreated') IS NOT NULL AND COL_LENGTH('dbo.Item', 'ItemDateCreated') IS NULL
    EXEC sp_rename 'dbo.Item.StyleDateCreated', 'ItemDateCreated', 'COLUMN';
GO

-- Rename columns on ItemColor
IF COL_LENGTH('dbo.ItemColor', 'StyleColorId') IS NOT NULL AND COL_LENGTH('dbo.ItemColor', 'ItemColorId') IS NULL
    EXEC sp_rename 'dbo.ItemColor.StyleColorId', 'ItemColorId', 'COLUMN';
IF COL_LENGTH('dbo.ItemColor', 'StyleId') IS NOT NULL AND COL_LENGTH('dbo.ItemColor', 'ItemId') IS NULL
    EXEC sp_rename 'dbo.ItemColor.StyleId', 'ItemId', 'COLUMN';
GO

-- Rename foreign key columns that reference ItemColor
IF COL_LENGTH('dbo.Inventory', 'StyleColorId') IS NOT NULL AND COL_LENGTH('dbo.Inventory', 'ItemColorId') IS NULL
    EXEC sp_rename 'dbo.Inventory.StyleColorId', 'ItemColorId', 'COLUMN';
IF COL_LENGTH('dbo.InventoryActivityLog', 'StyleColorId') IS NOT NULL AND COL_LENGTH('dbo.InventoryActivityLog', 'ItemColorId') IS NULL
    EXEC sp_rename 'dbo.InventoryActivityLog.StyleColorId', 'ItemColorId', 'COLUMN';
GO
