using System.Text;
namespace MicroService;

public class Consumer : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IMessageConsumer _consumer;

    public Consumer(ILogger<Worker> logger, IMessageConsumer consumer)
    {
        _logger = logger;
        _consumer = consumer;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {

            await _consumer.SubscribeAsync(
                "test-topic",
                async payload =>
                {
                    var message = Encoding.UTF8.GetString(payload);
                    _logger.LogInformation("Consumed message: {message}", message);
                    await Task.CompletedTask;
                },
                stoppingToken
            );

            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("Consumer running at: {time}", DateTimeOffset.Now);
            }
            await Task.Delay(1000, stoppingToken);
        }
    }
}
