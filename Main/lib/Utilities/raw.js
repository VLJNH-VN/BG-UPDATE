const fs = require('fs');
const path = require('path');

exports.name = '/upcode/raw';
exports.index = async (req, res, next) => {
  try {
    const txt = req.query.txt;
    if (!txt) return res.json({ 
        success: false,
        error: 'Thiếu dữ liệu để khởi chạy chương trình',
        parameters: {
            required: {
                txt: {
                    type: "string",
                    description: "Text hoặc code cần lưu trữ raw",
                    example: "Hello World"
                }
            }
        },
        usage: {
            endpoint: "/raw",
            method: "GET",
            example: "/raw?txt=Hello World"
        }
    });

    const filePath = path.join(__dirname, 'database', `${txt}.js`);

    if (!fs.existsSync(filePath)) {
       fs.writeFileSync(filePath, '', 'utf8');
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');

    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');

    return res.send(fileContent);

  } catch (error) {
    console.error('Error in /upcode/raw:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while processing your request'
    });
  }
};