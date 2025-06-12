'use strict';

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { key_BG } = require('../../../utils/check.js');

exports.name = '/randomtiktok';

const EDITS = [
    "@iconsrikka", "@smiley_cosplay_26th1", "@i_am_ngvtien06", "@pmaosensei", "@ngancosplay_204", 
    "@nnnnaa1", "@anlmecos", "@ninokawaiii", "@ssarahh1311", "@etamecosplay26", "@dumbapples0", 
    "@ruuent", "@maixphat", "@fuyuka05.7", "@lovewaifu2345"
];

exports.index = async (req, res) => {
    try {
        // Xác thực API Key
        if (key_BG(req, res)) return;

        const { search, help } = req.query;
        
        // Hiển thị help parameters nếu được yêu cầu
        if (help === 'true') {
            return res.json({
                endpoint: "/randomtiktok",
                description: "Lấy ngẫu nhiên video TikTok từ danh sách tác giả hoặc từ khóa tìm kiếm",
                parameters: {
                    required: {
                        apikey: {
                            type: "string",
                            description: "API key để xác thực",
                            example: "your_api_key_here"
                        }
                    },
                    optional: {
                        search: {
                            type: "string", 
                            description: "Từ khóa hoặc username để tìm kiếm video",
                            default: "random_from_predefined_list",
                            example: "@username hoặc 'dance'"
                        },
                        help: {
                            type: "boolean",
                            description: "Hiển thị thông tin parameters",
                            example: "true"
                        }
                    }
                },
                usage: {
                    random: "/randomtiktok?apikey=YOUR_KEY",
                    with_search: "/randomtiktok?search=dance&apikey=YOUR_KEY"
                },
                examples: {
                    random_video: "/randomtiktok?apikey=abc123",
                    search_specific: "/randomtiktok?search=@username&apikey=abc123",
                    help_info: "/randomtiktok?help=true&apikey=abc123"
                },
                predefined_users: EDITS,
                note: "Nếu không có tham số search, sẽ chọn ngẫu nhiên từ danh sách tác giả có sẵn"
            });
        }

        let searchQuery = search || EDITS[Math.floor(Math.random() * EDITS.length)];
        const limit = 10;
        const { searchTikTok } = require('../../global');
        const searchResult = await searchTikTok(searchQuery, limit);

        if (!searchResult.success || !searchResult.videos?.length) {
            return res.status(404).json({ success: false, message: `Không tìm thấy video nào cho từ khóa: ${searchQuery}` });
        }

        const randomVideo = searchResult.videos[Math.floor(Math.random() * searchResult.videos.length)];

        const message = {
            success: true,
            post_by: randomVideo.author?.nickname || "Không rõ",
            username: randomVideo.author?.unique_id || "Không rõ",
            content: randomVideo.title || "Không có tiêu đề",
            video_url: randomVideo.no_watermark
        };

        console.log("Video được chọn:", message);

        const videoUrl = randomVideo.no_watermark;
        const videoResponse = await axios.get(videoUrl, { responseType: 'stream', timeout: 5000 });

        const filePath = path.join(__dirname, 'video');
        if (!fs.existsSync(filePath)) fs.mkdirSync(filePath, { recursive: true });

        const videoFilePath = path.join(filePath, `${Date.now()}.mp4`);
        const writer = fs.createWriteStream(videoFilePath);
        videoResponse.data.pipe(writer);

        writer.on('finish', () => {
            res.sendFile(videoFilePath, () => {
                fs.unlink(videoFilePath, (err) => {
                    if (err) console.error("Lỗi xóa file:", err);
                });
            });
        });

    } catch (error) {
        console.error('Lỗi:', error.message);
        res.status(500).json({ error: "Đã xảy ra lỗi khi xử lý yêu cầu." });
    }
};