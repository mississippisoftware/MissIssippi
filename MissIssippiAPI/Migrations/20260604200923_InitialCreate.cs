using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MissIssippiAPI.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "User",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false),
                    Email = table.Column<string>(type: "varchar(256)", unicode: false, maxLength: 256, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Role = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false, defaultValue: "owner"),
                    Active = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_User", x => x.UserId);
                });

            migrationBuilder.CreateTable(
                name: "Collection",
                columns: table => new
                {
                    CollectionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CollectionName = table.Column<string>(type: "varchar(75)", unicode: false, maxLength: 75, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    CreatedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap"),
                    ModifiedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Collect__D1CCDFE1B35E33F2", x => x.CollectionId);
                    table.ForeignKey(
                        name: "FK_Collection_User_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Collection_User_ModifiedByUserId",
                        column: x => x.ModifiedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "ImageType",
                columns: table => new
                {
                    ImageTypeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Type = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    Sequence = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    CreatedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap"),
                    ModifiedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ImageTyp__C4FE4B7B050E0A04", x => x.ImageTypeId);
                    table.ForeignKey(
                        name: "FK_ImageType_User_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_ImageType_User_ModifiedByUserId",
                        column: x => x.ModifiedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "InventoryAdjustmentBatch",
                columns: table => new
                {
                    BatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "newsequentialid()"),
                    BatchTimestamp = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "sysutcdatetime()"),
                    Source = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    Notes = table.Column<string>(type: "varchar(200)", unicode: false, maxLength: 200, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    CreatedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap"),
                    ModifiedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryAdjustmentBatch", x => x.BatchId);
                    table.ForeignKey(
                        name: "FK_InventoryAdjustmentBatch_User_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_InventoryAdjustmentBatch_User_ModifiedByUserId",
                        column: x => x.ModifiedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "InventoryUploadBatch",
                columns: table => new
                {
                    UploadBatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "newsequentialid()"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "sysutcdatetime()"),
                    Status = table.Column<string>(type: "varchar(30)", unicode: false, maxLength: 30, nullable: false),
                    Mode = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    DatasetHash = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: false),
                    IdempotencyKey = table.Column<string>(type: "varchar(120)", unicode: false, maxLength: 120, nullable: true),
                    RowCount = table.Column<int>(type: "int", nullable: false),
                    ProcessedRows = table.Column<int>(type: "int", nullable: false),
                    ErrorCount = table.Column<int>(type: "int", nullable: false),
                    WarningCount = table.Column<int>(type: "int", nullable: false),
                    CreatedSkus = table.Column<int>(type: "int", nullable: false),
                    CreatedItemColors = table.Column<int>(type: "int", nullable: false),
                    CreatedInventory = table.Column<int>(type: "int", nullable: false),
                    UpdatedInventory = table.Column<int>(type: "int", nullable: false),
                    IsUndone = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    UndoneAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DuplicateOfUploadBatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    InventoryHistoryBatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UndoHistoryBatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Message = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true),
                    ResultJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    CreatedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap"),
                    ModifiedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryUploadBatch", x => x.UploadBatchId);
                    table.ForeignKey(
                        name: "FK_InventoryUploadBatch_User_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_InventoryUploadBatch_User_ModifiedByUserId",
                        column: x => x.ModifiedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "Season",
                columns: table => new
                {
                    SeasonId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SeasonName = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    SeasonDateCreated = table.Column<DateTime>(type: "datetime", nullable: false),
                    Active = table.Column<bool>(type: "bit", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    CreatedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap"),
                    ModifiedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Season__C1814E3825F7E317", x => x.SeasonId);
                    table.ForeignKey(
                        name: "FK_Season_User_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Season_User_ModifiedByUserId",
                        column: x => x.ModifiedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "Sizes",
                columns: table => new
                {
                    SizeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SizeName = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    SizeSequence = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    CreatedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap"),
                    ModifiedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Sizes__83BD097A09B4478E", x => x.SizeId);
                    table.ForeignKey(
                        name: "FK_Sizes_User_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Sizes_User_ModifiedByUserId",
                        column: x => x.ModifiedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "Color",
                columns: table => new
                {
                    ColorId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ColorName = table.Column<string>(type: "varchar(75)", unicode: false, maxLength: 75, nullable: false),
                    SeasonId = table.Column<int>(type: "int", nullable: true),
                    CollectionId = table.Column<int>(type: "int", nullable: true),
                    PantoneColor = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    HexValue = table.Column<string>(type: "varchar(7)", unicode: false, maxLength: 7, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    CreatedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap"),
                    ModifiedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Color__8DA7674DAF1C0D00", x => x.ColorId);
                    table.ForeignKey(
                        name: "FK_Color_User_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Color_User_ModifiedByUserId",
                        column: x => x.ModifiedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "f_Collection_Color",
                        column: x => x.CollectionId,
                        principalTable: "Collection",
                        principalColumn: "CollectionId");
                    table.ForeignKey(
                        name: "f_Season_Color",
                        column: x => x.SeasonId,
                        principalTable: "Season",
                        principalColumn: "SeasonId");
                });

            migrationBuilder.CreateTable(
                name: "Item",
                columns: table => new
                {
                    ItemId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ItemNumber = table.Column<string>(type: "varchar(75)", unicode: false, maxLength: 75, nullable: false),
                    Description = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: false),
                    CostPrice = table.Column<decimal>(type: "decimal(18,0)", nullable: true),
                    WholesalePrice = table.Column<decimal>(type: "decimal(18,0)", nullable: true),
                    Weight = table.Column<decimal>(type: "decimal(18,0)", nullable: true),
                    SeasonId = table.Column<int>(type: "int", nullable: false),
                    ItemDateCreated = table.Column<DateTime>(type: "datetime", nullable: false),
                    InProduction = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    CreatedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap"),
                    ModifiedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Item__8AD14640BCF81361", x => x.ItemId);
                    table.ForeignKey(
                        name: "FK_Item_User_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Item_User_ModifiedByUserId",
                        column: x => x.ModifiedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "f_Season_Item",
                        column: x => x.SeasonId,
                        principalTable: "Season",
                        principalColumn: "SeasonId");
                });

            migrationBuilder.CreateTable(
                name: "ItemColor",
                columns: table => new
                {
                    ItemColorId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ItemId = table.Column<int>(type: "int", nullable: false),
                    ColorId = table.Column<int>(type: "int", nullable: false),
                    Active = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CompositeSignature = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false, defaultValue: ""),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    CreatedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap"),
                    ModifiedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ItemCol__D60ED5767E9873B1", x => x.ItemColorId);
                    table.ForeignKey(
                        name: "FK_ItemColor_User_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_ItemColor_User_ModifiedByUserId",
                        column: x => x.ModifiedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "f_Color_ItemColor",
                        column: x => x.ColorId,
                        principalTable: "Color",
                        principalColumn: "ColorId");
                    table.ForeignKey(
                        name: "f_Item_ItemColor",
                        column: x => x.ItemId,
                        principalTable: "Item",
                        principalColumn: "ItemId");
                });

            migrationBuilder.CreateTable(
                name: "Inventory",
                columns: table => new
                {
                    InventoryId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ItemColorId = table.Column<int>(type: "int", nullable: false),
                    SizeId = table.Column<int>(type: "int", nullable: false),
                    Qty = table.Column<int>(type: "int", nullable: false),
                    InStock = table.Column<int>(type: "int", nullable: false, computedColumnSql: "(case when [Qty]>(0) then (1) else (0) end)", stored: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    CreatedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap"),
                    ModifiedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Inventor__F5FDE6B312394863", x => x.InventoryId);
                    table.ForeignKey(
                        name: "FK_Inventory_User_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Inventory_User_ModifiedByUserId",
                        column: x => x.ModifiedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "f_ItemColor_Inventory",
                        column: x => x.ItemColorId,
                        principalTable: "ItemColor",
                        principalColumn: "ItemColorId");
                    table.ForeignKey(
                        name: "f_Sizes_Inventory",
                        column: x => x.SizeId,
                        principalTable: "Sizes",
                        principalColumn: "SizeId");
                });

            migrationBuilder.CreateTable(
                name: "InventoryActivityLog",
                columns: table => new
                {
                    InventoryActivityLogId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ItemColorId = table.Column<int>(type: "int", nullable: false),
                    SizeId = table.Column<int>(type: "int", nullable: false),
                    Qty = table.Column<int>(type: "int", nullable: false),
                    OldQty = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    NewQty = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    Delta = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    ActionType = table.Column<string>(type: "varchar(150)", unicode: false, maxLength: 150, nullable: false),
                    InventoryActivityDate = table.Column<DateTime>(type: "datetime", nullable: false),
                    LogTimestamp = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "sysutcdatetime()"),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    CreatedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap"),
                    ModifiedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Inventor__BE0F81F948B45064", x => x.InventoryActivityLogId);
                    table.ForeignKey(
                        name: "FK_InventoryActivityLog_User_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_InventoryActivityLog_User_ModifiedByUserId",
                        column: x => x.ModifiedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "f_InventoryAdjustmentBatch_InventoryActivityLog",
                        column: x => x.BatchId,
                        principalTable: "InventoryAdjustmentBatch",
                        principalColumn: "BatchId");
                    table.ForeignKey(
                        name: "f_ItemColor_InventoryActivityLog",
                        column: x => x.ItemColorId,
                        principalTable: "ItemColor",
                        principalColumn: "ItemColorId");
                    table.ForeignKey(
                        name: "f_Sizes_InventoryActivityLog",
                        column: x => x.SizeId,
                        principalTable: "Sizes",
                        principalColumn: "SizeId");
                });

            migrationBuilder.CreateTable(
                name: "ItemColorSecondaryColor",
                columns: table => new
                {
                    ItemColorId = table.Column<int>(type: "int", nullable: false),
                    SecondaryColorId = table.Column<int>(type: "int", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    CreatedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap"),
                    ModifiedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemColorSecondaryColor", x => new { x.ItemColorId, x.SecondaryColorId });
                    table.ForeignKey(
                        name: "FK_ItemColorSecondaryColor_User_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_ItemColorSecondaryColor_User_ModifiedByUserId",
                        column: x => x.ModifiedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "f_Color_ItemColorSecondaryColor",
                        column: x => x.SecondaryColorId,
                        principalTable: "Color",
                        principalColumn: "ColorId");
                    table.ForeignKey(
                        name: "f_ItemColor_ItemColorSecondaryColor",
                        column: x => x.ItemColorId,
                        principalTable: "ItemColor",
                        principalColumn: "ItemColorId");
                });

            migrationBuilder.CreateTable(
                name: "ItemImage",
                columns: table => new
                {
                    ItemImageId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ItemColorId = table.Column<int>(type: "int", nullable: false),
                    ImageTypeId = table.Column<int>(type: "int", nullable: false),
                    ImageUrl = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true),
                    ImageSequenceWithinType = table.Column<int>(type: "int", nullable: false),
                    ImageSequence = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    CreatedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap"),
                    ModifiedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ItemImag__7FBDF9E4A9A8D9E8", x => x.ItemImageId);
                    table.ForeignKey(
                        name: "FK_ItemImage_User_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_ItemImage_User_ModifiedByUserId",
                        column: x => x.ModifiedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "f_ImageType_ItemImage",
                        column: x => x.ImageTypeId,
                        principalTable: "ImageType",
                        principalColumn: "ImageTypeId");
                    table.ForeignKey(
                        name: "f_ItemColor_ItemImage",
                        column: x => x.ItemColorId,
                        principalTable: "ItemColor",
                        principalColumn: "ItemColorId");
                });

            migrationBuilder.CreateTable(
                name: "Sku",
                columns: table => new
                {
                    SkuId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ItemColorId = table.Column<int>(type: "int", nullable: false),
                    SizeId = table.Column<int>(type: "int", nullable: false),
                    Sku = table.Column<string>(type: "varchar(25)", unicode: false, maxLength: 25, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    ModifiedAtUtc = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "getutcdate()"),
                    CreatedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap"),
                    ModifiedByUserId = table.Column<string>(type: "varchar(128)", unicode: false, maxLength: 128, nullable: false, defaultValue: "system-bootstrap")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Sku__CA1ECF0D968C4D01", x => x.SkuId);
                    table.ForeignKey(
                        name: "FK_Sku_User_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Sku_User_ModifiedByUserId",
                        column: x => x.ModifiedByUserId,
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "f_ItemColor_Sku",
                        column: x => x.ItemColorId,
                        principalTable: "ItemColor",
                        principalColumn: "ItemColorId");
                    table.ForeignKey(
                        name: "f_Sizes_Sku",
                        column: x => x.SizeId,
                        principalTable: "Sizes",
                        principalColumn: "SizeId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Collection_CreatedByUserId",
                table: "Collection",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Collection_ModifiedByUserId",
                table: "Collection",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "u_Collection_CollectionName",
                table: "Collection",
                column: "CollectionName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Color_CollectionId",
                table: "Color",
                column: "CollectionId");

            migrationBuilder.CreateIndex(
                name: "IX_Color_CreatedByUserId",
                table: "Color",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Color_ModifiedByUserId",
                table: "Color",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Color_SeasonId",
                table: "Color",
                column: "SeasonId");

            migrationBuilder.CreateIndex(
                name: "u_Color_ColorName_SeasonId_CollectionId",
                table: "Color",
                columns: new[] { "ColorName", "SeasonId", "CollectionId" },
                unique: true,
                filter: "[SeasonId] IS NOT NULL AND [CollectionId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ImageType_CreatedByUserId",
                table: "ImageType",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ImageType_ModifiedByUserId",
                table: "ImageType",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "u_ImageType_Sequence",
                table: "ImageType",
                column: "Sequence",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "u_ImageType_Type",
                table: "ImageType",
                column: "Type",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Inventory_CreatedByUserId",
                table: "Inventory",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Inventory_ItemColorId",
                table: "Inventory",
                column: "ItemColorId");

            migrationBuilder.CreateIndex(
                name: "IX_Inventory_ModifiedByUserId",
                table: "Inventory",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Inventory_SizeId",
                table: "Inventory",
                column: "SizeId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryActivityLog_BatchId",
                table: "InventoryActivityLog",
                column: "BatchId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryActivityLog_CreatedByUserId",
                table: "InventoryActivityLog",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryActivityLog_ItemColorId",
                table: "InventoryActivityLog",
                column: "ItemColorId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryActivityLog_ModifiedByUserId",
                table: "InventoryActivityLog",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryActivityLog_SizeId",
                table: "InventoryActivityLog",
                column: "SizeId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryAdjustmentBatch_CreatedByUserId",
                table: "InventoryAdjustmentBatch",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryAdjustmentBatch_ModifiedByUserId",
                table: "InventoryAdjustmentBatch",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "ix_InventoryUploadBatch_CreatedAt",
                table: "InventoryUploadBatch",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryUploadBatch_CreatedByUserId",
                table: "InventoryUploadBatch",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "ix_InventoryUploadBatch_Hash_Mode_Undone",
                table: "InventoryUploadBatch",
                columns: new[] { "DatasetHash", "Mode", "IsUndone" });

            migrationBuilder.CreateIndex(
                name: "IX_InventoryUploadBatch_ModifiedByUserId",
                table: "InventoryUploadBatch",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "u_InventoryUploadBatch_IdempotencyKey",
                table: "InventoryUploadBatch",
                column: "IdempotencyKey",
                unique: true,
                filter: "[IdempotencyKey] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Item_CreatedByUserId",
                table: "Item",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Item_ModifiedByUserId",
                table: "Item",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Item_SeasonId",
                table: "Item",
                column: "SeasonId");

            migrationBuilder.CreateIndex(
                name: "u_Item_ItemNumber_SeasonId",
                table: "Item",
                columns: new[] { "ItemNumber", "SeasonId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ItemColor_ColorId",
                table: "ItemColor",
                column: "ColorId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemColor_CreatedByUserId",
                table: "ItemColor",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemColor_ModifiedByUserId",
                table: "ItemColor",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "u_ItemColor_ItemId_ColorId_CompositeSignature",
                table: "ItemColor",
                columns: new[] { "ItemId", "ColorId", "CompositeSignature" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ItemColorSecondaryColor_CreatedByUserId",
                table: "ItemColorSecondaryColor",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemColorSecondaryColor_ModifiedByUserId",
                table: "ItemColorSecondaryColor",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemColorSecondaryColor_SecondaryColorId",
                table: "ItemColorSecondaryColor",
                column: "SecondaryColorId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemImage_CreatedByUserId",
                table: "ItemImage",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemImage_ImageTypeId",
                table: "ItemImage",
                column: "ImageTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemImage_ItemColorId",
                table: "ItemImage",
                column: "ItemColorId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemImage_ModifiedByUserId",
                table: "ItemImage",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Season_CreatedByUserId",
                table: "Season",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Season_ModifiedByUserId",
                table: "Season",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "u_Season_SeasonName",
                table: "Season",
                column: "SeasonName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Sizes_CreatedByUserId",
                table: "Sizes",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Sizes_ModifiedByUserId",
                table: "Sizes",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "u_Sizes_Size_Sequence",
                table: "Sizes",
                column: "SizeSequence",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "u_Sizes_SizeName",
                table: "Sizes",
                column: "SizeName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Sku_CreatedByUserId",
                table: "Sku",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Sku_ModifiedByUserId",
                table: "Sku",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Sku_SizeId",
                table: "Sku",
                column: "SizeId");

            migrationBuilder.CreateIndex(
                name: "u_Sku_ItemColorId_SizeId",
                table: "Sku",
                columns: new[] { "ItemColorId", "SizeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "u_Sku_Sku",
                table: "Sku",
                column: "Sku",
                unique: true);

            migrationBuilder.InsertData(
                table: "User",
                columns: new[] { "UserId", "Email", "DisplayName", "Role", "Active", "CreatedAtUtc", "ModifiedAtUtc" },
                values: new object[] { "system-bootstrap", "system@bootstrap.local", "System Bootstrap", "system", true, new DateTime(2026, 4, 20), new DateTime(2026, 4, 20) });

            migrationBuilder.InsertData(
                table: "Season",
                columns: new[] { "SeasonName", "SeasonDateCreated", "Active", "CreatedAtUtc", "ModifiedAtUtc", "CreatedByUserId", "ModifiedByUserId" },
                values: new object[] { "SS26", new DateTime(2026, 4, 20), true, new DateTime(2026, 4, 20), new DateTime(2026, 4, 20), "system-bootstrap", "system-bootstrap" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Inventory");

            migrationBuilder.DropTable(
                name: "InventoryActivityLog");

            migrationBuilder.DropTable(
                name: "InventoryUploadBatch");

            migrationBuilder.DropTable(
                name: "ItemColorSecondaryColor");

            migrationBuilder.DropTable(
                name: "ItemImage");

            migrationBuilder.DropTable(
                name: "Sku");

            migrationBuilder.DropTable(
                name: "InventoryAdjustmentBatch");

            migrationBuilder.DropTable(
                name: "ImageType");

            migrationBuilder.DropTable(
                name: "ItemColor");

            migrationBuilder.DropTable(
                name: "Sizes");

            migrationBuilder.DropTable(
                name: "Color");

            migrationBuilder.DropTable(
                name: "Item");

            migrationBuilder.DropTable(
                name: "Collection");

            migrationBuilder.DropTable(
                name: "Season");

            migrationBuilder.DropTable(
                name: "User");
        }
    }
}
