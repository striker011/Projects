// Low_Latency_Market_Data_Pipeline.h: Includedatei für Include-Standardsystemdateien
// oder projektspezifische Includedateien.

#pragma once

#if defined(_WIN32)
#include <windows.h>
#include <stdio.h>
#include <tchar.h>
#define DIV 1048576 
#define WIDTH 7


#elif defined (__linux__)
#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#endif

#include <iostream>
#include <sstream>
#include <fstream>
#include <string>
#include <functional>
#include <cstring>
#include <filesystem>
// TODO: Verweisen Sie hier auf zusätzliche Header, die Ihr Programm erfordert.
