use MissIssippiDB
GO

IF OBJECT_ID('dbo.InventoryAdjustmentBatch', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.InventoryAdjustmentBatch(
        BatchId uniqueidentifier NOT NULL
            CONSTRAINT PK_InventoryAdjustmentBatch PRIMARY KEY
            CONSTRAINT DF_InventoryAdjustmentBatch_BatchId DEFAULT NEWSEQUENTIALID(),
        BatchTimestamp datetime2(3) NOT NULL
            CONSTRAINT DF_InventoryAdjustmentBatch_BatchTimestamp DEFAULT sysutcdatetime(),
        Source varchar(30) NOT NULL,
        Notes varchar(200) NULL
    );
END
GO

IF COL_LENGTH('dbo.InventoryActivityLog', 'BatchId') IS NULL
BEGIN
    ALTER TABLE dbo.InventoryActivityLog ADD BatchId uniqueidentifier NULL;
END
GO

IF COL_LENGTH('dbo.InventoryActivityLog', 'OldQty') IS NULL
BEGIN
    ALTER TABLE dbo.InventoryActivityLog
        ADD OldQty int NOT NULL
        CONSTRAINT DF_InventoryActivityLog_OldQty DEFAULT (0);
END
GO

IF COL_LENGTH('dbo.InventoryActivityLog', 'NewQty') IS NULL
BEGIN
    ALTER TABLE dbo.InventoryActivityLog
        ADD NewQty int NOT NULL
        CONSTRAINT DF_InventoryActivityLog_NewQty DEFAULT (0);
END
GO

IF COL_LENGTH('dbo.InventoryActivityLog', 'Delta') IS NULL
BEGIN
    ALTER TABLE dbo.InventoryActivityLog
        ADD Delta int NOT NULL
        CONSTRAINT DF_InventoryActivityLog_Delta DEFAULT (0);
END
GO

IF COL_LENGTH('dbo.InventoryActivityLog', 'LogTimestamp') IS NULL
BEGIN
    ALTER TABLE dbo.InventoryActivityLog
        ADD LogTimestamp datetime2(3) NOT NULL
        CONSTRAINT DF_InventoryActivityLog_LogTimestamp DEFAULT (sysutcdatetime());
END
GO

IF EXISTS (SELECT 1 FROM dbo.InventoryActivityLog WHERE BatchId IS NULL)
BEGIN
    DECLARE @LegacyBatchId uniqueidentifier = NEWID();

    INSERT INTO dbo.InventoryAdjustmentBatch (BatchId, Source, Notes)
    VALUES (@LegacyBatchId, 'edit', 'Legacy backfill');

    UPDATE dbo.InventoryActivityLog
    SET BatchId = @LegacyBatchId,
        OldQty = Qty,
        NewQty = Qty,
        Delta = 0,
        LogTimestamp = InventoryActivityDate
    WHERE BatchId IS NULL;
END
GO

IF COL_LENGTH('dbo.InventoryActivityLog', 'BatchId') IS NOT NULL
    AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.InventoryActivityLog') AND name = 'BatchId' AND is_nullable = 1)
BEGIN
    ALTER TABLE dbo.InventoryActivityLog ALTER COLUMN BatchId uniqueidentifier NOT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'f_InventoryAdjustmentBatch_InventoryActivityLog'
)
BEGIN
    ALTER TABLE dbo.InventoryActivityLog
        ADD CONSTRAINT f_InventoryAdjustmentBatch_InventoryActivityLog
        FOREIGN KEY (BatchId) REFERENCES dbo.InventoryAdjustmentBatch(BatchId);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_InventoryActivityLog_BatchId'
)
BEGIN
    CREATE INDEX IX_InventoryActivityLog_BatchId
        ON dbo.InventoryActivityLog(BatchId);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_InventoryAdjustmentBatch_BatchTimestamp'
)
BEGIN
    CREATE INDEX IX_InventoryAdjustmentBatch_BatchTimestamp
        ON dbo.InventoryAdjustmentBatch(BatchTimestamp);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_InventoryActivityLog_LogTimestamp'
)
BEGIN
    CREATE INDEX IX_InventoryActivityLog_LogTimestamp
        ON dbo.InventoryActivityLog(LogTimestamp);
END
GO
