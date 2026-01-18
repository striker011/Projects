using System.Drawing;
using System.Reflection.Metadata;

namespace MicroService;

public class MLServer : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    Server _server;

    public MLServer(ILogger<Worker> logger, Server server)
    {
        _logger = logger;
        this._server = new Server();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {

            await this._server.Run(stoppingToken);

            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("MLServer running at: {time}", DateTimeOffset.Now);
            }
            await Task.Delay(1000, stoppingToken);
        }
    }
}

public class Server : MicroService.IEndpoint
{
    private const int SIZE = 1024;
    private const int BUFFER = 512;
    byte[] storage,buffer;
    Queue<byte> Queue;
    public Server()
    {
        storage = new byte[SIZE];
        buffer = new byte[BUFFER];
        Queue = new Queue<byte>();
    }

    public void write(byte[] information, int size)
    {
        if (size > BUFFER)
        {
            writeStorageChunkes(information, size);
        }
        else
        {
            writeStorageOnce(information,size);
        }
    }
    private void writeStorageOnce(byte[] information, int size)
    {
        //copty buffer into storage
        //check if starting from 0 or not
        //raise flag or so
    }

    private void writeStorageChunkes(byte[] information, int size)
    {
        /*
        int startVariable = 0;
        int endVariable = BUFFER;
        int incrementalAddonForEveryNewLoop = BUFFER;
        int counter = startVariable;
        int counterBuffer = 0;
        bool loopControl = true;
        bool terminationToken = false;
        
        while(loopControl)
        {
            //Loop 1 - N
            while(counter < endVariable)
            {
                byte temp = information[counter];
                buffer[counterBuffer] = temp;
                counter++;
                counterBuffer++;
            }

            //Check for next Loop
            if (terminationToken)
            {
                loopControl = false;
            }
            else
            {
                counterBuffer=0;
                startVariable += incrementalAddonForEveryNewLoop;
                endVariable += incrementalAddonForEveryNewLoop;
                if(endVariable > size)
                {
                    endVariable = size;
                    terminationToken = true;
                }
            }
        }
    */
    }
    private static void DoNothing() { }
    public Task Run(CancellationToken stoppingToken)
    {
        Task task = new Task((Action)(() => DoNothing()),stoppingToken);
        return task;
    }
}
