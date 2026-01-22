# CMakeList.txt: CMake-Projekt für "Low_Latency_Market_Data_Pipeline". Schließen Sie die Quelle ein, und definieren Sie
# projektspezifische Logik hier.
#

# Fügen Sie der ausführbaren Datei dieses Projekts eine Quelle hinzu.
add_executable (Low_Latency_Market_Data_Pipeline "Low_Latency_Market_Data_Pipeline.cpp" "Low_Latency_Market_Data_Pipeline.h")

if (CMAKE_VERSION VERSION_GREATER 3.12)
  set_property(TARGET Low_Latency_Market_Data_Pipeline PROPERTY CXX_STANDARD 20)
endif()

# TODO: Fügen Sie bei Bedarf Tests hinzu, und installieren Sie Ziele.
