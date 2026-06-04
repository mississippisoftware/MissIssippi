
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MissIssippiAPI.Data;
using MissIssippiAPI.Models;
using MissIssippiAPI.Services;
using MissIssippiAPI.Services.AI;

var builder = WebApplication.CreateBuilder(args);

// Allow local Production runs to use dotnet user-secrets for Azure SQL testing.
if (builder.Environment.IsProduction())
{
    builder.Configuration.AddUserSecrets<Program>(optional: true);
}

// ASP.NET Core Identity (user store + password management)
builder.Services.AddIdentity<User, IdentityRole>()
    .AddEntityFrameworkStores<MissIssippiContext>()
    .AddDefaultTokenProviders();

// JWT Bearer auth — override Identity's default cookie scheme
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
        RoleClaimType = "role",
        NameClaimType = "name",
    };
});

// Add services to the container.

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins",
        policy => policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyMethod()
            .AllowAnyHeader());
});

builder.Services.AddControllers(opts =>
    opts.Filters.Add(new AuthorizeFilter(
        new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build())));

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<InventoryService>();
builder.Services.AddScoped<SkuService>();
builder.Services.AddScoped<InventoryUploadService>();
builder.Services.AddScoped<InventoryHistoryLogger>();

// AI layer — provider selected by Ai:Provider in configuration
// "Mock" (default): no API key required, keyword-based routing for testing
// Future: "Anthropic" — requires Ai:ApiKey and the Anthropic.SDK package
var aiProvider = builder.Configuration["Ai:Provider"] ?? "Mock";
if (aiProvider.Equals("Anthropic", StringComparison.OrdinalIgnoreCase))
{
    // Placeholder: AnthropicAiChatService not yet implemented
    // builder.Services.AddScoped<IAiChatService, AnthropicAiChatService>();
    throw new InvalidOperationException(
        "Anthropic provider is not yet implemented. Set Ai:Provider to 'Mock' in appsettings.");
}
else
{
    builder.Services.AddScoped<IAiChatService, MockAiChatService>();
}
builder.Services.AddScoped<InventoryAiService>();

string? defaultConnection =
    Environment.GetEnvironmentVariable("TEST_DB_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(defaultConnection))
{
    string message = builder.Environment.IsProduction()
        ? "DefaultConnection is not set. For local Azure testing run: dotnet user-secrets set 'ConnectionStrings:DefaultConnection' '...'"
        : "Connection string 'DefaultConnection' is not set. Configure ConnectionStrings:DefaultConnection in appsettings.Development.json or environment configuration.";

    Console.Error.WriteLine(message);
    throw new InvalidOperationException(message);
}

builder.Services.AddDbContext<MissIssippiContext>(options =>
    options.UseSqlServer(defaultConnection)
           .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
//if (app.Environment.IsDevelopment())
//{
    app.UseSwagger();
    app.UseSwaggerUI();
//}

app.UseHttpsRedirection();
app.UseCors("AllowAllOrigins");
app.UseAuthentication();
app.UseAuthorization();



app.MapControllers();
app.Run();

// Expose the implicit Program class so WebApplicationFactory<Program> can reference it.
public partial class Program { }
