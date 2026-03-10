using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using MissIssippiAPI.Data;
using MissIssippiAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace MissIssippiAPI.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class SeasonController : ControllerBase
    {
        private readonly MissIssippiContext _context;

        public SeasonController(MissIssippiContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<List<Season>> GetSeasons(int? SeasonId = null, string? SeasonName = null, bool? Active = null)
        {
            var query = from s in _context.Seasons
                        .Where(x =>
                                (x.SeasonId == SeasonId || SeasonId == null)
                                && (x.SeasonName.Contains(SeasonName) || SeasonName == null)
                                 && (x.Active == Active || Active == null)
                                )
                        select new Season
                        {
                            SeasonId = s.SeasonId,
                            SeasonName = s.SeasonName,
                            SeasonDateCreated = s.SeasonDateCreated,
                            Active = s.Active
                        };

            return await query.ToListAsync();
        }

        [HttpPost]
        public async Task<IActionResult> AddOrUpdateSeason(Season? season)
        {
            if (season == null || string.IsNullOrWhiteSpace(season.SeasonName))
            {
                return Ok(false);
            }

            var normalizedName = season.SeasonName.Trim();
            var hasDuplicate = await _context.Seasons
                .AnyAsync(x => x.SeasonId != season.SeasonId && x.SeasonName == normalizedName);

            if (hasDuplicate)
            {
                return Conflict($"Season '{normalizedName}' already exists.");
            }

            var existingSeason = await _context.Seasons.Where(x => x.SeasonId == season.SeasonId).FirstOrDefaultAsync();

            if (existingSeason != null)
            {
                existingSeason.SeasonName = normalizedName;
                existingSeason.Active = season.Active ?? false;
            }
            else
            {
                existingSeason = new Season
                {
                    SeasonName = normalizedName,
                    SeasonDateCreated = DateTime.UtcNow,
                    Active = season.Active ?? false
                };
                _context.Seasons.Add(existingSeason);
            }

            try
            {
                await _context.SaveChangesAsync();
                return Ok(true);
            }
            catch (DbUpdateException)
            {
                return Conflict($"Season '{normalizedName}' already exists.");
            }
        }

        [HttpDelete]
        public async Task<bool> DeleteSeason(int SeasonId)
        {
            var existingSeason = await _context.Seasons.FindAsync(SeasonId);
            if (existingSeason != null)
            {
                _context.Seasons.Remove(existingSeason);
                await _context.SaveChangesAsync();
            }

            return true;
        }

    }
}
