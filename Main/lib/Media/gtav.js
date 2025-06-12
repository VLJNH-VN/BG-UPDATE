const axios = require("axios");
const { key_BG } = require('../../../utils/check.js');
const FormData = require("form-data");

exports.name = "/gta5";

exports.index = async (req, res, next) => {
    try {
        // Xác thực API Key
        if (key_BG(req, res)) return;

        const { url } = req.query;
        if (!url)
            return res.status(400).json({ 
                success: false,
                error: "Thiếu tham số url",
                parameters: {
                    required: {
                        url: {
                            type: "string",
                            description: "URL của hình ảnh cần chuyển đổi theo phong cách GTA V",
                            example: "https://example.com/image.jpg"
                        }
                    }
                },
                usage: {
                    endpoint: "/gta5",
                    method: "GET",
                    example: "/gta5?url=https://example.com/image.jpg"
                }
            });

        // Download the file from the specified URL
        const response = await axios({
            method: "GET",
            responseType: "stream",
            url,
        });

        // Check if the response contains an image
        const contentType = response.headers["content-type"];
        if (!contentType || !contentType.startsWith("image/")) {
            return res.status(400).json({
                error: "The provided URL does not point to an image.",
            });
        }

        // Create a FormData object and append the downloaded file to it
        let dataFile = new FormData();
        dataFile.append("file", response.data);

        // Send a POST request to another server with the downloaded file
        await axios({
            method: "post",
            url: "https://taoanhdep.com/public/anime-gtav.php",
            headers: {
                ...dataFile.getHeaders(),
            },
            data: dataFile,
        }).then(async function (response) {
            var { requestId } = await response.data;

            // Set up an interval to periodically check the processing status
            const myInterval = setInterval(myCheck, 1500);

            function myCheck() {
                console.log(
                    `https://taoanhdep.com/public/check-gtav.php?id=${requestId}`
                );
                axios({
                    method: "GET",
                    url: `https://taoanhdep.com/public/check-gtav.php?id=${requestId}`,
                }).then((response) => {
                    // Check if the processing is completed
                    if (response.data.status !== "InProgress") {
                        console.log(response.data);
                        res.status(200).json({ data: response.data });
                        return clearInterval(myInterval);
                    }
                });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever nghẽn vui lòng thử lại sau." });
    }
};