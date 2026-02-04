// Low_Latency_Market_Data_Pipeline.cpp: Definiert den Einstiegspunkt für die Anwendung.
//

#include "Low_Latency_Market_Data_Pipeline.h"

static std::ostringstream captured;
static std::streambuf* oldBuf = NULL;

using namespace std;

struct signal {
	int id;
	float value;
	int second;
};

struct signal_small {
	float value;
	int second;
};

std::ostream& operator<<(std::ostream& os, const signal& p) {
	os << "ID: " << p.id << ", Value: " << p.value << ", Second: "<< p.second;
	return os;
}

class Generator {
public:
	static constexpr size_t CAPACITY = 128;

	Generator()
	{
		index = 0;
		counter = 0;
		memset((void*)buffer, 0, CAPACITY);
	}

	// Returns pointer to a valid signal inside the buffer
	const signal* generateSignal() {
		signal& s = buffer[index];

		s.id = counter++;
		s.value = static_cast<float>(s.id) * 0.5f;
		s.second = s.id % 60;

		index = (index + 1) % CAPACITY;
		return &s;
	}

private:
	signal buffer[CAPACITY];
	size_t index;
	int counter;
};

class RingBuffer {
	public:

		RingBuffer() {
			writeIndex = 0;
			readIndex = 0;
			memset((void*)buffer, 0, M);
			cout << "RingBuffer is active." << endl;
		}
			
		int write(int value) {
			if ((writeIndex+1)%M == readIndex) {
				//skip
				return 0;
			}
			else {
				buffer[writeIndex] = value;
				writeIndex = (writeIndex + 1) % M;
				return 1;
			}
		}

		int read(int* value) {
			if (readIndex== writeIndex) {
				//skip
				return 0;
			}
			else {
				*value =  buffer[readIndex];
				readIndex = (readIndex + 1) % M;
				return 1;
			}
		}

		void toString() {
			cout << "WriteIndex = " << writeIndex << "---" << "ReadIndex = "<< readIndex<< endl;
		}

	private:
		static int const N = 10;
		static int const M = N - 1;
		int buffer[M];
		int writeIndex, readIndex;
};

class SignalRingBuffer {
public:

	static constexpr size_t CAPACITY_TOTAL = 128;
	static constexpr size_t CAPACITY = 127;
	signal buffer[CAPACITY_TOTAL];
	int writeIndex, readIndex;

	SignalRingBuffer() {
		memset((void*)buffer, 0, CAPACITY);
		writeIndex = 0;
		readIndex = 0;
		cout << "SignalRingBuffer is active." << endl;
	}

	int write(signal value) {
		if (((writeIndex + 1) % (CAPACITY)) == readIndex){
			return 0;
		}
		else {
			buffer[writeIndex] = value;
			writeIndex = (writeIndex + 1) % CAPACITY;
			return 1;
		}
	}

	int read(signal* &ptr) {
		if (readIndex == writeIndex) {
			return 0;
		}
		else {
			ptr = &buffer[readIndex];
			readIndex = (readIndex + 1) % CAPACITY;
			return 1;
		}
	}

private:

};

class SignalRingBuffer_Overwrite {

public:
	static constexpr size_t CAPACITY = 128;
	bool readerOverflowBehind;

	SignalRingBuffer_Overwrite() {
		memset((void*)buffer, 0, CAPACITY);
		writeIndex = 0;
		readIndex = 0;
		cout << "SignalRingBuffer is active." << endl;
		readerOverflowBehind = false;
	}

	int write(signal value) {
		buffer[writeIndex] = value;
		writeIndex = (writeIndex + 1) % CAPACITY;
		return 1;
	}

	int read(signal*& ptr) {

		ptr = &buffer[readIndex];
		readIndex = (readIndex + 1) % CAPACITY;
		return 1;
	}

private:
	signal buffer[CAPACITY];
	int writeIndex, readIndex;
};

class Sink {
public:
	SignalRingBuffer storage;
	Sink() {
		storage = SignalRingBuffer();
	}

	void write(signal &data){
		storage.write(data);
	}

	void read(signal*& ptr) {
		storage.read(ptr);
	}

private:
	
};

class Producer {
public:
	Producer() {
		generator = Generator();
	}

	const signal* produce() {
		return generator.generateSignal();
	}

private:
	Generator generator;
};

class Thread {
public:
	Thread() {

	}
	void newThread() {

	}
private:

};


class TestCase {
public:
	std::string BasePath;
	TestCase() {
#if defined(WIN32)
		BasePath = "..\\..\\..\\..\\TestCases\\";
#elif	 defined(__linux__)
		BasePath = "TestCases/";
#endif
	}

	void RUN() {
		playTestCase(&TestCase::TestCase_1, "TestCase_1.txt");
		playTestCase(&TestCase::TestCase_2, "TestCase_2.txt");
	}

	void SAVE() {
		saveTestCaseOutput(&TestCase::TestCase_2, "TestCase_1.txt");
		saveTestCaseOutput(& TestCase::TestCase_2, "TestCase_2.txt");
		saveTestCaseOutput(&TestCase::TestCase_2, "TestCase_3.txt");
	}

	int TestCase_1() {
		int value = 10;

		int buffer = 0;

		int* ptr = 0;
		ptr = &buffer;

		RingBuffer ring = RingBuffer();

		while (ring.write(value++));
		while (ring.read(ptr))
			std::cout << " Read: " << *ptr << std::endl;



		Generator gen;

		for (int i = 0; i < 200; ++i) {
			const signal* s = gen.generateSignal();
			std::cout << "ID: " << s->id
				<< " Value: " << s->value
				<< " Time" << ":" << s->second
				<< std::endl;
		}
		
		return 1;
	}
	int TestCase_2() {

		SignalRingBuffer signalringbuffer = SignalRingBuffer();
		Generator generator = Generator();

		const signal* tmp;
		signal* tmp2 = NULL;

		for (int i = 0; i < 5; i++) {

			tmp = (generator.generateSignal());
			signalringbuffer.write(*tmp);

			signalringbuffer.read(tmp2);

			if (tmp2 != NULL) {
				std::cout << "Wrote Signal: " << *tmp << "  and read Signal: " << *tmp2 << std::endl;
			}
			else {
				std::cout << "[FAILURE] no value read" << std::endl;
			}

		}

		return 1;
	}
	int TestCase_3() {
		int noSignals = 130;

		Producer producer = Producer();
		Sink sink = Sink();

		for (int i = 0; i < noSignals; i++) {
			if (i > 125) {
				std::cout << "";
			}
			const signal* ptr = producer.produce();
			signal value = *ptr;
			sink.write(value);
			if (ptr == NULL) {
				continue;
			}
			std::cout << "[WRITE] Signal: " << ptr->id << " " << ptr->second << " " << ptr->value << " |" << std::endl;
		}

		for (int i = 0; i < noSignals; i++) {
			if (i > 125) {
				std::cout << "";
			}
			signal* ptr = NULL;
			sink.read(ptr);
			if (ptr == NULL) {
				continue;
			}
			std::cout << "[READ] Signal: " << ptr->id <<" "  << ptr->second << " " << ptr->value << " |" << std::endl;
		}


		for (int i = 0; i < sink.storage.CAPACITY; i++) {
			if (i > 125) {
				std::cout << "";
			}
			std::cout << sink.storage.buffer[i] << std::endl;
		}

		return 1;
	}

private:
	int playTestCase(int (TestCase::* func)(), std::string testCaseFileName) {
		captureConsoleOutput();
		try {
			(this->*func)();  // run the test
		}
		catch (const std::exception& e) {
			releaseConsoleOutput();  // restore std::cout first
			std::cerr << "[EXCEPTION] Test Case: " << testCaseFileName
				<< " threw: " << e.what() << std::endl;
			return -1;
		}
		catch (...) {
			releaseConsoleOutput();
			std::cerr << "[EXCEPTION] Test Case: " << testCaseFileName
				<< " threw unknown exception" << std::endl;
			return -1;
		}
		releaseConsoleOutput();

		std::string capturedOutput = getCapturedOutput();
		std::string expectedOutput = loadExpectedOutput(testCaseFileName);

		bool test = compareOutputs(capturedOutput,expectedOutput);

		if (test) {
			std::cout << "[SUCCESS] Test Case: " << testCaseFileName << " worked" << std::endl;
			return 1;
		}
		else {
			std::cout << "[FAILURE] Test Case: " << testCaseFileName << " did not work" << std::endl;
			return 0;
		}
	}
	int saveTestCaseOutput(int (TestCase::* func)(), std::string  fileName) {
		
		captureConsoleOutput();
		try {
			(this->*func)();  // run the test
		}
		catch (const std::exception& e) {
			releaseConsoleOutput();  // restore std::cout first
			std::cerr << "[EXCEPTION] Test Case: " << fileName
				<< " threw: " << e.what() << std::endl;
			return -1;
		}
		catch (...) {
			releaseConsoleOutput();
			std::cerr << "[EXCEPTION] Test Case: " << fileName
				<< " threw unknown exception" << std::endl;
			return -1;
		}
		releaseConsoleOutput();

		try {
			std::cout << "Opening file: [" << BasePath + fileName << "]\n";
			std::ofstream file(BasePath + fileName, std::ios::out | std::ios::trunc);
			if (!file.is_open()) {
				throw std::runtime_error("Datei konnte nicht geoeffnet werden: " +
					BasePath);
			}
			else {
				file << getCapturedOutput();
				file.close();
			}
		}
		catch (const std::exception& e) {
			std::cerr << "[WARNING] Could not write TestCase output: " << e.what() << std::endl;
			return 0;
		}
		return 1;
	}
	std::string loadExpectedOutput(std::string fileName){
		try {
			std::cout << "Opening file: [" << BasePath + fileName << "]\n";
			std::ifstream file(BasePath + fileName);
			if (!file) {
				throw std::runtime_error(fileName + " konnte nicht geoeffnet werden");
			}
			std::stringstream buffer;
			buffer << file.rdbuf();
			std::string expectedReturn = buffer.str();
			return expectedReturn;
		}
		catch (const std::exception& e) {
			std::cerr << "[WARNING] Could not load expected output: " << e.what() << std::endl;
			return "";
		}
	}
	bool compareOutputs(std::string input, std::string expected) {
		if (input == expected) {
			return true;
		}
		else {
			return false;
		}
	}
	void captureConsoleOutput() {
		if (oldBuf != nullptr) {
			// already capturing
			return;
		}
		std::cout << std::flush;
		captured.str("");    
		captured.clear();
		oldBuf = std::cout.rdbuf(captured.rdbuf());
	}
	void releaseConsoleOutput() {
		if (oldBuf == nullptr) {
			// not capturing
			return;
		}
		std::cout.flush();
		std::cout.rdbuf(oldBuf);
		oldBuf = nullptr;
	}
	std::string getCapturedOutput()
	{
		return captured.str();
	}
};

static int __system__() {
#ifdef _WIN32
	MEMORYSTATUSEX statex;
	statex.dwLength = sizeof(statex);
	GlobalMemoryStatusEx(&statex);

	_tprintf(TEXT("There is  %*ld %% of memory in use.\n"),
		WIDTH, statex.dwMemoryLoad);
#endif

#ifdef linux
	char cmd[30];
	int flag = 0;
	FILE* fp;
	char line[130];
	int TotalMem, TotalFree, TotalUsed;

	flag = 0;
	memcpy(cmd, "\0", 30);
	sprintf(cmd, "free -t -m|grep Total");
	fp = popen(cmd, "r");
	while (fgets(line, sizeof line, fp))
	{
		flag++;
		sscanf(line, "%*s %d %d %d", &TotalMem, &TotalUsed, &TotalFree);
	}
	pclose(fp);

	if (flag)
		printf("TotalMem:%d -- TotalUsed:%d -- TotalFree:%d\n", TotalMem, TotalUsed, TotalFree);
	else
		printf("not found\n");
#endif

	return 0;
}

/*
* normalizer oder so was bauen
* sink bauen
* threads einbauen
* threadmanager einbauen
*/
int main(int argc, char* argv[])
{
	cout << "Hello CMake." << endl;
	__system__();




	TestCase testcase = TestCase();

	testcase.SAVE();

	//testcase.TestCase_3();

	//std::cout << std::filesystem::current_path() << "\n";

	//testcase.TestCase_2();

	return 0;
}
