using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using TestAppdZENcode.Server.Models;

namespace TestAppdZENcode.Server.Data;

public partial class TestAppdZencodeDbContext : DbContext
{
    public TestAppdZencodeDbContext()
    {
    }

    public TestAppdZencodeDbContext(DbContextOptions<TestAppdZencodeDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Comment> Comments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_COMMENTS_ID");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Parent).WithMany(p => p.Children).HasConstraintName("FK_PARENT_ID");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
