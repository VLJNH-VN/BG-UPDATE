'use strict';

const axios = require("axios");
const chalk = require('chalk');

exports.name = '/tiktok/search';

const CONFIG = {
    API_URL: "https://tikwm.com/api/feed/search",
    HEADERS: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Cookie": "current_language=en",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
    }
};

exports.index = async (req, res) => {
    try {
        // API key validation
        const { key_BG } = require('../../../utils/check.js');
        if (key_BG(req, res)) return;

        const query = req.query.query;
        const limit = parseInt(req.query.limit) || 10; 

        if (!query) {
            return res.status(400).json({ 
                error: "Thiếu tham số query",
                usage: "GET /tiktok/searchtt?query=<search_term>&limit=<number>&apikey=<your_api_key>",
                example: "GET /tiktok/searchtt?query=lonmup&limit=5&apikey=YOUR_KEY",
                note: "Limit tối đa là 10, mặc định là 10"
            });
        }

        const response = await axios.post(CONFIG.API_URL, new URLSearchParams({
            keywords: query,
            count: 50,
            cursor: 0,
            HD: 1
        }).toString(), { headers: CONFIG.HEADERS });

        const videos = response.data.data?.videos || [];
        if (videos.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy video nào." });
        }

        const selectedVideos = videos.slice(0, limit).map(video => ({
            title: video.title,
            cover: video.cover,
            origin_cover: video.origin_cover,
            no_watermark: video.play,
            watermark: video.wmplay,
            music: video.music,
            author: {
                nickname: video.author?.nickname || "Không rõ",
                unique_id: video.author?.unique_id || "Không rõ"
            }
        }));

        console.log(chalk.cyan(`🔍 TT: ${query} (${selectedVideos.length})`));

        res.json({
            success: true,
            videos: selectedVideos
        });
    } catch (error) {
        console.error("Lỗi khi lấy video TikTok:", error);
        res.status(500).json({ error: "Không thể lấy video TikTok" });
    }
};