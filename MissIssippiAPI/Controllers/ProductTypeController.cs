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
    public class ProductTypeController : ControllerBase
    {
        private readonly MissIssippiContext _context;

        public ProductTypeController(MissIssippiContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<List<ProductType>> GetProductTypes(int? ProductTypeId = null, string? ProductTypeName = null)
        {
            var query = from p in _context.ProductTypes
                        .Where(x =>
                                (x.ProductTypeId == ProductTypeId || ProductTypeId == null)
                                && (x.ProductTypeName.Contains(ProductTypeName) || ProductTypeName == null)
                                )
                        select new ProductType
                        {
                            ProductTypeId = p.ProductTypeId,
                            ProductTypeName = p.ProductTypeName,
                        };

            return await query.ToListAsync();
        }

        [HttpPost]
        public async Task<bool> AddOrUpdateProductType(ProductType? productType)
        {
            if (productType != null)
            {
                var existingProductType = await _context.ProductTypes.Where(x => x.ProductTypeId == productType.ProductTypeId).FirstOrDefaultAsync();

                if (existingProductType != null)
                {
                    existingProductType.ProductTypeName = productType.ProductTypeName;

                }

                if (existingProductType == null)
                {
                    existingProductType.ProductTypeName = productType.ProductTypeName;
                    _context.AddAsync(existingProductType);

                }
                _context.SaveChangesAsync();
                return true;
            }
            return false;
        }

        [HttpDelete]
        public async Task<bool> DeleteProductType(int ProductTypeId)
        {
            var existingProductType = await _context.ProductTypes.FindAsync(ProductTypeId);
            if (existingProductType != null)
            {
                _context.ProductTypes.Remove(existingProductType);
                await _context.SaveChangesAsync();
            }

            return true;
        }

    }
}
