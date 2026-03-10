
using Microsoft.EntityFrameworkCore;
using MissIssippiAPI.Data;  // your context namespace

var builder = WebApplication.CreateBuilder(args);

// Allow local Production runs to use dotnet user-secrets for Azure SQL testing.
if (builder.Environment.IsProduction())
{
    builder.Configuration.AddUserSecrets<Program>(optional: true);
}

// Add services to the container.

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins",
        builder => builder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddControllers();
builder.Services.AddScoped<MissIssippiAPI.Services.InventoryService>();
builder.Services.AddScoped<MissIssippiAPI.Services.SkuService>();
builder.Services.AddScoped<MissIssippiAPI.Services.InventoryUploadService>();
builder.Services.AddScoped<MissIssippiAPI.Services.InventoryHistoryLogger>();

string? defaultConnection = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(defaultConnection))
{
    string message = builder.Environment.IsProduction()
        ? "DefaultConnection is not set. For local Azure testing run: dotnet user-secrets set 'ConnectionStrings:DefaultConnection' '...'"
        : "Connection string 'DefaultConnection' is not set. Configure ConnectionStrings:DefaultConnection in appsettings.Development.json or environment configuration.";

    Console.Error.WriteLine(message);
    throw new InvalidOperationException(message);
}

builder.Services.AddDbContext<MissIssippiContext>(options =>
    options.UseSqlServer(defaultConnection));

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
app.UseAuthorization();



app.MapControllers();
app.Run();

