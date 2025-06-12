
function key_BG(req, res) {
  const fs = require('fs-extra');
  try {
    const data_apikey = require('./APIKEY.json');
    const apikey = req.query.apikey;
    
    if (!apikey) {
      res.json({
        error: 'Thiếu tham số apikey'
      });
      return true;
    }
    
    const vljnh = data_apikey.find(i => i.apikey === apikey);

    if (!vljnh) {
      res.json({
        error: 'APIKEY không chính xác liên hệ admin: https://www.facebook.com/culo2006'
      });
      return true;
    } 
    
    if (vljnh.request === 0) {
      res.json({
        error: 201,
        message: 'APIKEY của bạn đã hết lượt request liên hệ admin: https://www.facebook.com/culi2006'
      });
      return true;
    } 
    
    // Trừ đi 1 lượt request nếu là Free key
    if (vljnh.keytype === 'Free' || vljnh.type === 'free') {
      vljnh.request = vljnh.request - 1;
      fs.writeFileSync(__dirname + '/APIKEY.json', JSON.stringify(data_apikey, null, 2), 'utf-8');
    }
    
    return false; // Không có lỗi, tiếp tục xử lý
    
  } catch (e) {
    console.log('Lỗi kiểm tra API key:', e);
    res.json({
      error: 'Có lỗi xảy ra khi kiểm tra API key'
    });
    return true;
  }
}

module.exports = {
  key_BG
};
