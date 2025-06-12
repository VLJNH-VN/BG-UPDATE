exports.name = '/imgur';
exports.index = async(req, res, next) => {
    var request = require('request');
    var link = req.query.link;
    if (!link) return res.json({ 
        success: false,
        error: 'Thiếu tham số link',
        parameters: {
            required: {
                link: {
                    type: "string",
                    description: "URL của hình ảnh cần upload lên Imgur",
                    example: "https://example.com/image.jpg"
                }
            }
        },
        usage: {
            endpoint: "/imgur",
            method: "GET",
            example: "/imgur?link=https://example.com/image.jpg"
        }
    });
    var request = require('request');
    var options = {
        'method': 'POST',
        'url': 'https://api.imgur.com/3/image',
        'headers': {
            'Authorization': 'Client-ID 6d0dba3a66763d9'
        },
        formData: {
            'image': encodeURI(link)
        }
    };
    request(options, function(error, response) {
        if (error) return res.json({ error: 'Đã xảy ra lỗi với link của bạn' })
        var data = response.body
        var upload = JSON.parse(data)
        res.json({
            uploaded: {
                status: 'success',
                image: upload.data.link
            }
        })
    });
}