import { redis } from "../lib/redis.js";
import { startTimer, stopTimer } from "../lib/clickup.js";

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
        const timerId = await startTimer(taskId, userId);

        await redis.set(`timer:${taskId}`, timerId);
      }

      // 🛑 STOP TIMER
      if (status === "in review") {
        const timerId = await redis.get(`timer:${taskId}`);

        if (timerId) {
          await stopTimer(timerId);
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