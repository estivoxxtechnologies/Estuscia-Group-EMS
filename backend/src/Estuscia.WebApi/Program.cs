using System.Text;
using Estuscia.Application.Common.Interfaces;
using Estuscia.Infrastructure.Persistence;
using Estuscia.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// DbContext & Tenant Scoping
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection") ?? 
        "Host=localhost;Port=5432;Database=estuscia_ems;Username=postgres;Password=postgres"));

builder.Services.AddScoped<IAppDbContext>(p => p.GetRequiredService<AppDbContext>());
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentTenantService, CurrentTenantService>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

// JWT Authentication
var secret = builder.Configuration["Jwt:Secret"] ?? "EstusciaSecretKey_MustBeLongerThan32CharsRequiredForJwt!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

// CORS for Vite React frontend
builder.Services.AddCors(opt => opt.AddPolicy("AllowFrontend", policy =>
    policy.WithOrigins("http://localhost:3000", "https://*.run.app")
          .AllowAnyHeader()
          .AllowAnyMethod()
          .AllowCredentials()));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
