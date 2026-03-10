use MissIssippiDB
GO

IF OBJECT_ID('dbo.Collection', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Collection(
        CollectionId int not null identity primary key,
        CollectionName varchar(75) not null
            constraint c_Collection_Collection_name_cannot_be_blank check(CollectionName > '')
            constraint u_Collection_CollectionName unique
    );
END
GO

IF COL_LENGTH('dbo.Color', 'CollectionId') IS NULL
BEGIN
    ALTER TABLE dbo.Color
        ADD CollectionId int NULL;
END
GO

IF COL_LENGTH('dbo.Color', 'Collection') IS NOT NULL
BEGIN
    INSERT INTO dbo.Collection (CollectionName)
    SELECT DISTINCT LTRIM(RTRIM(c.Collection))
    FROM dbo.Color c
    WHERE c.Collection IS NOT NULL
      AND LTRIM(RTRIM(c.Collection)) <> ''
      AND NOT EXISTS (
          SELECT 1
          FROM dbo.Collection cc
          WHERE cc.CollectionName = LTRIM(RTRIM(c.Collection))
      );

    UPDATE c
    SET c.CollectionId = cc.CollectionId
    FROM dbo.Color c
    INNER JOIN dbo.Collection cc
        ON cc.CollectionName = LTRIM(RTRIM(c.Collection));
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'f_Collection_Color'
)
BEGIN
    ALTER TABLE dbo.Color WITH CHECK
        ADD CONSTRAINT f_Collection_Color FOREIGN KEY (CollectionId)
            REFERENCES dbo.Collection(CollectionId);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Color_CollectionId'
      AND object_id = OBJECT_ID('dbo.Color')
)
BEGIN
    CREATE INDEX IX_Color_CollectionId
    ON dbo.Color(CollectionId);
END
GO

IF EXISTS (
    SELECT 1
    FROM sys.key_constraints
    WHERE name = 'u_Color_ColorName'
      AND parent_object_id = OBJECT_ID('dbo.Color')
)
BEGIN
    ALTER TABLE dbo.Color
        DROP CONSTRAINT u_Color_ColorName;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'u_Color_ColorName_SeasonId_CollectionId'
      AND object_id = OBJECT_ID('dbo.Color')
)
BEGIN
    ALTER TABLE dbo.Color
        ADD CONSTRAINT u_Color_ColorName_SeasonId_CollectionId
        UNIQUE (ColorName, SeasonId, CollectionId);
END
GO

IF COL_LENGTH('dbo.Color', 'Collection') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Color
        DROP COLUMN Collection;
END
GO
