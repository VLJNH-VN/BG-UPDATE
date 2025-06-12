const axios = require('axios');

exports.name = '/facebook/getinfov2';

exports.index = async (req, res, next) => {
  try {
    const token = "EAAD6V7os0gcBO4c5ZAHAzJPW3PfxgaEyvtKtownKvgJ7xH3vBx2XaJQM4GSICpKJf9fJvNZCEHW4belFUMYtkWbezvFqZAUlTDe962Cp09KF9AggexghuI01KMNeebHLZA1Y00MV19k9AYcP65VLtRmO8gBVILmRCxYiWWrTao7WLrMBfqEeqVXxLwZDZD";

    const { uid } = req.query;
    if (!uid) return res.json({ 
        success: false,
        error: 'Thiếu tham số uid',
        parameters: {
            required: {
                uid: {
                    type: "string",
                    description: "User ID Facebook cần lấy thông tin (phiên bản 2)",
                    example: "100012345678901"
                }
            }
        },
        usage: {
            endpoint: "/getinfov2",
            method: "GET",
            example: "/getinfov2?uid=100012345678901"
        }
    });

    const response = await axios.get(`https://graph.facebook.com/${uid}?fields=id,is_verified,cover,updated_time,work,education,likes,created_time,work,posts,hometown,username,family,timezone,link,name,locale,location,about,website,birthday,gender,relationship_status,significant_other,quotes,first_name,subscribers.limit(0)&access_token=${token}`);

    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Tài khoàn die hoặc token api die vui lòng liên hệ admin.' });
  }
};