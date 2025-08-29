export function handleExit(cleanup: () => void) {
    process.on('SIGINT', () => {
        console.log('Exited');
        cleanup();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        cleanup();
        console.log('Exited');
        process.exit(0);
    });
}

// Export the simulation framework
export * from './framework/index.js';