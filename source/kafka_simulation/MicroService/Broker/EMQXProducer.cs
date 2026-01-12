using System.Text;
namespace MicroService;

public class EmqxProducerClient : IMessageProducer
{
    public Task PublishAsync(string topic, byte[] payload, CancellationToken ct)
    {
        Console.WriteLine($"[EMQX Producer] Topic: {topic}, Payload: {Encoding.UTF8.GetString(payload)}");
        return Task.CompletedTask;
    }
}