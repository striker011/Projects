using System.Text;
namespace MicroService;

public class Producer : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IMessageProducer _producer;

    public Producer(ILogger<Worker> logger, IMessageProducer producer)
    {
        _logger = logger;
        _producer = producer;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {

                await _producer.PublishAsync(
                "test-topic",
                Encoding.UTF8.GetBytes("hello"),
                stoppingToken);

            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("Producer running at: {time}", DateTimeOffset.Now);
            }
            await Task.Delay(1000, stoppingToken);
        }
    }
}
