namespace MicroService;

public interface IEndpoint
{
    public Task Run(CancellationToken stoppingToken);
}