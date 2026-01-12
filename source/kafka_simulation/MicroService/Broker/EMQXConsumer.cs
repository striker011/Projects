using System.Text;

namespace MicroService;

public class EmqxConsumerClient : IMessageConsumer
{
    public async Task SubscribeAsync(
        string topic,
        Func<byte[], Task> onMessage,
        CancellationToken ct)
    {
        // Simulation eines Message-Eingangs
        while (!ct.IsCancellationRequested)
        {
            var payload = Encoding.UTF8.GetBytes("hello from EMQX consumer");

            Console.WriteLine($"[EMQX Consumer] Message received on topic: {topic}");
            await onMessage(payload);

            await Task.Delay(2000, ct);
        }
    }
}
