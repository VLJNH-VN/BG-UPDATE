exports.name = '/quote/random';

const quotes = require('../daoly.json');

exports.index = async (req, res) => {
    try {
        const category = req.query.category;

        if (!category) {
            return res.status(400).json({
                error: 'Thiếu tham số category',
                usage: 'GET /quote/random?category=<category>',
                categories: Object.keys(quotes.dao_ly)
            });
        }

        if (!quotes.dao_ly[category]) {
            return res.status(400).json({
                error: 'Category không tồn tại',
                available_categories: Object.keys(quotes.dao_ly)
            });
        }

        const categoryQuotes = quotes.dao_ly[category];
        const randomQuote = categoryQuotes[Math.floor(Math.random() * categoryQuotes.length)];

        res.json({
            success: true,
            category: category,
            quote: randomQuote,
            total_quotes: categoryQuotes.length
        });

    } catch (error) {
        console.error('Quote API Error:', error.message);
        res.status(500).json({
            error: 'Có lỗi xảy ra khi lấy quote'
        });
    }
};