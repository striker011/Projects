using MicroService;

var builder = Host.CreateApplicationBuilder(args);

//works
/*
builder.Services.AddHostedService<MLServer>();
builder.Services.AddHostedService<Fileserver>();
builder.Services.AddHostedService<DB>();



//alles ROTZE!!!!!!!!!!!!!, muss entweder Transient sein oder ein Manager der Threads hosted
builder.Services.AddSingleton<IMessageProducer, KafkaProducerClient>();


builder.Services.AddSingleton<IMessageProducer, EmqxProducerClient>();
builder.Services.AddSingleton<IMessageConsumer, EmqxConsumerClient>();

builder.Services.AddSingleton<IMessageProducer, KafkaProducerClient>();
builder.Services.AddSingleton<IMessageConsumer, KafkaConsumerClient>();
*/



var host = builder.Build();
host.Run();
