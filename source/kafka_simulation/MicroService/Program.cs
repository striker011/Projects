using MicroService;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddHostedService<Consumer>();
builder.Services.AddHostedService<Producer>();
builder.Services.AddHostedService<MLServer>();
builder.Services.AddHostedService<Fileserver>();
builder.Services.AddHostedService<DB>();

var host = builder.Build();
host.Run();
