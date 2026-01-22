# Aufbau:


## Producer

## Normalisation

## StrategyManager

## Sink

# Communication

## SPSC Ring Buffer

## lockless queue





What it is: Low-latency market data pipeline with lock-free SPSC queues

Why: Demonstrates concurrency patterns used in trading systems (T7-like concepts)

Design: 4-thread pipeline, ring buffers, memory ordering, cacheline alignment

Build/Run: cmake commands

Results: Beispieloutput (Throughput + p99 latency)

Notes: CPU pinning, warmup, avoiding IO in hot path


