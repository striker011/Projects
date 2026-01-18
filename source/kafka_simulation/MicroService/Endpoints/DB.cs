namespace MicroService;

public class DB : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    public IEnumerable<IMessageConsumer> _messageConsumers;

    public DB(ILogger<Worker> logger, IEnumerable<IMessageConsumer> messageConsumers)
    {
        _logger = logger;
        _messageConsumers  = messageConsumers;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("DB running at: {time}", DateTimeOffset.Now);
            }
            await Task.Delay(1000, stoppingToken);
        }
    }
}
