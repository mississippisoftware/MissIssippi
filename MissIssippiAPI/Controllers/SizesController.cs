using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using MissIssippiAPI.Data;
using MissIssippiAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace MissIssippiAPI
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class SizesController : ControllerBase
    {
        private readonly MissIssippiContext _context;

        public SizesController(MissIssippiContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<List<Size>> GetSizes(int? SizeId = null, string? SizeName = null, int? SizeSequence = null)
        {
            var query = from s in _context.Sizes
                        .Where(x =>
                                (x.SizeId == SizeId|| SizeId == null)
                                && (x.SizeName.Contains(SizeName) || SizeName == null)
                                 && (x.SizeSequence == SizeSequence || SizeSequence == null)
                                )
                        select new Size
                        {
                            SizeId = s.SizeId,
                            SizeName = s.SizeName,
                            SizeSequence = s.SizeSequence
                        };

            return await query.ToListAsync();
        }

        [HttpPost]
        public async Task<bool> AddOrUpdateSize(Size? size)
        {
            if (size != null)
            {
                var existingSize = await _context.Sizes.Where(x => x.SizeId == size.SizeId).FirstOrDefaultAsync();

                if (existingSize != null)
                {
                    existingSize.SizeName = size.SizeName;
                    existingSize.SizeSequence = size.SizeSequence;

                }

                if (existingSize == null)
                {
                    existingSize.SizeName = size.SizeName;
                    existingSize.SizeSequence = size.SizeSequence;
                    _context.AddAsync(existingSize);

                }
                _context.SaveChangesAsync();
                return true;
            }
            return false;
        }

        [HttpDelete]
        public async Task<bool> DeleteSize(int SizeId)
        {
            var existingSize = await _context.Sizes.FindAsync(SizeId);
            if (existingSize != null)
            {
                _context.Sizes.Remove(existingSize);
                await _context.SaveChangesAsync();
            }

            return true;
        }

    }
}
