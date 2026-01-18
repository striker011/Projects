namespace MicroService;
public interface IMessageProducer
{
    public Task PublishAsync(string topic, byte[] payload, CancellationToken ct);
}