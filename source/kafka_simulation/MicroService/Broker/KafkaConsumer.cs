using System.Text;

namespace MicroService;

public class KafkaConsumerClient : IMessageConsumer
{
    public async Task SubscribeAsync(
        string topic,
        Func<byte[], Task> onMessage,
        CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            // Simulierte Kafka Message
            var payload = Encoding.UTF8.GetBytes("hello from kafka");

            Console.WriteLine($"[Kafka Consumer] Message received on topic: {topic}");
            await onMessage(payload);

            await Task.Delay(2000, ct);
        }
    }
}
