/**
 * 💜 ========================================================== 💜
 *              ARSLAN-MD WHATSAPP BOT - CONFIGURATION
 * 💜 ========================================================== 💜
 * Author: MR ARSLAN
 * Version: 2.5.0
 * Description: Master configuration file containing all settings, 
 *              commands information, and feature toggles.
 */

export default {
    // ==========================================
    // 1. BASIC BOT IDENTITY
    // ==========================================
    BOT_NAME: "ARSLAN-MD",
    OWNER_NAME: "MR ARSLAN",
    PREFIX: ".",
    OWNER_NUMBER: "923467214839",
    SESSION_ID: process.env.SESSION_ID || "",
    REGION: "Pakistan",
    LANGUAGE: "EN/UR",
    
    // ==========================================
    // 2. BOT OPERATIONAL MODES
    // ==========================================
    // "public" = Bot sab ke liye chalega
    // "self" = Bot sirf owner ke commands sunega
    // "admin" = Bot sirf group admins ke liye chalega
    MODE: "public",
    
    // ==========================================
    // 3. FEATURE TOGGLES (ENABLE / DISABLE)
    // ==========================================
    FEATURES: {
        AUTO_READ: false,           // Incoming messages ko automatically read karna (blue tick)
        AUTO_STATUS_VIEW: true,     // Contacts ke status automatically view karna
        AUTO_BIO: true,             // Bot ke bio mein live uptime ya status show karna
        ANTISPAM: true,             // Spamming karne walon ko block/warn karna
        ANTICALL: true,             // Bot par call karne walon ko automatic reject/warn karna
        ANTILINK: false,            // Groups mein link share karne se rokna
        WELCOME_GOODBYE: true,      // Group mein naye member ke ane par welcome message dena
        BAD_WORD_FILTER: false,     // Ghalat alfaz (abuse) delete karna
        AUTO_RECORDING: false,      // Audio recording typing status show karna
        AUTO_TYPING: true           // Bot par hamesha typing status show rakhna
    },

    // ==========================================
    // 4. CUSTOM MESSAGES & RESPONSES
    // ==========================================
    MESSAGES: {
        OWNER_ONLY: "⚠️ *Access Denied:* Yeh command sirf mere Boss (MR ARSLAN) ke liye hai!",
        GROUP_ONLY: "⚠️ *Error:* Yeh command sirf WhatsApp groups ke andar use ho sakti hai!",
        PRIVATE_ONLY: "⚠️ *Error:* Yeh command sirf personal chat (DM) mein kaam karegi!",
        ADMIN_ONLY: "⚠️ *Error:* Yeh command sirf Group Admin use kar sakte hain!",
        BOT_ADMIN: "⚠️ *Error:* Pehle mujhe group ka admin banao!",
        SUCCESS: "✅ *Success:* Aapka kaam kamyabi se mukammal ho gaya hai!",
        WAIT: "⏳ *Please Wait:* Aapki request process ho rahi hai...",
        ERROR: "❌ *Oops:* Kuch kharabi paida ho gayi hai, dobara try karein!"
    },

    // ==========================================
    // 5. STICKER & WATERMARK SETTINGS
    // ==========================================
    STICKER: {
        PACKNAME: "ARSLAN-MD STICKERS",
        AUTHOR: "CREATED BY MR ARSLAN"
    },

    // ==========================================
    // 6. COMPLETE COMMANDS DIRECTORY & METADATA
    // ==========================================
    COMMANDS: [
        // --- General & System Commands ---
        {
            name: "menu",
            category: "General",
            status: true,
            desc: "Displays the gorgeous master command menu of ARSLAN-MD."
        },
        {
            name: "help",
            category: "General",
            status: true,
            desc: "Alternative command to open the bot menu."
        },
        {
            name: "ping",
            category: "General",
            status: true,
            desc: "Checks the server speed, latency, and response time."
        },
        {
            name: "owner",
            category: "General",
            status: true,
            desc: "Provides official contact details and profile of MR ARSLAN."
        },
        {
            name: "runtime",
            category: "General",
            status: true,
            desc: "Shows how long the bot has been continuously online."
        },
        {
            name: "script",
            category: "General",
            status: true,
            desc: "Provides GitHub repository link and deployment source code."
        },
        {
            name: "alive",
            category: "General",
            status: true,
            desc: "Confirms whether the bot system is active and running."
        },

        // --- Media & Conversion Commands ---
        {
            name: "sticker",
            category: "Media",
            status: true,
            desc: "Converts any sent image or video into a WhatsApp sticker."
        },
        {
            name: "take",
            category: "Media",
            status: true,
            desc: "Changes the packname and author watermark of a sticker."
        },
        {
            name: "toimg",
            category: "Media",
            status: true,
            desc: "Converts a sticker back into a normal image file."
        },
        {
            name: "tourl",
            category: "Media",
            status: true,
            desc: "Uploads media to cloud storage and generates a direct link."
        },

        // --- Download & Utility Commands ---
        {
            name: "song",
            category: "Downloader",
            status: true,
            desc: "Downloads audio tracks or music files from YouTube."
        },
        {
            name: "video",
            category: "Downloader",
            status: true,
            desc: "Downloads video files directly from YouTube links."
        },
        {
            name: "play",
            category: "Downloader",
            status: true,
            desc: "Searches and streams media content instantly."
        },
        {
            name: "weather",
            category: "Utility",
            status: true,
            desc: "Checks current temperature and weather updates of any city."
        },
        {
            name: "calc",
            category: "Utility",
            status: true,
            desc: "Performs mathematical calculations inside chat."
        },

        // --- Group Management Commands (Owner / Admin) ---
        {
            name: "kick",
            category: "Group",
            status: true,
            desc: "Removes a target user from the WhatsApp group."
        },
        {
            name: "add",
            category: "Group",
            status: true,
            desc: "Adds a new participant directly into the group."
        },
        {
            name: "promote",
            category: "Group",
            status: true,
            desc: "Grants admin privileges to a specific group member."
        },
        {
            name: "demote",
            category: "Group",
            status: true,
            desc: "Revokes admin status from a group administrator."
        },
        {
            name: "tagall",
            category: "Group",
            status: true,
            desc: "Tags all active members in the group simultaneously."
        },
        {
            name: "mute",
            category: "Group",
            status: true,
            desc: "Restricts group messaging so only admins can chat."
        },
        {
            name: "unmute",
            category: "Group",
            status: true,
            desc: "Unlocks group chat so everyone can send messages."
        },

        // --- Owner & Advanced Control Commands ---
        {
            name: "broadcast",
            category: "Owner",
            status: true,
            desc: "Broadcasts a global message to all chats and groups."
        },
        {
            name: "block",
            category: "Owner",
            status: true,
            desc: "Blocks an unwanted user number from interacting with bot."
        },
        {
            name: "unblock",
            category: "Owner",
            status: true,
            desc: "Unblocks a previously restricted user."
        },
        {
            name: "setprefix",
            category: "Owner",
            status: true,
            desc: "Dynamically changes the bot command prefix symbol."
        },
        {
            name: "restart",
            category: "Owner",
            status: true,
            desc: "Reboots the bot backend server process."
        },
        {
            name: "shutdown",
            category: "Owner",
            status: true,
            desc: "Completely turns off the bot execution process."
        }
    ],

    // ==========================================
    // 7. API ENDPOINTS & EXTERNAL SERVICES (OPTIONAL)
    // ==========================================
    APIS: {
        PRIMARY_API: "https://api.example.com",
        KEY: "arslan-free-key-999"
    }
};
