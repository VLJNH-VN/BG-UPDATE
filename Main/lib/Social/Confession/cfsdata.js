exports.name = '/cfsdata';
exports.index = async (req, res, next) => {
	const id = req.query.id;
    if (!id) return res.json({ 
        success: false,
        error: 'Thiếu dữ liệu để khởi chạy chương trình',
        parameters: {
            required: {
                id: {
                    type: "string",
                    description: "ID của confession cần lấy dữ liệu",
                    example: "cfs123"
                }
            }
        },
        usage: {
            endpoint: "/confession/data",
            method: "GET",
            example: "/confession/data?id=cfs123"
        }
    });
	let path = __dirname + `/cfs.json`;
	return res.sendFile(path)
}