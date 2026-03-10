using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using MissIssippiAPI.Models;

namespace MissIssippiAPI.Data;

public partial class MissIssippiContext : DbContext
{
    public MissIssippiContext()
    {
    }

    public MissIssippiContext(DbContextOptions<MissIssippiContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Color> Colors { get; set; }

    public virtual DbSet<Collection> Collections { get; set; }

    public virtual DbSet<ImageType> ImageTypes { get; set; }

    public virtual DbSet<Inventory> Inventories { get; set; }

    public virtual DbSet<InventoryActivityLog> InventoryActivityLogs { get; set; }

    public virtual DbSet<InventoryAdjustmentBatch> InventoryAdjustmentBatches { get; set; }

    public virtual DbSet<InventoryUploadBatch> InventoryUploadBatches { get; set; }

    public virtual DbSet<ItemImage> ItemImages { get; set; }

    public virtual DbSet<Season> Seasons { get; set; }

    public virtual DbSet<Size> Sizes { get; set; }

    public virtual DbSet<Sku> Skus { get; set; }

    public virtual DbSet<Item> Items { get; set; }

    public virtual DbSet<ItemColor> ItemColors { get; set; }

    public virtual DbSet<ItemColorSecondaryColor> ItemColorSecondaryColors { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Color>(entity =>
        {
            entity.HasKey(e => e.ColorId).HasName("PK__Color__8DA7674DAF1C0D00");

            entity.ToTable("Color");

            entity.HasIndex(e => new { e.ColorName, e.SeasonId, e.CollectionId }, "u_Color_ColorName_SeasonId_CollectionId")
                .IsUnique();

            entity.Property(e => e.ColorName)
                .HasMaxLength(75)
                .IsUnicode(false);

            entity.Property(e => e.HexValue)
                .HasMaxLength(7)
                .IsUnicode(false);

            entity.Property(e => e.PantoneColor)
                .HasMaxLength(50)
                .IsUnicode(false);

            entity.HasOne(d => d.Collection).WithMany(p => p.Colors)
                .HasForeignKey(d => d.CollectionId)
                .HasConstraintName("f_Collection_Color");

            entity.HasOne(d => d.Season).WithMany()
                .HasForeignKey(d => d.SeasonId)
                .HasConstraintName("f_Season_Color");
        });

        modelBuilder.Entity<Collection>(entity =>
        {
            entity.HasKey(e => e.CollectionId).HasName("PK__Collect__D1CCDFE1B35E33F2");

            entity.ToTable("Collection");

            entity.HasIndex(e => e.CollectionName, "u_Collection_CollectionName").IsUnique();

            entity.Property(e => e.CollectionName)
                .HasMaxLength(75)
                .IsUnicode(false);
        });

        modelBuilder.Entity<ImageType>(entity =>
        {
            entity.HasKey(e => e.ImageTypeId).HasName("PK__ImageTyp__C4FE4B7B050E0A04");

            entity.ToTable("ImageType");

            entity.HasIndex(e => e.Sequence, "u_ImageType_Sequence").IsUnique();

            entity.HasIndex(e => e.Type, "u_ImageType_Type").IsUnique();

            entity.Property(e => e.Type)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Inventory>(entity =>
        {
            entity.HasKey(e => e.InventoryId).HasName("PK__Inventor__F5FDE6B312394863");

            entity.ToTable("Inventory");

            entity.Property(e => e.InStock).HasComputedColumnSql("(case when [Qty]>(0) then (1) else (0) end)", true);

            entity.HasOne(d => d.Size).WithMany(p => p.Inventories)
                .HasForeignKey(d => d.SizeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_Sizes_Inventory");

            entity.HasOne(d => d.ItemColor).WithMany(p => p.Inventories)
                .HasForeignKey(d => d.ItemColorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_ItemColor_Inventory");
        });

        modelBuilder.Entity<InventoryActivityLog>(entity =>
        {
            entity.HasKey(e => e.InventoryActivityLogId).HasName("PK__Inventor__BE0F81F948B45064");

            entity.ToTable("InventoryActivityLog");

            entity.Property(e => e.BatchId);

            entity.Property(e => e.ActionType)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.Delta).HasDefaultValue(0);
            entity.Property(e => e.InventoryActivityDate).HasColumnType("datetime");
            entity.Property(e => e.LogTimestamp)
                .HasColumnType("datetime2(3)")
                .HasDefaultValueSql("sysutcdatetime()")
                .ValueGeneratedOnAdd();
            entity.Property(e => e.NewQty).HasDefaultValue(0);
            entity.Property(e => e.OldQty).HasDefaultValue(0);

            entity.HasOne(d => d.Size).WithMany(p => p.InventoryActivityLogs)
                .HasForeignKey(d => d.SizeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_Sizes_InventoryActivityLog");

            entity.HasOne(d => d.ItemColor).WithMany(p => p.InventoryActivityLogs)
                .HasForeignKey(d => d.ItemColorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_ItemColor_InventoryActivityLog");

            entity.HasOne(d => d.Batch).WithMany(p => p.InventoryActivityLogs)
                .HasForeignKey(d => d.BatchId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_InventoryAdjustmentBatch_InventoryActivityLog");
        });

        modelBuilder.Entity<InventoryAdjustmentBatch>(entity =>
        {
            entity.HasKey(e => e.BatchId).HasName("PK_InventoryAdjustmentBatch");

            entity.ToTable("InventoryAdjustmentBatch");

            entity.Property(e => e.BatchId)
                .HasDefaultValueSql("newsequentialid()");

            entity.Property(e => e.BatchTimestamp)
                .HasColumnType("datetime2(3)")
                .HasDefaultValueSql("sysutcdatetime()")
                .ValueGeneratedOnAdd();

            entity.Property(e => e.Source)
                .HasMaxLength(30)
                .IsUnicode(false);

            entity.Property(e => e.Notes)
                .HasMaxLength(200)
                .IsUnicode(false);
        });

        modelBuilder.Entity<InventoryUploadBatch>(entity =>
        {
            entity.HasKey(e => e.UploadBatchId).HasName("PK_InventoryUploadBatch");

            entity.ToTable("InventoryUploadBatch");

            entity.HasIndex(e => e.CreatedAt, "ix_InventoryUploadBatch_CreatedAt");
            entity.HasIndex(e => new { e.DatasetHash, e.Mode, e.IsUndone }, "ix_InventoryUploadBatch_Hash_Mode_Undone");
            entity.HasIndex(e => e.IdempotencyKey, "u_InventoryUploadBatch_IdempotencyKey")
                .IsUnique()
                .HasFilter("[IdempotencyKey] IS NOT NULL");

            entity.Property(e => e.UploadBatchId)
                .HasDefaultValueSql("newsequentialid()");

            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime2(3)")
                .HasDefaultValueSql("sysutcdatetime()")
                .ValueGeneratedOnAdd();

            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .IsUnicode(false);

            entity.Property(e => e.Mode)
                .HasMaxLength(20)
                .IsUnicode(false);

            entity.Property(e => e.DatasetHash)
                .HasMaxLength(64)
                .IsUnicode(false);

            entity.Property(e => e.IdempotencyKey)
                .HasMaxLength(120)
                .IsUnicode(false);

            entity.Property(e => e.Message)
                .HasMaxLength(500)
                .IsUnicode(false);

            entity.Property(e => e.IsUndone)
                .HasDefaultValue(false);

            entity.Property(e => e.ResultJson)
                .HasColumnType("nvarchar(max)");
        });

        modelBuilder.Entity<ItemImage>(entity =>
        {
            entity.HasKey(e => e.ItemImageId).HasName("PK__ItemImag__7FBDF9E4A9A8D9E8");

            entity.ToTable("ItemImage");

            entity.Property(e => e.ImageUrl)
                .HasMaxLength(500)
                .IsUnicode(false);

            entity.HasOne(d => d.ImageType).WithMany(p => p.ItemImages)
                .HasForeignKey(d => d.ImageTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_ImageType_ItemImage");

            entity.HasOne(d => d.ItemColor).WithMany(p => p.ItemImages)
                .HasForeignKey(d => d.ItemColorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_ItemColor_ItemImage");
        });

        modelBuilder.Entity<Season>(entity =>
        {
            entity.HasKey(e => e.SeasonId).HasName("PK__Season__C1814E3825F7E317");

            entity.ToTable("Season");

            entity.HasIndex(e => e.SeasonName, "u_Season_SeasonName").IsUnique();

            entity.Property(e => e.SeasonDateCreated).HasColumnType("datetime");
            entity.Property(e => e.SeasonName)
                .HasMaxLength(10)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Size>(entity =>
        {
            entity.HasKey(e => e.SizeId).HasName("PK__Sizes__83BD097A09B4478E");

            entity.HasIndex(e => e.SizeName, "u_Sizes_SizeName").IsUnique();

            entity.HasIndex(e => e.SizeSequence, "u_Sizes_Size_Sequence").IsUnique();

            entity.Property(e => e.SizeName)
                .HasMaxLength(10)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Sku>(entity =>
        {
            entity.HasKey(e => e.SkuId).HasName("PK__Sku__CA1ECF0D968C4D01");

            entity.ToTable("Sku");

            entity.HasIndex(e => e.SkuValue, "u_Sku_Sku").IsUnique();

            entity.HasIndex(e => new { e.ItemColorId, e.SizeId }, "u_Sku_ItemColorId_SizeId").IsUnique();

            entity.Property(e => e.SkuValue)
                .HasColumnName("Sku")
                .HasMaxLength(25)
                .IsUnicode(false);

            entity.HasOne(d => d.ItemColor).WithMany(p => p.Skus)
                .HasForeignKey(d => d.ItemColorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_ItemColor_Sku");

            entity.HasOne(d => d.Size).WithMany()
                .HasForeignKey(d => d.SizeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_Sizes_Sku");
        });

        modelBuilder.Entity<Item>(entity =>
        {
            entity.HasKey(e => e.ItemId).HasName("PK__Item__8AD14640BCF81361");

            entity.ToTable("Item");

            entity.HasIndex(e => new { e.ItemNumber, e.SeasonId }, "u_Item_ItemNumber_SeasonId").IsUnique();

            entity.Property(e => e.CostPrice).HasColumnType("decimal(18, 0)");
            entity.Property(e => e.Description)
                .HasMaxLength(500)
                .IsUnicode(false)
                .IsRequired();
            entity.Property(e => e.ItemDateCreated).HasColumnType("datetime");
            entity.Property(e => e.ItemNumber)
                .HasMaxLength(75)
                .IsUnicode(false);
            entity.Property(e => e.Weight).HasColumnType("decimal(18, 0)");
            entity.Property(e => e.WholesalePrice).HasColumnType("decimal(18, 0)");

            entity.HasOne(d => d.Season).WithMany(p => p.Items)
                .HasForeignKey(d => d.SeasonId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_Season_Item");
        });

        modelBuilder.Entity<ItemColor>(entity =>
        {
            entity.HasKey(e => e.ItemColorId).HasName("PK__ItemCol__D60ED5767E9873B1");

            entity.ToTable("ItemColor");

            entity.HasIndex(e => new { e.ItemId, e.ColorId, e.CompositeSignature }, "u_ItemColor_ItemId_ColorId_CompositeSignature").IsUnique();

            entity.Property(e => e.Active)
                .HasDefaultValue(true);

            entity.Property(e => e.CompositeSignature)
                .HasMaxLength(500)
                .HasDefaultValue("");

            entity.HasOne(d => d.Color).WithMany(p => p.ItemColors)
                .HasForeignKey(d => d.ColorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_Color_ItemColor");

            entity.HasOne(d => d.Item).WithMany(p => p.ItemColors)
                .HasForeignKey(d => d.ItemId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_Item_ItemColor");
        });

        modelBuilder.Entity<ItemColorSecondaryColor>(entity =>
        {
            entity.HasKey(e => new { e.ItemColorId, e.SecondaryColorId })
                .HasName("PK_ItemColorSecondaryColor");

            entity.ToTable("ItemColorSecondaryColor");

            entity.Property(e => e.SortOrder).HasDefaultValue(1);

            entity.HasOne(d => d.ItemColor).WithMany(p => p.ItemColorSecondaryColors)
                .HasForeignKey(d => d.ItemColorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_ItemColor_ItemColorSecondaryColor");

            entity.HasOne(d => d.SecondaryColor).WithMany(p => p.ItemColorSecondaryColors)
                .HasForeignKey(d => d.SecondaryColorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_Color_ItemColorSecondaryColor");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
