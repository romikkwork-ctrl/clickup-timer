import { redis } from "../lib/redis.js";
import { startTimer, stopTimer } from "../lib/clickup.js";

// 🔥 NEW: format duration
function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
        String(hours).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0"),
    ].join(":");
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const event = req.body;

    try {
        if (event.event === "taskUpdated") {
            const taskId = event.task_id;
            const status = event.history_items?.[0]?.after?.status;
            const userId = event.history_items?.[0]?.user?.id;

            console.log("Status changed:", status);

            // ✅ START TIMER
            if (status === "in progress") {
                const existing = await redis.get(`timer:${taskId}`);

                if (!existing) {
                    const timerId = await startTimer(taskId, userId);

                    await redis.set(`timer:${taskId}`, {
                        timerId,
                        startTime: Date.now(), // 🔥 store start time
                    });

                    console.log("⏱ Timer started");
                }
            }

            // 🛑 STOP TIMER
            if (status === "in review") {
                const data = await redis.get(`timer:${taskId}`);

                if (data) {
                    const { timerId, startTime } = data;

                    await stopTimer(timerId);

                    // 🔥 calculate duration
                    const durationMs = Date.now() - startTime;
                    const formatted = formatDuration(durationMs);

                    console.log(`🛑 Timer stopped. Duration: ${formatted}`);

                    // OPTIONAL: store total time
                    const prev = await redis.get(`duration:${taskId}`);

                    let totalMs = durationMs;

                    if (prev) {
                        totalMs += prev;
                    }

                    await redis.set(`duration:${taskId}`, totalMs);

                    await redis.del(`timer:${taskId}`);
                }
            }
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}