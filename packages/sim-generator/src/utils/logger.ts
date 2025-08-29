export class Logger {
  private isVerboseMode = false;

  setVerbose(verbose: boolean): void {
    this.isVerboseMode = verbose;
  }

  info(message: string, ...args: any[]): void {
    console.log(`ℹ️  ${message}`, ...args);
  }

  verbose(message: string, ...args: any[]): void {
    if (this.isVerboseMode) {
      console.log(`🔍 ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`⚠️  ${message}`, ...args);
  }

  error(message: string, error?: any): void {
    console.error(`❌ ${message}`);
    if (error) {
      console.error(error);
    }
  }

  success(message: string, ...args: any[]): void {
    console.log(`✅ ${message}`, ...args);
  }
}