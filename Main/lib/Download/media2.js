exports.name = '/media/link';

const { key_BG } = require('../../../utils/check.js');

exports.index = async (req, res, next) => {
  if (key_BG(req, res)) return;
  const link = req.query.link;
  const keyAPi = ['32e64e6f3emshf0d6c60b556177ep1f983cjsn05e5f6948d51','32e64e6f3emshf0d6c60b556177ep1f983cjsn05e5f6948d51']
 var keyRandom = keyAPi[Math.floor(Math.random() * keyAPi.length)];

  if (!link) return res.json({ 
    success: false,
    error: 'Thiếu dữ liệu để khởi chạy chương trình',
    parameters: {
      required: {
        link: {
          type: "string",
          description: "URL của media cần tải xuống",
          example: "https://www.tiktok.com/@user/video/123456"
        }
      }
    },
    usage: {
      endpoint: "/media/link",
      method: "GET",
      example: "/media/link?link=https://www.tiktok.com/@user/video/123456"
    }
  });

  const axios = require('axios');

  const options = {
    method: 'POST',
    url: 'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink',
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': keyRandom,
      'X-RapidAPI-Host': 'social-download-all-in-one.p.rapidapi.com'
    },
    data: { url: link }
  };

  try {
    const response = await axios.request(options);
    if (response.status === 200) {
      console.log(response.data);
      return res.json(response.data);
    } else {
      return res.json({ error: 'Có lỗi xảy ra khi tải xuống dữ liệu ' });
    }
  } catch (error) {
    if (error.response) {
      console.error('Error response:', error.response.data);
      return res.json({ error: error.response.data });
    } else if (error.request) {
      console.error('Error request:', error.request);
      return res.json({ error: 'Yêu cầu tới server không có phản hồi' });
    } else {
      console.error('Error:', error.message);
      return res.json({ error: 'Có lỗi xảy ra khi gửi yêu cầu' });
    }
  }
};