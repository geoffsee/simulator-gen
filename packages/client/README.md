# Simulators Web Client

A React-based web client for the simulators framework, providing a user interface for interacting with and testing simulation APIs. This package serves as both a development tool and a reference implementation for web-based simulation interfaces.

## Overview

The client package provides a web interface for the simulators framework, featuring API testing capabilities and a foundation for building simulation dashboards and monitoring interfaces.

## Features

- **API Testing Interface**: Interactive tool for testing simulation endpoints
- **React-based UI**: Modern web interface built with React and TypeScript
- **Development Tools**: Hot module reloading and development server
- **Extensible Architecture**: Foundation for building custom simulation interfaces

## Installation

```bash
bun install
```

## Usage

### Development Server

```bash
bun dev
```

This starts a development server with hot module reloading for rapid development.

### Production Build

```bash
bun start
```

This runs the production build of the client application.

## Architecture

The client consists of:

- **App Component**: Main application layout and structure
- **APITester**: Interactive API testing interface for simulation endpoints
- **Styling**: Modern CSS with responsive design
- **Build System**: Bun-based build and development tools

## API Testing

The built-in API tester allows you to:

- Test GET and PUT endpoints
- Send requests to simulation APIs
- View formatted JSON responses
- Debug API interactions during development

## Development

This package is part of the simulators monorepo and integrates with:

- `@simulators/lib`: Core simulation framework
- `@simulators/legal-sim`: Legal simulation APIs
- `@simulators/sim-generator`: Generated simulation packages

## Technology Stack

- **React**: Component-based UI framework
- **TypeScript**: Type-safe development
- **Bun**: Fast JavaScript runtime and build tool
- **CSS**: Modern styling with responsive design

This project was created using `bun init` in bun v1.2.8. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
