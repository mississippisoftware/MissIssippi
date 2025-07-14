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
    public class ColorController : ControllerBase
    {
        private readonly MissIssippiContext _context;

        public ColorController(MissIssippiContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<List<Color>> GetColors(int? ColorId = null, string? ColorName = null)
        {
            var query = from c in _context.Colors
                        .Where(x =>  
                                (x.ColorId == ColorId || ColorId == null)
                                && (x.ColorName.Contains(ColorName) || ColorName == null)
                                )
                        select new Color
                        {
                            ColorId = c.ColorId,
                            ColorName = c.ColorName
                        };

            return await query.ToListAsync();
        }

        [HttpPost]
        public async Task<bool> AddOrUpdateColor(Color? color)
        {
            if (color != null)
            {
                var existingColor = await _context.Colors.Where(x => x.ColorId == color.ColorId).FirstOrDefaultAsync();

                if (existingColor != null)
                {
                    existingColor.ColorName = color.ColorName;

                }

                if (existingColor == null)
                {
                    existingColor.ColorName = color.ColorName;
                    _context.AddAsync(existingColor);

                }
                _context.SaveChangesAsync();
                return true;
            }
            return false;
        }

        [HttpDelete]
        public async Task<bool> DeleteColor(int ColorId)
        {
            var existingColor = await _context.Colors.FindAsync(ColorId);
            if (existingColor != null) {
                _context.Colors.Remove(existingColor);
                await _context.SaveChangesAsync();
            }

            return true;
        }

    }
}
