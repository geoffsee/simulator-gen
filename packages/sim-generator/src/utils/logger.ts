export class Logger {
  private verbose = false;

  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }

  info(message: string, ...args: any[]): void {
    console.log(`ℹ️  ${message}`, ...args);
  }

  verbose(message: string, ...args: any[]): void {
    if (this.verbose) {
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