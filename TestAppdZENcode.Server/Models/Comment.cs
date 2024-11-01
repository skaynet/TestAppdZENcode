using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace TestAppdZENcode.Server.Models;

[Table("comments")]
public partial class Comment
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("parent_id")]
    public int? ParentId { get; set; }

    [Column("user_name")]
    [StringLength(255)]
    public string UserName { get; set; } = null!;

    [Column("email")]
    [StringLength(255)]
    [EmailAddress]
    public string Email { get; set; } = null!;

    [Column("home_page")]
    [StringLength(255)]
    [Url]
    public string? HomePage { get; set; }

    [Column("content")]
    public string Content { get; set; } = null!;

    [Column("file_path")]
    [StringLength(500)]
    public string? FilePath { get; set; }

    [Column("created_at", TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [InverseProperty("Parent")]
    public virtual ICollection<Comment> Children { get; set; } = new List<Comment>();

    [JsonIgnore] // Исключаем Parent из сериализации
    [ForeignKey("ParentId")]
    [InverseProperty("Children")]
    public virtual Comment? Parent { get; set; }
}
