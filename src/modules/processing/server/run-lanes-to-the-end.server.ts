import { runWithConcurrency } from "#/shared/server/run-with-concurrency.server";

type LaneOutcome<Result> = { isDone: false } | { isDone: true; result: Result };

/**
 * Like `runWithConcurrency`, but a failure only rejects after every running task has stopped,
 * so nothing is still changing a clip once the stage reports it ended. No new item starts after
 * the first failure, which is the one rethrown.
 */
export async function runLanesToTheEnd<Item, Result>(
    items: ReadonlyArray<Item>,
    limit: number,
    task: (item: Item) => Promise<Result>,
): Promise<Array<Result>> {
    const failures: Array<unknown> = [];
    const settled = await runWithConcurrency(
        items,
        limit,
        async (item): Promise<LaneOutcome<Result>> => {
            if (failures.length > 0) {
                return { isDone: false };
            }

            try {
                return { isDone: true, result: await task(item) };
            } catch (error) {
                failures.push(error);
                return { isDone: false };
            }
        },
    );

    if (failures.length > 0) {
        throw failures[0];
    }

    return settled.flatMap((outcome) => {
        if (outcome.isDone === false) {
            return [];
        }

        return [outcome.result];
    });
}
