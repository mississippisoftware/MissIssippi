use MissIssippiDB
GO

-- Ensure SeasonName length supports Legacy
IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Season')
      AND name = 'SeasonName'
      AND max_length < 10
)
BEGIN
    ALTER TABLE dbo.Season ALTER COLUMN SeasonName varchar(10) NOT NULL;
END
GO

-- Add Color metadata columns if missing
IF COL_LENGTH('dbo.Color', 'SeasonId') IS NULL
    ALTER TABLE dbo.Color ADD SeasonId int NULL;
IF COL_LENGTH('dbo.Color', 'PantoneColor') IS NULL
    ALTER TABLE dbo.Color ADD PantoneColor varchar(50) NULL;
IF COL_LENGTH('dbo.Color', 'HexValue') IS NULL
    ALTER TABLE dbo.Color ADD HexValue varchar(7) NULL;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'f_Season_Color'
)
BEGIN
    ALTER TABLE dbo.Color
    ADD CONSTRAINT f_Season_Color FOREIGN KEY (SeasonId) REFERENCES Season(SeasonId);
END
GO

-- Ensure Legacy season exists
IF NOT EXISTS (SELECT 1 FROM dbo.Season WHERE SeasonName = 'Legacy')
BEGIN
    INSERT INTO dbo.Season(SeasonName, SeasonDateCreated, Active)
    VALUES ('Legacy', GETDATE(), 1);
END
GO

-- Add ItemColorId columns if missing
IF OBJECT_ID('dbo.Sku', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.Sku', 'ItemColorId') IS NULL
        ALTER TABLE dbo.Sku ADD ItemColorId int NULL;
END
GO

IF OBJECT_ID('dbo.ItemImage', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.ItemImage', 'ItemColorId') IS NULL
        ALTER TABLE dbo.ItemImage ADD ItemColorId int NULL;
END
GO

-- Backfill ItemColorId from ItemMaster where possible
IF OBJECT_ID('dbo.Sku', 'U') IS NOT NULL
    AND OBJECT_ID('dbo.ItemMaster', 'U') IS NOT NULL
    AND COL_LENGTH('dbo.Sku', 'ItemColorId') IS NOT NULL
    AND COL_LENGTH('dbo.Sku', 'ItemMasterId') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        UPDATE s
        SET s.ItemColorId = sc.ItemColorId
        FROM dbo.Sku s
        JOIN dbo.ItemMaster im ON s.ItemMasterId = im.ItemMasterId
        JOIN dbo.ItemColor sc ON sc.ItemId = im.ItemId AND sc.ColorId = im.ColorId
        WHERE s.ItemColorId IS NULL;';
END
GO

IF OBJECT_ID('dbo.ItemImage', 'U') IS NOT NULL
    AND OBJECT_ID('dbo.ItemMaster', 'U') IS NOT NULL
    AND COL_LENGTH('dbo.ItemImage', 'ItemColorId') IS NOT NULL
    AND COL_LENGTH('dbo.ItemImage', 'ItemMasterId') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        UPDATE img
        SET img.ItemColorId = sc.ItemColorId
        FROM dbo.ItemImage img
        JOIN dbo.ItemMaster im ON img.ItemMasterId = im.ItemMasterId
        JOIN dbo.ItemColor sc ON sc.ItemId = im.ItemId AND sc.ColorId = im.ColorId
        WHERE img.ItemColorId IS NULL;';
END
GO

-- Drop all FKs that reference ItemMaster
IF OBJECT_ID('dbo.ItemMaster', 'U') IS NOT NULL
BEGIN
    DECLARE @dropSql nvarchar(max) = N'';

    SELECT @dropSql = @dropSql
        + N'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + N'.'
        + QUOTENAME(OBJECT_NAME(parent_object_id))
        + N' DROP CONSTRAINT ' + QUOTENAME(name) + N';' + CHAR(13)
    FROM sys.foreign_keys
    WHERE referenced_object_id = OBJECT_ID('dbo.ItemMaster');

    IF @dropSql <> N''
        EXEC sp_executesql @dropSql;
END
GO

-- Finalize Sku migration
IF OBJECT_ID('dbo.Sku', 'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.objects WHERE name = 'u_Sku_ItemMasterId_SizeId' AND type = 'UQ')
        ALTER TABLE dbo.Sku DROP CONSTRAINT u_Sku_ItemMasterId_SizeId;

    IF COL_LENGTH('dbo.Sku', 'ItemMasterId') IS NOT NULL
        ALTER TABLE dbo.Sku DROP COLUMN ItemMasterId;

    IF COL_LENGTH('dbo.Sku', 'ItemColorId') IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM dbo.Sku WHERE ItemColorId IS NULL)
        ALTER TABLE dbo.Sku ALTER COLUMN ItemColorId int NOT NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'f_ItemColor_Sku')
        ALTER TABLE dbo.Sku
        ADD CONSTRAINT f_ItemColor_Sku FOREIGN KEY (ItemColorId) REFERENCES ItemColor(ItemColorId);

    IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE name = 'u_Sku_ItemColorId_SizeId' AND type = 'UQ')
        ALTER TABLE dbo.Sku
        ADD CONSTRAINT u_Sku_ItemColorId_SizeId UNIQUE(ItemColorId, SizeId);
END
GO

-- Finalize ItemImage migration
IF OBJECT_ID('dbo.ItemImage', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.ItemImage', 'ItemMasterId') IS NOT NULL
        ALTER TABLE dbo.ItemImage DROP COLUMN ItemMasterId;

    IF COL_LENGTH('dbo.ItemImage', 'ItemColorId') IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM dbo.ItemImage WHERE ItemColorId IS NULL)
        ALTER TABLE dbo.ItemImage ALTER COLUMN ItemColorId int NOT NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'f_ItemColor_ItemImage')
        ALTER TABLE dbo.ItemImage
        ADD CONSTRAINT f_ItemColor_ItemImage FOREIGN KEY (ItemColorId) REFERENCES ItemColor(ItemColorId);
END
GO

-- Drop ItemMaster table if no longer needed
IF OBJECT_ID('dbo.ItemMaster', 'U') IS NOT NULL
    DROP TABLE dbo.ItemMaster;
GO
