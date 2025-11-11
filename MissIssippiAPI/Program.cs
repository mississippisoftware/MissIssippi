
using Microsoft.EntityFrameworkCore;
using MissIssippiAPI.Data;  // your context namespace

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins",
        builder => builder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});
builder.Configuration.AddJsonFile("secret-appsettings.json", true, true);

builder.Services.AddControllers();



//string settingname = "Settings:liveconn";
//#if DEBUG
string settingname = "Settings:devconn-local";
//#endif
string? connstring = builder.Configuration[settingname];
if (connstring == null)
{
    throw new Exception(settingname + " connection string not found");
}


builder.Services.AddDbContext<MissIssippiContext>(options =>
    options.UseSqlServer(connstring));

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

