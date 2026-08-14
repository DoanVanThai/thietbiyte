# THIÊN LỘC GROUP - Design Direction

## 1. Tuyên bố định hướng

THIÊN LỘC GROUP cần được cảm nhận như một đối tác cung ứng và kỹ thuật đáng tin cậy, không phải một sàn thương mại điện tử và không phải một landing page startup.

Ngôn ngữ thiết kế mục tiêu:

- Clinical
- Professional
- Modern
- Technical
- Trustworthy
- Clean
- B2B
- Premium vừa đủ

Nguyên tắc quyết định:

1. Clarity > Decoration.
2. Readability > Effects.
3. Information > Marketing noise.
4. Evidence > Claim.
5. Task completion > Visual novelty.

## 2. Trải nghiệm cốt lõi

Một người dùng phải có thể trả lời nhanh bốn câu hỏi:

1. THIÊN LỘC có sản phẩm/giải pháp phù hợp nhu cầu của tôi không?
2. Sản phẩm này dùng cho ngữ cảnh nào và có thông số gì quan trọng?
3. Công ty có đủ năng lực cung ứng, lắp đặt và hỗ trợ sau bán hàng không?
4. Tôi cần làm gì tiếp theo để nhận báo giá, tài liệu hoặc hỗ trợ kỹ thuật?

Public Website phải tối ưu ba hành trình chính:

- Tìm sản phẩm: ngành -> danh mục/chuyên khoa -> filter -> chi tiết -> shortlist/yêu cầu báo giá.
- Đánh giá năng lực: giải pháp/dự án -> bằng chứng -> dịch vụ kỹ thuật -> liên hệ.
- Tra cứu kiến thức: search -> bài kiến thức -> sản phẩm/giải pháp liên quan -> tư vấn chuyên môn.

Portal/Admin phải tối ưu tốc độ, độ chính xác, trạng thái và khả năng phục hồi lỗi. Không mang visual marketing vào workflow nghiệp vụ.

## 3. Phân tách ba surface

| Surface | Register | Mục tiêu | Density | Điều cần tránh |
|---|---|---|---:|---|
| Public Website | Brand + information | Tìm kiếm, đánh giá, tạo lead và xây trust | 5/10 | Hero phô trương, marketing copy dài, card grid lặp |
| User Portal | Product | Tra cứu tài liệu, yêu cầu hỗ trợ, theo dõi giao dịch/dịch vụ | 7/10 | Motion trang trí, navigation sáng tạo quá mức |
| Admin | Product | Quản trị catalogue, nội dung, lead, dự án và dịch vụ | 8/10 | Card hóa dữ liệu, màu accent ở trạng thái inactive |

### Quy tắc dùng chung component

Nên dùng chung ở mức primitive và token:

- Color, typography, spacing, radius, border, focus và semantic state tokens.
- Button, IconButton, Field, Select, Combobox, Checkbox, Radio, Tabs, Dialog/Drawer, Toast.
- Status, Empty state, Loading skeleton, Error message.
- Logo, icon family và accessibility behavior.

Không nên dùng chung trực tiếp nếu khác register:

- Public Header/Mega menu với Portal/Admin navigation.
- Marketing ProductCard với Admin data row.
- Public hero/section wrapper với dashboard panel.
- Public article card với Admin content editor row.
- Public CTA band với Portal action toolbar.

Mục tiêu là một design system chung nhưng ba composition layer riêng.

## 4. Kiến trúc thông tin Public

### 4.1 Sitemap xác nhận

| Nhóm | Trang |
|---|---|
| Entry | Trang chủ |
| Product discovery | Sản phẩm, Y tế, Thú y, Danh mục, Chuyên khoa, Thương hiệu |
| Capability | Giải pháp, Dự án, Dịch vụ kỹ thuật |
| Content | Tin tức, Kiến thức |
| Company | Giới thiệu, Liên hệ |
| Utility | Tìm kiếm, Đăng nhập |

### 4.2 Route direction đề xuất

Route cụ thể sẽ được chốt trong Phase 1. Baseline slug tiếng Việt không dấu:

| Trang | Route đề xuất |
|---|---|
| Trang chủ | `/` |
| Sản phẩm | `/san-pham` |
| Y tế | `/san-pham/y-te` |
| Thú y | `/san-pham/thu-y` |
| Danh mục | `/danh-muc` |
| Chuyên khoa | `/chuyen-khoa` |
| Thương hiệu | `/thuong-hieu` |
| Giải pháp | `/giai-phap` |
| Dự án | `/du-an` |
| Dịch vụ kỹ thuật | `/dich-vu-ky-thuat` |
| Tin tức | `/tin-tuc` |
| Kiến thức | `/kien-thuc` |
| Giới thiệu | `/gioi-thieu` |
| Liên hệ | `/lien-he` |
| Tìm kiếm | `/tim-kiem` |
| Đăng nhập | `/dang-nhap` |

Portal và Admin nên có namespace riêng, ví dụ `/portal/*` và `/admin/*`, để tách layout, permission, analytics và caching khỏi Public Website.

### 4.3 Header desktop

Không đặt toàn bộ sitemap trên một hàng. Header dùng ba lớp với tổng chiều cao được kiểm soát:

1. Utility strip thấp: hotline kỹ thuật, email, địa điểm hoặc thông tin cần thiết. Không dùng ticker.
2. Main header: logo bên trái, search rộng ở trung tâm, đăng nhập và CTA chính bên phải.
3. Primary navigation một hàng:
   - Sản phẩm
   - Giải pháp
   - Dự án
   - Dịch vụ kỹ thuật
   - Tài nguyên
   - Giới thiệu
   - Liên hệ

Mega menu của `Sản phẩm` chứa Y tế, Thú y, Danh mục, Chuyên khoa và Thương hiệu theo nhóm rõ ràng. `Tài nguyên` chứa Tin tức và Kiến thức.

### 4.4 Header mobile

- Một hàng gồm logo, search action và menu action.
- Search mở thành surface riêng có recent query/suggestion, không nhét vào menu dài.
- Menu dùng accordion theo nhóm, không render toàn bộ taxonomy cùng lúc.
- Hotline, đăng nhập và CTA chính đặt ở vùng cố định, dễ chạm.
- Không dùng horizontal nav cuộn cho menu cấp một.

### 4.5 Breadcrumb và wayfinding

- Có breadcrumb trên Product, Category, Specialty, Brand, Solution, Project và Article detail.
- Breadcrumb phản ánh taxonomy thật, không lặp title vô ích.
- Active state luôn rõ trên Public, Portal và Admin.
- Detail page phải có đường quay lại danh sách cùng filter state khi khả thi.

## 5. Hierarchy mới

### 5.1 Thứ tự ưu tiên thông tin

1. Page identity: người dùng đang ở đâu và nội dung là gì.
2. Decision-critical data: ứng dụng, thông số, tiêu chuẩn, hãng, tình trạng hỗ trợ.
3. Evidence: tài liệu, chứng nhận, dự án, chính sách, đội ngũ kỹ thuật.
4. Primary action: yêu cầu báo giá, tải tài liệu hoặc yêu cầu hỗ trợ.
5. Related discovery: sản phẩm, giải pháp hoặc nội dung liên quan.

### 5.2 Hierarchy trang chủ

Trang chủ không phải danh sách mọi thứ công ty có. Cấu trúc đề xuất:

1. Header và global search.
2. Hero split, left-aligned: thông điệp cụ thể + một CTA chính + một CTA phụ; bên còn lại là ảnh thiết bị/lắp đặt thật.
3. Product entry: hai lối rõ cho Y tế và Thú y, sau đó là các đường vào theo Danh mục/Chuyên khoa.
4. Năng lực nổi bật: giải pháp theo workflow, không phải 3 feature card chung chung.
5. Thương hiệu/đối tác: logo thật, không thêm nhãn trang trí dưới logo.
6. Dự án tiêu biểu: bằng chứng cụ thể về phạm vi cung cấp và dịch vụ.
7. Dịch vụ kỹ thuật: quy trình hỗ trợ, bảo trì, đào tạo và SLA nếu có.
8. Kiến thức mới/có giá trị: được biên tập theo đối tượng, không trộn tin công ty với kiến thức chuyên môn.
9. CTA cuối trang có ý định khác hero hoặc là điểm lặp có chủ đích của CTA chính.
10. Footer gọn, đủ pháp lý và liên hệ.

Không dùng cùng một layout family cho hai section liên tiếp quá hai lần. Không để mọi section là heading centered + 3 card.

### 5.3 Hierarchy product listing

1. Breadcrumb + H1 + mô tả taxonomy ngắn.
2. Search within results + số lượng kết quả.
3. Filter theo ngành, danh mục, chuyên khoa, hãng và thuộc tính kỹ thuật có giá trị.
4. Result list/grid có thể quét model, ảnh, ứng dụng, thuộc tính chính và tài liệu.
5. Sort và compare/shortlist nếu business flow cần.
6. Pagination hoặc load pattern có URL/state rõ, hỗ trợ SEO.

Desktop ưu tiên sidebar filter hoặc filter bar có cấu trúc. Mobile dùng drawer/sheet với số filter đang áp dụng và nút xóa rõ ràng.

### 5.4 Hierarchy product detail

Above the fold:

- Breadcrumb.
- Tên sản phẩm, model, hãng và ngành.
- Ảnh sản phẩm thật, đúng tỷ lệ.
- 3-5 thuộc tính quyết định, không phải marketing badge.
- CTA chính `Yêu cầu báo giá` hoặc CTA đã được business xác nhận.
- CTA phụ `Tải tài liệu` hoặc `Nhận tư vấn kỹ thuật`.

Phần nội dung:

1. Tổng quan và ứng dụng.
2. Thông số kỹ thuật theo nhóm logic.
3. Cấu hình/phụ kiện/tương thích.
4. Tài liệu và chứng nhận.
5. Dịch vụ lắp đặt, đào tạo, bảo hành.
6. Sản phẩm/giải pháp liên quan.

Thông số dài dùng grouped specification, table semantic hoặc disclosure theo nhóm. Không biến mỗi thông số thành một card và không kẻ cả top/bottom border trên mọi dòng.

### 5.5 Hierarchy Portal/Admin

- Page title + trạng thái/scope + action bar.
- Filter/search ở gần dữ liệu, không nằm trong hero.
- Table/list là surface chính; card chỉ dùng cho summary thực sự cần nhóm.
- Primary action có một vị trí ổn định.
- Bulk action chỉ xuất hiện khi có selection.
- Loading dùng skeleton theo layout; empty state dạy cách bắt đầu; error nằm gần nguồn lỗi.
- Dữ liệu số dùng tabular figures.

## 6. Layout direction

### 6.1 Grid và container

- Public desktop: container tối đa khoảng 1280-1360px, lề fluid, grid 12 cột.
- Article/prose: cột đọc 65-75ch, có rail cho mục lục/tài liệu khi cần.
- Product detail: vùng media 5-6 cột, vùng identity/action 6-7 cột; phần spec theo full container.
- Portal/Admin: app shell có content width theo task; table không bị ép vào marketing container hẹp.
- Dưới 768px: các composition bất đối xứng chuyển thành một cột rõ ràng.

### 6.2 Nhịp trang

- Dùng khoảng cách theo quan hệ, không dùng một mức section padding cho toàn trang.
- Nhóm title + description chặt hơn nhóm đó với content.
- Section chuyển chủ đề cần khoảng thở lớn hơn section tiếp nối cùng câu chuyện.
- Xen kẽ full-width evidence, split content, grouped list và media; tránh chuỗi card grid.
- Không dùng overlap chỉ để tạo cảm giác premium. Overlap chỉ hợp lý khi thể hiện quan hệ giữa ảnh và caption/content.

### 6.3 Cards

Card được dùng khi có ít nhất một trong các lý do:

- Item có ranh giới và action riêng.
- Người dùng cần chọn/so sánh item.
- Elevation thể hiện layer tương tác thật.

Không dùng card cho heading section, đoạn giới thiệu, từng metric đơn lẻ hoặc từng dòng thông số. Ưu tiên list, table, divider, grouping và whitespace.

## 7. Typography direction

### 7.1 Font strategy

Baseline đề xuất: một sans-serif có hỗ trợ tiếng Việt tốt cho cả ba surface, ưu tiên `Be Vietnam Pro` sau khi kiểm tra render thực tế. Fallback: `system-ui`, `-apple-system`, `Segoe UI`, sans-serif.

Lý do:

- Dấu tiếng Việt rõ ở kích thước nhỏ.
- Giữ cảm giác kỹ thuật, hiện đại và địa phương mà không giả lập phong cách startup quốc tế.
- Một family giảm lệch giọng giữa Public, Portal và Admin.

Không dùng serif chỉ để tạo cảm giác premium. Không dùng display font trong label, button, table hoặc form. Nếu brand guideline sau này có font chính thức, font thương hiệu được ưu tiên sau khi kiểm tra readability và license.

### 7.2 Scale direction

Public Website:

| Role | Desktop direction | Mobile direction |
|---|---:|---:|
| Hero H1 | 48-60px, tối đa 2 dòng | 34-42px |
| Page H1 | 40-48px | 30-36px |
| Section H2 | 28-36px | 24-30px |
| H3 | 20-24px | 18-22px |
| Body | 16-18px | 16px |
| Metadata | 13-14px | 13-14px |

Portal/Admin dùng fixed scale dày hơn:

- Page title 24-30px.
- Section title 18-22px.
- UI body 14-16px.
- Table/metadata 13-14px khi contrast và density cho phép.

### 7.3 Typographic rules

- H1-H3 dùng sentence case, không Title Case máy móc.
- Heading tracking từ -0.01em đến -0.025em; không chặt hơn -0.04em.
- Body line-height khoảng 1.55-1.7 trên Public; 1.4-1.55 trong product UI.
- Dùng `text-wrap: balance` cho heading và `pretty` cho prose khi implementation hỗ trợ.
- Uppercase chỉ dùng cho label ngắn, không lặp trên mọi section.
- Model, SKU và dữ liệu số cần tabular figures; monospace chỉ dùng khi nội dung thực sự là mã.

## 8. Color direction

### 8.1 Chiến lược

Color strategy: restrained clinical.

- Nền chủ đạo là neutral sáng hơi ngả theo màu thương hiệu, không dùng beige/cream mặc định.
- Một primary accent duy nhất cho action, link, focus và active state.
- Màu semantic dành cho success, warning, error và info; không dùng semantic color để trang trí.
- Y tế và Thú y không tách thành hai palette cạnh tranh. Phân biệt bằng content, imagery, label và taxonomy.

### 8.2 Palette khởi điểm để kiểm chứng ở Phase 1

Đây là direction, chưa phải brand token chính thức vì chưa có logo/guideline:

| Role | Giá trị khởi điểm | Mục đích |
|---|---|---|
| Ink | `#17252B` | Heading, body chính |
| Muted ink | `#4F626A` | Metadata có contrast đạt chuẩn |
| Canvas | `#F7F9F9` | Nền trang |
| Surface | `#FFFFFF` | Form, table, panel cần surface |
| Border | `#D7E1E1` | Divider và control boundary |
| Primary | `#0B6661` | CTA, link, active, focus |
| Primary strong | `#07514D` | Hover/pressed và text cần contrast |
| Info | `#245C8A` | Trạng thái thông tin |
| Success | `#237A4B` | Thành công/available |
| Warning | `#9A6500` | Cảnh báo |
| Error | `#B4232C` | Lỗi/nguy hiểm |

Trước Phase 1 cần đối chiếu palette với logo chính thức và kiểm tra WCAG 2.2 AA ở tất cả pairing. Không dùng gradient text, blue-purple glow hoặc gradient CTA.

## 9. Spacing, radius, border và shadow

### 9.1 Spacing

Base unit: 4px.

Scale khuyến nghị: 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96.

- Public component gap thường dùng 12-32px.
- Public section gap dùng 48-96px nhưng thay đổi theo nội dung.
- Portal/Admin component gap dùng 8-24px; page gap 24-40px.
- Mobile gutter 16-20px; tablet 24-32px; desktop 32-48px tùy container.

### 9.2 Radius

Hệ thống soft-control, không cartoon:

| Component | Radius direction |
|---|---:|
| Input, select, button | 6-8px |
| Card/panel | 8-12px |
| Large media | 12-16px |
| Tag/status | 999px chỉ khi pill phù hợp semantic |

Không dùng `rounded-3xl` cho section/card. Không dùng pill cho primary button theo mặc định.

### 9.3 Borders và shadows

- Divider 1px là công cụ phân nhóm chính cho table/list.
- Panel không đồng thời có border và shadow rộng.
- Shadow chỉ dùng cho dropdown, popover, sticky elevation hoặc modal.
- Shadow blur nên thấp và tint theo neutral/primary; không dùng `shadow-xl` trang trí.
- Không dùng glow.

## 10. Iconography và imagery

### 10.1 Icons

- Dùng một family duy nhất, baseline đề xuất Phosphor ở weight regular hoặc stroke tương đương 1.5-1.75.
- Icon 16-20px cho UI, 20-24px cho action nổi bật.
- Icon phải có label/accessible name khi action không có text.
- Không đặt icon trên mọi heading.
- Không dùng icon y tế sáo mòn như dấu cộng, nhịp tim, shield ở mọi section.
- Icon chuyên khoa/danh mục chỉ được dùng khi có taxonomy và bộ hình nhất quán.

### 10.2 Imagery

Ưu tiên theo thứ tự:

1. Ảnh sản phẩm chính thức từ hãng, nền sạch, đúng model.
2. Ảnh lắp đặt, đào tạo và bàn giao thật của THIÊN LỘC.
3. Ảnh môi trường sử dụng thật, có kiểm soát về quyền sử dụng và tính chính xác.
4. Diagram kỹ thuật hoặc workflow có nguồn rõ ràng.

Không dùng stock “bác sĩ cười nhìn camera”, ảnh AI có thiết bị y tế sai cấu trúc, gradient blob hoặc fake dashboard làm hero. Mọi ảnh có kích thước/tỷ lệ được reserve để tránh CLS và có alt text theo nội dung.

## 11. Components direction

### 11.1 Public navigation components

- UtilityBar
- PublicHeader
- GlobalSearch
- ProductMegaMenu
- MobileNavigation
- Breadcrumbs
- PublicFooter

### 11.2 Discovery components

- TaxonomyIndex
- FilterPanel/FilterSheet
- ActiveFilterSummary
- ProductResultItem
- ProductComparisonBar nếu nghiệp vụ cần
- BrandIndex
- SpecialtyIndex
- SearchSuggestion/SearchResult/NoResults

### 11.3 Detail và evidence components

- ProductIdentity
- ProductMediaGallery
- KeySpecificationList
- GroupedSpecificationTable
- DocumentDownloadList
- CertificateList
- ProjectEvidence
- ServiceCommitment
- RelatedProducts/RelatedSolutions

### 11.4 Conversion components

- QuoteRequestForm
- TechnicalConsultationForm
- ContactChannelList
- FormSuccess/FormError

Một trang chỉ có một primary action. Secondary và tertiary action phải khác ý định, khác visual weight và có label cụ thể.

### 11.5 Portal/Admin components

- AppShell
- SideNavigation hoặc TopNavigation theo workflow thực
- PageHeader
- ActionToolbar
- DataTable
- FilterBar
- BulkActions
- Status
- AuditTrail
- EmptyState
- Skeleton
- InlineError
- ConfirmationDialog chỉ cho hành động có rủi ro

## 12. Responsive direction

### 12.1 Breakpoint strategy

Baseline để kiểm chứng:

- Small: dưới 640px.
- Medium: 640-767px.
- Tablet: 768-1023px.
- Desktop: 1024-1279px.
- Wide: từ 1280px.

Breakpoint phải phản ứng với điểm gãy của content, không chỉ theo device name.

### 12.2 Quy tắc bắt buộc

- Target tương tác tối thiểu 44x44px.
- Không dùng fixed width gây horizontal scroll.
- H1 và model dài phải wrap an toàn, không cắt chữ tiếng Việt.
- Product grid chuyển 4/3/2/1 cột theo content; không ép card quá hẹp.
- Table mobile có lựa chọn theo task: horizontal scroll có sticky key column, priority columns, hoặc row detail. Không tự động biến mọi bảng thành card.
- Filter mobile mở sheet/drawer, có Apply, Clear và số kết quả dự kiến.
- Sticky CTA trên mobile chỉ dùng nếu không che content và hỗ trợ task chính.
- Media dùng aspect ratio rõ; không phụ thuộc `100vh`. Nếu cần full-height dùng dynamic viewport unit.
- Mobile navigation phải keyboard/screen-reader friendly và khóa scroll đúng khi mở.

## 13. Motion direction

Motion intensity: 2/10.

- Duration mặc định 150-220ms cho hover, focus, expand và state change.
- Easing ease-out, không bounce/elastic.
- Chỉ animate transform và opacity khi có thể.
- Không fade-up mọi section, không parallax, marquee, scroll hijack hoặc card stack.
- Skeleton chỉ shimmer nhẹ nếu không gây phân tâm; ưu tiên static skeleton khi reduced motion.
- Tất cả motion phải tôn trọng `prefers-reduced-motion`.
- Content không được ẩn mặc định chờ animation.

Motion hợp lệ phải truyền đạt một trong bốn điều: feedback, state change, hierarchy hoặc continuity.

## 14. Content direction

### 14.1 Voice

- Chính xác, trực tiếp, có bằng chứng.
- Dùng thuật ngữ chuyên môn đúng ngữ cảnh và giải thích khi cần.
- Không dùng các cụm chung chung như “giải pháp hàng đầu”, “nâng tầm”, “đột phá”, “toàn diện” nếu không có dữ kiện.
- Không dùng dấu chấm than để tạo urgency.
- Không tạo số liệu giả hoặc chứng nhận giả để làm đẹp layout.

### 14.2 Product content model tối thiểu

- Tên thương mại.
- Model/SKU.
- Hãng và xuất xứ.
- Ngành: Y tế hoặc Thú y.
- Danh mục.
- Chuyên khoa/ứng dụng.
- Mô tả ngắn.
- Key specifications.
- Full specifications theo nhóm.
- Cấu hình/phụ kiện/tương thích.
- Tài liệu và chứng nhận.
- Bảo hành, lắp đặt, đào tạo, hỗ trợ.
- Ảnh và alt text.
- Sản phẩm/giải pháp liên quan.
- CTA/status theo chính sách kinh doanh.

### 14.3 Tin tức và kiến thức

Tách rõ:

- Tin tức: hoạt động công ty, sự kiện, hợp tác, bàn giao.
- Kiến thức: nội dung chuyên môn, hướng dẫn chọn/vận hành, bảo trì và ứng dụng.

Bài kiến thức cần ngày cập nhật, tác giả hoặc người duyệt chuyên môn khi phù hợp, nguồn tham khảo và disclaimer. Không trình bày bài chuyên môn như marketing blog generic.

## 15. Accessibility và trust baseline

- Mục tiêu WCAG 2.2 AA.
- Body text contrast tối thiểu 4.5:1; large text tối thiểu 3:1.
- Focus ring rõ và nhất quán, không bị che bởi sticky header.
- Có skip link, landmark semantic và heading order đúng.
- Form dùng label thật phía trên field, helper/error ở dưới; không dùng placeholder thay label.
- Error không chỉ truyền đạt bằng màu.
- Ảnh sản phẩm có alt mô tả model/góc nhìn khi có ý nghĩa; ảnh trang trí dùng alt rỗng đúng cách.
- Download ghi rõ loại file và dung lượng nếu biết.
- Link mở tab mới phải được báo trước khi cần.
- Dữ liệu y tế/technical phải có nguồn, ngày cập nhật và ownership rõ.
- Không dùng dark pattern, countdown giả, stock giả hoặc claim không kiểm chứng.

## 16. Keep, redesign, build

### Keep

Hiện không có component để giữ. Khi nhận brand asset, giữ nguyên logo/wordmark và màu chính thức trừ khi có phê duyệt redesign thương hiệu.

### Redesign

Hiện không có component để redesign.

### Build in Phase 1

Phase 1 nên bắt đầu từ information architecture, content model và design tokens, sau đó mới dựng shell và page archetype. Thứ tự ưu tiên đề xuất:

1. Xác nhận brand asset, CTA, pricing policy và taxonomy.
2. Chốt design tokens và shared primitives.
3. Dựng Public shell, search và navigation.
4. Dựng Product listing + Product detail làm archetype chính.
5. Dựng Homepage từ content thật và evidence thật.
6. Dựng content pages, solution/project/service pages.
7. Dựng Portal/Admin shell tách composition nhưng dùng chung primitives.
8. Audit accessibility, responsive, performance và AI-pattern repetition.

Không triển khai các bước trên trong Phase 0.

## 17. Definition of success cho hướng thiết kế

Hướng thiết kế đạt yêu cầu khi:

- Người mua chuyên môn tìm được đúng sản phẩm hoặc giải pháp trong tối đa ba quyết định điều hướng chính.
- Product detail giúp tạo shortlist mà không cần đọc marketing copy dài.
- Bằng chứng năng lực, dự án và dịch vụ kỹ thuật xuất hiện trước CTA cuối cùng.
- Public Website có bản sắc clinical B2B nhưng không rơi vào medical-blue template hoặc SaaS template.
- Portal/Admin cho phép người dùng chuyên nghiệp thao tác nhanh với ít decoration.
- Desktop và mobile giữ cùng thứ tự ưu tiên thông tin.
- Component nhất quán nhưng page composition không lặp máy móc.
- Không có gradient text, glow, glass mặc định, radius quá lớn, card grid tràn lan hoặc fade-up hàng loạt.

