using Ganss.Xss;
using Microsoft.AspNetCore.Mvc;
using SixLabors.ImageSharp;
using TestAppdZENcode.Server.Data;
using TestAppdZENcode.Server.Models;

namespace TestAppdZENcode.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommentsController : ControllerBase
    {
        private readonly CommentsRepository _commentRepository;
        private readonly HtmlSanitizer _sanitizer;
        private readonly int PageSize;

        public CommentsController(CommentsRepository repository)
        {
            _commentRepository = repository;
            _sanitizer = new HtmlSanitizer();
            PageSize = 25;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Comment>>> GetComments([FromQuery] int page = 1, [FromQuery] string sortBy = "created_at", [FromQuery] string sortOrder = "DESC")
        {
            if (page <= 0) return BadRequest("Invalid pagination parameters.");

            var (comments, totalCount) = await _commentRepository.GetCommentsWithChildrenAsync(page, PageSize, sortBy, sortOrder);
            
            return Ok(new
            {
                TotalCount = totalCount,
                Comments = comments
            });
        }

        [HttpPost]
        public async Task<ActionResult<IEnumerable<Comment>>> PostComment([FromForm] Comment comment, IFormFile? file, 
            [FromQuery] int page = 1, [FromQuery] string sortBy = "created_at", [FromQuery] string sortOrder = "DESC")
        {
            if (file == null || file.Length == 0)
            {
                file = null;
            }
            else
            {
                // Проверка типа файла
                var isImage = file.ContentType.StartsWith("image/");
                var isTextFile = file.ContentType == "text/plain";

                if (!isImage && !isTextFile)
                    return BadRequest("Invalid file type. Only image (320x240) or text file allowed.");

                if (isImage)
                {
                    // Дополнительная проверка размеров изображения
                    using (var image = Image.Load(file.OpenReadStream()))  // Загрузка изображения из потока
                    {
                        if (image.Width > 320 || image.Height > 240)
                        {
                            return BadRequest("Invalid image dimensions. Image must be 320x240.");
                        }
                    }
                }
                else if (isTextFile && file.Length > 102400)
                {
                    return BadRequest("Text file size exceeds 100 KB.");
                }
            }

            // Очистка контента комментария от вредоносного HTML
            comment.Content = _sanitizer.Sanitize(comment.Content);

            // Логика сохранения файла и комментария
            var addedComment = await _commentRepository.AddCommentWithFileAsync(comment, file);

            //return Ok(new { addedComment.Id, addedComment.FilePath });

            var (comments, totalCount) = await _commentRepository.GetCommentsWithChildrenAsync(page, PageSize, sortBy, sortOrder);

            return Ok(new
            {
                TotalCount = totalCount,
                Comments = comments
            });
        }
    }
}
