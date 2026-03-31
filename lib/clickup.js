import axios from "axios";

const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN;
const TEAM_ID = process.env.CLICKUP_TEAM_ID;

const headers = {
  Authorization: CLICKUP_API_TOKEN,
  "Content-Type": "application/json",
};

export const startTimer = async (taskId, userId) => {
  const response = await axios.post(
    `https://api.clickup.com/api/v2/team/${TEAM_ID}/time_entries`,
    {
      description: "Auto started from status change",
      start: Date.now(),
      task_id: taskId,
      assignee: userId,
    },
    { headers }
  );

  return response.data.data.id;
};

export const stopTimer = async (timerId) => {
  await axios.put(
    `https://api.clickup.com/api/v2/time_entries/${timerId}`,
    {
      end: Date.now(),
    },
    { headers }
  );
};