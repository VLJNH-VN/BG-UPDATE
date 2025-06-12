const axios = require('axios');

exports.name = '/facebook/posts';

exports.index = async (req, res, next) => {
  const { uid, token } = req.query;
  if (!uid || !token) return res.json({ 
      success: false,
      error: 'Thiếu dữ liệu để khởi chạy chương trình',
      parameters: {
          required: {
              uid: {
                  type: "string",
                  description: "User ID Facebook cần lấy danh sách bài viết",
                  example: "100012345678901"
              },
              token: {
                  type: "string",
                  description: "Access token Facebook",
                  example: "your_access_token"
              }
          }
      },
      usage: {
          endpoint: "/facebook/listpost",
          method: "GET",
          example: "/facebook/listpost?uid=100012345678901&token=your_access_token"
      }
  });

  try {
    const response = await axios.get(`https://graph.facebook.com/${uid}?fields=id,likes,family,posts&access_token=${token}`);

    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Tài khoàn die hoặc token api die vui lòng liên hệ admin.' });
  }
};