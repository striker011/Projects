#ifndef RINGBUFFER
#define RINGBUFFER

class RingBuffer 
{
    public: 
        const int N = 10;

        int put(int item);
        int get(int * value);

    private:
        int buffer[N];
        int writeIndex, readIndex;
}