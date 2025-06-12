const fs = require('fs');
const path = require('path');

exports.name = '/raw';
exports.index = async (req, res, next) => {
  try {
    const { id } = req.query;

    // Kiểm tra id có tồn tại không
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu dữ liệu để khởi chạy chương trình',
        parameters: {
            required: {
                id: {
                    type: "string",
                    description: "ID của raw data cần truy xuất",
                    example: "abc123"
                }
            }
        },
        usage: {
            endpoint: "/raw-public",
            method: "GET",
            example: "/raw-public?id=abc123"
        }
      });
    }

    // Validate id để tránh path traversal
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      return res.status(400).json({
        error: 'Invalid id format',
        message: 'ID can only contain letters, numbers, underscore and dash'
      });
    }

    // Tạo đường dẫn file
    const filePath = path.join(__dirname, 'Utilities/database', `${id}.js`);

    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File not found',
        message: `No file found with id: ${id}`
      });
    }

    // Đọc và trả về file
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Set header để trả về dạng JavaScript
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1 hour
    res.setHeader('Access-Control-Allow-Origin', '*');

    return res.send(fileContent);

  } catch (error) {
    console.error('Error in /raw:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while processing your request'
    });
  }
};