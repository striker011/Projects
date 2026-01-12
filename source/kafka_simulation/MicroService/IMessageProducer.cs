namespace MicroService;
public interface IMessageProducer
{
    Task PublishAsync(string topic, byte[] payload, CancellationToken ct);
}