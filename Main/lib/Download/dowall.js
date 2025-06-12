exports.name = '/media/dowall';
'use strict';

const axios = require('axios');
const { key_BG } = require('../../../utils/check.js');

exports.index = async (req, res) => {
    try {
        // Xác minh API Key
        if (key_BG(req, res)) return;

        const url = req.query.url;
        if (!url) {
            return res.status(400).json({ 
                success: false,
                error: 'Thiếu tham số url',
                parameters: {
                    required: {
                        url: {
                            type: "string", 
                            description: "URL của hình ảnh cần tải xuống",
                            example: "https://example.com/image.jpg"
                        }
                    }
                },
                usage: {
                    endpoint: "/media/dowall",
                    method: "GET",
                    example: "/media/dowall?url=https://example.com/image.jpg"
                }
            });
        }

        const { downloadMedia, convertMp3ToAac } = require('../../global');
        const mediaResult = await downloadMedia(url);

        if (!mediaResult.success) {
            return res.status(400).json({ error: mediaResult.error || "Không lấy được dữ liệu!" });
        }

        let data = {
            medias: mediaResult.medias || [],
            title: mediaResult.title || "",
            thumbnail: mediaResult.thumbnail || ""
        };

        for (let media of data.medias) {
            if (media.type === "audio" && media.extension === "mp3") {
                try {
                    const convertResult = await convertMp3ToAac(media.url, req);
                    media.aac = convertResult.success ? convertResult.aac_url : "";
                } catch (error) {
                    media.aac = "";
                    console.error("Lỗi khi chuyển đổi MP3 → AAC:", error.message);
                }
            }
        }

        res.json(data);
    } catch (error) {
        console.error("Lỗi API:", error.message);
        res.status(500).json({ error: "Có lỗi xảy ra khi xử lý yêu cầu" });
    }
};