# Accessibility & Usability Audit — Phase 18

Ngày kiểm tra: 13/08/2026  
Chuẩn tham chiếu: WCAG 2.2, mức AA  
Phạm vi: toàn bộ website công khai, Authentication, User Portal, Product/Catalog/Compare/Quote, Admin và CRM (102 route tĩnh).

> Kết luận: không còn lỗi accessibility mức chặn đã biết trong mã nguồn và HTML build. Kết quả này là đánh giá phù hợp WCAG AA, không phải chứng nhận pháp lý. Kiểm thử cuối bằng screen reader thật vẫn nên được thực hiện trước khi phát hành production.

## 1. Kết quả tổng quan

| Nhóm | Kết quả | Ghi chú |
|---|---|---|
| Contrast | Pass | Text, muted text, link, button, status và border thiết yếu đạt ngưỡng mục tiêu |
| Keyboard | Pass sau sửa | Navigation, search, form, dialog/drawer, product actions, Admin và CRM có đường dùng bàn phím |
| Focus | Pass sau sửa | Có focus-visible 3px toàn cục; input và contenteditable có replacement rõ |
| Forms | Pass sau sửa | Control có accessible name; required/error/description được liên kết ở các form có validation |
| Semantics | Pass sau sửa | Landmark, heading, bảng, button/link, list và trạng thái ARIA được chuẩn hóa |
| Images | Pass | Tất cả ảnh build có `alt`; ảnh trang trí dùng `alt=""` hoặc icon `aria-hidden` |
| Modal/Drawer | Pass | Dùng native `<dialog>`; drawer Admin tùy biến có trap, Escape và restore focus |
| Touch | Pass sau sửa | Target quan trọng đạt tối thiểu 44 × 44px trên thiết bị coarse pointer |
| Medical readability | Pass sau sửa | Bảng thông số/so sánh/CRM/Admin quan trọng dùng tối thiểu 14px và line-height dễ đọc |

Mega Menu: không có component Mega Menu trong hệ thống hiện tại, nên mục này không áp dụng. Navigation desktop và mobile drawer vẫn nằm trong phạm vi kiểm tra.

## 2. Contrast

Các cặp màu nền sáng chính được kiểm tra theo công thức contrast WCAG:

| Token / trường hợp | Tỷ lệ | Ngưỡng |
|---|---:|---:|
| Foreground / white | 16.65:1 | 4.5:1 |
| Muted foreground / white | 8.09:1 | 4.5:1 |
| Primary link / white | 7.11:1 | 4.5:1 |
| Focus ring / white | 4.82:1 | 3:1 |
| Essential strong border / white | 3.36:1 | 3:1 |
| Success status / success background | 8.05:1 | 4.5:1 |
| Danger status / danger background | 6.49:1 | 4.5:1 |
| Review status / review background | 8.19:1 | 4.5:1 |

Đã tránh gray quá nhạt cho text/placeholder. Border trang trí có thể nhẹ hơn; border cần nhận biết control dùng `--color-border-strong`.

## 3. Keyboard và focus

- Mobile navigation, Portal drawer và các modal dùng native `<dialog>`, do đó có focus trap và Escape theo nền tảng; khi đóng, focus trở lại trigger.
- Admin mobile sidebar tùy biến có trap Tab/Shift+Tab, đóng bằng Escape/backdrop/link, khóa scroll và restore focus về nút mở.
- Global search hỗ trợ `Ctrl/Cmd + K`, Arrow Up/Down, Enter và Escape; combobox Admin quản lý `aria-activedescendant` và `aria-selected`.
- Filter nội dung Admin là nhóm toggle button với `aria-pressed`, không giả làm tab panel.
- CMS blocks và Product builder hỗ trợ sắp xếp bằng `Alt + Arrow Up/Down`, bên cạnh drag-and-drop chuột.
- Focus-visible toàn cục dùng outline 3px, offset 2–3px. Input/select/textarea và contenteditable không bị mất outline mà không có replacement.
- Có chế độ `forced-colors` và `prefers-reduced-motion`.

## 4. Forms

- Bộ quét 102 trang build không còn input/select/textarea thiếu accessible name.
- Placeholder chỉ là gợi ý, không thay label.
- Các trường bắt buộc có native `required` và chỉ báo “Bắt buộc” nhìn thấy được trong Auth, Portal, Admin Product/Access và CRM.
- Các form Auth, Quote, Portal và Product editor liên kết lỗi bằng `aria-describedby`/`aria-errormessage`, đặt `aria-invalid` khi lỗi, có vùng live và chuyển focus đến lỗi đầu tiên.
- Hướng dẫn như quy tắc mật khẩu và mô tả trường được nối bằng `aria-describedby`.

## 5. Semantics và images

- Mỗi route build có đúng một `<main>` và tối thiểu một `<h1>`.
- Không còn heading skip, duplicate ID, dialog thiếu tên, button rỗng tên truy cập, bảng thiếu caption/scope hoặc ảnh thiếu `alt` trong output build.
- Bảng Admin/CRM có `<caption>` và `scope="col"`/`scope="row"` phù hợp.
- Filter dùng button; điều hướng dùng link; nhóm lặp dùng list/table/article theo nội dung.
- Status luôn có nhãn chữ/icon đi kèm, không chỉ dựa vào màu.

## 6. Modal, drawer và touch

- Tất cả dialog có `aria-label` hoặc `aria-labelledby`.
- Native dialog đảm nhận trap focus/Escape; trigger được khôi phục theo hành vi native hoặc handler rõ ràng.
- Target Filter, Favorite, Compare, Pagination, Close, Menu, icon action và control kéo-thả đạt tối thiểu 44 × 44px trên thiết bị touch.
- Các hành động mobile cố định có safe-area padding; horizontal data tables giữ khả năng cuộn thay vì nén chữ.

## 7. Medical readability

- Bảng thông số Product Detail, Compare, Catalog, Portal, Admin Product/Access và CRM được nâng lên tối thiểu 14px với line-height 1.5 trở lên.
- Thông số, model, trạng thái, giá trị quote và follow-up không dùng text 12px.
- Số liệu dùng `font-variant-numeric: tabular-nums` ở các vùng cần đối chiếu.
- Status có text label; icon/dot chỉ là tín hiệu bổ sung.

## 8. Issues đã sửa trong Phase 18

- Tăng contrast/focus token và bổ sung forced-colors.
- Chuẩn hóa focus-visible cho control và contenteditable.
- Bổ sung error linkage cho Quote, Portal và Product editor.
- Bổ sung accessible name cho pager icon và Media dialog.
- Bổ sung caption/scope cho bảng Dashboard, Content, Projects, Documents, User Activity và CRM.
- Xóa duplicate anchor ID ở CRM Follow-ups.
- Sửa semantics của Content filter từ tab giả sang toggle group.
- Bổ sung keyboard reorder cho CMS/Product builder.
- Bổ sung focus trap/Escape/restore focus cho Admin mobile sidebar.
- Bổ sung ARIA state cho Search result groups và Compare tray collapse.
- Tăng touch target và cỡ chữ bảng dữ liệu quan trọng.

## 9. Verification

- `npm run build`: thành công.
- Astro diagnostics: **0 errors, 0 warnings, 0 hints**.
- Static output: **102/102 pages built**.
- Bộ quét HTML trên 102 route: **0 issue** cho missing label, unnamed button, missing alt, unnamed dialog, duplicate ID, heading skip, table caption và table header scope.
- Kiểm tra landmark: **102/102 route có đúng một main và có h1**.
- In-app Browser không khả dụng trong phiên audit này, nên không ghi nhận kết quả giả lập từ một browser ngoài kênh được cấp. Logic focus/keyboard đã được kiểm tra trong mã, TypeScript và output build; nên thực hiện một vòng xác nhận bằng NVDA/JAWS/VoiceOver trên môi trường staging trước production.

## 10. Tiêu chí WCAG liên quan

Các sửa đổi trực tiếp bao phủ: 1.1.1, 1.3.1, 1.3.2, 1.4.3, 1.4.11, 2.1.1, 2.1.2, 2.4.1, 2.4.3, 2.4.7, 2.4.11, 2.5.3, 2.5.8, 3.3.1, 3.3.2, 3.3.3, 4.1.2 và 4.1.3.

---

Phase 18 hoàn tất. Dừng tại đây và chờ **RUN PHASE 19**.
