using Microsoft.AspNetCore.Mvc;
using System.Linq;
using MissIssippiAPI.Data;
using MissIssippiAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace MissIssippiAPI.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class CollectionController : ControllerBase
    {
        private readonly MissIssippiContext _context;

        public CollectionController(MissIssippiContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<List<Collection>> GetCollections(int? CollectionId = null, string? CollectionName = null)
        {
            var query = from c in _context.Collections
                        .Where(x =>
                            (x.CollectionId == CollectionId || CollectionId == null)
                            && (x.CollectionName.Contains(CollectionName) || CollectionName == null))
                        select new Collection
                        {
                            CollectionId = c.CollectionId,
                            CollectionName = c.CollectionName
                        };

            return await query.ToListAsync();
        }

        [HttpPost]
        public async Task<IActionResult> AddCollection(CollectionSaveRequest? request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.CollectionName))
            {
                return BadRequest("Collection name is required.");
            }

            var normalizedName = request.CollectionName.Trim();
            var exists = await _context.Collections.AnyAsync(x => x.CollectionName == normalizedName);
            if (exists)
            {
                return Conflict($"Collection '{normalizedName}' already exists.");
            }

            var collection = new Collection
            {
                CollectionName = normalizedName
            };

            _context.Collections.Add(collection);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return Conflict($"Collection '{normalizedName}' already exists.");
            }

            return Ok(new CollectionDto
            {
                CollectionId = collection.CollectionId,
                CollectionName = collection.CollectionName
            });
        }
    }
}
