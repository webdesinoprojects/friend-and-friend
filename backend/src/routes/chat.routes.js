const express = require("express");
const protect = require("../middlewares/auth.middleware");
const chatController = require("../controllers/chat.controller");

const router = express.Router();

router.use(protect);

router.get("/", chatController.listMyChats);
router.post("/:threadId/messages", chatController.sendMessage);
router.post("/:threadId/read", chatController.markRead);
router.delete("/:threadId/messages/:messageId", chatController.deleteMessage);
router.delete("/:threadId", chatController.deleteThread);

module.exports = router;
