const axios = require('axios');

exports.name = '/facebook/share';

exports.index = async (req, res, next) => {
  try {

    const link = req.query.link;
    if (!link) return res.status(400).json({ 
        success: false,
        error: 'Thiếu tham số link',
        parameters: {
            required: {
                link: {
                    type: "string",
                    description: "ID của bài post Facebook cần chia sẻ",
                    example: "123456789"
                },
                token: {
                    type: "string",
                    description: "Facebook access token để xác thực",
                    example: "your_facebook_token"
                }
            }
        },
        usage: {
            endpoint: "/facebook/share",
            method: "GET",
            example: "/facebook/share?link=123456789&token=your_facebook_token"
        }
    });
    const token = req.query.token;
    if (!token) return res.status(400).json({ 
        success: false,
        error: 'Thiếu tham số token',
        parameters: {
            required: {
                link: {
                    type: "string",
                    description: "ID của bài post Facebook cần chia sẻ",
                    example: "123456789"
                },
                token: {
                    type: "string",
                    description: "Facebook access token để xác thực",
                    example: "your_facebook_token"
                }
            }
        },
        usage: {
            endpoint: "/facebook/share",
            method: "GET",
            example: "/facebook/share?link=123456789&token=your_facebook_token"
        }
    });

    const response = await axios.get(`https://graph.facebook.com/me/feed?method=POST&link=https://m.facebook.com/${link}&published=0&access_token=${token}`);

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sever nghẽn vui lòng thử lại sau.' });
  }
};