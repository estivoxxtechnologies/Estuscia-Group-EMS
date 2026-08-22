using Estuscia.Application.Common.Interfaces;
using Estuscia.Domain.Common;
using Estuscia.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Estuscia.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    private readonly ICurrentTenantService _tenantService;

    public AppDbContext(DbContextOptions<AppDbContext> options, ICurrentTenantService tenantService)
        : base(options)
    {
        _tenantService = tenantService;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<ApplicationUser> Users => Set<ApplicationUser>();
    public DbSet<DailyWorkLog> DailyWorkLogs => Set<DailyWorkLog>();
    public DbSet<CustomerReceipt> CustomerReceipts => Set<CustomerReceipt>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<InvestmentSlab> InvestmentSlabs => Set<InvestmentSlab>();
    public DbSet<KnowledgeVideo> KnowledgeVideos => Set<KnowledgeVideo>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Global Multi-Tenant Query Filter: Automatic isolation for all tenants
        modelBuilder.Entity<DailyWorkLog>()
            .HasQueryFilter(e => _tenantService.IsSuperAdmin || e.TenantId == _tenantService.TenantId);

        modelBuilder.Entity<CustomerReceipt>()
            .HasQueryFilter(e => _tenantService.IsSuperAdmin || e.TenantId == _tenantService.TenantId);

        modelBuilder.Entity<AttendanceRecord>()
            .HasQueryFilter(e => _tenantService.IsSuperAdmin || e.TenantId == _tenantService.TenantId);

        modelBuilder.Entity<ApplicationUser>()
            .HasQueryFilter(e => _tenantService.IsSuperAdmin || e.TenantId == _tenantService.TenantId);

        modelBuilder.Entity<InvestmentSlab>()
            .HasQueryFilter(e => _tenantService.IsSuperAdmin || e.TenantId == _tenantService.TenantId);

        modelBuilder.Entity<KnowledgeVideo>()
            .HasQueryFilter(e => _tenantService.IsSuperAdmin || e.TenantId == _tenantService.TenantId);

        // Indexes for high performance
        modelBuilder.Entity<DailyWorkLog>()
            .HasIndex(e => new { e.TenantId, e.BranchName, e.WorkDate });

        modelBuilder.Entity<CustomerReceipt>()
            .HasIndex(e => new { e.TenantId, e.ReceiptNumber }).IsUnique();

        modelBuilder.Entity<ApplicationUser>()
            .HasIndex(e => new { e.Email }).IsUnique();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<IMultiTenantEntity>())
        {
            if (entry.State == EntityState.Added && _tenantService.TenantId.HasValue)
            {
                if (entry.Entity.TenantId == Guid.Empty)
                {
                    entry.Entity.TenantId = _tenantService.TenantId.Value;
                }
            }
        }

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAtUtc = DateTime.UtcNow;
                if (_tenantService.UserId.HasValue)
                    entry.Entity.CreatedByUserId = _tenantService.UserId.Value.ToString();
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAtUtc = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
