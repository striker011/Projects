namespace MicroService;

public class IoTDevice : BackgroundService
{
    private readonly ILogger<Worker> _logger;


    Device _device;

    public IoTDevice(ILogger<Worker> logger, Device device)
    {
        _logger = logger;
        _device = device;

    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            
            

            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("Fileserver running at: {time}", DateTimeOffset.Now);
            }
            await Task.Delay(1000, stoppingToken);
        }
    }

    public class Device
    {
        public Device()
        {
            //kall kafka
        }
    }
}
