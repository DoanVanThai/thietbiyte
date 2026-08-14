# Thiên Lộc Group

Website và trang quản trị thiết bị y tế, xây dựng bằng Astro, PostgreSQL và SQLite.

## Chạy local

```bash
cp .env.example .env
npm ci
npm run db:deploy
npm run db:seed
npm run dev
```

## Kiểm tra

```bash
npm run test:server
npm run build
```

## Production

Production dùng `docker-compose.production.yml`. Biến môi trường thật chỉ được lưu trong `.env.production` trên máy chủ và không được commit. Dữ liệu nội dung/ảnh nằm trong `storage/`, còn PostgreSQL dùng named volume để tồn tại qua các lần build lại.

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
docker compose --env-file .env.production -f docker-compose.production.yml exec -T app npm run db:seed
```
