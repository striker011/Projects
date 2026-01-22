using MicroService;
namespace Simulation;


public class SimulationConfig
{
    int numberOfWorker;
    public int Leicht,Mittel,Schwer;
    int MinDelay,MaxDelay;
    int Seed;

    SimulationConfig()
    {
        
    }
}

public class Simulation
{
    SimulationConfig _simulationConfig;

    Simulation()
    {
        
    }
    Simulation(SimulationConfig simulationConfig)
    {
        this._simulationConfig = simulationConfig;
    }

    public void Run()
    {
        
        {
            //Create N IoT-Devices
            //Load the PayloadType into them 
            //Provide CancelToken
            //Start Loop
        }
    }
    
}

public class SimulationLogger
{
    public enum Metric
    {
        Throughput,
        Latency    
    }    

    SimulationLogger()
    {
        //faggot
    }
}