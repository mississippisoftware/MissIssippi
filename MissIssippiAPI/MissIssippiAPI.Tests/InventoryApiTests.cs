using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using MissIssippiAPI.Dtos;
using MissIssippiAPI.Models;
using Xunit;

namespace MissIssippiAPI.Tests;

// NOTE: The CLAUDE.md §8 specifies a { success, data, error } response envelope, but the
// current controllers return raw values (List<T>, bool, or IActionResult).  Tests here
// assert on the actual HTTP contract rather than the aspirational envelope.  When the
// controllers are updated to match §8 the tests will need to change accordingly.

[Collection("InventoryApi")]
public class InventoryApiTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    // System.Text.Json default is case-sensitive; the API serialises with camelCase,
    // so we use PropertyNameCaseInsensitive throughout deserialization.
    private static readonly JsonSerializerOptions JsonOpts =
        new() { PropertyNameCaseInsensitive = true };

    public InventoryApiTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    // ─── 1. GET /api/Color/GetColors — returns 200 with a list ───────────────

    [Fact]
    public async Task GetColors_Returns200WithList()
    {
        var response = await _client.GetAsync("/api/Color/GetColors");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        var colors = JsonSerializer.Deserialize<List<ColorDto>>(body, JsonOpts);
        colors.Should().NotBeNull();
    }

    // ─── 2. POST /api/Color/AddOrUpdateColor — creates a color, returns 200/true ──

    [Fact]
    public async Task PostColor_CreatesColor_Returns200True()
    {
        var uniqueName = $"TEST-{Guid.NewGuid():N}";
        int? createdId = null;
        try
        {
            var payload = new { ColorId = 0, ColorName = uniqueName, SeasonId = (int?)null };
            var createResponse = await _client.PostAsJsonAsync("/api/Color/AddOrUpdateColor", payload);

            createResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            var result = await createResponse.Content.ReadFromJsonAsync<bool>(JsonOpts);
            result.Should().BeTrue();

            createdId = await FindColorIdByNameAsync(uniqueName);
            createdId.Should().NotBeNull("the newly created color should be retrievable");
        }
        finally
        {
            await CleanupColorAsync(createdId);
        }
    }

    // ─── 3. GET /api/Color/GetColors — newly created color appears in the list ──

    [Fact]
    public async Task GetColors_NewlyCreatedColorAppearsInList()
    {
        var uniqueName = $"TEST-{Guid.NewGuid():N}";
        int? createdId = null;
        try
        {
            var payload = new { ColorId = 0, ColorName = uniqueName, SeasonId = (int?)null };
            await _client.PostAsJsonAsync("/api/Color/AddOrUpdateColor", payload);

            var getResponse = await _client.GetAsync(
                $"/api/Color/GetColors?ColorName={Uri.EscapeDataString(uniqueName)}");

            getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            var colors = await getResponse.Content.ReadFromJsonAsync<List<ColorDto>>(JsonOpts);
            colors.Should().NotBeNull();
            colors!.Should().Contain(c => c.ColorName == uniqueName,
                "the color created moments ago should appear in the GET response");

            createdId = colors!.First(c => c.ColorName == uniqueName).ColorId;
        }
        finally
        {
            await CleanupColorAsync(createdId);
        }
    }

    // ─── 4. POST /api/Color/AddOrUpdateColor with duplicate name+season → 409 ──

    [Fact]
    public async Task PostColor_DuplicateNameAndSeason_Returns409()
    {
        var uniqueName = $"TEST-{Guid.NewGuid():N}";
        int? createdId = null;
        try
        {
            var payload = new { ColorId = 0, ColorName = uniqueName, SeasonId = (int?)null };

            // First create — must succeed
            var first = await _client.PostAsJsonAsync("/api/Color/AddOrUpdateColor", payload);
            first.StatusCode.Should().Be(HttpStatusCode.OK);
            createdId = await FindColorIdByNameAsync(uniqueName);

            // Second create with same name+season — must be rejected as duplicate
            var second = await _client.PostAsJsonAsync("/api/Color/AddOrUpdateColor", payload);
            second.StatusCode.Should().Be(HttpStatusCode.Conflict,
                "adding a color with an already-existing name and season should return 409");
        }
        finally
        {
            await CleanupColorAsync(createdId);
        }
    }

    // ─── 5. GET /api/Item/GetItem — returns 200 with a list ─────────────────

    [Fact]
    public async Task GetItems_Returns200WithList()
    {
        var response = await _client.GetAsync("/api/Item/GetItem");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var items = await response.Content.ReadFromJsonAsync<List<ItemReadDto>>(JsonOpts);
        items.Should().NotBeNull();
    }

    // ─── 6. POST /api/Item/AddOrUpdateItem — creates an item, returns 200/201 ──

    [Fact]
    public async Task PostItem_CreatesItem_Returns2xx()
    {
        // Resolve an existing season so the FK constraint is satisfied.
        var seasonId = await GetFirstSeasonIdAsync();
        seasonId.Should().BePositive("at least one season must exist on the staging DB");

        var uniqueDesc = $"TEST-ITEM-{Guid.NewGuid():N}";
        int? createdItemId = null;
        try
        {
            var payload = new
            {
                ItemId = 0,
                ItemNumber = "TST-TEST",
                Description = uniqueDesc,
                SeasonId = seasonId,
                InProduction = false,
                CostPrice = (decimal?)null,
                WholesalePrice = (decimal?)null,
                Weight = (decimal?)null,
            };

            var createResponse = await _client.PostAsJsonAsync("/api/Item/AddOrUpdateItem", payload);
            createResponse.IsSuccessStatusCode.Should().BeTrue(
                $"creating a valid item should succeed (got {(int)createResponse.StatusCode})");

            createdItemId = await FindItemIdByDescriptionAsync(uniqueDesc);
            createdItemId.Should().NotBeNull("the newly created item should be retrievable");
        }
        finally
        {
            await CleanupItemAsync(createdItemId);
        }
    }

    // ─── 7. GET /api/Season/GetSeasons — returns 200 with a list ────────────

    [Fact]
    public async Task GetSeasons_Returns200WithList()
    {
        var response = await _client.GetAsync("/api/Season/GetSeasons");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var seasons = await response.Content.ReadFromJsonAsync<List<Season>>(JsonOpts);
        seasons.Should().NotBeNull();
    }

    // ─── 8. GET /api/Sizes/GetSizes — returns 200 with a list ───────────────

    [Fact]
    public async Task GetSizes_Returns200WithList()
    {
        var response = await _client.GetAsync("/api/Sizes/GetSizes");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var sizes = await response.Content.ReadFromJsonAsync<List<Size>>(JsonOpts);
        sizes.Should().NotBeNull();
    }

    // ─── 9. GET /api/Inventory/GetInventory — returns 200 ───────────────────

    [Fact]
    public async Task GetInventory_Returns200()
    {
        var response = await _client.GetAsync("/api/Inventory/GetInventory");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var inventory = await response.Content.ReadFromJsonAsync<List<InventoryRowDto>>(JsonOpts);
        inventory.Should().NotBeNull();
    }

    // ─── 10. POST /api/InventoryUpload/UploadInventory with invalid JSON → 400 ──
    //
    // Sending syntactically malformed JSON triggers ASP.NET Core's automatic 400
    // response from [ApiController] model-binding, without needing any service logic.

    [Fact]
    public async Task PostInventoryUpload_MalformedPayload_Returns400()
    {
        var badJson = new StringContent("{invalid-json", Encoding.UTF8, "application/json");
        var response = await _client.PostAsync("/api/InventoryUpload/UploadInventory", badJson);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest,
            "malformed JSON should be rejected by model binding before reaching the service");
    }

    // ─── Helpers (API-only, no raw SQL) ─────────────────────────────────────

    private async Task<int?> FindColorIdByNameAsync(string name)
    {
        var resp = await _client.GetAsync(
            $"/api/Color/GetColors?ColorName={Uri.EscapeDataString(name)}");
        if (!resp.IsSuccessStatusCode) return null;
        var list = await resp.Content.ReadFromJsonAsync<List<ColorDto>>(JsonOpts);
        return list?.FirstOrDefault(c => c.ColorName == name)?.ColorId;
    }

    private async Task CleanupColorAsync(int? colorId)
    {
        if (colorId is null or 0) return;
        await _client.DeleteAsync($"/api/Color/DeleteColor?ColorId={colorId}");
    }

    private async Task<int> GetFirstSeasonIdAsync()
    {
        var resp = await _client.GetAsync("/api/Season/GetSeasons");
        var seasons = await resp.Content.ReadFromJsonAsync<List<Season>>(JsonOpts);
        return seasons?.FirstOrDefault()?.SeasonId ?? 0;
    }

    private async Task<int?> FindItemIdByDescriptionAsync(string description)
    {
        var resp = await _client.GetAsync(
            $"/api/Item/GetItem?Description={Uri.EscapeDataString(description)}");
        if (!resp.IsSuccessStatusCode) return null;
        var list = await resp.Content.ReadFromJsonAsync<List<ItemReadDto>>(JsonOpts);
        return list?.FirstOrDefault(i => i.Description == description)?.ItemId;
    }

    private async Task CleanupItemAsync(int? itemId)
    {
        if (itemId is null or 0) return;
        await _client.DeleteAsync($"/api/Item/DeleteItem?ItemId={itemId}");
    }
}
