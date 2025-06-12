'use strict';

const fs = require('fs');
const path = require('path');
const { key_BG } = require('../../../utils/check.js');
exports.name = '/tiktok/list-stats';

const DATA_DIR = path.join(__dirname, 'data', 'users');

// Đảm bảo thư mục data/users tồn tại
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Tải dữ liệu từ file uid cụ thể
function loadUserStats(uid) {
    try {
        const filePath = path.join(DATA_DIR, `${uid}.json`);
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(`❌ Đọc ${uid}.json: ${error.message}`);
    }
    return null;
}

// Thống kê link download từ data của user
function getDownloadLinksStats(userData) {
    if (!userData || !userData.videos || !Array.isArray(userData.videos)) {
        return {
            total_videos: 0,
            total_download_links: 0,
            video_with_downloads: 0,
            links_by_quality: {},
            links_by_type: {}
        };
    }

    let totalDownloadLinks = 0;
    let videoWithDownloads = 0;
    const linksByQuality = {};
    const linksByType = {};

    userData.videos.forEach(video => {
        if (video.download_urls && video.download_urls.has_download && video.download_urls.medias) {
            videoWithDownloads++;

            video.download_urls.medias.forEach(media => {
                totalDownloadLinks++;

                // Thống kê theo quality
                const quality = media.quality || 'unknown';
                linksByQuality[quality] = (linksByQuality[quality] || 0) + 1;

                // Thống kê theo type
                const type = media.type || 'unknown';
                linksByType[type] = (linksByType[type] || 0) + 1;
            });
        }
    });

    return {
        total_videos: userData.videos.length,
        total_download_links: totalDownloadLinks,
        video_with_downloads: videoWithDownloads,
        links_by_quality: linksByQuality,
        links_by_type: linksByType
    };
}

// Lấy chi tiết tất cả link download
function getAllDownloadLinks(userData) {
    if (!userData || !userData.videos || !Array.isArray(userData.videos)) {
        return [];
    }

    const allLinks = [];

    userData.videos.forEach((video, index) => {
        if (video.download_urls && video.download_urls.has_download && video.download_urls.medias) {
            video.download_urls.medias.forEach((media, mediaIndex) => {
                allLinks.push({
                    video_index: index + 1,
                    video_id: video.video_id,
                    video_title: video.title,
                    video_url: video.video_url,
                    media_index: mediaIndex + 1,
                    download_url: media.url,
                    quality: media.quality,
                    type: media.type,
                    extension: media.extension,
                    data_size: media.data_size,
                    duration: media.duration || null
                });
            });
        }
    });

    return allLinks;
}

exports.index = async (req, res) => {
    try {
        // Xác minh API Key
        if (key_BG(req, res)) return;
        
        const { uid, all } = req.query;

        if (!uid) {
            return res.status(400).json({
                success: false,
                error: "Thiếu tham số UID",
                parameters: {
                    required: {
                        uid: {
                            type: "string",
                            description: "Mã định danh để lấy dữ liệu từ file JSON tương ứng",
                            example: "user123"
                        },
                        apikey: {
                            type: "string", 
                            description: "API key để xác thực",
                            example: "your_api_key_here"
                        }
                    },
                    optional: {
                        all: {
                            type: "boolean",
                            description: "Trả về tất cả link download chi tiết",
                            default: "false",
                            example: "true"
                        }
                    }
                },
                usage: {
                    basic_stats: "/tiktok/list-stats?uid=YOUR_UID&apikey=YOUR_KEY",
                    all_links: "/tiktok/list-stats?uid=YOUR_UID&all=true&apikey=YOUR_KEY"
                },
                examples: {
                    basic: "/tiktok/list-stats?uid=user123&apikey=abc123",
                    detailed: "/tiktok/list-stats?uid=user123&all=true&apikey=abc123"
                },
                note: "UID là mã định danh để lấy dữ liệu từ file JSON tương ứng"
            });
        }

        // Tải dữ liệu của user theo UID
        const userData = loadUserStats(uid);

        if (!userData) {
            return res.status(404).json({
                success: false,
                error: `Không tìm thấy dữ liệu cho UID: ${uid}`,
                note: "Hãy đảm bảo UID đã được sử dụng để lấy dữ liệu TikTok trước đó",
                file_location: `data/users/${uid}.json`
            });
        }

        // Thống kê link download
        const downloadStats = getDownloadLinksStats(userData);

        const response = {
            success: true,
            uid: uid,
            user_info: {
                verification_uid: userData.verification_uid,
                tiktok_username: userData.tiktok_username,
                nickname: userData.nickname,
                follower_count: userData.follower_count,
                video_count: userData.video_count,
                last_updated: userData.last_updated
            },
            download_statistics: downloadStats,
            data_info: {
                total_videos_cached: userData.videos ? userData.videos.length : 0,
                has_more_videos: userData.hasMore || false,
                cache_timestamp: userData.timestamp,
                file_location: `data/users/${uid}.json`
            }
        };

        // Nếu có tham số all=true, thêm danh sách tất cả link
        if (all === 'true') {
            const allLinks = getAllDownloadLinks(userData);
            response.all_download_links = allLinks;
            response.total_links_listed = allLinks.length;
        }

        console.log(`📊 UID ${uid}: ${downloadStats.total_download_links} links từ ${downloadStats.total_videos} videos`);

        res.json(response);

    } catch (error) {
        console.error('❌ List-stats error:', error.message);
        res.status(500).json({ 
            success: false,
            error: "Lỗi server khi xử lý yêu cầu",
            details: error.message
        });
    }
};