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
        public async Task<List<Color>> GetColors(int? ColorId = null, string? ColorName = null, int? SeasonId = null)
        {
            var query = from c in _context.Colors
                        .Where(x =>  
                                (x.ColorId == ColorId || ColorId == null)
                                && (x.ColorName.Contains(ColorName) || ColorName == null)
                                && (x.SeasonId == SeasonId || SeasonId == null)
                                )
                        select new Color
                        {
                            ColorId = c.ColorId,
                            ColorName = c.ColorName,
                            SeasonId = c.SeasonId,
                            PantoneColor = c.PantoneColor,
                            HexValue = c.HexValue
                        };

            return await query.ToListAsync();
        }

        [HttpPost]
        public async Task<bool> AddOrUpdateColor(Color? color)
        {
            if (color != null)
            {
                var existingColor = color.ColorId != 0
                    ? await _context.Colors.Where(x => x.ColorId == color.ColorId).FirstOrDefaultAsync()
                    : null;

                if (existingColor != null)
                {
                    existingColor.ColorName = color.ColorName;
                    existingColor.SeasonId = color.SeasonId;
                    existingColor.PantoneColor = color.PantoneColor;
                    existingColor.HexValue = color.HexValue;
                }
                else
                {
                    existingColor = new Color
                    {
                        ColorName = color.ColorName,
                        SeasonId = color.SeasonId,
                        PantoneColor = color.PantoneColor,
                        HexValue = color.HexValue
                    };
                    _context.Colors.Add(existingColor);
                }

                await _context.SaveChangesAsync();
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
