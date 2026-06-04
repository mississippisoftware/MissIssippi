using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MissIssippiAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddUserTableAndAuditFields : Migration
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
            migrationBuilder.Sql(@"
    INSERT INTO [User] (UserId, Email, DisplayName, Role, Active, CreatedAtUtc, ModifiedAtUtc)
    VALUES ('PENDING_SEED', 'pending@placeholder.local', 'Pending Seed User', 'owner', 0,
            GETUTCDATE(), GETUTCDATE())
");
            // Add audit columns to 14 existing tables

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "Collection",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAtUtc",
                table: "Collection",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "Collection",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");
            migrationBuilder.AddColumn<string>(
                name: "ModifiedByUserId",
                table: "Collection",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "ImageType",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAtUtc",
                table: "ImageType",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "ImageType",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");
            migrationBuilder.AddColumn<string>(
                name: "ModifiedByUserId",
                table: "ImageType",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "InventoryAdjustmentBatch",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAtUtc",
                table: "InventoryAdjustmentBatch",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "InventoryAdjustmentBatch",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");
            migrationBuilder.AddColumn<string>(
                name: "ModifiedByUserId",
                table: "InventoryAdjustmentBatch",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "InventoryUploadBatch",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAtUtc",
                table: "InventoryUploadBatch",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "InventoryUploadBatch",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");
            migrationBuilder.AddColumn<string>(
                name: "ModifiedByUserId",
                table: "InventoryUploadBatch",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "Season",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAtUtc",
                table: "Season",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "Season",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");
            migrationBuilder.AddColumn<string>(
                name: "ModifiedByUserId",
                table: "Season",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "Sizes",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAtUtc",
                table: "Sizes",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "Sizes",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");
            migrationBuilder.AddColumn<string>(
                name: "ModifiedByUserId",
                table: "Sizes",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "Color",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAtUtc",
                table: "Color",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "Color",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");
            migrationBuilder.AddColumn<string>(
                name: "ModifiedByUserId",
                table: "Color",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "Item",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAtUtc",
                table: "Item",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "Item",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");
            migrationBuilder.AddColumn<string>(
                name: "ModifiedByUserId",
                table: "Item",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "ItemColor",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAtUtc",
                table: "ItemColor",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "ItemColor",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");
            migrationBuilder.AddColumn<string>(
                name: "ModifiedByUserId",
                table: "ItemColor",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "Inventory",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAtUtc",
                table: "Inventory",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "Inventory",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");
            migrationBuilder.AddColumn<string>(
                name: "ModifiedByUserId",
                table: "Inventory",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "InventoryActivityLog",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAtUtc",
                table: "InventoryActivityLog",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "InventoryActivityLog",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");
            migrationBuilder.AddColumn<string>(
                name: "ModifiedByUserId",
                table: "InventoryActivityLog",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "ItemColorSecondaryColor",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAtUtc",
                table: "ItemColorSecondaryColor",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "ItemColorSecondaryColor",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");
            migrationBuilder.AddColumn<string>(
                name: "ModifiedByUserId",
                table: "ItemColorSecondaryColor",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "ItemImage",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAtUtc",
                table: "ItemImage",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "ItemImage",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");
            migrationBuilder.AddColumn<string>(
                name: "ModifiedByUserId",
                table: "ItemImage",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "Sku",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAtUtc",
                table: "Sku",
                type: "datetime2(3)",
                nullable: false,
                defaultValue: new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc));
            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "Sku",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");
            migrationBuilder.AddColumn<string>(
                name: "ModifiedByUserId",
                table: "Sku",
                type: "varchar(128)",
                unicode: false,
                maxLength: 128,
                nullable: false,
                defaultValue: "PENDING_SEED");

            // Add audit FK constraints (2 per table × 14 tables = 28)

            migrationBuilder.AddForeignKey(
                name: "FK_Collection_User_CreatedByUserId",
                table: "Collection",
                column: "CreatedByUserId",
                principalTable: "User",
                principalColumn: "UserId");
            migrationBuilder.AddForeignKey(
                name: "FK_Collection_User_ModifiedByUserId",
                table: "Collection",
                column: "ModifiedByUserId",
                principalTable: "User",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ImageType_User_CreatedByUserId",
                table: "ImageType",
                column: "CreatedByUserId",
                principalTable: "User",
                principalColumn: "UserId");
            migrationBuilder.AddForeignKey(
                name: "FK_ImageType_User_ModifiedByUserId",
                table: "ImageType",
                column: "ModifiedByUserId",
                principalTable: "User",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_InventoryAdjustmentBatch_User_CreatedByUserId",
                table: "InventoryAdjustmentBatch",
                column: "CreatedByUserId",
                principalTable: "User",
                principalColumn: "UserId");
            migrationBuilder.AddForeignKey(
                name: "FK_InventoryAdjustmentBatch_User_ModifiedByUserId",
                table: "InventoryAdjustmentBatch",
                column: "ModifiedByUserId",
                principalTable: "User",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_InventoryUploadBatch_User_CreatedByUserId",
                table: "InventoryUploadBatch",
                column: "CreatedByUserId",
                principalTable: "User",
                principalColumn: "UserId");
            migrationBuilder.AddForeignKey(
                name: "FK_InventoryUploadBatch_User_ModifiedByUserId",
                table: "InventoryUploadBatch",
                column: "ModifiedByUserId",
                principalTable: "User",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Season_User_CreatedByUserId",
                table: "Season",
                column: "CreatedByUserId",
                principalTable: "User",
                principalColumn: "UserId");
            migrationBuilder.AddForeignKey(
                name: "FK_Season_User_ModifiedByUserId",
                table: "Season",
                column: "ModifiedByUserId",
                principalTable: "User",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Sizes_User_CreatedByUserId",
                table: "Sizes",
                column: "CreatedByUserId",
                principalTable: "User",
                principalColumn: "UserId");
            migrationBuilder.AddForeignKey(
                name: "FK_Sizes_User_ModifiedByUserId",
                table: "Sizes",
                column: "ModifiedByUserId",
                principalTable: "User",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Color_User_CreatedByUserId",
                table: "Color",
                column: "CreatedByUserId",
                principalTable: "User",
                principalColumn: "UserId");
            migrationBuilder.AddForeignKey(
                name: "FK_Color_User_ModifiedByUserId",
                table: "Color",
                column: "ModifiedByUserId",
                principalTable: "User",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Item_User_CreatedByUserId",
                table: "Item",
                column: "CreatedByUserId",
                principalTable: "User",
                principalColumn: "UserId");
            migrationBuilder.AddForeignKey(
                name: "FK_Item_User_ModifiedByUserId",
                table: "Item",
                column: "ModifiedByUserId",
                principalTable: "User",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ItemColor_User_CreatedByUserId",
                table: "ItemColor",
                column: "CreatedByUserId",
                principalTable: "User",
                principalColumn: "UserId");
            migrationBuilder.AddForeignKey(
                name: "FK_ItemColor_User_ModifiedByUserId",
                table: "ItemColor",
                column: "ModifiedByUserId",
                principalTable: "User",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Inventory_User_CreatedByUserId",
                table: "Inventory",
                column: "CreatedByUserId",
                principalTable: "User",
                principalColumn: "UserId");
            migrationBuilder.AddForeignKey(
                name: "FK_Inventory_User_ModifiedByUserId",
                table: "Inventory",
                column: "ModifiedByUserId",
                principalTable: "User",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_InventoryActivityLog_User_CreatedByUserId",
                table: "InventoryActivityLog",
                column: "CreatedByUserId",
                principalTable: "User",
                principalColumn: "UserId");
            migrationBuilder.AddForeignKey(
                name: "FK_InventoryActivityLog_User_ModifiedByUserId",
                table: "InventoryActivityLog",
                column: "ModifiedByUserId",
                principalTable: "User",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ItemColorSecondaryColor_User_CreatedByUserId",
                table: "ItemColorSecondaryColor",
                column: "CreatedByUserId",
                principalTable: "User",
                principalColumn: "UserId");
            migrationBuilder.AddForeignKey(
                name: "FK_ItemColorSecondaryColor_User_ModifiedByUserId",
                table: "ItemColorSecondaryColor",
                column: "ModifiedByUserId",
                principalTable: "User",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ItemImage_User_CreatedByUserId",
                table: "ItemImage",
                column: "CreatedByUserId",
                principalTable: "User",
                principalColumn: "UserId");
            migrationBuilder.AddForeignKey(
                name: "FK_ItemImage_User_ModifiedByUserId",
                table: "ItemImage",
                column: "ModifiedByUserId",
                principalTable: "User",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Sku_User_CreatedByUserId",
                table: "Sku",
                column: "CreatedByUserId",
                principalTable: "User",
                principalColumn: "UserId");
            migrationBuilder.AddForeignKey(
                name: "FK_Sku_User_ModifiedByUserId",
                table: "Sku",
                column: "ModifiedByUserId",
                principalTable: "User",
                principalColumn: "UserId");

            // Add audit column indexes (2 per table × 14 tables = 28)

            migrationBuilder.CreateIndex(
                name: "IX_Collection_CreatedByUserId",
                table: "Collection",
                column: "CreatedByUserId");
            migrationBuilder.CreateIndex(
                name: "IX_Collection_ModifiedByUserId",
                table: "Collection",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ImageType_CreatedByUserId",
                table: "ImageType",
                column: "CreatedByUserId");
            migrationBuilder.CreateIndex(
                name: "IX_ImageType_ModifiedByUserId",
                table: "ImageType",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryAdjustmentBatch_CreatedByUserId",
                table: "InventoryAdjustmentBatch",
                column: "CreatedByUserId");
            migrationBuilder.CreateIndex(
                name: "IX_InventoryAdjustmentBatch_ModifiedByUserId",
                table: "InventoryAdjustmentBatch",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryUploadBatch_CreatedByUserId",
                table: "InventoryUploadBatch",
                column: "CreatedByUserId");
            migrationBuilder.CreateIndex(
                name: "IX_InventoryUploadBatch_ModifiedByUserId",
                table: "InventoryUploadBatch",
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
                name: "IX_Sizes_CreatedByUserId",
                table: "Sizes",
                column: "CreatedByUserId");
            migrationBuilder.CreateIndex(
                name: "IX_Sizes_ModifiedByUserId",
                table: "Sizes",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Color_CreatedByUserId",
                table: "Color",
                column: "CreatedByUserId");
            migrationBuilder.CreateIndex(
                name: "IX_Color_ModifiedByUserId",
                table: "Color",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Item_CreatedByUserId",
                table: "Item",
                column: "CreatedByUserId");
            migrationBuilder.CreateIndex(
                name: "IX_Item_ModifiedByUserId",
                table: "Item",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemColor_CreatedByUserId",
                table: "ItemColor",
                column: "CreatedByUserId");
            migrationBuilder.CreateIndex(
                name: "IX_ItemColor_ModifiedByUserId",
                table: "ItemColor",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Inventory_CreatedByUserId",
                table: "Inventory",
                column: "CreatedByUserId");
            migrationBuilder.CreateIndex(
                name: "IX_Inventory_ModifiedByUserId",
                table: "Inventory",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryActivityLog_CreatedByUserId",
                table: "InventoryActivityLog",
                column: "CreatedByUserId");
            migrationBuilder.CreateIndex(
                name: "IX_InventoryActivityLog_ModifiedByUserId",
                table: "InventoryActivityLog",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemColorSecondaryColor_CreatedByUserId",
                table: "ItemColorSecondaryColor",
                column: "CreatedByUserId");
            migrationBuilder.CreateIndex(
                name: "IX_ItemColorSecondaryColor_ModifiedByUserId",
                table: "ItemColorSecondaryColor",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemImage_CreatedByUserId",
                table: "ItemImage",
                column: "CreatedByUserId");
            migrationBuilder.CreateIndex(
                name: "IX_ItemImage_ModifiedByUserId",
                table: "ItemImage",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Sku_CreatedByUserId",
                table: "Sku",
                column: "CreatedByUserId");
            migrationBuilder.CreateIndex(
                name: "IX_Sku_ModifiedByUserId",
                table: "Sku",
                column: "ModifiedByUserId");

            // Path 1 retrofit (D-014): back-fill audit fields on existing rows.
            // Operator replaces 'PENDING_SEED' with their real Entra OID after seeding the User table.
            migrationBuilder.Sql(@"
                UPDATE dbo.Sizes SET CreatedAtUtc = '2026-04-20', ModifiedAtUtc = '2026-04-20',
                    CreatedByUserId = 'PENDING_SEED', ModifiedByUserId = 'PENDING_SEED';
                UPDATE dbo.Season SET CreatedAtUtc = '2026-04-20', ModifiedAtUtc = '2026-04-20',
                    CreatedByUserId = 'PENDING_SEED', ModifiedByUserId = 'PENDING_SEED';
                UPDATE dbo.Collection SET CreatedAtUtc = '2026-04-20', ModifiedAtUtc = '2026-04-20',
                    CreatedByUserId = 'PENDING_SEED', ModifiedByUserId = 'PENDING_SEED';
                UPDATE dbo.Color SET CreatedAtUtc = '2026-04-20', ModifiedAtUtc = '2026-04-20',
                    CreatedByUserId = 'PENDING_SEED', ModifiedByUserId = 'PENDING_SEED';
                UPDATE dbo.Item SET CreatedAtUtc = '2026-04-20', ModifiedAtUtc = '2026-04-20',
                    CreatedByUserId = 'PENDING_SEED', ModifiedByUserId = 'PENDING_SEED';
                UPDATE dbo.ItemColor SET CreatedAtUtc = '2026-04-20', ModifiedAtUtc = '2026-04-20',
                    CreatedByUserId = 'PENDING_SEED', ModifiedByUserId = 'PENDING_SEED';
                UPDATE dbo.ItemColorSecondaryColor SET CreatedAtUtc = '2026-04-20', ModifiedAtUtc = '2026-04-20',
                    CreatedByUserId = 'PENDING_SEED', ModifiedByUserId = 'PENDING_SEED';
                UPDATE dbo.Sku SET CreatedAtUtc = '2026-04-20', ModifiedAtUtc = '2026-04-20',
                    CreatedByUserId = 'PENDING_SEED', ModifiedByUserId = 'PENDING_SEED';
                UPDATE dbo.ImageType SET CreatedAtUtc = '2026-04-20', ModifiedAtUtc = '2026-04-20',
                    CreatedByUserId = 'PENDING_SEED', ModifiedByUserId = 'PENDING_SEED';
                UPDATE dbo.ItemImage SET CreatedAtUtc = '2026-04-20', ModifiedAtUtc = '2026-04-20',
                    CreatedByUserId = 'PENDING_SEED', ModifiedByUserId = 'PENDING_SEED';
                UPDATE dbo.Inventory SET CreatedAtUtc = '2026-04-20', ModifiedAtUtc = '2026-04-20',
                    CreatedByUserId = 'PENDING_SEED', ModifiedByUserId = 'PENDING_SEED';
                UPDATE dbo.InventoryAdjustmentBatch SET CreatedAtUtc = '2026-04-20', ModifiedAtUtc = '2026-04-20',
                    CreatedByUserId = 'PENDING_SEED', ModifiedByUserId = 'PENDING_SEED';
                UPDATE dbo.InventoryUploadBatch SET CreatedAtUtc = '2026-04-20', ModifiedAtUtc = '2026-04-20',
                    CreatedByUserId = 'PENDING_SEED', ModifiedByUserId = 'PENDING_SEED';
                UPDATE dbo.InventoryActivityLog SET CreatedAtUtc = '2026-04-20', ModifiedAtUtc = '2026-04-20',
                    CreatedByUserId = 'PENDING_SEED', ModifiedByUserId = 'PENDING_SEED';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop audit indexes (2 per table × 14 = 28)

            migrationBuilder.DropIndex(name: "IX_Collection_CreatedByUserId", table: "Collection");
            migrationBuilder.DropIndex(name: "IX_Collection_ModifiedByUserId", table: "Collection");

            migrationBuilder.DropIndex(name: "IX_ImageType_CreatedByUserId", table: "ImageType");
            migrationBuilder.DropIndex(name: "IX_ImageType_ModifiedByUserId", table: "ImageType");

            migrationBuilder.DropIndex(name: "IX_InventoryAdjustmentBatch_CreatedByUserId", table: "InventoryAdjustmentBatch");
            migrationBuilder.DropIndex(name: "IX_InventoryAdjustmentBatch_ModifiedByUserId", table: "InventoryAdjustmentBatch");

            migrationBuilder.DropIndex(name: "IX_InventoryUploadBatch_CreatedByUserId", table: "InventoryUploadBatch");
            migrationBuilder.DropIndex(name: "IX_InventoryUploadBatch_ModifiedByUserId", table: "InventoryUploadBatch");

            migrationBuilder.DropIndex(name: "IX_Season_CreatedByUserId", table: "Season");
            migrationBuilder.DropIndex(name: "IX_Season_ModifiedByUserId", table: "Season");

            migrationBuilder.DropIndex(name: "IX_Sizes_CreatedByUserId", table: "Sizes");
            migrationBuilder.DropIndex(name: "IX_Sizes_ModifiedByUserId", table: "Sizes");

            migrationBuilder.DropIndex(name: "IX_Color_CreatedByUserId", table: "Color");
            migrationBuilder.DropIndex(name: "IX_Color_ModifiedByUserId", table: "Color");

            migrationBuilder.DropIndex(name: "IX_Item_CreatedByUserId", table: "Item");
            migrationBuilder.DropIndex(name: "IX_Item_ModifiedByUserId", table: "Item");

            migrationBuilder.DropIndex(name: "IX_ItemColor_CreatedByUserId", table: "ItemColor");
            migrationBuilder.DropIndex(name: "IX_ItemColor_ModifiedByUserId", table: "ItemColor");

            migrationBuilder.DropIndex(name: "IX_Inventory_CreatedByUserId", table: "Inventory");
            migrationBuilder.DropIndex(name: "IX_Inventory_ModifiedByUserId", table: "Inventory");

            migrationBuilder.DropIndex(name: "IX_InventoryActivityLog_CreatedByUserId", table: "InventoryActivityLog");
            migrationBuilder.DropIndex(name: "IX_InventoryActivityLog_ModifiedByUserId", table: "InventoryActivityLog");

            migrationBuilder.DropIndex(name: "IX_ItemColorSecondaryColor_CreatedByUserId", table: "ItemColorSecondaryColor");
            migrationBuilder.DropIndex(name: "IX_ItemColorSecondaryColor_ModifiedByUserId", table: "ItemColorSecondaryColor");

            migrationBuilder.DropIndex(name: "IX_ItemImage_CreatedByUserId", table: "ItemImage");
            migrationBuilder.DropIndex(name: "IX_ItemImage_ModifiedByUserId", table: "ItemImage");

            migrationBuilder.DropIndex(name: "IX_Sku_CreatedByUserId", table: "Sku");
            migrationBuilder.DropIndex(name: "IX_Sku_ModifiedByUserId", table: "Sku");

            // Drop audit FK constraints (2 per table × 14 = 28)

            migrationBuilder.DropForeignKey(name: "FK_Collection_User_CreatedByUserId", table: "Collection");
            migrationBuilder.DropForeignKey(name: "FK_Collection_User_ModifiedByUserId", table: "Collection");

            migrationBuilder.DropForeignKey(name: "FK_ImageType_User_CreatedByUserId", table: "ImageType");
            migrationBuilder.DropForeignKey(name: "FK_ImageType_User_ModifiedByUserId", table: "ImageType");

            migrationBuilder.DropForeignKey(name: "FK_InventoryAdjustmentBatch_User_CreatedByUserId", table: "InventoryAdjustmentBatch");
            migrationBuilder.DropForeignKey(name: "FK_InventoryAdjustmentBatch_User_ModifiedByUserId", table: "InventoryAdjustmentBatch");

            migrationBuilder.DropForeignKey(name: "FK_InventoryUploadBatch_User_CreatedByUserId", table: "InventoryUploadBatch");
            migrationBuilder.DropForeignKey(name: "FK_InventoryUploadBatch_User_ModifiedByUserId", table: "InventoryUploadBatch");

            migrationBuilder.DropForeignKey(name: "FK_Season_User_CreatedByUserId", table: "Season");
            migrationBuilder.DropForeignKey(name: "FK_Season_User_ModifiedByUserId", table: "Season");

            migrationBuilder.DropForeignKey(name: "FK_Sizes_User_CreatedByUserId", table: "Sizes");
            migrationBuilder.DropForeignKey(name: "FK_Sizes_User_ModifiedByUserId", table: "Sizes");

            migrationBuilder.DropForeignKey(name: "FK_Color_User_CreatedByUserId", table: "Color");
            migrationBuilder.DropForeignKey(name: "FK_Color_User_ModifiedByUserId", table: "Color");

            migrationBuilder.DropForeignKey(name: "FK_Item_User_CreatedByUserId", table: "Item");
            migrationBuilder.DropForeignKey(name: "FK_Item_User_ModifiedByUserId", table: "Item");

            migrationBuilder.DropForeignKey(name: "FK_ItemColor_User_CreatedByUserId", table: "ItemColor");
            migrationBuilder.DropForeignKey(name: "FK_ItemColor_User_ModifiedByUserId", table: "ItemColor");

            migrationBuilder.DropForeignKey(name: "FK_Inventory_User_CreatedByUserId", table: "Inventory");
            migrationBuilder.DropForeignKey(name: "FK_Inventory_User_ModifiedByUserId", table: "Inventory");

            migrationBuilder.DropForeignKey(name: "FK_InventoryActivityLog_User_CreatedByUserId", table: "InventoryActivityLog");
            migrationBuilder.DropForeignKey(name: "FK_InventoryActivityLog_User_ModifiedByUserId", table: "InventoryActivityLog");

            migrationBuilder.DropForeignKey(name: "FK_ItemColorSecondaryColor_User_CreatedByUserId", table: "ItemColorSecondaryColor");
            migrationBuilder.DropForeignKey(name: "FK_ItemColorSecondaryColor_User_ModifiedByUserId", table: "ItemColorSecondaryColor");

            migrationBuilder.DropForeignKey(name: "FK_ItemImage_User_CreatedByUserId", table: "ItemImage");
            migrationBuilder.DropForeignKey(name: "FK_ItemImage_User_ModifiedByUserId", table: "ItemImage");

            migrationBuilder.DropForeignKey(name: "FK_Sku_User_CreatedByUserId", table: "Sku");
            migrationBuilder.DropForeignKey(name: "FK_Sku_User_ModifiedByUserId", table: "Sku");

            // Drop User table (no other tables depend on it after FKs removed above)
            migrationBuilder.DropTable(name: "User");

            // Drop audit columns (4 per table × 14 = 56)

            migrationBuilder.DropColumn(name: "CreatedAtUtc", table: "Collection");
            migrationBuilder.DropColumn(name: "ModifiedAtUtc", table: "Collection");
            migrationBuilder.DropColumn(name: "CreatedByUserId", table: "Collection");
            migrationBuilder.DropColumn(name: "ModifiedByUserId", table: "Collection");

            migrationBuilder.DropColumn(name: "CreatedAtUtc", table: "ImageType");
            migrationBuilder.DropColumn(name: "ModifiedAtUtc", table: "ImageType");
            migrationBuilder.DropColumn(name: "CreatedByUserId", table: "ImageType");
            migrationBuilder.DropColumn(name: "ModifiedByUserId", table: "ImageType");

            migrationBuilder.DropColumn(name: "CreatedAtUtc", table: "InventoryAdjustmentBatch");
            migrationBuilder.DropColumn(name: "ModifiedAtUtc", table: "InventoryAdjustmentBatch");
            migrationBuilder.DropColumn(name: "CreatedByUserId", table: "InventoryAdjustmentBatch");
            migrationBuilder.DropColumn(name: "ModifiedByUserId", table: "InventoryAdjustmentBatch");

            migrationBuilder.DropColumn(name: "CreatedAtUtc", table: "InventoryUploadBatch");
            migrationBuilder.DropColumn(name: "ModifiedAtUtc", table: "InventoryUploadBatch");
            migrationBuilder.DropColumn(name: "CreatedByUserId", table: "InventoryUploadBatch");
            migrationBuilder.DropColumn(name: "ModifiedByUserId", table: "InventoryUploadBatch");

            migrationBuilder.DropColumn(name: "CreatedAtUtc", table: "Season");
            migrationBuilder.DropColumn(name: "ModifiedAtUtc", table: "Season");
            migrationBuilder.DropColumn(name: "CreatedByUserId", table: "Season");
            migrationBuilder.DropColumn(name: "ModifiedByUserId", table: "Season");

            migrationBuilder.DropColumn(name: "CreatedAtUtc", table: "Sizes");
            migrationBuilder.DropColumn(name: "ModifiedAtUtc", table: "Sizes");
            migrationBuilder.DropColumn(name: "CreatedByUserId", table: "Sizes");
            migrationBuilder.DropColumn(name: "ModifiedByUserId", table: "Sizes");

            migrationBuilder.DropColumn(name: "CreatedAtUtc", table: "Color");
            migrationBuilder.DropColumn(name: "ModifiedAtUtc", table: "Color");
            migrationBuilder.DropColumn(name: "CreatedByUserId", table: "Color");
            migrationBuilder.DropColumn(name: "ModifiedByUserId", table: "Color");

            migrationBuilder.DropColumn(name: "CreatedAtUtc", table: "Item");
            migrationBuilder.DropColumn(name: "ModifiedAtUtc", table: "Item");
            migrationBuilder.DropColumn(name: "CreatedByUserId", table: "Item");
            migrationBuilder.DropColumn(name: "ModifiedByUserId", table: "Item");

            migrationBuilder.DropColumn(name: "CreatedAtUtc", table: "ItemColor");
            migrationBuilder.DropColumn(name: "ModifiedAtUtc", table: "ItemColor");
            migrationBuilder.DropColumn(name: "CreatedByUserId", table: "ItemColor");
            migrationBuilder.DropColumn(name: "ModifiedByUserId", table: "ItemColor");

            migrationBuilder.DropColumn(name: "CreatedAtUtc", table: "Inventory");
            migrationBuilder.DropColumn(name: "ModifiedAtUtc", table: "Inventory");
            migrationBuilder.DropColumn(name: "CreatedByUserId", table: "Inventory");
            migrationBuilder.DropColumn(name: "ModifiedByUserId", table: "Inventory");

            migrationBuilder.DropColumn(name: "CreatedAtUtc", table: "InventoryActivityLog");
            migrationBuilder.DropColumn(name: "ModifiedAtUtc", table: "InventoryActivityLog");
            migrationBuilder.DropColumn(name: "CreatedByUserId", table: "InventoryActivityLog");
            migrationBuilder.DropColumn(name: "ModifiedByUserId", table: "InventoryActivityLog");

            migrationBuilder.DropColumn(name: "CreatedAtUtc", table: "ItemColorSecondaryColor");
            migrationBuilder.DropColumn(name: "ModifiedAtUtc", table: "ItemColorSecondaryColor");
            migrationBuilder.DropColumn(name: "CreatedByUserId", table: "ItemColorSecondaryColor");
            migrationBuilder.DropColumn(name: "ModifiedByUserId", table: "ItemColorSecondaryColor");

            migrationBuilder.DropColumn(name: "CreatedAtUtc", table: "ItemImage");
            migrationBuilder.DropColumn(name: "ModifiedAtUtc", table: "ItemImage");
            migrationBuilder.DropColumn(name: "CreatedByUserId", table: "ItemImage");
            migrationBuilder.DropColumn(name: "ModifiedByUserId", table: "ItemImage");

            migrationBuilder.DropColumn(name: "CreatedAtUtc", table: "Sku");
            migrationBuilder.DropColumn(name: "ModifiedAtUtc", table: "Sku");
            migrationBuilder.DropColumn(name: "CreatedByUserId", table: "Sku");
            migrationBuilder.DropColumn(name: "ModifiedByUserId", table: "Sku");
        }
    }
}
