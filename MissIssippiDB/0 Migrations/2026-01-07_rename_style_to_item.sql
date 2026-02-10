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

-- Refresh views to Item naming
DROP VIEW IF EXISTS ItemView;
GO
CREATE VIEW ItemView AS (
    SELECT
        s.ItemNumber,
        s.[Description],
        s.CostPrice,
        s.WholesalePrice,
        s.Weight,
        se.SeasonName,
        se.SeasonDateCreated,
        SeasonActive = se.Active,
        s.ItemDateCreated,
        s.InProduction,
        s.ItemId,
        s.SeasonId
    FROM Item s
    JOIN Season se
        ON s.SeasonId = se.SeasonId
);
GO

DROP VIEW IF EXISTS ItemColorView;
GO
CREATE VIEW ItemColorView AS (
    SELECT
        s.ItemNumber,
        c.ColorName,
        se.SeasonName,
        sc.ItemColorId,
        sc.ColorId,
        sc.ItemId,
        se.SeasonId
    FROM ItemColor sc
    JOIN Item s
        ON sc.ItemId = s.ItemId
    JOIN Color c
        ON sc.ColorId = c.ColorId
    JOIN Season se
        ON s.SeasonId = se.SeasonId
);
GO

DROP VIEW IF EXISTS InventoryView;
GO
CREATE VIEW InventoryView AS (
    SELECT
        s.ItemNumber,
        s.[Description],
        c.ColorName,
        si.SizeName,
        i.Qty,
        se.SeasonName,
        i.InStock,
        i.InventoryId,
        i.ItemColorId,
        s.ItemId,
        c.ColorId,
        i.SizeId,
        se.SeasonId
    FROM Inventory i
    JOIN ItemColor sc
        ON i.ItemColorId = sc.ItemColorId
    JOIN Item s
        ON sc.ItemId = s.ItemId
    JOIN Season se
        ON se.SeasonId = s.SeasonId
    JOIN Color c
        ON sc.ColorId = c.ColorId
    JOIN Sizes si
        ON i.SizeId = si.SizeId
);
GO
