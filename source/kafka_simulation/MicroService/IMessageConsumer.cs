namespace MicroService;

public interface IMessageConsumer
{
    Task SubscribeAsync(
        string topic,
        Func<byte[], Task> onMessage,
        CancellationToken ct);
}