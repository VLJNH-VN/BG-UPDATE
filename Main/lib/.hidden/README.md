
# Hidden Routes Folder

Folder này chứa các API routes sẽ được ẩn khỏi trang chủ API.

## Cách sử dụng:

### 1. Ẩn route bằng cách đặt file trong folder .hidden
Bất kỳ file .js nào trong folder này sẽ tự động được ẩn khỏi danh sách API public.

### 2. Ẩn route bằng config.json
Thêm route vào file `config.json`:
```json
{
    "hiddenRoutes": [
        "/admin/dashboard",
        "/internal/debug",
        "/your/route"
    ]
}
```

### 3. Quản lý hidden routes qua API
- **Xem danh sách:** `/admin/hidden?admin=true&action=list`
- **Thêm route:** `/admin/hidden?admin=true&action=add&route=/your/route`
- **Xóa route:** `/admin/hidden?admin=true&action=remove&route=/your/route`

## Các file hiện có:

- `config.json` - Cấu hình routes bị ẩn
- `admin.js` - API dashboard cho admin
- `internal.js` - API debug nội bộ
- `manage.js` - API quản lý hidden routes

## Lưu ý:
- Routes trong folder này vẫn hoạt động bình thường, chỉ bị ẩn khỏi trang chủ
- Cần authentication để truy cập các API admin
- System sẽ tự động reload khi có thay đổi file
