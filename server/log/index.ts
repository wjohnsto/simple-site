import { isNumber, isObject, isString } from 'lodash';

const LOG_LEVEL = {
        FATAL: 6,
        ERROR: 5,
        WARN: 4,
        INFO: 3,
        DEBUG: 2,
        TRACE: 1,
    },
    LOG_PRINT: Array<string> = [
        '',
        'TRACE',
        'DEBUG',
        'INFO',
        'WARN',
        'ERROR',
        'FATAL',
    ];

class Log {
    LOG_LEVEL = LOG_LEVEL;

    protected logLevel: number = LOG_LEVEL.TRACE;

    fatal(error: any): void {
        return this.stringifyError(error, LOG_LEVEL.FATAL);
    }

    error(error: any): void {
        return this.stringifyError(error, LOG_LEVEL.ERROR);
    }

    warn(message: any): void {
        this.log(message, LOG_LEVEL.WARN);
    }

    info(message: any): void {
        this.log(message, LOG_LEVEL.INFO);
    }

    debug(message: any): void {
        this.log(message, LOG_LEVEL.DEBUG);
    }

    trace(message: any): void {
        this.log(message, LOG_LEVEL.TRACE);
    }

    log(message: any, logLevel: number = LOG_LEVEL.INFO): void {
        if (!this.shouldLog(logLevel)) {
            return;
        }

        if (isObject(message)) {
            message = JSON.stringify(message, null, 2);
        }

        console.log(`[${LOG_PRINT[logLevel]}] ${message}`);
    }

    setLogLevel(level: number): void {
        if (isNumber((<any>LOG_LEVEL)[level])) {
            this.logLevel = (<any>LOG_LEVEL)[level];
            return;
        } else if (level < LOG_LEVEL.TRACE) {
            this.logLevel = LOG_LEVEL.TRACE;
            return;
        } else if (level > LOG_LEVEL.ERROR) {
            this.logLevel = LOG_LEVEL.ERROR;
            return;
        }

        this.logLevel = level;
    }

    protected stringifyError(error: any, logLevel: number): void {
        if (!error) {
            return;
        }

        let message: string = error.message,
            stack: string = error.stack;

        if (isString(stack)) {
            this.log(stack, logLevel);
            return;
        }

        if (isString(message)) {
            this.log(message, logLevel);
        } else {
            this.log(error, logLevel);
        }
    }

    protected shouldLog(logLevel: number): boolean {
        return logLevel >= (this.logLevel || LOG_LEVEL.INFO);
    }
}

export default new Log();
