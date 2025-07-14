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

    public virtual DbSet<Inventory> Inventories { get; set; }

    public virtual DbSet<InventoryActivityLog> InventoryActivityLogs { get; set; }

    public virtual DbSet<InventoryView> InventoryViews { get; set; }

    public virtual DbSet<ProductType> ProductTypes { get; set; }

    public virtual DbSet<Season> Seasons { get; set; }

    public virtual DbSet<Size> Sizes { get; set; }

    public virtual DbSet<Style> Styles { get; set; }

    public virtual DbSet<StyleColor> StyleColors { get; set; }

    public virtual DbSet<StyleColorView> StyleColorViews { get; set; }

    public virtual DbSet<StyleView> StyleViews { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=tcp:miss-issippi.database.windows.net,1433;Initial Catalog=Miss_Issippi_DB-Dev;Persist Security Info=False;User ID=miss_issippi_admin;Password=Frills101;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Color>(entity =>
        {
            entity.HasKey(e => e.ColorId).HasName("PK__Color__8DA7674DAF1C0D00");

            entity.ToTable("Color");

            entity.HasIndex(e => e.ColorName, "u_Color_ColorName").IsUnique();

            entity.Property(e => e.ColorName)
                .HasMaxLength(75)
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

            entity.HasOne(d => d.StyleColor).WithMany(p => p.Inventories)
                .HasForeignKey(d => d.StyleColorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_StyleColor_Inventory");
        });

        modelBuilder.Entity<InventoryActivityLog>(entity =>
        {
            entity.HasKey(e => e.InventoryActivityLogId).HasName("PK__Inventor__BE0F81F948B45064");

            entity.ToTable("InventoryActivityLog");

            entity.Property(e => e.ActionType)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.InventoryActivityDate).HasColumnType("datetime");

            entity.HasOne(d => d.Size).WithMany(p => p.InventoryActivityLogs)
                .HasForeignKey(d => d.SizeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_Sizes_InventoryActivityLog");

            entity.HasOne(d => d.StyleColor).WithMany(p => p.InventoryActivityLogs)
                .HasForeignKey(d => d.StyleColorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_StyleColor_InventoryActivityLog");
        });

        modelBuilder.Entity<InventoryView>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("InventoryView");

            entity.Property(e => e.ColorName)
                .HasMaxLength(75)
                .IsUnicode(false);
            entity.Property(e => e.Description)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.SeasonName)
                .HasMaxLength(4)
                .IsUnicode(false);
            entity.Property(e => e.SizeName)
                .HasMaxLength(10)
                .IsUnicode(false);
            entity.Property(e => e.StyleNumber)
                .HasMaxLength(75)
                .IsUnicode(false);
        });

        modelBuilder.Entity<ProductType>(entity =>
        {
            entity.HasKey(e => e.ProductTypeId).HasName("PK__ProductT__A1312F6EBCB7E6E4");

            entity.ToTable("ProductType");

            entity.HasIndex(e => e.ProductTypeName, "u_ProductType_ProductTypeName").IsUnique();

            entity.Property(e => e.ProductTypeName)
                .HasMaxLength(150)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Season>(entity =>
        {
            entity.HasKey(e => e.SeasonId).HasName("PK__Season__C1814E3825F7E317");

            entity.ToTable("Season");

            entity.HasIndex(e => e.SeasonName, "u_Season_SeasonName").IsUnique();

            entity.Property(e => e.SeasonDateCreated).HasColumnType("datetime");
            entity.Property(e => e.SeasonName)
                .HasMaxLength(4)
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

        modelBuilder.Entity<Style>(entity =>
        {
            entity.HasKey(e => e.StyleId).HasName("PK__Style__8AD14640BCF81361");

            entity.ToTable("Style");

            entity.HasIndex(e => new { e.StyleNumber, e.SeasonId }, "u_Style_StyleNumber_SeasonId").IsUnique();

            entity.Property(e => e.CostPrice).HasColumnType("decimal(18, 0)");
            entity.Property(e => e.Description)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.StyleDateCreated).HasColumnType("datetime");
            entity.Property(e => e.StyleNumber)
                .HasMaxLength(75)
                .IsUnicode(false);
            entity.Property(e => e.Weight).HasColumnType("decimal(18, 0)");
            entity.Property(e => e.WholesalePrice).HasColumnType("decimal(18, 0)");

            entity.HasOne(d => d.ProductType).WithMany(p => p.Styles)
                .HasForeignKey(d => d.ProductTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_ProductType_Style");

            entity.HasOne(d => d.Season).WithMany(p => p.Styles)
                .HasForeignKey(d => d.SeasonId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_Season_Style");
        });

        modelBuilder.Entity<StyleColor>(entity =>
        {
            entity.HasKey(e => e.StyleColorId).HasName("PK__StyleCol__D60ED5767E9873B1");

            entity.ToTable("StyleColor");

            entity.HasIndex(e => new { e.StyleId, e.ColorId }, "u_StyleColor_StyleId_ColorId").IsUnique();

            entity.HasOne(d => d.Color).WithMany(p => p.StyleColors)
                .HasForeignKey(d => d.ColorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_Color_StyleColor");

            entity.HasOne(d => d.Style).WithMany(p => p.StyleColors)
                .HasForeignKey(d => d.StyleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("f_Style_StyleColor");
        });

        modelBuilder.Entity<StyleColorView>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("StyleColorView");

            entity.Property(e => e.ColorName)
                .HasMaxLength(75)
                .IsUnicode(false);
            entity.Property(e => e.SeasonName)
                .HasMaxLength(4)
                .IsUnicode(false);
            entity.Property(e => e.StyleNumber)
                .HasMaxLength(75)
                .IsUnicode(false);
        });

        modelBuilder.Entity<StyleView>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("StyleView");

            entity.Property(e => e.CostPrice).HasColumnType("decimal(18, 0)");
            entity.Property(e => e.Description)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.ProductTypeName)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.SeasonDateCreated).HasColumnType("datetime");
            entity.Property(e => e.SeasonName)
                .HasMaxLength(4)
                .IsUnicode(false);
            entity.Property(e => e.StyleDateCreated).HasColumnType("datetime");
            entity.Property(e => e.StyleNumber)
                .HasMaxLength(75)
                .IsUnicode(false);
            entity.Property(e => e.Weight).HasColumnType("decimal(18, 0)");
            entity.Property(e => e.WholesalePrice).HasColumnType("decimal(18, 0)");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
