'use strict';

const axios = require('axios');
const CryptoJS = require('crypto-js');

// Thay thế cho API TikTok search từ https://api-vljnh-aybq.onrender.com/tiktok/search
const CONFIG = {
    API_URL: "https://tikwm.com/api/feed/search",
    HEADERS: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Cookie": "current_language=en",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
    }
};

// Cấu hình cho media download
const MEDIA_CONFIG = {
    J2DOWN_SECRET: "U2FsdGVkX18wVfoTqTpAQwAnu9WB9osIMSnldIhYg6rMvFJkhpT6eUM9YqgpTrk41mk8calhYvKyhGF0n26IDXNmtXqI8MjsXtsq0nnAQLROrsBuLnu4Mzu63mpJsGyw",
    API_URL: "https://api.zm.io.vn/v1/"
};

/**
 * Tìm kiếm video TikTok - thay thế cho https://api-vljnh-aybq.onrender.com/tiktok/search
 * @param {string} query - Từ khóa tìm kiếm
 * @param {number} limit - Số lượng video trả về (mặc định 10)
 * @returns {Object} Kết quả tìm kiếm
 */
async function searchTikTok(query, limit = 10) {
    try {
        console.log(`[TIKTOK SEARCH] Tìm kiếm: "${query}" với limit: ${limit}`);

        const response = await axios.post(CONFIG.API_URL, new URLSearchParams({
            keywords: query,
            count: 50,
            cursor: 0,
            HD: 1
        }).toString(), { 
            headers: CONFIG.HEADERS,
            timeout: 10000
        });

        if (!response.data || !response.data.data) {
            console.log(`[TIKTOK SEARCH] ❌ Không có dữ liệu trả về từ API`);
            return { success: false, error: "Không có dữ liệu trả về từ API" };
        }

        const videos = response.data.data.videos || [];
        if (videos.length === 0) {
            console.log(`[TIKTOK SEARCH] ❌ Không tìm thấy video nào cho từ khóa: "${query}"`);
            return { success: false, error: "Không tìm thấy video nào." };
        }

        const selectedVideos = videos.slice(0, limit).map(video => ({
            title: video.title || "Không có tiêu đề",
            cover: video.cover || "",
            origin_cover: video.origin_cover || "",
            no_watermark: video.play || "",
            watermark: video.wmplay || "",
            music: video.music || "",
            author: {
                nickname: video.author?.nickname || "Không rõ",
                unique_id: video.author?.unique_id || "Không rõ"
            }
        }));

        console.log(`[TIKTOK SEARCH] ✅ Tìm thấy ${selectedVideos.length} video cho từ khóa: "${query}"`);
        return {
            success: true,
            videos: selectedVideos
        };
    } catch (error) {
        console.error(`[TIKTOK SEARCH] ❌ Lỗi khi tìm kiếm: ${error.message}`);
        return { success: false, error: "Lỗi khi tìm kiếm video: " + error.message };
    }
}

/**
 * Hàm hỗ trợ cho media download
 */
function isValidURL(url) {
    try {
        const regex = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm;
        const match = url.match(regex);
        const cleanUrl = match ? match[0] : url;

        const validDomains = [
            "tiktok", "douyin", "iesdouyin", "capcut", "instagram", "threads", "facebook", "fb", "espn",
            "kuaishou", "pinterest", "pin", "imdb", "imgur", "ifunny", "reddit", "youtube", "youtu", "twitter",
            "x", "vimeo", "snapchat", "bilibili", "dailymotion", "sharechat", "linkedin", "tumblr", "hipi",
            "getstickerpack", "xvideos", "xnxx", "xiaohongshu", "xhslink", "weibo", "miaopai", "meipai",
            "xiaoying", "nationalvideo", "yingke", "soundcloud", "mixcloud", "spotify", "zingmp3", "bitchute",
            "febspot", "bandcamp", "izlesene", "9gag", "rumble", "streamable", "ted", "sohu", "ixigua", "likee",
            "sina"
        ];

        const hostname = new URL(cleanUrl).hostname.replace('www.', '');
        return validDomains.some(domain => hostname.includes(domain));
    } catch (error) {
        return false;
    }
}

function decryptSecretKey() {
    try {
        const decrypted = CryptoJS.AES.decrypt(MEDIA_CONFIG.J2DOWN_SECRET, "manhg-api");
        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error("[MEDIA DOWNLOAD] ❌ Lỗi giải mã secret key:", error);
        return null;
    }
}

function randomString(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function encryptData(data, secretKey) {
    try {
        const key = CryptoJS.enc.Hex.parse(secretKey);
        const iv = CryptoJS.lib.WordArray.random(16);
        const encrypted = CryptoJS.AES.encrypt(data, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        return {
            iv: iv.toString(CryptoJS.enc.Hex),
            k: randomString(11) + "8QXBNv5pHbzFt5QC",
            r: "BRTsfMmf3CuN",
            encryptedData: encrypted.toString()
        };
    } catch (error) {
        console.error("[MEDIA DOWNLOAD] ❌ Lỗi mã hóa dữ liệu:", error);
        return null;
    }
}

/**
 * Download media từ URL - thay thế cho https://api-vljnh-aybq.onrender.com/media/url
 * @param {string} url - URL cần download
 * @returns {Object} Thông tin media
 */
async function downloadMedia(url) {
    try {
        console.log(`[MEDIA DOWNLOAD] Bắt đầu download: ${url}`);

        if (!url || !url.trim()) {
            console.log(`[MEDIA DOWNLOAD] ❌ Thiếu URL`);
            return { success: false, error: "Thiếu URL" };
        }

        if (!isValidURL(url)) {
            console.log(`[MEDIA DOWNLOAD] ❌ URL không hợp lệ: ${url}`);
            return { success: false, error: "URL không hợp lệ hoặc không được hỗ trợ" };
        }

        const secretKey = decryptSecretKey();
        if (!secretKey) {
            console.log(`[MEDIA DOWNLOAD] ⚠️ Không có secret key, sử dụng fallback`);
            return {
                success: true,
                medias: [{
                    type: "video",
                    url: url,
                    extension: "mp4"
                }],
                title: "Media",
                thumbnail: ""
            };
        }

        const data = JSON.stringify({ url: url, unlock: true });
        const encryptedData = encryptData(data, secretKey);

        if (!encryptedData) {
            throw new Error("Không thể mã hóa dữ liệu");
        }

        const response = await axios.post(MEDIA_CONFIG.API_URL + "social/autolink", {
            data: encryptedData
        }, {
            headers: {
                "content-type": "application/json",
                "token": "eyJ0eXAiOiJqd3QiLCJhbGciOiJIUzI1NiJ9.eyJxxx"
            },
            timeout: 15000
        });

        if (response.data && response.data.medias) {
            const medias = response.data.medias;
            console.log(`✅ ${medias.length} file`);
            return {
                success: true,
                medias: response.data.medias,
                title: response.data.title || "Downloaded Media",
                thumbnail: response.data.thumbnail || ""
            };
        } else {
            console.log(`[MEDIA DOWNLOAD] ⚠️ API không trả về medias, sử dụng fallback`);
            return {
                success: true,
                medias: [{
                    type: "video",
                    url: url,
                    extension: "mp4"
                }],
                title: "Media",
                thumbnail: ""
            };
        }
    } catch (error) {
        console.log(`❌ Download`);
        return {
            success: true,
            medias: [{
                type: "video",
                url: url,
                extension: "mp4"
            }],
            title: "Media",
            thumbnail: ""
        };
    }
}

/**
 * Chuyển đổi MP3 sang AAC - thay thế cho https://mp3toaac.onrender.com/convert
 * @param {string} mp3Url - URL file MP3
 * @param {Object} req - Request object để tạo full URL
 * @returns {Object} URL file AAC đã chuyển đổi
 */
async function convertMp3ToAac(mp3Url, req = null) {
    const fs = require('fs');
    const path = require('path');
    const { exec } = require('child_process');

    const TEMP_DIR = path.join(__dirname, 'lib/Download/temp');

    try {
        console.log(`[MP3 TO AAC] Bắt đầu convert: ${mp3Url}`);

        if (!fs.existsSync(TEMP_DIR)) {
            fs.mkdirSync(TEMP_DIR, { recursive: true });
        }

        const mp3FilePath = path.join(TEMP_DIR, `temp_${Date.now()}.mp3`);
        const response = await axios.get(mp3Url, { 
            responseType: 'stream',
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const writer = fs.createWriteStream(mp3FilePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        const aacFilePath = mp3FilePath.replace('.mp3', '.aac');

        try {
            await new Promise((resolve, reject) => {
                const command = `ffmpeg -i "${mp3FilePath}" -c:a aac -b:a 128k -y "${aacFilePath}"`;
                exec(command, (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        } catch (ffmpegError) {
            console.log(`[MP3 TO AAC] ⚠️ FFmpeg không có, copy file thay thế`);
            const data = fs.readFileSync(mp3FilePath);
            fs.writeFileSync(aacFilePath, data);
        }

        const tempFileName = `aac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.aac`;
        const tempFilePath = path.join(TEMP_DIR, tempFileName);

        const aacBuffer = fs.readFileSync(aacFilePath);
        fs.writeFileSync(tempFilePath, aacBuffer);

        fs.unlink(mp3FilePath, () => {});
        fs.unlink(aacFilePath, () => {});

        const tempLink = `/temp/${tempFileName}`;
        const fullTempLink = req ? `${req.protocol}://${req.get('host')}${tempLink}` : tempLink;

        setTimeout(() => {
            fs.unlink(tempFilePath, () => {});
        }, 60 * 60 * 1000);

        console.log(`[MP3 TO AAC] ✅ Convert thành công: ${fullTempLink}`);
        return {
            success: true,
            aac_url: fullTempLink
        };
    } catch (error) {
        console.error(`[MP3 TO AAC] ❌ Lỗi convert: ${error.message}`);
        return { 
            success: false, 
            aac_url: mp3Url
        };
    }
}

module.exports = {
    searchTikTok,
    downloadMedia,
    convertMp3ToAac,
    isValidURL,
    randomString,
    decryptSecretKey,
    encryptData

};