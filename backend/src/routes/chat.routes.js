const express = require("express");
const multer = require("multer");
const protect = require("../middlewares/auth.middleware");
const chatController = require("../controllers/chat.controller");
const {
  MAX_VOICE_BYTES,
  ALLOWED_VOICE_MIME_TYPES,
} = require("../utils/imagekit");

const router = express.Router();
const voiceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VOICE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    const mimetype = String(file.mimetype || "").split(";")[0].toLowerCase();
    if (!ALLOWED_VOICE_MIME_TYPES.has(mimetype)) {
      return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "voice"));
    }
    return callback(null, true);
  },
});

function acceptVoice(req, res, next) {
  voiceUpload.single("voice")(req, res, (error) => {
    if (!error) return next();
    const message = error.code === "LIMIT_FILE_SIZE"
      ? "Voice recording must be 5 MB or smaller."
      : "Upload a WebM, OGG, MP4, MP3 or WAV voice recording.";
    return res.status(400).json({ success: false, message });
  });
}

router.get("/events", protect, chatController.streamEvents);
router.post("/:threadId/signal", protect, chatController.signalThread);

router.use(protect);

router.get("/", chatController.listMyChats);
router.get("/:threadId/messages", chatController.listMessages);
router.post("/:threadId/messages", chatController.sendMessage);
router.post("/:threadId/voice", acceptVoice, chatController.sendVoiceMessage);
router.patch("/:threadId/messages/:messageId/location", chatController.updateLiveLocation);
router.post("/:threadId/read", chatController.markRead);
router.patch("/:threadId/messages/:messageId", chatController.editMessage);
router.delete("/:threadId/messages/:messageId", chatController.deleteMessage);
router.delete("/:threadId/messages", chatController.clearConversationMessages);
router.delete("/:threadId", chatController.hideConversation);

module.exports = router;
