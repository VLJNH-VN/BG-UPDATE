
const fs = require('fs');
const path = require('path');

exports.name = '/media/avatarwibu';
exports.index = async (req, res, next) => {
  try {
    const dataPath = path.join(__dirname, 'AnimeAvatar/data/anime.json');
    const animeData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    const randomIndex = Math.floor(Math.random() * animeData.length);
    const randomAnime = animeData[randomIndex];
    
    res.json({
      success: true,
      data: randomAnime,
      author: 'BLACK-GOKU API'
    });
  } catch (error) {
    console.error('Error in avatarwibu:', error);
    res.status(500).json({
      success: false,
      error: 'Có lỗi xảy ra khi lấy avatar wibu'
    });
  }
};
