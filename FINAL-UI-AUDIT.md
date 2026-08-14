# FINAL UI AUDIT — PHASE 19

Ngày audit: 13/08/2026  
Phạm vi: Public website, Customer Portal, Admin, RBAC, CRM và Content  
Nguyên tắc: final polish, không thêm feature, không thay đổi route hoặc information architecture

## Design read

- Loại công việc: `redesign-preserve` cho hệ thống B2B y tế và thú y đang vận hành.
- Đối tượng chính: bệnh viện, phòng khám, phòng xét nghiệm, cơ sở thú y, đội mua sắm, sales và quản trị viên.
- Tính cách: clinical, precise, calm, trustworthy.
- Hệ thống giữ lại: Astro, CSS hiện có, Be Vietnam Pro, medical blue, neutral system, cấu trúc route và logic nghiệp vụ.
- Public website: `VARIANCE 4 / MOTION 2 / DENSITY 5`.
- Portal, Admin và CRM: `VARIANCE 2 / MOTION 1 / DENSITY 8`.

Audit sử dụng bản hiện tại của [Taste Skill](https://github.com/Leonxlnx/taste-skill). Taste Skill được áp dụng trực tiếp cho Public website. Với Portal, Admin, RBAC và CRM, quyết định ưu tiên product-system vì chính Taste Skill xác định dashboard và data table không thuộc cùng register với landing page.

## What changed

### Public website

#### Header và Navigation

- Thu gọn header từ ba tầng, cao 164px, thành một thanh điều hướng 72px.
- Bỏ utility bar gồm bốn lời hứa dịch vụ lặp lại.
- Đưa logo, primary navigation, tìm kiếm, đăng nhập và báo giá vào cùng một hàng.
- Tìm kiếm desktop dùng nút mở search dialog hiện có, không tạo luồng mới.
- Giữ nguyên toàn bộ route và nhãn điều hướng.
- Chuyển sang mobile navigation ở 1100px để tránh ép chữ hoặc xuống hai dòng.
- Header khi scroll chỉ thêm shadow nhẹ; không còn co chiều cao hoặc ẩn cả cụm điều hướng.

#### Homepage

- Hero chuyển sang bố cục phẳng, image-led; bỏ khung card bao ngoài.
- H1 đổi từ marketing chung chung thành “Thiết bị y tế cho bệnh viện và phòng khám”.
- CTA thống nhất quanh hai hành động thật: xem danh mục và yêu cầu báo giá.
- Bỏ trust strip bốn ô trong hero.
- Danh mục đầu trang chuyển từ sáu mini-card sang dải ảnh, typography và divider.
- Khu vực sản phẩm nổi bật chuyển từ bốn card nhỏ sang danh sách sản phẩm hai cột, ảnh lớn hơn và thông tin catalog thật.
- Danh sách thương hiệu chuyển từ logo-box/card grid sang text index có divider.
- Bỏ outer card của hai panel sản phẩm và thương hiệu.
- Phần dự án đổi thành “Cấu hình triển khai tham khảo”, loại bỏ copy nội bộ như “component”, “Admin” và “dữ liệu minh họa”.
- Nội dung bài viết bỏ metadata ngày giả.
- Spacing giữa các section được phân nhịp compact/spacious thay vì cùng dùng một mức 96px.

#### Catalog, Search và Compare

- Giữ product cards vì đây là affordance chọn sản phẩm, không phải marketing card soup.
- Bỏ dòng “Dữ liệu minh họa cho giao diện” khỏi catalog toolbar.
- Brand context bỏ card nền riêng, chuyển sang khối thông tin có divider.
- Giữ filter rail, view switch, compare và pagination vì đều là điều khiển tác vụ.
- Giữ touch target 44px cho filter, favorite, compare, pagination và drawer controls.
- Copy trạng thái dữ liệu được viết lại theo ngôn ngữ người dùng, không nhắc môi trường kiểm thử hoặc Admin.

#### Product Detail

- Giữ ảnh sản phẩm là visual focus và giữ summary sticky để hỗ trợ quy trình xem cấu hình.
- Thông số kỹ thuật giữ font 15px, line-height rõ và bảng có header/row label.
- Các nhóm tính năng, cấu hình, ứng dụng, tài liệu và bảo hành tiếp tục dùng divider thay vì thêm card.
- Copy kỹ thuật được Việt hóa: “tùy chọn mua thêm” thay cho “option”.
- Bỏ các câu mô tả implementation như “staff-only”, “dữ liệu public” và “chỉ hiển thị trường đã có dữ liệu”.
- CTA báo giá rõ nhưng không dùng màu hoặc kích thước lấn át ảnh máy.

#### Y tế

- Hero bỏ outer card, chuyển thành split layout phẳng với ảnh thiết bị.
- Giữ luồng bốn bước vì đây là sequence hướng dẫn có mục đích, không phải bốn marketing cards.
- Copy sản phẩm bỏ câu tự biện hộ về “số lượt xem giả định”.
- Giữ chuyên khoa, nhóm thiết bị và bảng thông số ở register chuyên môn, ưu tiên scan nhanh.

#### Thú y

- Đồng bộ teal accent về medical blue chung của hệ thống.
- Bỏ decorative gradient, vòng tròn nền, glass caption và `backdrop-filter`.
- Bỏ capability strip ba cột trong hero.
- Bỏ eyebrow lặp ở hero, danh mục, sản phẩm, giải pháp và CTA.
- Icon danh mục và solution không còn nằm trong icon box.
- Bỏ số thứ tự trang trí ở accordion giải pháp.
- Caption ảnh chuyển thành dòng chú thích tĩnh dưới ảnh.
- CTA cuối trang chuyển từ dark promotional band sang nền primary-subtle.
- Việt hóa “Recommended configuration” thành “Cấu hình đề xuất”.

#### Auth, Quote và Footer

- Giữ auth split layout và quote sections vì chúng giúp nhóm form và tăng khả năng hoàn thành tác vụ.
- Giữ process/timeline circles, success indicator và status color vì chúng có ý nghĩa trạng thái.
- Không bổ sung animation hoặc decorative surface mới.
- Footer giữ bốn nhóm thông tin nhưng dùng hierarchy nhẹ, link nhỏ gọn và một hệ màu trung tính.

### Customer Portal

- Bỏ outer card lớn của main content; nội dung làm việc nằm trực tiếp trên app surface.
- Giảm radius sidebar về 6px.
- Documents, empty state và session icon không còn icon box tròn/đổ nền.
- Giữ summary strip vì số liệu được tính từ dữ liệu người dùng và phục vụ điều hướng tác vụ.
- Giữ table, filters, form, modal và drawer vì chúng là product primitives cần thiết.
- Copy phiên đăng nhập bỏ nhắc đến backend và viết theo trạng thái người dùng thấy được.
- Dashboard, favorites, compare, quotes, documents, profile và security dùng cùng mật độ và label hierarchy.

### Admin, RBAC, CRM và Content

- Dashboard panels chuyển từ card grid sang section có divider.
- Quick actions bỏ outer card; giữ nút nhỏ có border để tăng tốc tác vụ.
- Placeholder module giảm từ 420px xuống 180px, bỏ dashed card, icon trang trí và copy theo phase phát triển.
- Các tổng số giả `48`, `126`, `284` được thay bằng số lượng thực tế của mảng dữ liệu đang render.
- Content tab counts được tính trực tiếp theo loại bài viết.
- Bỏ pagination giả khi toàn bộ dữ liệu hiện có đang nằm trên một trang.
- Giá trị chưa xuất bản đổi từ em dash thành “Chưa xuất bản”.
- Users bỏ badge “Dữ liệu minh họa” và copy nhắc API/backend.
- CRM bỏ eyebrow “CRM · Dữ liệu minh họa”; mô tả follow-up được Việt hóa.
- Dashboard empty-data note bỏ thuật ngữ implementation như data model, taxonomy và render.
- Tables, filters, forms, Product CMS, Users, RBAC, CRM và Content giữ layout compact; typography quan trọng không nhỏ hơn 14px sau các override accessibility hiện có.

## What was removed

- Utility bar và cấu trúc header ba tầng.
- Homepage trust strip bốn ô.
- Homepage nested panel cards, product mini-cards và brand boxes.
- Homepage reveal/stagger animation script `homepage-motion.ts`.
- Decorative gradients, glowing/blur backgrounds và glass caption ở trang Thú y.
- Decorative hero circle ở trang Thú y.
- Eyebrow spam và icon boxes không có chức năng.
- Dark promotional CTA band không cần thiết.
- Fake content totals và fake pagination trong Admin Content/Documents/Media.
- Dev-facing copy: component, phase, Admin, backend, data model, taxonomy, staff-only.
- Em dash/en dash trong nội dung hiển thị.
- Các layout transitions không cần thiết trong header.

Không còn phát hiện gradient text, decorative gradient, glassmorphism, blur background, `rounded-3xl`, `shadow-xl` hoặc `shadow-2xl` trong source UI.

## Typography improvements

- Giữ Be Vietnam Pro với đầy đủ weight 400, 500, 600 và 700 để hỗ trợ dấu tiếng Việt ổn định.
- Hero heading giảm tính khẩu hiệu, giới hạn chiều rộng 14–16 ký tự và dùng scale theo viewport.
- Heading Public giữ chênh lệch rõ nhưng không vượt mức cần thiết cho B2B medical.
- Admin heading nhỏ và gọn hơn Public; không dùng marketing scale trong dashboard.
- Paragraph chính giới hạn khoảng 54–68 ký tự để dễ đọc.
- Label, helper, status và metadata được phân cấp bằng weight, spacing và neutral color thay vì badge hàng loạt.
- Technical tables dùng tối thiểu 14–15px, line-height 1.55–1.6 và numeric alignment rõ.
- Copy Việt hóa các từ `option`, `Recommended configuration`, `Pages` và các câu implementation-facing.

## Layout improvements

- Public shell nhường không gian cho ảnh máy và dữ liệu sản phẩm thay vì UI chrome.
- Homepage dùng alternating split layout, text index, divider và whitespace thay cho card soup.
- Section rhythm được chia thành compact 48–64px, standard 80px và spacious 96px theo lượng nội dung.
- Product hero dùng tỷ lệ 45/55 và khoảng cách 40–72px; ảnh không bị cạnh tranh bởi decorative surface.
- Y tế và Thú y dùng cùng visual grammar nhưng khác nội dung chuyên môn.
- Portal main bỏ container thừa; Admin panel bỏ container thừa nhưng table/form/modal vẫn giữ boundary cần thiết.
- Empty states được rút gọn, không dùng icon container lớn hoặc huge empty area.

## Taste Skill decisions

- Dùng `redesign-preserve`: nâng cấp có chọn lọc trên stack hiện có, không rewrite.
- Một accent chính: medical blue. Success, warning và danger chỉ dùng cho trạng thái semantic.
- Radius system giữ 6/8/10/12px; không dùng radius oversized hoặc biến mọi phần tử thành bubble.
- Card chỉ giữ khi nội dung cần boundary và affordance riêng: product card, form section, modal, drawer, table wrapper và auth panel.
- Circle chỉ giữ cho avatar, status dot, progress/timeline và success state vì hình dạng có nghĩa.
- Grid ba/bốn cột chỉ giữ cho dữ liệu sản phẩm hoặc sequence thật; không dùng để lặp marketing claims.
- Motion chỉ giữ hover, modal, drawer, accordion, toast và feedback trong khoảng 140–210ms. Bỏ reveal-on-scroll và stagger decoration.
- Không dùng số liệu tự tạo để làm giao diện có vẻ “đầy”. Empty state được ưu tiên khi chưa có dữ liệu.
- Mỗi trang được kiểm tra theo câu hỏi generic-template. Các phần có thể dùng cho SaaS bất kỳ đã được thay bằng ngôn ngữ thiết bị, chuyên khoa, cấu hình, hồ sơ và quy trình báo giá.

## Responsive improvements

- Header chuyển sang search/menu controls ở 1100px, tránh nav wrap và logo/action collision.
- Mobile header cao 68px và đồng bộ `--header-height` cho sticky sections.
- Homepage hero stack theo một cột, ảnh giữ tỷ lệ 1.25 trên mobile.
- Category index dùng horizontal scrolling có snap thay vì ép sáu mục quá hẹp.
- Featured products chuyển về một cột trên mobile; brand index còn hai cột.
- Thú y hero, category, product grid và solution body lần lượt co về 2 cột rồi 1 cột.
- Product specification table chuyển sang stacked label/value ở mobile, vẫn giữ cỡ chữ 13–14px và divider rõ.
- Portal/Admin tables giữ horizontal overflow; mobile controls và drawer có touch target tối thiểu 44px.

## Verification

- `npx astro build`: pass, server build hoàn tất.
- Impeccable anti-pattern detector: `[]`.
- HTTP smoke test: các route Public chính trả `200`; Portal/Admin trả `302` đúng với auth guard.
- `npm run test:server`: lệnh chạy thành công; repository hiện chưa có test case trong glob này.
- Browser visual QA không thực hiện được vì in-app browser runtime không có browser instance trong phiên làm việc. Audit đã dùng source inspection, compiled output, responsive rules và HTTP smoke test.

### Known repository issue ngoài phạm vi UI

`npm run build` gồm `astro check` hiện dừng ở 7 lỗi TypeScript có sẵn trong API CRM: kiểu trả về của lead/quote thiếu `id` và `assigned_sales_id` tại các handler `src/pages/api/crm/**`. Đây là backend typing issue, không phát sinh từ Phase 19 và không được sửa để tránh mở rộng scope. Bước `astro build` riêng vẫn pass.

## Final status

Phase 19 hoàn tất. Không thêm feature. Không thay đổi route hoặc nghiệp vụ.

Chờ: **RUN PHASE 20**
