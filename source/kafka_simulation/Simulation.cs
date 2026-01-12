using MicroService;
namespace Simulation;

public enum CancelToken
{
    Time,
    Bytes
}

public class SimulationCancelToken
{
    int _TimeInSeconds=10;
    int _AmountOfBytes=1024;

    public bool _TimeToken=false,_ByteToken=false;
    public bool _loop_Token=false;

    SimulationCancelToken(CancelToken Token,int Variable)
    {
        switch (Token)
        {
            case CancelToken.Time: _TimeToken=true; _TimeInSeconds = Variable;break;
            case CancelToken.Bytes: _ByteToken=true; _AmountOfBytes = Variable;break;
        }
        _loop_Token = true;
    }


}

public class SimulationData
{    
    int _numberOfIOTDevices;
    MicroService.PayloadType _payloadType;
    SimulationData(int numberOfIOTDevices, MicroService.PayloadType payloadType)
    {
        this._numberOfIOTDevices = numberOfIOTDevices;
        this._payloadType = payloadType;
    }
}

public class Simulation
{
    IEnumerable<SimulationData> _simulationDatas;
    SimulationCancelToken _simulationCancelToken;

    Simulation()
    {
        
    }
    Simulation(IEnumerable<SimulationData> simulationDatas, SimulationCancelToken simulationCancelToken)
    {
        this._simulationDatas = simulationDatas;
        this._simulationCancelToken = simulationCancelToken;
    }

    public void Run()
    {
        foreach(SimulationData data in _simulationDatas)
        {
            //Create N IoT-Devices
            //Load the PayloadType into them 
            //Provide CancelToken
            //Start Loop
        }
    }
    
}