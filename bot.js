const TelegramBot = require('node-telegram-bot-api');
const config = require('./config.json');
const log = require('./utils/logger');
const fs = require('fs');
class SimpleAPIBot {
    constructor() {
        this.token = process.env.TELEGRAM_BOT_TOKEN || config.telegram?.bot_token;
        this.adminIds = config.telegram?.admin_ids || [];
        this.isAvailable = false;

        if (!this.token) {
            log('❌ Bot Token không được cấu hình trong config.json hoặc TELEGRAM_BOT_TOKEN env', 'BOT');
            return;
        }

        try {
            this.bot = new TelegramBot(this.token, { polling: true });
            this.isAvailable = true;
            this.setupHandlers();
            log('✅ Telegram Bot khởi tạo thành công', 'BOT');
        } catch (error) {
            log('❌ Lỗi khởi tạo bot: ' + error.message, 'BOT');
        }
    }

    setupHandlers() {
        // Start command
        this.bot.onText(/\/start/, (msg) => {
            //console.log("BOT - Bot nhận lệnh /start từ user:", msg.from.id);
            this.handleStartCommand(msg);
        });

        // Help command
        this.bot.onText(/\/help/, (msg) => {
            this.sendHelpMessage(msg.chat.id);
        });

        // Server status
        this.bot.onText(/\/status/, (msg) => {
            this.handleServerStatus(msg);
        });

        // API Routes
        this.bot.onText(/\/routes/, (msg) => {
            this.handleApiRoutes(msg);
        });

        // Stats
        this.bot.onText(/\/stats/, (msg) => {
            this.handleStats(msg);
        });

        // Admin commands
        this.bot.onText(/\/admin/, (msg) => {
            this.handleAdminMenu(msg);
        });

        // Broadcast (admin only)
        this.bot.onText(/\/broadcast (.+)/, (msg, match) => {
            this.handleBroadcast(msg, match[1]);
        });

        // User API Key commands
        this.bot.onText(/\/newkey/, (msg) => {
            this.handleNewKey(msg);
        });

        this.bot.onText(/\/checkkey (.+)/, (msg, match) => {
            this.handleCheckKey(msg, match[1]);
        });

        // Admin API Key management
        this.bot.onText(/\/admin_keys/, (msg) => {
            this.handleAdminKeys(msg);
        });

        this.bot.onText(/\/admin_addkey (.+) (.+) (.+)/, (msg, match) => {
            this.handleAdminAddKey(msg, match[1], match[2], match[3]);
        });

        this.bot.onText(/\/admin_delkey (.+)/, (msg, match) => {
            this.handleAdminDeleteKey(msg, match[1]);
        });

        // Key info and delete commands
        this.bot.onText(/\/keyinfo (.+)/, (msg, match) => {
            this.handleKeyInfo(msg, match[1]);
        });

        this.bot.onText(/\/delkey (.+)/, (msg, match) => {
            this.handleUserDeleteKey(msg, match[1]);
        });

        // Server control commands
        this.bot.onText(/\/reload/, (msg) => {
            this.handleReloadRoutes(msg);
        });

        this.bot.onText(/\/logs/, (msg) => {
            this.handleViewLogs(msg);
        });

        this.bot.onText(/\/version/, (msg) => {
            this.handleVersion(msg);
        });

        // Server maintenance commands
        this.bot.onText(/\/maintenance/, (msg) => {
            this.handleMaintenance(msg);
        });

        this.bot.onText(/\/restart/, (msg) => {
            this.handleServerRestart(msg);
        });

        // Error handling
        this.bot.on('polling_error', (error) => {
            log('❌ Bot polling error: ' + error.message, 'BOT');
        });

        // Setup callback handlers immediately
        this.setupCallbackHandlers();
    }

    handleStartCommand(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const isAdmin = this.adminIds.includes(userId);

        const keyboard = {
            inline_keyboard: [
                [
                    { text: '📊 Thống kê', callback_data: 'stats' },
                    { text: '🖥️ Server Status', callback_data: 'status' }
                ],
                [
                    { text: '🌐 API Routes', callback_data: 'routes' },
                    { text: '📖 Hướng dẫn', callback_data: 'help' }
                ],
                [
                    { text: '🔑 Tạo API Key', callback_data: 'newkey' },
                    { text: '🔍 Kiểm tra Key', callback_data: 'checkkey' }
                ],
                [
                    { text: '📋 Thông tin Key', callback_data: 'keyinfo' },
                    { text: '🗑️ Xóa Key', callback_data: 'delkey' }
                ]
            ]
        };

        if (isAdmin) {
            keyboard.inline_keyboard.push(
                [{ text: '⚙️ Admin Panel', callback_data: 'admin' }],
                [
                    { text: '🔄 Reload Routes', callback_data: 'reload_routes' },
                    { text: '📋 View Logs', callback_data: 'view_logs' }
                ],
                [{ text: '📊 Version Info', callback_data: 'version_info' }]
            );
        } else {
            keyboard.inline_keyboard.push([{ text: '📊 Version Info', callback_data: 'version_info' }]);
        }

        this.bot.sendMessage(chatId, 
            `🤖 *Chào mừng đến với BLACK-GOKU API Bot!*\n\n` +
            `👤 User ID: \`${userId}\`\n` +
            `🔰 Role: ${isAdmin ? 'Admin' : 'User'}\n\n` +
            `Bot này giúp bạn theo dõi và quản lý API server.\n\n` +
            `Chọn chức năng bạn muốn sử dụng:`, 
            { parse_mode: 'Markdown', reply_markup: keyboard }
        );
    }

    handleServerStatus(msg) {
        const chatId = msg.chat.id;
        const uptime = process.uptime();
        const memUsage = process.memoryUsage();

        const message = `
🖥️ *Server Status*

⏱️ **Uptime:** ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s
💾 **Memory Usage:** ${Math.round(memUsage.used / 1024 / 1024)}MB
📊 **CPU Usage:** ${process.cpuUsage().user}μs
🌐 **Port:** ${global.config?.port || 8888}
🔧 **Node.js:** ${process.version}
        `;

        this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }

    handleApiRoutes(msg) {
        const chatId = msg.chat.id;
        try {
            // Simple route list since we can't access the dynamic routes
            let routesList = '🌐 *Danh sách API Routes:*\n\n';
            routesList += '📁 **TikTok:**\n';
            routesList += '   • `/randomtiktok` - Random TikTok video\n';
            routesList += '   • `/searchtt` - Search TikTok\n\n';
            routesList += '📁 **Download:**\n';
            routesList += '   • `/media/dowall` - Download media\n\n';
            routesList += '📁 **Social:**\n';
            routesList += '   • `/getinfo` - Get user info\n';
            routesList += '   • `/timejoine` - Get join time\n\n';
            routesList += '📁 **Media:**\n';
            routesList += '   • `/uploadimg` - Upload image\n';

            this.bot.sendMessage(chatId, routesList, { parse_mode: 'Markdown' });
        } catch (error) {
            this.bot.sendMessage(chatId, '❌ Không thể lấy danh sách routes từ server.');
        }
    }

    handleStats(msg) {
        const chatId = msg.chat.id;

        try {
            const data = require('./Main/app/data.json');
            const message = `
📊 *Thống kê API:*

🔢 **Tổng requests:** ${data.total || 0}
📅 **Requests hôm nay:** ${data.daily || 0}
📆 **Requests tháng này:** ${data.monthly || 0}
            `;

            this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } catch (error) {
            this.bot.sendMessage(chatId, '❌ Không thể lấy thống kê từ server.');
        }
    }

    handleAdminMenu(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (!this.adminIds.includes(userId)) {
            this.bot.sendMessage(chatId, '❌ Bạn không có quyền truy cập admin panel.');
            return;
        }

        const keyboard = {
            inline_keyboard: [
                [
                    { text: '📊 System Stats', callback_data: 'admin_stats' },
                    { text: '🔧 Maintenance Mode', callback_data: 'admin_maintenance' }
                ],
                [
                    { text: '🔑 API Keys Management', callback_data: 'admin_keys' },
                    { text: '📢 Broadcast Message', callback_data: 'admin_broadcast' }
                ],
                [
                    { text: '🔄 Restart Server', callback_data: 'admin_restart' },
                    { text: '⚙️ Server Control', callback_data: 'admin_control' }
                ]
            ]
        };

        this.bot.sendMessage(chatId, 
            '⚙️ *Admin Panel*\n\nChọn chức năng quản trị:', 
            { parse_mode: 'Markdown', reply_markup: keyboard }
        );
    }

    handleBroadcast(msg, message) {
        const userId = msg.from.id;

        if (!this.adminIds.includes(userId)) {
            this.bot.sendMessage(msg.chat.id, '❌ Bạn không có quyền sử dụng lệnh này.');
            return;
        }

        // Here you would implement broadcast to all users
        // For now, just send to admins
        this.adminIds.forEach(adminId => {
            this.bot.sendMessage(adminId, `📢 *Broadcast:*\n\n${message}`, 
                { parse_mode: 'Markdown' });
        });

        this.bot.sendMessage(msg.chat.id, '✅ Đã gửi broadcast message.');
    }

    sendHelpMessage(chatId) {
        const helpMessage = `
📚 *Hướng dẫn sử dụng BLACK-GOKU API Bot:*

🔧 **Lệnh cơ bản:**
• /start - Khởi động bot và xem menu
• /help - Hiển thị hướng dẫn này
• /status - Xem trạng thái server
• /routes - Danh sách API routes
• /stats - Thống kê sử dụng API

🔑 **API Key:**
• /newkey - Tạo API key mới
• /checkkey [apikey] - Kiểm tra thông tin API key

⚙️ **Lệnh Admin:**
• /admin - Mở admin panel
• /broadcast [message] - Gửi thông báo
• /admin_keys - Quản lý API keys
• /admin_addkey [type] [requests] [note] - Thêm API key
• /admin_delkey [apikey] - Xóa API key

💡 **Lưu ý:**
• Bot chỉ hiển thị thông tin cơ bản về API
• Để sử dụng đầy đủ chức năng, vui lòng truy cập web interface

❓ **Hỗ trợ:**
Liên hệ admin nếu cần hỗ trợ thêm.
        `;

        this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    }

    handleNewKey(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const username = msg.from.username || msg.from.first_name || 'Unknown';

        try {
            const fs = require('fs');
            const crypto = require('crypto');

            // Generate new API key
            const newApiKey = 'FREE_' + crypto.randomBytes(16).toString('hex').toUpperCase();

            // Load existing keys
            let apiKeys = [];
            try {
                const data = fs.readFileSync('./utils/APIKEY.json', 'utf8');
                apiKeys = JSON.parse(data);
            } catch (e) {
                apiKeys = [];
            }

            // Check if user already has a key
            const existingKey = apiKeys.find(key => key.user_id === userId);
            if (existingKey) {
                this.bot.sendMessage(chatId, 
                    `❌ Bạn đã có API key rồi!\n\n` +
                    `🔑 **API Key:** \`${existingKey.apikey}\`\n` +
                    `📊 **Requests còn lại:** ${existingKey.request}\n` +
                    `📅 **Ngày tạo:** ${existingKey.created_date}`,
                    { parse_mode: 'Markdown' }
                );
                return;
            }

            // Create new key object
            const keyData = {
                apikey: newApiKey,
                type: 'free',
                request: 1000,
                user_id: userId,
                username: username,
                created_date: new Date().toLocaleDateString('vi-VN'),
                created_time: new Date().toLocaleTimeString('vi-VN')
            };

            // Add to array and save
            apiKeys.push(keyData);
            fs.writeFileSync('./utils/APIKEY.json', JSON.stringify(apiKeys, null, 2));

            this.bot.sendMessage(chatId, 
                `✅ **Tạo API Key thành công!**\n\n` +
                `🔑 **API Key:** \`${newApiKey}\`\n` +
                `📊 **Loại:** Free (1000 requests)\n` +
                `📅 **Ngày tạo:** ${keyData.created_date}\n\n` +
                `💡 **Cách sử dụng:**\n` +
                `Thêm \`?apikey=${newApiKey}\` vào cuối URL API\n\n` +
                `⚠️ **Lưu ý:** Hãy bảo mật API key của bạn!`,
                { parse_mode: 'Markdown' }
            );

        } catch (error) {
            log('❌ Error creating new API key: ' + error.message, 'BOT');
            this.bot.sendMessage(chatId, '❌ Có lỗi xảy ra khi tạo API key. Vui lòng thử lại sau.');
        }
    }

    handleCheckKey(msg, apikey) {
        const chatId = msg.chat.id;

        if (!apikey) {
            this.bot.sendMessage(chatId, '❌ Vui lòng nhập API key!\nVí dụ: /checkkey YOUR_API_KEY');
            return;
        }

        try {
            const fs = require('fs');
            let apiKeys = [];

            try {
                const data = fs.readFileSync('./utils/APIKEY.json', 'utf8');
                apiKeys = JSON.parse(data);
            } catch (e) {
                this.bot.sendMessage(chatId, '❌ Không thể đọc dữ liệu API keys.');
                return;
            }

            const keyData = apiKeys.find(key => key.apikey === apikey);

            if (!keyData) {
                this.bot.sendMessage(chatId, '❌ API key không tồn tại hoặc không hợp lệ.');
                return;
            }

            const status = keyData.request > 0 ? '✅ Hoạt động' : '❌ Hết lượt request';

            this.bot.sendMessage(chatId, 
                `🔑 **Thông tin API Key:**\n\n` +
                `**Key:** \`${keyData.apikey}\`\n` +
                `**Loại:** ${keyData.type.toUpperCase()}\n` +
                `**Trạng thái:** ${status}\n` +
                `**Requests còn lại:** ${keyData.request}\n` +
                `**Chủ sở hữu:** ${keyData.username || 'Unknown'}\n` +
                `**Ngày tạo:** ${keyData.created_date || 'N/A'}`,
                { parse_mode: 'Markdown' }
            );

        } catch (error) {
            log('❌ Error checking API key: ' + error.message, 'BOT');
            this.bot.sendMessage(chatId, '❌ Có lỗi xảy ra khi kiểm tra API key.');
        }
    }

    handleAdminKeys(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (!this.adminIds.includes(userId)) {
            this.bot.sendMessage(chatId, '❌ Bạn không có quyền truy cập chức năng này.');
            return;
        }

        try {
            const fs = require('fs');
            let apiKeys = [];

            try {
                const data = fs.readFileSync('./utils/APIKEY.json', 'utf8');
                apiKeys = JSON.parse(data);
            } catch (e) {
                apiKeys = [];
            }

            if (apiKeys.length === 0) {
                this.bot.sendMessage(chatId, '📭 Chưa có API key nào được tạo.');
                return;
            }

            const totalKeys = apiKeys.length;
            const freeKeys = apiKeys.filter(k => k.type === 'free').length;
            const premiumKeys = apiKeys.filter(k => k.type === 'premium').length;
            const activeKeys = apiKeys.filter(k => k.request > 0).length;

            let message = `🔑 **Quản lý API Keys:**\n\n`;
            message += `📊 **Thống kê:**\n`;
            message += `• Tổng keys: ${totalKeys}\n`;
            message += `• Free keys: ${freeKeys}\n`;
            message += `• Premium keys: ${premiumKeys}\n`;
            message += `• Keys hoạt động: ${activeKeys}\n\n`;
            message += `📝 **Danh sách keys:**\n`;

            apiKeys.slice(0, 10).forEach((key, index) => {
                const status = key.request > 0 ? '✅' : '❌';
                message += `${index + 1}. ${status} \`${key.apikey.substring(0, 20)}...\` (${key.type})\n`;
            });

            if (apiKeys.length > 10) {
                message += `\n... và ${apiKeys.length - 10} keys khác`;
            }

            this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

        } catch (error) {
            log('❌ Error getting admin keys: ' + error.message, 'BOT');
            this.bot.sendMessage(chatId, '❌ Có lỗi xảy ra khi lấy danh sách API keys.');
        }
    }

    handleAdminAddKey(msg, type, requests, note) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (!this.adminIds.includes(userId)) {
            this.bot.sendMessage(chatId, '❌ Bạn không có quyền truy cập chức năng này.');
            return;
        }

        if (!['free', 'premium'].includes(type.toLowerCase())) {
            this.bot.sendMessage(chatId, '❌ Loại key không hợp lệ. Chỉ chấp nhận: free, premium');
            return;
        }

        const requestCount = parseInt(requests);
        if (isNaN(requestCount) || requestCount < 0) {
            this.bot.sendMessage(chatId, '❌ Số requests không hợp lệ.');
            return;
        }

        try {
            const fs = require('fs');
            const crypto = require('crypto');

            // Generate new API key
            const newApiKey = type.toUpperCase() + '_' + crypto.randomBytes(16).toString('hex').toUpperCase();

            // Load existing keys
            let apiKeys = [];
            try {
                const data = fs.readFileSync('./utils/APIKEY.json', 'utf8');
                apiKeys = JSON.parse(data);
            } catch (e) {
                apiKeys = [];
            }

            // Create new key object
            const keyData = {
                apikey: newApiKey,
                type: type.toLowerCase(),
                request: requestCount,
                note: note || 'Admin created',
                created_by: 'Admin',
                created_date: new Date().toLocaleDateString('vi-VN'),
                created_time: new Date().toLocaleTimeString('vi-VN')
            };

            // Add to array and save
            apiKeys.push(keyData);
            fs.writeFileSync('./utils/APIKEY.json', JSON.stringify(apiKeys, null, 2));

            this.bot.sendMessage(chatId, 
                `✅ **Tạo API Key thành công!**\n\n` +
                `🔑 **API Key:** \`${newApiKey}\`\n` +
                `📊 **Loại:** ${type.toUpperCase()}\n` +
                `🔢 **Requests:** ${requestCount}\n` +
                `📝 **Ghi chú:** ${note}\n` +
                `📅 **Ngày tạo:** ${keyData.created_date}`,
                { parse_mode: 'Markdown' }
            );

        } catch (error) {
            log('❌ Error creating admin API key: ' + error.message, 'BOT');
            this.bot.sendMessage(chatId, '❌ Có lỗi xảy ra khi tạo API key.');
        }
    }

    handleAdminDeleteKey(msg, apikey) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (!this.adminIds.includes(userId)) {
            this.bot.sendMessage(chatId, '❌ Bạn không có quyền truy cập chức năng này.');
            return;
        }

        try {
            const fs = require('fs');
            let apiKeys = [];

            try {
                const data = fs.readFileSync('./utils/APIKEY.json', 'utf8');
                apiKeys = JSON.parse(data);
            } catch (e) {
                this.bot.sendMessage(chatId, '❌ Không thể đọc dữ liệu API keys.');
                return;
            }

            const keyIndex = apiKeys.findIndex(key => key.apikey === apikey);

            if (keyIndex === -1) {
                this.bot.sendMessage(chatId, '❌ API key không tồn tại.');
                return;
            }

            const deletedKey = apiKeys[keyIndex];
            apiKeys.splice(keyIndex, 1);

            fs.writeFileSync('./utils/APIKEY.json', JSON.stringify(apiKeys, null, 2));

            this.bot.sendMessage(chatId, 
                `✅ **Đã xóa API Key thành công!**\n\n` +
                `🔑 **Key:** \`${deletedKey.apikey}\`\n` +
                `📊 **Loại:** ${deletedKey.type}\n` +
                `👤 **Chủ sở hữu:** ${deletedKey.username || deletedKey.note || 'Unknown'}`,
                { parse_mode: 'Markdown' }
            );

        } catch (error) {
            log('❌ Error deleting API key: ' + error.message, 'BOT');
            this.bot.sendMessage(chatId, '❌ Có lỗi xảy ra khi xóa API key.');
        }
    }

    handleKeyInfo(msg, apikey) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (!apikey) {
            this.bot.sendMessage(chatId, '❌ Vui lòng nhập API key!\nVí dụ: /keyinfo YOUR_API_KEY');
            return;
        }

        try {
            const fs = require('fs');
            let apiKeys = [];

            try {
                const data = fs.readFileSync('./utils/APIKEY.json', 'utf8');
                apiKeys = JSON.parse(data);
            } catch (e) {
                this.bot.sendMessage(chatId, '❌ Không thể đọc dữ liệu API keys.');
                return;
            }

            const keyData = apiKeys.find(key => key.apikey === apikey);

            if (!keyData) {
                this.bot.sendMessage(chatId, '❌ API key không tồn tại hoặc không hợp lệ.');
                return;
            }

            // Check if user owns this key or is admin
            if (keyData.user_id !== userId && !this.adminIds.includes(userId)) {
                this.bot.sendMessage(chatId, '❌ Bạn không có quyền xem thông tin key này.');
                return;
            }

            const status = keyData.request > 0 ? '✅ Hoạt động' : '❌ Hết lượt request';
            const usage = keyData.type === 'free' ? 1000 - keyData.request : 'Unlimited';

            const keyboard = {
                inline_keyboard: [
                    [{ text: '🗑️ Xóa Key này', callback_data: `delete_key_${apikey}` }]
                ]
            };

            this.bot.sendMessage(chatId, 
                `📋 **Thông tin chi tiết API Key:**\n\n` +
                `🔑 **Key:** \`${keyData.apikey}\`\n` +
                `📊 **Loại:** ${keyData.type.toUpperCase()}\n` +
                `🔋 **Trạng thái:** ${status}\n` +
                `🔢 **Requests còn lại:** ${keyData.request}\n` +
                `📈 **Đã sử dụng:** ${usage}\n` +
                `👤 **Chủ sở hữu:** ${keyData.username || 'Unknown'}\n` +
                `📅 **Ngày tạo:** ${keyData.created_date || 'N/A'}\n` +
                `⏰ **Giờ tạo:** ${keyData.created_time || 'N/A'}`,
                { parse_mode: 'Markdown', reply_markup: keyboard }
            );

        } catch (error) {
            log('❌ Error getting key info: ' + error.message, 'BOT');
            this.bot.sendMessage(chatId, '❌ Có lỗi xảy ra khi lấy thông tin API key.');
        }
    }

    handleUserDeleteKey(msg, apikey) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (!apikey) {
            this.bot.sendMessage(chatId, '❌ Vui lòng nhập API key!\nVí dụ: /delkey YOUR_API_KEY');
            return;
        }

        try {
            const fs = require('fs');
            let apiKeys = [];

            try {
                const data = fs.readFileSync('./utils/APIKEY.json', 'utf8');
                apiKeys = JSON.parse(data);
            } catch (e) {
                this.bot.sendMessage(chatId, '❌ Không thể đọc dữ liệu API keys.');
                return;
            }

            const keyIndex = apiKeys.findIndex(key => key.apikey === apikey);

            if (keyIndex === -1) {
                this.bot.sendMessage(chatId, '❌ API key không tồn tại.');
                return;
            }

            const keyToDelete = apiKeys[keyIndex];

            // Check if user owns this key or is admin
            if (keyToDelete.user_id !== userId && !this.adminIds.includes(userId)) {
                this.bot.sendMessage(chatId, '❌ Bạn chỉ có thể xóa key của chính mình.');
                return;
            }

            apiKeys.splice(keyIndex, 1);
            fs.writeFileSync('./utils/APIKEY.json', JSON.stringify(apiKeys, null, 2));

            this.bot.sendMessage(chatId, 
                `✅ **Đã xóa API Key thành công!**\n\n` +
                `🔑 **Key:** \`${keyToDelete.apikey}\`\n` +
                `📊 **Loại:** ${keyToDelete.type}\n` +
                `💡 **Lưu ý:** Bạn có thể tạo key mới bằng lệnh /newkey`,
                { parse_mode: 'Markdown' }
            );

        } catch (error) {
            log('❌ Error deleting user API key: ' + error.message, 'BOT');
            this.bot.sendMessage(chatId, '❌ Có lỗi xảy ra khi xóa API key.');
        }
    }

    handleMaintenance(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (!this.adminIds.includes(userId)) {
            this.bot.sendMessage(chatId, '❌ Bạn không có quyền truy cập chức năng này.');
            return;
        }

        const keyboard = {
            inline_keyboard: [
                [
                    { text: '🔧 Bật Maintenance', callback_data: 'maintenance_on' },
                    { text: '✅ Tắt Maintenance', callback_data: 'maintenance_off' }
                ],
                [{ text: '📊 Trạng thái hiện tại', callback_data: 'maintenance_status' }]
            ]
        };

        this.bot.sendMessage(chatId, 
            '🔧 **Chế độ bảo trì Server:**\n\n' +
            'Chọn hành động bạn muốn thực hiện:', 
            { parse_mode: 'Markdown', reply_markup: keyboard }
        );
    }

    handleServerRestart(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (!this.adminIds.includes(userId)) {
            this.bot.sendMessage(chatId, '❌ Bạn không có quyền truy cập chức năng này.');
            return;
        }

        const keyboard = {
            inline_keyboard: [
                [
                    { text: '⚠️ Xác nhận Restart', callback_data: 'confirm_restart' },
                    { text: '❌ Hủy bỏ', callback_data: 'cancel_restart' }
                ]
            ]
        };

        this.bot.sendMessage(chatId, 
            '🔄 **Khởi động lại Server:**\n\n' +
            '⚠️ **Cảnh báo:** Server sẽ tạm thời offline trong vài giây.\n' +
            'Tất cả kết nối hiện tại sẽ bị ngắt.\n\n' +
            'Bạn có chắc chắn muốn khởi động lại server?', 
            { parse_mode: 'Markdown', reply_markup: keyboard }
        );
    }

    handleReloadRoutes(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (!this.adminIds.includes(userId)) {
            this.bot.sendMessage(chatId, '❌ Bạn không có quyền sử dụng lệnh này.');
            return;
        }

        try {
            // Trigger route reload
            const { loadAllRoutes } = require('./Main/app/server.js');
            if (typeof loadAllRoutes === 'function') {
                loadAllRoutes();
                this.bot.sendMessage(chatId, '✅ Đã reload tất cả routes thành công!');
            } else {
                this.bot.sendMessage(chatId, '❌ Không thể reload routes. Function không tồn tại.');
            }
        } catch (error) {
            log('❌ Error reloading routes: ' + error.message, 'BOT');
            this.bot.sendMessage(chatId, '❌ Có lỗi xảy ra khi reload routes: ' + error.message);
        }
    }

    handleViewLogs(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (!this.adminIds.includes(userId)) {
            this.bot.sendMessage(chatId, '❌ Bạn không có quyền xem logs.');
            return;
        }

        try {
            const fs = require('fs');
            const logPath = './logs/api.log';
            
            if (fs.existsSync(logPath)) {
                const logs = fs.readFileSync(logPath, 'utf8');
                const recentLogs = logs.split('\n').slice(-20).join('\n');
                
                this.bot.sendMessage(chatId, 
                    `📋 **Server Logs (20 dòng gần nhất):**\n\n\`\`\`\n${recentLogs}\n\`\`\``,
                    { parse_mode: 'Markdown' }
                );
            } else {
                this.bot.sendMessage(chatId, '❌ Không tìm thấy file logs.');
            }
        } catch (error) {
            this.bot.sendMessage(chatId, '❌ Có lỗi khi đọc logs: ' + error.message);
        }
    }

    handleVersion(msg) {
        const chatId = msg.chat.id;
        
        try {
            const packageJson = require('./package.json');
            const message = `
🤖 **BLACK-GOKU API Bot Info:**

📦 **Version:** ${packageJson.version || '1.0.0'}
🔧 **Node.js:** ${process.version}
💾 **Memory:** ${Math.round(process.memoryUsage().used / 1024 / 1024)}MB
⏱️ **Uptime:** ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m
🌐 **Platform:** ${process.platform}
            `;

            this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } catch (error) {
            this.bot.sendMessage(chatId, '❌ Không thể lấy thông tin version.');
        }
    }

    // Handle callback queries
    setupCallbackHandlers() {
        this.bot.on('callback_query', (query) => {
            const chatId = query.message.chat.id;
            const data = query.data;

            this.bot.answerCallbackQuery(query.id);

            switch (data) {
                case 'stats':
                    this.handleStats({ chat: { id: chatId } });
                    break;
                case 'status':
                    this.handleServerStatus({ chat: { id: chatId } });
                    break;
                case 'routes':
                    this.handleApiRoutes({ chat: { id: chatId } });
                    break;
                case 'help':
                    this.sendHelpMessage(chatId);
                    break;
                case 'admin':
                    this.handleAdminMenu({ chat: { id: chatId }, from: { id: query.from.id } });
                    break;
                case 'admin_stats':
                    this.handleStats({ chat: { id: chatId } });
                    break;
                case 'admin_maintenance':
                    this.bot.sendMessage(chatId, '🔧 Maintenance mode not implemented yet.');
                    break;
                case 'admin_broadcast':
                    this.bot.sendMessage(chatId, '📢 Use /broadcast [message] command to send broadcast.');
                    break;
                case 'admin_keys':
                    this.handleAdminKeys({ chat: { id: chatId }, from: { id: query.from.id } });
                    break;
                case 'newkey':
                    this.handleNewKey({ chat: { id: chatId }, from: query.from });
                    break;
                case 'checkkey':
                    this.bot.sendMessage(chatId, '🔍 **Kiểm tra API Key:**\n\nSử dụng lệnh: `/checkkey YOUR_API_KEY`', 
                        { parse_mode: 'Markdown' });
                    break;
                case 'keyinfo':
                    this.bot.sendMessage(chatId, '📋 **Thông tin API Key:**\n\nSử dụng lệnh: `/keyinfo YOUR_API_KEY`', 
                        { parse_mode: 'Markdown' });
                    break;
                case 'delkey':
                    this.bot.sendMessage(chatId, '🗑️ **Xóa API Key:**\n\nSử dụng lệnh: `/delkey YOUR_API_KEY`', 
                        { parse_mode: 'Markdown' });
                    break;
                case 'admin_restart':
                    this.handleServerRestart({ chat: { id: chatId }, from: { id: query.from.id } });
                    break;
                case 'admin_control':
                    this.handleMaintenance({ chat: { id: chatId }, from: { id: query.from.id } });
                    break;
                case 'maintenance_on':
                    if (!this.adminIds.includes(query.from.id)) {
                        this.bot.sendMessage(chatId, '❌ Bạn không có quyền truy cập chức năng này.');
                        break;
                    }
                    try {
                        const fs = require('fs');
                        const maintenanceFile = './Main/tmp/maintenance.txt';
                        fs.writeFileSync(maintenanceFile, 'maintenance_mode_enabled');
                        this.bot.sendMessage(chatId, '🔧 Đã bật chế độ bảo trì. Server sẽ từ chối các request mới.');
                        // Notify other admins
                        this.adminIds.forEach(adminId => {
                            if (adminId !== query.from.id) {
                                this.bot.sendMessage(adminId, `🔧 **Maintenance Mode ON**\n\nAdmin ${query.from.first_name} đã bật chế độ bảo trì lúc ${new Date().toLocaleString('vi-VN')}`);
                            }
                        });
                    } catch (error) {
                        this.bot.sendMessage(chatId, '❌ Lỗi khi bật chế độ bảo trì: ' + error.message);
                    }
                    break;
                case 'maintenance_off':
                    if (!this.adminIds.includes(query.from.id)) {
                        this.bot.sendMessage(chatId, '❌ Bạn không có quyền truy cập chức năng này.');
                        break;
                    }
                    try {
                        const fs = require('fs');
                        const maintenanceFile = './Main/tmp/maintenance.txt';
                        if (fs.existsSync(maintenanceFile)) {
                            fs.unlinkSync(maintenanceFile);
                        }
                        this.bot.sendMessage(chatId, '✅ Đã tắt chế độ bảo trì. Server hoạt động bình thường.');
                        // Notify other admins
                        this.adminIds.forEach(adminId => {
                            if (adminId !== query.from.id) {
                                this.bot.sendMessage(adminId, `✅ **Maintenance Mode OFF**\n\nAdmin ${query.from.first_name} đã tắt chế độ bảo trì lúc ${new Date().toLocaleString('vi-VN')}`);
                            }
                        });
                    } catch (error) {
                        this.bot.sendMessage(chatId, '❌ Lỗi khi tắt chế độ bảo trì: ' + error.message);
                    }
                    break;
                case 'maintenance_status':
                    try {
                        const fs = require('fs');
                        const maintenanceFile = './Main/tmp/maintenance.txt';
                        const isMaintenanceMode = fs.existsSync(maintenanceFile);
                        const status = isMaintenanceMode ? '🔧 Chế độ bảo trì ĐANG BẬT' : '✅ Server hoạt động bình thường';
                        this.bot.sendMessage(chatId, `📊 **Trạng thái Server:**\n\n${status}`);
                    } catch (error) {
                        this.bot.sendMessage(chatId, '❌ Lỗi khi kiểm tra trạng thái: ' + error.message);
                    }
                    break;
                case 'confirm_restart':
                    if (!this.adminIds.includes(query.from.id)) {
                        this.bot.sendMessage(chatId, '❌ Bạn không có quyền truy cập chức năng này.');
                        break;
                    }
                    this.bot.sendMessage(chatId, '🔄 Đang khởi động lại server... Vui lòng đợi 30 giây.');
                    // Notify all admins
                    this.adminIds.forEach(adminId => {
                        if (adminId !== query.from.id) {
                            this.bot.sendMessage(adminId, `🔄 **Server Restart:**\n\nAdmin ${query.from.first_name} đã khởi động lại server lúc ${new Date().toLocaleString('vi-VN')}`);
                        }
                    });
                    // Create restart flag file
                    try {
                        const fs = require('fs');
                        fs.writeFileSync('./Main/tmp/restart.txt', new Date().toISOString());
                    } catch (error) {
                        console.log('Error creating restart flag:', error.message);
                    }
                    // Restart server after 3 seconds
                    setTimeout(() => {
                        process.exit(0);
                    }, 3000);
                    break;
                case 'cancel_restart':
                    this.bot.sendMessage(chatId, '❌ Đã hủy lệnh khởi động lại server.');
                    break;
                case 'reload_routes':
                    this.handleReloadRoutes({ chat: { id: chatId }, from: { id: query.from.id } });
                    break;
                case 'view_logs':
                    this.handleViewLogs({ chat: { id: chatId }, from: { id: query.from.id } });
                    break;
                case 'version_info':
                    this.handleVersion({ chat: { id: chatId } });
                    break;
            }
        });
    }
}

// Initialize bot
const bot = new SimpleAPIBot();
if (bot.isAvailable) {
    log('🚀 Simple API Bot started successfully', 'BOT');
} else {
    log('❌ Bot failed to start - check token configuration', 'BOT');
}

module.exports = bot;