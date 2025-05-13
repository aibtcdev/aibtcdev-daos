# Durable Objects

This directory contains Cloudflare Durable Objects implementations that provide persistent state management for the AIBTC platform.

## Purpose

Durable Objects enable stateful serverless computing, allowing the platform to maintain state across requests without traditional databases. They serve as the backend for the MCP (Multi-Contract Protocol) agent system.

## Key Components

- `aibtc-mcp-do.ts` - The main Durable Object implementation for the Multi-Contract Protocol agent, which facilitates interaction with the blockchain contracts

## Usage

The Durable Objects are deployed as part of the Cloudflare Workers infrastructure and provide persistent state for the API endpoints.

[Back to main README](/)
