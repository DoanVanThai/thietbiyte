# PHASE 9 - AUTHENTICATION UI AUDIT

Ngày hoàn thành: 13/08/2026

## Phạm vi

Phase 9 chỉ triển khai Authentication UI cho đăng nhập, đăng ký, quên mật khẩu, đặt lại mật khẩu, xác minh email và các trạng thái liên quan đến tài khoản. Không triển khai backend authentication, User Portal, Admin hoặc Phase 10.

## Design read

Auth được thiết kế như một bề mặt tác vụ yên tĩnh cho người dùng B2B y tế. Form phải được nhận diện, đọc và hoàn tất nhanh trong môi trường văn phòng, phòng khám hoặc bệnh viện.

- Design variance: 2/10.
- Motion intensity: 1/10.
- Visual density: 5/10.
- Giữ Be Vietnam Pro, semantic color tokens, spacing, radius, focus và button language hiện có.
- Không dùng split-screen, marketing carousel, gradient, ảnh trang trí hoặc card có shadow lớn.

## Routes

- `/dang-nhap`
- `/dang-ky`
- `/quen-mat-khau`
- `/dat-lai-mat-khau`
- `/xac-minh-email`

Các state có thể kiểm tra bằng query trong UI foundation hiện tại:

- `/dang-nhap?state=unverified`
- `/dang-nhap?state=locked`
- `/dat-lai-mat-khau?state=expired`
- `/dat-lai-mat-khau?state=success`
- `/xac-minh-email?state=expired`
- `/xac-minh-email?state=success`

## Login

- H1 trực tiếp là `Đăng nhập`.
- Email dùng `type=email`, `inputmode=email`, `autocomplete=username`, không tự viết hoa và không spellcheck.
- Password dùng `autocomplete=current-password` và có show/hide với `aria-pressed` cùng accessible label động.
- Có Remember me, Forgot password, CTA chính `Đăng nhập` và secondary action `Tạo tài khoản`.
- Loading vô hiệu hóa submit, đặt `aria-busy=true`, hiển thị spinner và copy `Đang đăng nhập`.
- Validation theo field, focus field lỗi đầu tiên và form error không tiết lộ email hay mật khẩu nào sai.
- Có account states cho email chưa xác minh và tài khoản tạm khóa.

## Register

Form chỉ thu thập:

- Họ và tên.
- Email.
- Số điện thoại.
- Mật khẩu.
- Xác nhận mật khẩu.
- Loại khách hàng.

Customer type gồm đủ Bác sĩ/Cá nhân, Phòng khám, Bệnh viện, Phòng xét nghiệm, Đại lý, Phòng khám thú y và Bệnh viện thú y.

Desktop dùng hai cột khi đủ rộng; mobile chuyển một cột. Không yêu cầu địa chỉ, mã số thuế, tên đơn vị hoặc dữ liệu hồ sơ chưa cần thiết.

## Password flows

### Forgot password

- Email field có label thật và keyboard phù hợp.
- Success copy luôn dùng điều kiện `Nếu email khớp với một tài khoản`, không xác nhận email tồn tại.
- Có resend loading và live status.

### Reset password

- Có password, confirm password và bốn yêu cầu rõ ràng.
- Requirement list được liên kết với password bằng `aria-describedby`.
- Mỗi requirement cập nhật trạng thái thị giác và accessible label `Đã đáp ứng` hoặc `Chưa đáp ứng`.
- Có form, success và expired-link state.
- Khi submit thành công, focus chuyển tới heading của success state.

## Verification

- Default state hướng dẫn kiểm tra hộp thư nhưng không xác nhận địa chỉ có tồn tại.
- Có resend, resend loading và live status.
- Có success và expired state.
- Expired state cho phép yêu cầu liên kết mới mà không tạo claim về tài khoản.

## Validation và security UX

- Email sai định dạng có ví dụ dễ hiểu.
- Số điện thoại sai có lỗi riêng, không dùng thông báo chung mơ hồ.
- Password requirement và mismatch được mô tả cụ thể.
- Server-like login error dùng copy chung cho cả email và mật khẩu.
- Forgot password, verify và resend dùng security-neutral copy.
- UI không ghi mật khẩu, token hoặc dữ liệu nhạy cảm vào URL hay local storage.
- Đây là frontend foundation; rate limit, token expiry và account enumeration policy vẫn phải do backend thực thi.

## Accessibility

- Mỗi route có một H1.
- Mọi input có label liên kết bằng `for/id`.
- Error có `aria-live`, `aria-errormessage` và `aria-invalid` khi xảy ra lỗi.
- Password toggle là button thật, có focus và accessible name.
- Touch target chính và standalone links tối thiểu 44px.
- Submit có disabled và busy state để ngăn gửi lặp.
- Sau Email sent hoặc Reset success, focus chuyển sang heading trạng thái mới.
- Skip link và focus-visible dùng Design System hiện có.
- Reduced motion làm chậm spinner và gần như tắt transition không thiết yếu.

## Responsive

| Vùng hiển thị | Hành vi |
| --- | --- |
| Trên 640px | Login rộng tối đa 440px, Register tối đa 560px và dùng hai cột có kiểm soát |
| 320-640px | Form một cột, padding 16px, H1 24px, back action thành icon 44px |
| Màn hình thấp | Body cho phép nội dung tăng chiều cao; form không bị khóa trong một viewport cố định |

Mobile inputs giữ font 16px để tránh browser tự zoom. Email và điện thoại mở đúng keyboard tương ứng.

## Final Taste audit

- **Overdesign:** không có split-screen SaaS, gradient, glass, glow, decorative illustration hoặc marketing carousel.
- **Card/shadow:** form không bị bọc trong card nổi; hierarchy đến từ width, typography và spacing.
- **Form hierarchy:** H1, description, fields, account actions và submit có thứ tự rõ.
- **Typography:** nội dung quan trọng từ 13px trở lên; input 16px; heading dùng fixed scale phù hợp product UI.
- **Color:** primary chỉ dành cho action/focus; success và danger chỉ dùng cho state.
- **Motion:** chỉ spinner và transition trạng thái ngắn; không có page-load animation.
- **Mobile:** một cột, touch target 44px, không có CTA hoặc label xuống dòng thiếu kiểm soát.

## Files

### Layout và components

- `src/layouts/AuthLayout.astro`
- `src/components/AuthShell.astro`
- `src/components/AuthBrand.astro`
- `src/components/PasswordField.astro`

### Pages

- `src/pages/dang-nhap.astro`
- `src/pages/dang-ky.astro`
- `src/pages/quen-mat-khau.astro`
- `src/pages/dat-lai-mat-khau.astro`
- `src/pages/xac-minh-email.astro`

### Behavior và styles

- `src/scripts/auth.ts`
- `src/styles/auth.css`

## Verification

- `npm run check`: đạt, 50 files, 0 errors, 0 warnings, 0 hints.
- HTTP 200 cho 5 routes auth và 6 biến thể query state được liệt kê trong audit.
- Mỗi route auth có đúng một H1.
- Impeccable detector: 0 findings trên layout, components, pages, behavior và styles của Phase 9.
- Source audit xác nhận không có gradient, backdrop blur, giant radius, shadow lớn hoặc text 12px trong auth UI.
- `npm run build`: đạt, 54 static pages được tạo thành công.

## Giới hạn

- Browser tích hợp không có session khả dụng trong môi trường hiện tại nên chưa chạy được screenshot regression, keyboard traversal và thao tác form bằng browser thật.
- Submit hiện mô phỏng phản hồi để thể hiện loading, validation và state transition. Kết nối API, cookie/session, CSRF, rate limiting, email delivery và token verification thuộc backend.
- Link điều khoản và chính sách cần được kết nối với nội dung pháp lý chính thức khi các route đó có dữ liệu được duyệt.

## Kết luận

Phase 9 hoàn thành đúng phạm vi. Dừng tại đây và chờ `RUN PHASE 10`.
