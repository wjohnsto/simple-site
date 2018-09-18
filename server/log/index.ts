import { isNumber, isObject, isString } from 'lodash';

const LOG_LEVEL = {
    FATAL: 6,
    ERROR: 5,
    WARN: 4,
    INFO: 3,
    DEBUG: 2,
    TRACE: 1,
};

const LOG_PRINT: string[] = [
    '',
    'TRACE',
    'DEBUG',
    'INFO',
    'WARN',
    'ERROR',
    'FATAL',
];

class Log {
    public LOG_LEVEL = LOG_LEVEL;

    protected logLevel: number = LOG_LEVEL.TRACE;

    public fatal(error: any): void {
        this.stringifyError(error, LOG_LEVEL.FATAL);
    }

    public error(error: any): void {
        this.stringifyError(error, LOG_LEVEL.ERROR);
    }

    public warn(message: any): void {
        this.log(message, LOG_LEVEL.WARN);
    }

    public info(message: any): void {
        this.log(message, LOG_LEVEL.INFO);
    }

    public debug(message: any): void {
        this.log(message, LOG_LEVEL.DEBUG);
    }

    public trace(message: any): void {
        this.log(message, LOG_LEVEL.TRACE);
    }

    public log(message: any, logLevel: number = LOG_LEVEL.INFO): void {
        if (!this.shouldLog(logLevel)) {
            return;
        }

        if (isObject(message)) {
            message = JSON.stringify(message, null, 2);
        }

        console.log(`[${LOG_PRINT[logLevel]}] ${message}`);
    }

    public setLogLevel(level: number): void {
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

        const message: string = error.message;
        const stack: string = error.stack;

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
        if (!isNumber(this.logLevel)) {
            this.logLevel = LOG_LEVEL.INFO;
        }

        return logLevel >= this.logLevel;
    }
}

export = new Log();
