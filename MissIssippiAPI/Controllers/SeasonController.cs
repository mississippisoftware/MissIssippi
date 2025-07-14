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
        public async Task<bool> AddOrUpdateSeason(Season? season)
        {
            if (season != null)
            {
                var existingSeason = await _context.Seasons.Where(x => x.SeasonId == season.SeasonId).FirstOrDefaultAsync();

                if (existingSeason != null)
                {
                    existingSeason.SeasonName = season.SeasonName;
                    existingSeason.Active = season.Active;

                }

                if (existingSeason == null)
                {
                    existingSeason.SeasonName = season.SeasonName;
                    existingSeason.SeasonDateCreated = DateTime.Now;
                    existingSeason.Active = season.Active == null ? false : true;
                    _context.AddAsync(existingSeason);

                }
                _context.SaveChangesAsync();
                return true;
            }
            return false;
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
