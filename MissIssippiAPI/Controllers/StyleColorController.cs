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
    public class StyleColorController : ControllerBase
    {
        private readonly MissIssippiContext _context;

        public StyleColorController(MissIssippiContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<List<StyleColorView>> GetStyle(int? StyleId = null, string? StyleNumber = null, string? SeasonName = null, int? StyleColorId = null, int? ColorId = null, int? SeasonId = null)
        {
            var query = from s in _context.StyleColorViews
                        .Where(x =>
                                (x.StyleId == StyleId || StyleId == null)
                                && (x.StyleNumber.Contains(StyleNumber) || StyleNumber == null)
                                && (x.SeasonName.Contains(SeasonName) || SeasonName == null)
                                && (x.StyleColorId == StyleColorId || StyleColorId == null)
                                && (x.ColorId == ColorId || ColorId == null)
                                && (x.SeasonId == SeasonId || SeasonId == null)
                                )
                        select new StyleColorView
                        {
                            StyleNumber = s.StyleNumber,
                            ColorName = s.ColorName,
                            SeasonName = s.SeasonName,
                            StyleColorId = s.StyleColorId,
                            ColorId = s.ColorId,
                            StyleId = s.StyleId,
                            SeasonId = s.SeasonId,
                        };

            return await query.ToListAsync();
        }

        [HttpPost]
        public async Task<bool> AddOrUpdateStyleColor(StyleColorView? Style)
        {
            if (Style != null)
            {
                var existingStyleColor = await _context.StyleColors.Where(x => x.StyleColorId == Style.StyleColorId).FirstOrDefaultAsync();

                if (existingStyleColor != null)
                {
                    existingStyleColor.StyleId = Style.StyleId;
                    existingStyleColor.ColorId = Style.ColorId;

                }

                if (existingStyleColor == null)
                {
                    existingStyleColor.StyleId = Style.StyleId;
                    existingStyleColor.ColorId = Style.ColorId;

                }
                _context.SaveChangesAsync();
                return true;
            }
            return false;
        }

        [HttpDelete]
        public async Task<bool> DeleteStyleColor(int StyleColorId)
        {
            var existingStyleColor = await _context.StyleColors.FindAsync(StyleColorId);
            if (existingStyleColor != null)
            {
                _context.StyleColors.Remove(existingStyleColor);
                await _context.SaveChangesAsync();
            }

            return true;
        }

    }
}
