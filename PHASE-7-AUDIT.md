# PHASE 7 - Y TẾ + SPECIALTY UI AUDIT

Ngày hoàn thành: 13/08/2026

## Phạm vi

Phase 7 chỉ triển khai trải nghiệm khám phá thiết bị Y tế tại `/y-te` và các trang chuyên khoa Y tế. Route, dữ liệu và giao diện Thú y được giữ nguyên. Không triển khai Phase 8.

## Design read

Landing Y tế được đọc như một công cụ khám phá B2B cho bác sĩ, chủ phòng khám, kỹ thuật viên và bộ phận mua sắm. Người dùng có thể bắt đầu từ chuyên khoa hoặc nhu cầu chuyên môn, không bị buộc phải biết tên model.

- Design variance: 4/10.
- Motion intensity: 2/10.
- Visual density: 5/10.
- Giữ nguyên Be Vietnam Pro, semantic color tokens, spacing, radius, button và focus language của Design System hiện có.
- Clinical, technical và rõ ràng được ưu tiên hơn hiệu ứng trang trí.

## Routes

Landing:

- `/y-te`

Specialty detail:

- `/chuyen-khoa/san-phu-khoa`
- `/chuyen-khoa/tim-mach`
- `/chuyen-khoa/chan-doan-hinh-anh`
- `/chuyen-khoa/xet-nghiem`
- `/chuyen-khoa/hoi-suc`
- `/chuyen-khoa/tai-mui-hong`
- `/chuyen-khoa/tieu-hoa`
- `/chuyen-khoa/phau-thuat`
- `/chuyen-khoa/nha-khoa`
- `/chuyen-khoa/phuc-hoi-chuc-nang`

`/chuyen-khoa/thu-y` tiếp tục dùng catalog hiện có và không nhận layout mới của Phase 7.

## Y tế landing

- Hero compact có breadcrumb, một H1, mô tả ngắn và search có label thật.
- Search gửi tới catalog với `group=medical`, do đó không trộn kết quả Thú y.
- Datalist gợi ý từ tên sản phẩm, model, hãng, danh mục và chuyên khoa đang có trong data.
- Luồng khám phá được trình bày rõ: Chuyên khoa, Nhu cầu, Danh mục, Sản phẩm.
- Category navigation không dùng 11 card giống nhau. Chẩn đoán hình ảnh là nhóm dẫn, các nhóm còn lại dùng navigation có phân cấp.
- `Thiết bị được quan tâm` lấy từ sản phẩm nổi bật hiện có, không tạo số lượt xem giả.
- Danh sách chuyên khoa dùng mô tả ngắn để hỗ trợ quyết định thay vì chỉ hiển thị tên.

## Specialty detail

Mỗi trang chuyên khoa có:

1. Breadcrumb, H1 và mô tả ngắn.
2. Nhu cầu thường gặp dẫn tới catalog đã lọc.
3. Subcategory có vai trò và mô tả riêng.
4. Related products lấy từ catalog Y tế hiện có.
5. Related solutions và knowledge lấy từ dữ liệu website hiện có.
6. CTA B2B `Cần tư vấn danh mục thiết bị cho chuyên khoa này?` với một hành động chính `Nhận tư vấn cấu hình`.

Specialty chưa có sản phẩm khớp dùng empty state có hướng đi tiếp, không tạo sản phẩm hoặc claim giả.

## Component và data

### Mới

- `src/data/medical.ts`: hierarchy danh mục, 10 chuyên khoa và mapping dữ liệu liên quan.
- `src/components/MedicalProductSection.astro`: product section dùng lại card catalog và có empty state.
- `src/components/MedicalSpecialtyPage.astro`: composition chung cho specialty detail.
- `src/styles/medical.css`: layout và responsive rules riêng cho discovery experience, dùng token hiện có.

### Thay đổi

- `src/pages/y-te.astro`: chuyển từ listing sang discovery landing.
- `src/pages/chuyen-khoa/[slug].astro`: dùng specialty experience cho slug Y tế và giữ fallback catalog cho slug ngoài phạm vi.

### Tiếp tục dùng chung

- `BaseLayout.astro`
- `Header.astro`
- `Footer.astro`
- `Breadcrumb.astro`
- `CatalogProductCard.astro`
- Catalog data, solution data và knowledge data hiện có

## Category hierarchy audit

- Một featured category tạo điểm bắt đầu rõ thay vì tăng kích thước toàn bộ nhóm.
- Ba nhóm navigation phân biệt chẩn đoán, chuyên khoa và điều trị/hỗ trợ.
- Divider, khoảng trắng và typography tạo hierarchy; không bọc mọi link bằng card.
- Tên dài tiếng Việt dùng `text-wrap`, flexible grid và min-width 0 để tránh cắt hoặc xuống dòng vô tổ chức.
- Không dùng gradient, glow, glassmorphism, giant heading hoặc animation fade-up hàng loạt.

## Responsive audit

| Vùng hiển thị | Cách compose |
| --- | --- |
| 1120px trở lên | Hero split, category dẫn bên trái, navigation theo nhóm bên phải, product grid bốn cột |
| 901-1120px | Hero giữ split gọn, flow tách thành một hàng riêng, product grid hai cột |
| 681-900px | Hero và discovery chuyển một cột, ảnh giữ tỷ lệ rộng, specialty support xếp dọc |
| 375-680px | Search button full-width, flow một cột, danh mục một cột, product card cuộn ngang cục bộ, CTA không xuống dòng tùy tiện |

Các breakpoint được chọn theo lúc composition mất cân bằng, không tạo một layout riêng cho từng thiết bị.

## Accessibility và usability

- Một H1 cho mỗi page.
- Search có `role=search`, label liên kết input và submit button rõ nghĩa.
- Breadcrumb và các nhóm category/specialty dùng semantic navigation.
- Ảnh có alt, width và height.
- Link và button chính có touch target tối thiểu 44px theo component context.
- Focus styles kế thừa Design System; input có focus ring rõ.
- Hover chỉ áp dụng khi thiết bị hỗ trợ hover.
- Reduced motion tắt transition dịch chuyển.
- Không dùng placeholder thay label và không hiển thị metric giả.

## Final Taste audit

- **Category hierarchy:** một nhóm dẫn, ba nhóm phụ và specialty index tạo nhiều cấp rõ ràng.
- **Navigation:** người dùng đi được theo luồng chuyên khoa, nhu cầu, danh mục và sản phẩm.
- **Typography:** H1 compact, section heading 26-32px trên mobile/desktop, body và metadata không bị thu nhỏ quá mức.
- **Medical seriousness:** bảng màu corporate hiện có, ảnh thiết bị, copy kỹ thuật và ít hiệu ứng trang trí.
- **Mobile discovery:** thứ tự nội dung giữ nguyên ý nghĩa, không đưa navigation quan trọng xuống cuối trang.
- **Card repetition:** card được giữ cho sản phẩm và nội dung cần khung; category và specialty chủ yếu dùng row/divider.
- **Whitespace và density:** hero, flow, category, product và specialty có nhịp khác nhau nhưng cùng spacing scale.

## Verification

- `npm run check`: đạt, 47 files, 0 errors, 0 warnings, 0 hints.
- `npm run build`: đạt, 51 static pages.
- HTTP 200: `/y-te`, `/chuyen-khoa/san-phu-khoa`, `/chuyen-khoa/nha-khoa`, `/chuyen-khoa/thu-y` và `/san-pham?group=medical`.
- Static generation tạo đủ 10 specialty routes Y tế.
- Source scan không phát hiện gradient, glass, glowing blur, radius/shadow quá khổ hoặc heading khổng lồ trong phần Phase 7.
- Route Thú y vẫn dùng catalog markup cũ.

## Giới hạn

- Browser điều khiển tích hợp không có session trong môi trường hiện tại, vì vậy chưa chạy được screenshot regression và thao tác thật tại 375, 390, 768, 1024, 1280, 1440 và 1920. Markup, CSS breakpoints, type-check, static build và HTTP routes đã được kiểm tra.
- Popular products hiện dựa trên `featured` trong catalog tĩnh. Khi Admin/backend sẵn sàng, data source cần được thay nhưng giữ nguyên component contract.
- Ảnh và nội dung kỹ thuật hiện dùng dữ liệu minh họa của project; không tạo claim mới về hãng hoặc thiết bị.

## Kết luận

Phase 7 hoàn thành đúng phạm vi. Dừng tại đây và chờ `RUN PHASE 8`.
