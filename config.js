
cat > config.js << 'EOF'
import dotenv from 'dotenv';
dotenv.config();
export default {
  SESSION_ID: process.env.SESSION_ID || "",
  PREFIX: process.env.PREFIX || ".",
  BOT_NAME: process.env.BOT_NAME || "ARSLAN MD",
  MODE: process.env.MODE || "public",
  OWNER_NUMBER: process.env.OWNER_NUMBER || "923467214839",
  OWNER_NAME: process.env.OWNER_NAME || "MR ARSLAN",
  SUDO: process.env.SUDO ? process.env.SUDO.split(',') : ["923467214839"],
  AUTO_REPLY: process.env.AUTO_REPLY || "false",
  AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || "true",
  AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || "false",
  AUTO_LIKE_STATUS: process.env.AUTO_LIKE_STATUS || "true",
  AUTO_REACT: process.env.AUTO_REACT || "true",
  OWNER_REACT: process.env.OWNER_REACT || "true",
  ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "true",
  AUTO_TYPING: process.env.AUTO_TYPING || "false",
  AUTO_RECORDING: process.env.AUTO_RECORDING || "false",
  ANTI_LINK: process.env.ANTI_LINK || "true",
  ANTI_BAD_WORD: process.env.ANTI_BAD_WORD || "true",
  ANTI_DELETE: process.env.ANTI_DELETE || "true",
  ANTI_CALL: process.env.ANTI_CALL || "true",
  ANTI_BOT: process.env.ANTI_BOT || "false",
  WELCOME: process.env.WELCOME || "true",
  GOODBYE: process.env.GOODBYE || "true",
  AUTO_STICKER: process.env.AUTO_STICKER || "false",
  AUTO_VOICE: process.env.AUTO_VOICE || "false",
  MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || "https://i.ibb.co/cKGB1JpM/arslanmd.jpg",
  DESCRIPTION: process.env.DESCRIPTION || "*© POWERED BY MR ARSLAN*",
  VERSION: process.env.VERSION || "15.0.0",
  TIMEZONE: process.env.TIMEZONE || "Asia/Karachi"
};
EOF
