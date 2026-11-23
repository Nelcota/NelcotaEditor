// At one check every 2 seconds, about one line a minute while the database stays down.
const LOG_EVERY_CONSECUTIVE_FAILURES = 30;

/** The first failure of a streak is logged, then one in every 30, so an outage cannot flood the log. */
export function isFailureWorthLogging(consecutiveFailures: number): boolean {
    if (Number.isInteger(consecutiveFailures) === false || consecutiveFailures < 1) {
        throw new RangeError(`Invalid consecutive failure count: ${String(consecutiveFailures)}`);
    }

    return consecutiveFailures === 1 || consecutiveFailures % LOG_EVERY_CONSECUTIVE_FAILURES === 0;
}
