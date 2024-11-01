using Microsoft.EntityFrameworkCore;
using TestAppdZENcode.Server.Models;

namespace TestAppdZENcode.Server.Data
{
    public class CommentsRepository
    {
        private readonly TestAppdZencodeDbContext _context;

        public CommentsRepository(TestAppdZencodeDbContext context)
        {
            _context = context;
        }

        public async Task<(List<Comment> Comments, int TotalCount)> GetCommentsWithChildrenAsync(int page, int pageSize, string sortBy, string sortOrder)
        {
            var commentsQuery = _context.Comments
                .Where(c => c.ParentId == null)  // Корневые комментарии
                .Include(c => c.Children)        // Включение дочерних комментариев
                .AsQueryable();

            // Сортировка
            commentsQuery = sortBy switch
            {
                "userName" => sortOrder == "ASC" ? commentsQuery.OrderBy(c => c.UserName) : commentsQuery.OrderByDescending(c => c.UserName),
                "email" => sortOrder == "ASC" ? commentsQuery.OrderBy(c => c.Email) : commentsQuery.OrderByDescending(c => c.Email),
                "created_at" => sortOrder == "ASC" ? commentsQuery.OrderBy(c => c.CreatedAt) : commentsQuery.OrderByDescending(c => c.CreatedAt),
                _ => commentsQuery.OrderByDescending(c => c.CreatedAt), // LIFO сортировка по умолчанию
            };

            // Подсчет общего количества корневых комментариев (без учета пагинации)
            var totalCount = await commentsQuery.CountAsync();

            // Пагинация
            commentsQuery = commentsQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize);

            var comments = await commentsQuery.ToListAsync();

            // Рекурсивная подгрузка всех вложенных комментариев
            foreach (var comment in comments)
            {
                await LoadChildrenAsync(comment);
            }

            return (comments, totalCount);
        }

        private async Task LoadChildrenAsync(Comment parentComment)
        {
            var children = await _context.Comments
                .Where(c => c.ParentId == parentComment.Id)
                .ToListAsync();

            parentComment.Children = children;

            // Рекурсивно загружаем дочерние комментарии для каждого ребенка
            foreach (var child in children)
            {
                await LoadChildrenAsync(child);
            }
        }

        public async Task<Comment> AddCommentWithFileAsync(Comment comment, IFormFile? file)
        {
            // Логика сохранения файла на сервере
            var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadPath))
            {
                Directory.CreateDirectory(uploadPath);
            }

            if (file != null)
            {
                var fileName = Path.GetFileNameWithoutExtension(file.FileName) + "_" + Guid.NewGuid() + Path.GetExtension(file.FileName);
                var filePath = Path.Combine(uploadPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                comment.FilePath = fileName;  // Сохраняем имя файла
            }
            
            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            return comment;
        }
    }
}