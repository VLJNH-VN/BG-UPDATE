'use strict';
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { router, loadedRoutes } = require("./server.js");
const log = require("../../utils/logger");
const checkAPI = require("../../utils");
const config = require("../../config.json");
const APIKEY = process.cwd() + "/utils/APIKEY.json";
const globalFunctions = require("../global.js");
const app = express();
const getIP = require('ipware')().get_ip;
const fs = require('fs');
const { resolve } = require("path");
const path = resolve(__dirname, 'data.json');
const { writeFileSync } = require('fs');

global.checkAPI = checkAPI.check_api_key;
global.config = config;
global.APIKEY = APIKEY;
global._404 = process.cwd() + '/public/_404.html';

// Import global functions
global.searchTikTok = globalFunctions.searchTikTok;
global.downloadMedia = globalFunctions.downloadMedia;
global.convertMp3ToAac = globalFunctions.convertMp3ToAac;

app.use(helmet());
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
    if(global.admin === true || global.admin === false) return next();
    
    var ipInfo = getIP(req);
    var block = require("../../utils/block-ban/block.js")(ipInfo.clientIp);
    if (block === true) return res.status(403).json({ error: 'IP blocked' });
    
    var limit = require("../../utils/block-ban/limit-request.js")(ipInfo.clientIp);
    var type = (global.config.ADMIN && global.config.ADMIN.includes(ipInfo.clientIp)) ? 'ADMIN' : 'IP';
    // Chỉ log các request quan trọng, bỏ qua favicon và static files
    if (!req.url.includes('favicon.ico') && !req.url.includes('.css') && !req.url.includes('.js') && !req.url.includes('.png')) {
        log(`${type}: ${ipInfo.clientIp} - ${req.url}`, 'STATUS');
    }
    next();
});

app.get('/total_request', function (request, response) {
    var admin = request.query.admin
    if(admin == "true") {
        global.admin = true
    }
    var data = require('../data.json')
    response.status(200).json(data)
});

app.use(function (req, res, next) {
    if(global.admin == true) {
        global.admin = false
        return next();
    }
    var data = require('../data.json');
    data.total = data.total + 1
    writeFileSync(path, JSON.stringify(data, null, 4));
    next();
});

app.use("/", router);
app.set("json spaces", 4);
app.get('/', function (request, response) {
    // Icon mapping for categories
    const categoryIcons = {
        'Download': 'fas fa-download',
        'Media': 'fas fa-photo-video',
        'Social': 'fas fa-users',
        'Tiktok': 'fab fa-tiktok',
        'Games': 'fas fa-gamepad',
        'Utilities': 'fas fa-tools',
        'Tiện ích': 'fas fa-wrench',
        'Khác': 'fas fa-puzzle-piece'
    };

    let categoryHtml = Object.entries(loadedRoutes).map(([category, routes]) => {
        let routeLinks = routes.map(route => {
            let params = route.params.join(', ');
            return `
            <li class="api-item">
                <div class="route-info">
                    <div class="route-name">${route.name}</div>
                    <div class="params">Parameters: ${params || 'Không có'}</div>
                </div>
                <a href="${route.name}${params ? '?' + params.replace(/, /g, '&') + '=' : ''}" class="get-button">
                    <i class="fas fa-play"></i> GET
                </a>
            </li>
            `;
        }).join('');

        const icon = categoryIcons[category] || 'fas fa-folder';
        return `
        <div class="category">
            <div class="category-header">
                <i class="${icon}"></i>
                <span>${category}</span>
                <span style="margin-left: auto; font-size: 0.9rem; opacity: 0.8;">${routes.length} APIs</span>
            </div>
            <ul class="api-list">
                ${routeLinks}
            </ul>
        </div>
        `;
    }).join('');

    response.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BLACK-GOKU API - VLjnh</title>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: #333;
                line-height: 1.6;
            }

            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }

            .header {
                text-align: center;
                margin-bottom: 40px;
                color: white;
            }

            .header h1 {
                font-size: 2.5rem;
                margin-bottom: 10px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }

            .header .subtitle {
                font-size: 1.2rem;
                opacity: 0.9;
                margin-bottom: 20px;
            }

            .stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 40px;
            }

            .stat-card {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 20px;
                text-align: center;
                color: white;
                border: 1px solid rgba(255,255,255,0.2);
            }

            .stat-card i {
                font-size: 2rem;
                margin-bottom: 10px;
                color: #ffd700;
            }

            .stat-card h3 {
                font-size: 1.5rem;
                margin-bottom: 5px;
            }

            .category {
                background: white;
                border-radius: 15px;
                margin-bottom: 25px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                overflow: hidden;
                transition: transform 0.3s ease;
            }

            .category:hover {
                transform: translateY(-5px);
            }

            .category-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                font-size: 1.4rem;
                font-weight: bold;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .category-header i {
                font-size: 1.2rem;
            }

            .api-list {
                list-style: none;
                padding: 0;
            }

            .api-item {
                display: flex;
                align-items: center;
                padding: 15px 20px;
                border-bottom: 1px solid #f0f0f0;
                transition: background-color 0.3s ease;
            }

            .api-item:hover {
                background-color: #f8f9fa;
            }

            .api-item:last-child {
                border-bottom: none;
            }

            .route-info {
                flex: 1;
                min-width: 0;
            }

            .route-name {
                font-weight: bold;
                color: #2c3e50;
                font-size: 1rem;
                margin-bottom: 5px;
            }

            .params {
                color: #7f8c8d;
                font-size: 0.9rem;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .get-button {
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                text-decoration: none;
                font-size: 0.9rem;
                font-weight: bold;
                transition: all 0.3s ease;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 5px;
                margin-left: 10px;
            }

            .get-button:hover {
                transform: scale(1.05);
                box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
            }

            .profile {
                background: white;
                border-radius: 15px;
                padding: 30px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                margin-top: 40px;
            }

            .profile h2 {
                color: #2c3e50;
                margin-bottom: 20px;
                font-size: 1.8rem;
            }

            .profile-links {
                display: flex;
                justify-content: center;
                gap: 20px;
                flex-wrap: wrap;
                margin-top: 20px;
            }

            .profile-link {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 20px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                text-decoration: none;
                border-radius: 25px;
                transition: all 0.3s ease;
                font-weight: bold;
            }

            .profile-link:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
            }

            .search-box {
                background: white;
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 30px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            }

            .search-input {
                width: 100%;
                padding: 15px;
                border: 2px solid #e9ecef;
                border-radius: 10px;
                font-size: 1rem;
                transition: border-color 0.3s ease;
            }

            .search-input:focus {
                outline: none;
                border-color: #667eea;
            }

            @media (max-width: 768px) {
                .container {
                    padding: 15px;
                }

                .header h1 {
                    font-size: 2rem;
                }

                .header .subtitle {
                    font-size: 1rem;
                }

                .stats {
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                }

                .stat-card {
                    padding: 15px;
                }

                .category-header {
                    padding: 15px;
                    font-size: 1.2rem;
                }

                .api-item {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 15px;
                }

                .get-button {
                    align-self: flex-end;
                    margin-left: 0;
                }

                .profile-links {
                    flex-direction: column;
                    align-items: center;
                }

                .route-name {
                    font-size: 0.9rem;
                }

                .params {
                    font-size: 0.8rem;
                }
            }

            @media (max-width: 480px) {
                .header h1 {
                    font-size: 1.8rem;
                }

                .stats {
                    grid-template-columns: 1fr;
                }

                .api-item {
                    padding: 12px;
                }

                .category-header {
                    padding: 12px;
                    font-size: 1.1rem;
                }
            }

            .hidden {
                display: none;
            }

            .api-key-section {
                background: white;
                border-radius: 15px;
                padding: 30px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                margin-bottom: 30px;
                border: 2px solid #667eea;
            }

            .api-key-section h2 {
                color: #2c3e50;
                margin-bottom: 20px;
                font-size: 1.8rem;
            }

            .key-features {
                display: flex;
                justify-content: center;
                gap: 30px;
                margin: 20px 0;
                flex-wrap: wrap;
            }

            .feature {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #28a745;
                font-weight: bold;
            }

            .feature i {
                font-size: 1.2rem;
            }

            .bot-buttons {
                margin-top: 25px;
            }

            .bot-button {
                display: inline-block;
                padding: 15px 30px;
                background: linear-gradient(135deg, #0088cc, #0099ff);
                color: white;
                text-decoration: none;
                border-radius: 30px;
                font-size: 1.1rem;
                font-weight: bold;
                transition: all 0.3s ease;
                margin-bottom: 20px;
                box-shadow: 0 5px 15px rgba(0, 136, 204, 0.3);
            }

            .bot-button:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 25px rgba(0, 136, 204, 0.4);
            }

            .bot-commands {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 20px;
                margin-top: 20px;
                text-align: left;
                max-width: 500px;
                margin-left: auto;
                margin-right: auto;
            }

            .command-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #e9ecef;
            }

            .command-item:last-child {
                border-bottom: none;
            }

            .command {
                font-family: monospace;
                background: #e9ecef;
                padding: 4px 8px;
                border-radius: 4px;
                color: #495057;
                font-weight: bold;
            }

            .description {
                color: #6c757d;
                font-size: 0.9rem;
            }

            @media (max-width: 768px) {
                .key-features {
                    flex-direction: column;
                    gap: 15px;
                }

                .feature {
                    justify-content: center;
                }

                .bot-commands {
                    text-align: center;
                }

                .command-item {
                    flex-direction: column;
                    gap: 5px;
                    text-align: center;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1><i class="fas fa-code"></i> BLACK-GOKU API</h1>
                <div class="subtitle">Powerful API Collection by VLjnh</div>
            </div>

            <div class="stats">
                <div class="stat-card">
                    <i class="fas fa-rocket"></i>
                    <h3>${Object.keys(loadedRoutes).length}</h3>
                    <p>Categories</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-plug"></i>
                    <h3>${Object.values(loadedRoutes).flat().length}</h3>
                    <p>Endpoints</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-clock"></i>
                    <h3>24/7</h3>
                    <p>Uptime</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-shield-alt"></i>
                    <h3>Secure</h3>
                    <p>API Keys</p>
                </div>
            </div>

            <div class="search-box">
                <input type="text" class="search-input" placeholder="🔍 Tìm kiếm API endpoints..." id="searchInput">
            </div>

            ${categoryHtml}

            <div class="api-key-section">
                <h2><i class="fas fa-key"></i> Lấy API Key Miễn Phí</h2>
                <div class="key-info">
                    <p style="font-size: 1.1rem; color: #666; margin-bottom: 20px;">
                        Để sử dụng API, bạn cần có API key. Nhận ngay 1000 requests miễn phí!
                    </p>
                    <div class="key-features">
                        <div class="feature">
                            <i class="fas fa-gift"></i>
                            <span>1000 requests miễn phí</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-clock"></i>
                            <span>Không giới hạn thời gian</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-shield-alt"></i>
                            <span>Bảo mật tuyệt đối</span>
                        </div>
                    </div>
                    <div class="bot-buttons">
                        <a href="https://t.me/bgapikey_bot" class="bot-button" target="_blank">
                            <i class="fab fa-telegram"></i> Lấy API Key Miễn Phí
                        </a>
                        <div class="bot-commands">
                            <div class="command-item">
                                <span class="command">/newkey</span>
                                <span class="description">Tạo API key mới</span>
                            </div>
                            <div class="command-item">
                                <span class="command">/keyinfo [key]</span>
                                <span class="description">Kiểm tra thông tin key</span>
                            </div>
                            <div class="command-item">
                                <span class="command">/help</span>
                                <span class="description">Xem hướng dẫn</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="profile">
                <h2><i class="fas fa-user-circle"></i> Profile VLjnh</h2>
                <p style="font-size: 1.1rem; color: #666; margin-bottom: 20px;">
                    Passionate developer creating powerful APIs for the community
                </p>
                <div class="profile-links">
                    <a href="https://www.facebook.com/culo2006" class="profile-link">
                        <i class="fab fa-facebook"></i> Facebook
                    </a>
                    <a href="#" class="profile-link">
                        <i class="fas fa-wallet"></i> MOMO: 0336176273
                    </a>
                </div>
            </div>
        </div>

        <script>
            // Search functionality
            document.getElementById('searchInput').addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase();
                const categories = document.querySelectorAll('.category');

                categories.forEach(category => {
                    const apiItems = category.querySelectorAll('.api-item');
                    let hasVisibleItems = false;

                    apiItems.forEach(item => {
                        const routeName = item.querySelector('.route-name').textContent.toLowerCase();
                        const params = item.querySelector('.params').textContent.toLowerCase();

                        if (routeName.includes(searchTerm) || params.includes(searchTerm)) {
                            item.style.display = 'flex';
                            hasVisibleItems = true;
                        } else {
                            item.style.display = 'none';
                        }
                    });

                    category.style.display = hasVisibleItems ? 'block' : 'none';
                });
            });

            // Copy to clipboard functionality
            function copyToClipboard(text) {
                navigator.clipboard.writeText(text).then(() => {
                    // Show toast notification
                    const toast = document.createElement('div');
                    toast.innerHTML = '✅ Copied to clipboard!';
                    toast.style.cssText = \`
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #28a745;
                        color: white;
                        padding: 10px 20px;
                        border-radius: 5px;
                        z-index: 1000;
                        animation: slideIn 0.3s ease;
                    \`;
                    document.body.appendChild(toast);
                    setTimeout(() => document.body.removeChild(toast), 3000);
                });
            }

            // Add click to copy functionality to route names
            document.querySelectorAll('.route-name').forEach(route => {
                route.style.cursor = 'pointer';
                route.title = 'Click to copy';
                route.addEventListener('click', () => {
                    copyToClipboard(route.textContent);
                });
            });
        </script>

        <style>
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        </style>
    </body>
    </html>
    `);
});



app.post('/upcode', function (req, res) {
    var code = req.body.code;
    var id = ((Math.random() + 1).toString(36).substring(2)).toUpperCase()
    fs.writeFile(
        `${__dirname}/public/codeStorage/database/_${id}.js`,
        code,
        "utf-8",
        function (err) {
            if (err) return res.status(500).json({
                status: false,
                message: 'Không thể up code của bạn lên!'
            })
            return res.status(200).json({
                status: true,
                url: '' + id
            })
        }
    );
});

// Check rate limit
app.use(require('../../utils/block-ban/limit-request'));

// Maintenance mode middleware
app.use((req, res, next) => {
    const fs = require('fs');
    const maintenanceFile = './Main/tmp/maintenance.txt';

    try {
        if (fs.existsSync(maintenanceFile)) {
            // Allow admin access
            const config = require('../../config.json');
            const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
            const isAdmin = config.ADMIN && config.ADMIN.includes(clientIP);

            if (!isAdmin) {
                return res.status(503).json({
                    error: 'Service Unavailable',
                    message: 'Server đang trong chế độ bảo trì. Vui lòng thử lại sau.',
                    maintenance: true,
                    timestamp: new Date().toISOString()
                });
            }
        }
    } catch (error) {
        console.log('Maintenance check error:', error.message);
    }

    next();
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Đã xảy ra lỗi server',
            status: err.status || 500
        }
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const port = process.env.PORT || 5000;
app.set('port', port);
app.listen(port, '0.0.0.0', function() {
    log(`API BLACK-GOKU is running on port ${port}`, 'HOST UPTIME');
    console.log(`🌐 Server URL: http://0.0.0.0:${port}`);
});