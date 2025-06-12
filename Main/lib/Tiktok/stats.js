'use strict';

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { downloadMedia } = require('../../global.js');
const { key_BG } = require('../../../utils/check.js');

exports.name = '/tiktok/stats';

const DATA_DIR = path.join(__dirname, 'data', 'users');
const CONFIG = {
    API_URL: "https://tikwm.com/api/user/info",
    VIDEO_API_URL: "https://tikwm.com/api/user/posts",
    HEADERS: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Cookie": "current_language=en",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
    }
};

// Đảm bảo thư mục data/users tồn tại
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Lấy đường dẫn file cho uid cụ thể
function getUserFilePath(uid) {
    return path.join(DATA_DIR, `${uid}.json`);
}

// Tải dữ liệu từ file uid cụ thể
function loadUserStats(uid) {
    try {
        const filePath = getUserFilePath(uid);
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(`❌ Đọc ${uid}`);
    }
    return null;
}

// Lưu dữ liệu vào file uid cụ thể
function saveUserStats(uid, data) {
    try {
        const filePath = getUserFilePath(uid);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`❌ Ghi ${uid}`);
    }
}

// Kiểm tra và xóa dữ liệu cũ hơn 24h cho uid cụ thể
function isDataExpired(userData) {
    if (!userData || !userData.timestamp) return true;

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000; // 24 giờ

    return (now - userData.timestamp) > oneDayMs;
}

// Xóa file uid cụ thể nếu dữ liệu hết hạn
function cleanExpiredUserData(uid) {
    const userData = loadUserStats(uid);
    if (userData && isDataExpired(userData)) {
        try {
            const filePath = getUserFilePath(uid);
            fs.unlinkSync(filePath);
            console.log(`🗑️ ${uid}`);
            return true;
        } catch (error) {
            console.error(`❌ Xóa ${uid}`);
        }
    }
    return false;
}

// Lấy chi tiết video của user với phân trang
async function getUserVideos(unique_id, limit = 20, cursor = 0) {
    try {
        const response = await axios.post(CONFIG.VIDEO_API_URL, new URLSearchParams({
            unique_id: unique_id,
            count: limit,
            cursor: cursor
        }).toString(), { 
            headers: CONFIG.HEADERS,
            timeout: 15000 
        });

        if (!response.data || !response.data.data || !response.data.data.videos) {
            return { videos: [], hasMore: false, nextCursor: 0 };
        }

        const videos = response.data.data.videos;
        const hasMore = response.data.data.hasMore || videos.length >= limit;
        const nextCursor = cursor + videos.length;
        const videoDetails = [];

        for (let i = 0; i < videos.length; i++) {
            const video = videos[i];
            const videoUrl = `https://www.tiktok.com/@${unique_id}/video/${video.video_id}`;

            // Lấy link download bằng downloadMedia từ global.js
            let downloadInfo = null;
            try {
                downloadInfo = await downloadMedia(videoUrl);
            } catch (error) {
                console.log(`⚠️ Video ${cursor + i + 1}`);
            }

            videoDetails.push({
                stt: cursor + i + 1,
                video_id: video.video_id,
                title: video.title || "Không có tiêu đề",
                video_url: videoUrl,
                direct_video_url: video.play || video.wmplay || "",
                download_urls: downloadInfo?.success ? {
                    has_download: true,
                    title: downloadInfo.title || video.title,
                    thumbnail: downloadInfo.thumbnail || video.cover,
                    medias: downloadInfo.medias || []
                } : {
                    has_download: false,
                    fallback_url: video.play || video.wmplay || ""
                },
                cover: video.cover || "",
                duration: video.duration || 0,
                play_count: video.play_count || 0,
                digg_count: video.digg_count || 0,
                comment_count: video.comment_count || 0,
                share_count: video.share_count || 0,
                create_time: video.create_time || 0
            });
        }

        return { videos: videoDetails, hasMore, nextCursor };
    } catch (error) {
        console.error('❌ Lỗi video');
        return { videos: [], hasMore: false, nextCursor: 0 };
    }
}

exports.index = async (req, res) => {
    try {
        // Xác minh API Key
        if (key_BG(req, res)) return;
        
        const { uid, username, continue: continueLoading, help } = req.query;

        // Hiển thị help parameters nếu được yêu cầu
        if (help === 'true') {
            return res.json({
                endpoint: "/tiktok/stats",
                description: "Lấy thống kê và video của user TikTok với hệ thống cache riêng biệt",
                parameters: {
                    required: {
                        username: {
                            type: "string",
                            description: "TikTok username hoặc unique_id (có thể có @ hoặc không)",
                            example: "@nemuieiei3 hoặc nemuieiei3"
                        },
                        uid: {
                            type: "string", 
                            description: "Mã xác minh duy nhất để lưu cache riêng biệt",
                            example: "user_verification_123"
                        }
                    },
                    optional: {
                        continue: {
                            type: "boolean",
                            description: "Tải thêm video tiếp theo (nếu có sẵn cache)",
                            default: "false",
                            example: "true"
                        },
                        help: {
                            type: "boolean",
                            description: "Hiển thị thông tin parameters",
                            example: "true"
                        }
                    }
                },
                usage: {
                    get_stats: "/tiktok/stats?username=@username&uid=verification_code",
                    continue_loading: "/tiktok/stats?username=@username&uid=verification_code&continue=true"
                },
                examples: {
                    basic: "/tiktok/stats?username=@nemuieiei3&uid=user123",
                    continue: "/tiktok/stats?username=@nemuieiei3&uid=user123&continue=true",
                    help_info: "/tiktok/stats?help=true"
                },
                features: {
                    cache_system: "Mỗi UID có file riêng trong data/users/",
                    auto_expiry: "Cache tự động hết hạn sau 24 giờ", 
                    pagination: "Tải 20 video/lần, có thể continue để tải thêm",
                    download_links: "Tự động lấy link download cho mỗi video"
                },
                response_structure: {
                    user_info: "Thông tin profile TikTok",
                    videos: "Danh sách video với link download",
                    cache_info: "Thông tin cache và file lưu trữ"
                }
            });
        }

        if (!username || !uid) {
            return res.status(400).json({ 
                error: "Thiếu tham số BẮT BUỘC.",
                parameters: {
                    required: {
                        username: {
                            type: "string",
                            description: "TikTok username hoặc unique_id (có thể có @ hoặc không)",
                            example: "@nemuieiei3 hoặc nemuieiei3"
                        },
                        uid: {
                            type: "string", 
                            description: "Mã xác minh duy nhất để lưu cache riêng biệt",
                            example: "user_verification_123"
                        }
                    },
                    optional: {
                        continue: {
                            type: "boolean",
                            description: "Tải thêm video tiếp theo (nếu có sẵn cache)",
                            default: "false",
                            example: "true"
                        },
                        help: {
                            type: "boolean",
                            description: "Hiển thị thông tin parameters",
                            example: "true"
                        }
                    }
                },
                usage: {
                    get_stats: "/tiktok/stats?username=@username&uid=verification_code",
                    continue_loading: "/tiktok/stats?username=@username&uid=verification_code&continue=true"
                },
                examples: {
                    basic: "/tiktok/stats?username=@nemuieiei3&uid=user123",
                    continue: "/tiktok/stats?username=@nemuieiei3&uid=user123&continue=true",
                    help_info: "/tiktok/stats?help=true"
                },
                notes: {
                    cache: "Mỗi uid sẽ có file dữ liệu riêng biệt trong thư mục data/users/",
                    expiry: "Dữ liệu cache sẽ hết hạn sau 24 giờ",
                    videos: "Mỗi lần tải sẽ lấy 20 video, có thể tải thêm bằng continue=true"
                }
            });
        }

        // Kiểm tra và xóa dữ liệu hết hạn
        cleanExpiredUserData(uid);

        // username: TikTok ID thật để lấy data
        // uid: Mã xác minh, dùng làm key để lưu cache
        const searchParam = username;
        const userKey = uid;
        const now = Date.now();

        // Tải dữ liệu riêng cho uid này
        let userData = loadUserStats(userKey);

        // Kiểm tra cache và xử lý continue loading
        if (userData && !isDataExpired(userData)) {
            if (continueLoading === 'true' && userData.hasMore) {
                // Tải tiếp 20 video tiếp theo
                const tikTokUsername = userData.tiktok_username;
                const currentCursor = userData.nextCursor || userData.videos.length;

                console.log(`📹 Tải tiếp: ${tikTokUsername}`);

                const moreVideosResult = await getUserVideos(tikTokUsername, 20, currentCursor);

                // Cập nhật data
                userData.videos = [...userData.videos, ...moreVideosResult.videos];
                userData.videos_fetched = userData.videos.length;
                userData.hasMore = moreVideosResult.hasMore;
                userData.nextCursor = moreVideosResult.nextCursor;
                userData.timestamp = now;
                userData.last_updated = new Date(now).toLocaleString('vi-VN', {
                    timeZone: 'Asia/Ho_Chi_Minh'
                });

                saveUserStats(userKey, userData);

                console.log(`📹 +${moreVideosResult.videos.length} video. Tổng: ${userData.videos.length}`);

                return res.json({
                    success: true,
                    cached: false,
                    continued: true,
                    data: userData,
                    message: `Đã tải thêm ${moreVideosResult.videos.length} video. Tổng: ${userData.videos.length}`,
                    storage_info: {
                        uid_file: `${userKey}.json`,
                        location: "data/users/"
                    }
                });
            } else {
                console.log(`📊 ${userKey} (cache)`);
                return res.json({
                    success: true,
                    cached: true,
                    data: userData,
                    storage_info: {
                        uid_file: `${userKey}.json`,
                        location: "data/users/"
                    }
                });
            }
        }

        // Lấy thông tin từ TikTok API
        const response = await axios.post(CONFIG.API_URL, new URLSearchParams({
            unique_id: searchParam
        }).toString(), { 
            headers: CONFIG.HEADERS,
            timeout: 10000 
        });

        if (!response.data || !response.data.data) {
            return res.status(404).json({ 
                error: "Không tìm thấy thông tin người dùng TikTok" 
            });
        }

        const tikTokData = response.data.data;
        const tikTokUsername = tikTokData.user?.unique_id || searchParam;

        console.log(`📹 ${tikTokUsername}`);

        // Lấy chi tiết video của user (lấy 20 video đầu tiên)
        const videosResult = await getUserVideos(tikTokUsername, 20, 0);

        console.log(`📹 ${videosResult.videos.length} video`);

        const userInfo = {
            // Thông tin xác minh và TikTok ID
            verification_uid: uid,
            tiktok_username: tikTokUsername,
            tiktok_uid: tikTokData.user?.id || "Không rõ",

            // Thông tin profile TikTok
            nickname: tikTokData.user?.nickname || "Không rõ",
            follower_count: tikTokData.stats?.followerCount || 0,
            following_count: tikTokData.stats?.followingCount || 0,
            video_count: tikTokData.stats?.videoCount || 0,
            heart_count: tikTokData.stats?.heartCount || 0,
            avatar: tikTokData.user?.avatar || "",
            verified: tikTokData.user?.verified || false,

            // Chi tiết video của user
            videos: videosResult.videos,
            videos_fetched: videosResult.videos.length,
            hasMore: videosResult.hasMore,
            nextCursor: videosResult.nextCursor,

            // Thông tin hệ thống
            search_param: searchParam,
            cache_key: userKey,

            timestamp: now,
            last_updated: new Date(now).toLocaleString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh'
            })
        };

        // Lưu vào file riêng cho uid này
        saveUserStats(userKey, userInfo);

        console.log(`📊 ${userKey} - ${userInfo.videos_fetched} videos`);

        res.json({
            success: true,
            cached: false,
            data: userInfo,
            message: userInfo.hasMore ? `Đã tải ${userInfo.videos_fetched} video. Có thể tải thêm bằng cách thêm &continue=true` : `Đã tải hết ${userInfo.videos_fetched} video`,
            storage_info: {
                uid_file: `${userKey}.json`,
                location: "data/users/",
                note: "Mỗi UID có file dữ liệu riêng biệt"
            }
        });

    } catch (error) {
        console.error('❌ TikTok API');
        if (error.code === 'ECONNABORTED') {
            res.status(504).json({ error: "Timeout khi kết nối tới TikTok API" });
        } else {
            res.status(500).json({ error: "Không thể lấy thống kê TikTok" });
        }
    }
};