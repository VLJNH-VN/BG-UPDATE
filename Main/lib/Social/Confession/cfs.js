exports.name = '/confession';
exports.index = async (req, res, next) => {
    const { uid, content } = req.query;
    if (!uid || !content) return res.json({ 
        success: false,
        error: 'Thiếu dữ liệu để khởi chạy chương trình',
        parameters: {
            required: {
                uid: {
                    type: "string",
                    description: "User ID của người gửi confession",
                    example: "100012345678901"
                },
                content: {
                    type: "string",
                    description: "Nội dung confession",
                    example: "This is my confession"
                }
            }
        },
        usage: {
            endpoint: "/confession",
            method: "GET",
            example: "/confession?uid=100012345678901&content=This is my confession"
        }
    });
}