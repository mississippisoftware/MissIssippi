using Microsoft.AspNetCore.Mvc;
using MissIssippiAPI.Data;
using MissIssippiAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace MissIssippiAPI.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class InventoryPageController : ControllerBase
    {
        private readonly MissIssippiContext _context;

        public InventoryPageController(MissIssippiContext context)
        {
            _context = context;
        }

        // GET: Fetch inventory grouped by style/color for your page
        [HttpGet]
        public async Task<IActionResult> GetPageInventory()
        {
            var inventory = await _context.InventoryViews
                .OrderBy(i => i.StyleNumber)
                .ThenBy(i => i.ColorName)
                .ToListAsync();

            // Group by StyleNumber + ColorName
            var grouped = inventory
                .GroupBy(i => new { i.StyleNumber, i.ColorName })
                .Select(g => new
                {
                    g.Key.StyleNumber,
                    g.Key.ColorName,
                    StyleId = g.First().StyleId,
                    ColorId = g.First().ColorId,
                    StyleColorId = g.First().StyleColorId,
                    SeasonName = g.First().SeasonName,
                    // Group sizes safely to avoid duplicate keys
                    Sizes = g
                        .GroupBy(x => x.SizeName)
                        .ToDictionary(
                            x => x.Key,
                            x => new
                            {
                                x.First().Qty,
                                x.First().InventoryId,
                                x.First().SizeId
                            }
                        )
                });

            return Ok(grouped);
        }

        // POST: Save inventory updates from the page
        [HttpPost]
        public async Task<IActionResult> SavePageInventory([FromBody] List<InventoryView> updates)
        {
            if (updates == null || !updates.Any())
                return BadRequest("No updates provided");

            foreach (var update in updates)
            {
                var existing = await _context.Inventories
                    .FirstOrDefaultAsync(x => x.InventoryId == update.InventoryId);

                if (existing != null)
                {
                    // Update existing inventory
                    existing.Qty = update.Qty;
                    existing.SizeId = update.SizeId;
                    existing.StyleColorId = update.StyleColorId;
                }
                else
                {
                    // Insert new inventory row
                    _context.Inventories.Add(new Inventory
                    {
                        Qty = update.Qty,
                        SizeId = update.SizeId,
                        StyleColorId = update.StyleColorId
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(true);
        }

        // Optional: Delete inventory row by ID
        [HttpDelete("{inventoryId}")]
        public async Task<IActionResult> DeletePageInventory(int inventoryId)
        {
            var existing = await _context.Inventories.FindAsync(inventoryId);
            if (existing != null)
            {
                _context.Inventories.Remove(existing);
                await _context.SaveChangesAsync();
            }

            return Ok(true);
        }
    }
}