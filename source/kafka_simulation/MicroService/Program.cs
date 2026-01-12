using MicroService;

var builder = Host.CreateApplicationBuilder(args);

//works
/*
builder.Services.AddHostedService<Consumer>();
builder.Services.AddHostedService<Producer>();
builder.Services.AddHostedService<MLServer>();
builder.Services.AddHostedService<Fileserver>();
builder.Services.AddHostedService<DB>();
builder.Services.AddSingleton<IMessageProducer, KafkaProducerClient>();


builder.Services.AddSingleton<IMessageProducer, EmqxProducerClient>();
builder.Services.AddSingleton<IMessageConsumer, EmqxConsumerClient>();

builder.Services.AddSingleton<IMessageProducer, KafkaProducerClient>();
builder.Services.AddSingleton<IMessageConsumer, KafkaConsumerClient>();
*/



var host = builder.Build();
host.Run();
