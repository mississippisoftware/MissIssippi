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
    public class InventoryController : ControllerBase
    {
        private readonly MissIssippiContext _context;

        public InventoryController(MissIssippiContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<List<InventoryView>> GetInventory(string? StyleNumber = null,
                                                            string? Description = null,
                                                            string? ColorName = null,
                                                            string? SizeName = null,
                                                            string? SeasonName = null,
                                                            int? InventoryId = null,
                                                            int? StyleColorId = null,
                                                            int? StyleId = null, 
                                                            int? ColorId = null, 
                                                            int? SizeId = null,
                                                            int? SeasonId = null)
        {
            var query = from i in _context.InventoryViews
                        .Where(x =>
                                
                                (x.StyleNumber.Contains(StyleNumber) || StyleNumber == null)
                                && (x.Description.Contains(Description) || Description == null)
                                && (x.ColorName.Contains(ColorName) || ColorName == null)
                                && (x.SizeName.Contains(SizeName) || SizeName == null)
                                && (x.SeasonName.Contains(SeasonName) || SeasonName == null)
                                && (x.InventoryId == InventoryId || InventoryId == null)
                                && (x.StyleId == StyleId || StyleId == null)
                                && (x.StyleColorId == StyleColorId || StyleColorId == null)
                                && (x.ColorId == ColorId || ColorId == null)
                                && (x.SizeId == SizeId || SizeId == null)
                                && (x.SeasonId == SeasonId || SeasonId == null)
                                )
                        select new InventoryView
                        {
                            StyleNumber = i.StyleNumber,
                            Description = i.Description,
                            ColorName = i.ColorName,
                            SizeName = i.SizeName,
                            Qty = i.Qty,
                            SeasonName = i.SeasonName,
                            InventoryId = i.InventoryId,
                            StyleColorId = i.StyleColorId,
                            StyleId = i.StyleId,
                            ColorId = i.ColorId,
                            SizeId = i.SizeId,
                            SeasonId = i.SeasonId,
                        };

            return await query.ToListAsync();
        }

        [HttpPost]
        public async Task<bool> AddOrUpdateInventory(InventoryView? Inventory)
        {
            if (Inventory != null)
            {
                var existingInventory = await _context.Inventories.Where(x => x.InventoryId == Inventory.InventoryId).FirstOrDefaultAsync();

                if (existingInventory != null)
                {
                    existingInventory.InventoryId = Inventory.InventoryId;
                    existingInventory.StyleColorId = Inventory.StyleColorId;
                    existingInventory.SizeId = Inventory.SizeId;
                    existingInventory.Qty = Inventory.Qty;
                }

                if (existingInventory == null)
                {
                    //existingInventory.InventoryId = Inventory.InventoryId;
                    //existingInventory.StyleColorId = Inventory.StyleColorId;
                    //existingInventory.SizeId = Inventory.SizeId;
                    //existingInventory.Qty = Inventory.Qty;
                    var newInventory = new Inventory
                    {
                        StyleColorId = Inventory.StyleColorId,
                        SizeId = Inventory.SizeId,
                        Qty = Inventory.Qty
                    };
                    _context.Inventories.Add(newInventory);
                }
                await _context.SaveChangesAsync();
                return true;
            }
            return false;
        }

        [HttpDelete]
        public async Task<bool> DeleteInventory(int InventoryId)
        {
            var existingInventory = await _context.Inventories.FindAsync(InventoryId);
            if (existingInventory != null)
            {
                _context.Inventories.Remove(existingInventory);
                await _context.SaveChangesAsync();
            }
            return true;
        }

    }
}
