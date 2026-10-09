let lockTail = Promise.resolve();

export async function withPullJobLock(operation) {
    let release;
    const currentLock = new Promise((resolve) => {
        release = resolve;
    });
    const previousLock = lockTail;
    lockTail = currentLock;

    await previousLock;
    try {
        return await operation();
    } finally {
        release();
    }
}
