const listeners = new Set();
const eventHistory = [];
const MAX_EVENT_HISTORY = 100;
const STREAM_DURATION_MS = 25000;
let nextEventId = Date.now() * 1000;

function writeEvent(response, event) {
    response.write(`id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`);
}

function publish(type, data) {
    const event = {
        id: String(++nextEventId),
        type,
        data
    };

    eventHistory.push(event);
    if (eventHistory.length > MAX_EVENT_HISTORY) {
        eventHistory.shift();
    }

    for (const response of listeners) {
        if (!response.writableEnded) {
            writeEvent(response, event);
        }
    }
}

export function publishTradesUpdated(jobId, trades, job) {
    publish("trades-updated", {
        jobId: String(jobId),
        trades,
        cursor: job.cursor,
        totalPulled: job.totalPulled
    });
}

export function publishPullFinished(jobId, status) {
    publish("pull-finished", { jobId: String(jobId), status });
}

export function streamPullEvents(request, response) {
    response.status(200);
    response.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no"
    });
    response.flushHeaders();
    response.write("retry: 1000\n\n");

    const lastEventId = Number(request.get("Last-Event-ID")) || 0;
    listeners.add(response);
    if (lastEventId) {
        for (const event of eventHistory) {
            if (Number(event.id) > lastEventId) {
                writeEvent(response, event);
            }
        }
    } else {
        for (const event of eventHistory) {
            writeEvent(response, event);
        }
    }

    response.write(`id: ${nextEventId}\nevent: ready\ndata: {}\n\n`);
    const timeoutId = setTimeout(() => response.end(), STREAM_DURATION_MS);
    response.on("close", () => {
        clearTimeout(timeoutId);
        listeners.delete(response);
    });
}
