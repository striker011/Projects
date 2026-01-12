using System.Text;
namespace MicroService;

public class KafkaProducerClient : IMessageProducer
{
    public Task PublishAsync(string topic, byte[] payload, CancellationToken ct)
    {
         Console.WriteLine($"[Kafka Producer] Topic: {topic}, Payload: {Encoding.UTF8.GetString(payload)}");
        return Task.CompletedTask;
    }
}