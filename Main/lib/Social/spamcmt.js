
const axios = require('axios');

exports.name = '/facebook/spamcmt';

exports.index = async (req, res, next) => {
  try {
    const { idpost, token, comment, amount } = req.query;
    if (!idpost || !token || !comment || !amount) {
      return res.json({ 
        success: false,
        error: 'Thiếu dữ liệu để khởi chạy chương trình',
        parameters: {
            required: {
                idpost: {
                    type: "string",
                    description: "ID bài viết Facebook cần spam comment",
                    example: "123456789_987654321"
                },
                token: {
                    type: "string",
                    description: "Access token Facebook",
                    example: "your_access_token"
                },
                comment: {
                    type: "string",
                    description: "Nội dung comment cần spam",
                    example: "Nice post!"
                },
                amount: {
                    type: "number",
                    description: "Số lượng comment cần spam",
                    example: "5"
                }
            }
        },
        usage: {
            endpoint: "/facebook/spamcmt",
            method: "GET",
            example: "/facebook/spamcmt?idpost=123_456&token=your_token&comment=Nice&amount=5"
        }
      });
    }

    const response = await axios.get(`https://graph.facebook.com/${idpost}/comments?method=POST&message=${comment}&access_token=${token}`);
    res.json(response.data);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server nghẽn vui lòng thử lại sau' });
  }
};
