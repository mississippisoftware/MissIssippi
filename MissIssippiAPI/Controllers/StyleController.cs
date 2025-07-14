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
    public class StyleController : ControllerBase
    {
        private readonly MissIssippiContext _context;

        public StyleController(MissIssippiContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<List<StyleView>> GetStyle(int? StyleId = null, string? StyleNumber = null, string? Description = null, string? ProductTypeName = null, string? SeasonName = null, bool? InProduction = null)
        {
            var query = from s in _context.StyleViews
                        .Where(x =>
                                (x.StyleId == StyleId || StyleId == null)
                                && (x.StyleNumber.Contains(StyleNumber) || StyleNumber == null)
                                && (x.Description.Contains(Description) || Description == null)
                                && (x.ProductTypeName.Contains(ProductTypeName) || ProductTypeName == null)
                                && (x.SeasonName.Contains(SeasonName) || SeasonName == null)
                                && (x.InProduction == InProduction || InProduction == null)
                                )
                        select new StyleView
                        {
                            StyleNumber = s.StyleNumber,
                            Description = s.Description,
                            ProductTypeName = s.ProductTypeName,
                            CostPrice = s.CostPrice,
                            WholesalePrice = s.WholesalePrice,
                            Weight = s.Weight,
                            SeasonName = s.SeasonName,
                            SeasonDateCreated = s.SeasonDateCreated,
                            SeasonActive = s.SeasonActive,
                            StyleDateCreated = s.StyleDateCreated,
                            InProduction = s.InProduction,
                            StyleId = s.StyleId,
                            ProductTypeId = s.ProductTypeId,
                            SeasonId = s.SeasonId,
                        };

            return await query.ToListAsync();
        }

        [HttpPost]
        public async Task<bool> AddOrUpdateStyle(StyleView? Style)
        {
            if (Style != null)
            {
                var existingStyle = await _context.Styles.Where(x => x.StyleId == Style.StyleId).FirstOrDefaultAsync();

                if (existingStyle != null)
                {
                    existingStyle.StyleNumber = Style.StyleNumber;
                    existingStyle.Description = Style.Description;
                    existingStyle.ProductTypeId = Style.ProductTypeId;
                    existingStyle.CostPrice = Style.CostPrice;
                    existingStyle.WholesalePrice = Style.WholesalePrice;
                    existingStyle.Weight = Style.Weight;
                    existingStyle.SeasonId = Style.SeasonId;
                    existingStyle.InProduction = Style.InProduction;

                }

                if (existingStyle == null)
                {
                    existingStyle.StyleNumber = Style.StyleNumber;
                    existingStyle.Description = Style.Description;
                    existingStyle.ProductTypeId = Style.ProductTypeId;
                    existingStyle.CostPrice = Style.CostPrice;
                    existingStyle.WholesalePrice = Style.WholesalePrice;
                    existingStyle.Weight = Style.Weight;
                    existingStyle.SeasonId = Style.SeasonId;
                    existingStyle.StyleDateCreated = DateTime.Now;
                    existingStyle.InProduction = Style.InProduction;
                    _context.AddAsync(existingStyle);

                }
                _context.SaveChangesAsync();
                return true;
            }
            return false;
        }

        [HttpDelete]
        public async Task<bool> DeleteStyle(int StyleId)
        {
            var existingStyle = await _context.Styles.FindAsync(StyleId);
            if (existingStyle != null)
            {
                _context.Styles.Remove(existingStyle);
                await _context.SaveChangesAsync();
            }

            return true;
        }

    }
}
