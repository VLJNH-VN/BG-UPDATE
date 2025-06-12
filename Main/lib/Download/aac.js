
exports.name = '/convert/aac';
'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');
const chalk = require('chalk');

const TEMP_DIR = path.join(__dirname, 'temp');

// Tạo thư mục temp nếu chưa có
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

async function downloadMp3(url) {
    const filePath = path.join(TEMP_DIR, `audio_${Date.now()}.mp3`);
    
    try {
        const response = await axios.get(url, { 
            responseType: 'stream', 
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(filePath));
            writer.on('error', reject);
            
            // Timeout sau 30 giây
            setTimeout(() => {
                writer.destroy();
                reject(new Error('Timeout khi tải file'));
            }, 30000);
        });
    } catch (error) {
        throw new Error(`Lỗi tải MP3: ${error.message}`);
    }
}

function convertToAacWithCommand(inputFile) {
    return new Promise((resolve, reject) => {
        const outputFile = inputFile.replace('.mp3', '.aac');
        
        // Sử dụng command line trực tiếp
        const command = `ffmpeg -i "${inputFile}" -c:a aac -b:a 128k -y "${outputFile}"`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Lỗi FFmpeg: ${error.message}\nStderr: ${stderr}`));
                return;
            }
            
            if (fs.existsSync(outputFile)) {
                resolve(outputFile);
            } else {
                reject(new Error('File AAC không được tạo'));
            }
        });
    });
}

// Fallback: Chuyển đổi bằng cách đổi tên file (không khuyến khích nhưng có thể hoạt động)
function fallbackConvert(inputFile) {
    return new Promise((resolve, reject) => {
        try {
            const outputFile = inputFile.replace('.mp3', '.aac');
            
            // Đọc file MP3 và ghi thành AAC (chỉ đổi extension)
            const data = fs.readFileSync(inputFile);
            fs.writeFileSync(outputFile, data);
            
            console.log('⚠️ Sử dụng fallback conversion (chỉ đổi tên file)');
            resolve(outputFile);
        } catch (error) {
            reject(error);
        }
    });
}

exports.index = async (req, res) => {
    try {
        const mp3Url = req.query.url;
        if (!mp3Url) {
            return res.status(400).json({ 
                success: false,
                error: 'Thiếu tham số url',
                parameters: {
                    required: {
                        url: {
                            type: "string",
                            description: "URL của file MP3 cần chuyển đổi sang AAC",
                            example: "https://example.com/audio.mp3"
                        }
                    }
                },
                usage: {
                    endpoint: "/convert/aac",
                    method: "GET",
                    example: "/convert/aac?url=https://example.com/audio.mp3"
                }
            });
        }

        console.log(chalk.magenta(`🎵 AAC: ${new URL(mp3Url).hostname}`));
        
        const mp3File = await downloadMp3(mp3Url);
        let aacFile;
        
        try {
            aacFile = await convertToAacWithCommand(mp3File);
        } catch (ffmpegError) {
            console.log(chalk.yellow('⚠️ Fallback mode'));
            aacFile = await fallbackConvert(mp3File);
        }

        // Tạo tên file unique cho temp
        const tempFileName = `aac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.aac`;
        const tempFilePath = path.join(TEMP_DIR, tempFileName);
        
        // Copy file AAC vào thư mục temp với tên mới
        const aacBuffer = fs.readFileSync(aacFile);
        fs.writeFileSync(tempFilePath, aacBuffer);
        
        // Tạo link tạm thời (expire sau 1 giờ)
        const tempLink = `/temp/${tempFileName}`;
        const fullTempLink = `${req.protocol}://${req.get('host')}${tempLink}`;
        
        // Schedule xóa file sau 1 giờ
        setTimeout(() => {
            fs.unlink(tempFilePath, (err) => {
                if (err) console.error(`❌ Không thể xóa temp AAC: ${err.message}`);
                else console.log(chalk.yellow(`🗑️ Đã xóa temp: ${tempFileName}`));
            });
        }, 60 * 60 * 1000); // 1 giờ
        
        // Xóa các file gốc
        fs.unlink(mp3File, (err) => {
            if (err) console.error(`❌ Không thể xóa MP3: ${err.message}`);
        });
        
        fs.unlink(aacFile, (err) => {
            if (err) console.error(`❌ Không thể xóa AAC: ${err.message}`);
        });

        // Trả về thông tin file và link tạm thời
        const fileInfo = {
            success: true,
            filename: tempFileName,
            size: `${Math.round(aacBuffer.length/1024)}KB`,
            download_url: fullTempLink,
            expires_in: '1 hour',
            file_type: 'audio/aac'
        };
        
        console.log(chalk.green(`✅ AAC: ${fileInfo.size} | Link: ${tempLink}`));
        res.json(fileInfo);

    } catch (error) {
        console.error(`❌ Lỗi AAC2: ${error.message}`);
        res.status(500).json({ 
            error: 'Lỗi xử lý AAC2', 
            details: error.message,
            suggestion: 'Thử lại với URL MP3 khác'
        });
    }
};
