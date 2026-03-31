export default function handler(req, res) {
  res.status(200).json({
    message: "ClickUp webhook service is running 🚀",
  });
}