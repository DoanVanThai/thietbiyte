import type { CatalogProduct } from "@/data/catalog";

export const solutionSlug = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/gi, (character) => character === "Đ" ? "D" : "d")
  .toLocaleLowerCase("vi")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const normalize = (value: string) => solutionSlug(value).replace(/-/g, " ");

export interface SolutionProfile {
  label: string;
  overview: string;
  priorities: readonly string[];
  preparation: readonly (readonly [string, string])[];
  catalogHref: string;
  matches: (product: CatalogProduct) => boolean;
}

const commonPreparation = [
  ["Quy mô", "Số phòng chức năng và lượng lượt khám dự kiến mỗi ngày."],
  ["Chuyên môn", "Nhóm dịch vụ, kỹ thuật và chỉ định chính của cơ sở."],
  ["Mặt bằng", "Diện tích, nguồn điện, mạng dữ liệu và luồng di chuyển."],
  ["Ngân sách", "Mức đầu tư dự kiến và kế hoạch triển khai theo giai đoạn."],
] as const;

export const solutionProfile = (title: string): SolutionProfile => {
  const key = normalize(title);

  if (key.includes("thu y")) return {
    label: key.includes("benh vien") ? "Giải pháp bệnh viện thú y" : "Giải pháp phòng khám thú y",
    overview: "Tổ chức thiết bị theo luồng khám, chẩn đoán, theo dõi và can thiệp để đội ngũ thú y vận hành thống nhất từ tiếp nhận đến chăm sóc sau thủ thuật.",
    priorities: ["Thiết bị chẩn đoán phù hợp nhiều kích thước vật nuôi", "Theo dõi, gây mê và hồi tỉnh theo mức độ can thiệp", "Khu xét nghiệm và phẫu thuật có thể mở rộng theo giai đoạn"],
    preparation: commonPreparation,
    catalogHref: "/thu-y",
    matches: (product) => product.group === "veterinary",
  };

  if (key.includes("xet nghiem")) return {
    label: "Giải pháp phòng xét nghiệm",
    overview: "Cấu hình bắt đầu từ danh mục xét nghiệm, công suất mẫu và yêu cầu quản lý dữ liệu; sau đó mới xác định thiết bị chính, phụ trợ và phương án kết nối.",
    priorities: ["Công suất mẫu giờ cao điểm và thời gian trả kết quả", "Danh mục xét nghiệm thường quy, chuyên sâu và khả năng mở rộng", "Quản lý mẫu, nội kiểm và kết nối LIS khi cần"],
    preparation: commonPreparation,
    catalogHref: "/san-pham?category=xet-nghiem",
    matches: (product) => product.categorySlug === "xet-nghiem" || product.specialtySlugs.includes("xet-nghiem"),
  };

  if (key.includes("san phu khoa")) return {
    label: "Giải pháp phòng khám sản phụ khoa",
    overview: "Kết hợp thiết bị khám, siêu âm và theo dõi theo phạm vi chuyên môn của phòng khám, đồng thời dự trù khả năng nâng cấp đầu dò và gói đo về sau.",
    priorities: ["Cấu hình siêu âm và đầu dò theo nhóm ca khám", "Không gian khám bảo đảm riêng tư và thao tác thuận tiện", "Lưu trữ hình ảnh, báo cáo và kết nối dữ liệu khi cần"],
    preparation: commonPreparation,
    catalogHref: "/san-pham?specialty=san-phu-khoa",
    matches: (product) => product.specialtySlugs.includes("san-phu-khoa"),
  };

  if (key.includes("tai mui hong")) return {
    label: "Giải pháp phòng khám Tai Mũi Họng",
    overview: "Tổ chức bàn khám, hệ thống nội soi và thiết bị chẩn đoán chức năng theo luồng khám thực tế, giúp thao tác gọn và quản lý hình ảnh thuận tiện.",
    priorities: ["Hệ thống nội soi và xử lý hình ảnh theo phạm vi khám", "Bàn khám, nguồn sáng và phụ kiện đồng bộ", "Lưu trữ dữ liệu và vệ sinh dụng cụ theo quy trình"],
    preparation: commonPreparation,
    catalogHref: "/san-pham?specialty=tai-mui-hong",
    matches: (product) => product.specialtySlugs.includes("tai-mui-hong"),
  };

  if (key.includes("tieu hoa")) return {
    label: "Giải pháp phòng khám tiêu hóa",
    overview: "Xây dựng cấu hình nội soi từ phạm vi thủ thuật, yêu cầu xử lý hình ảnh và quy trình làm sạch, lưu trữ dụng cụ của cơ sở.",
    priorities: ["Bộ xử lý, nguồn sáng và ống soi theo phạm vi kỹ thuật", "Khu tiền mê, theo dõi và hồi tỉnh nếu có", "Quy trình rửa, khử khuẩn và lưu trữ dụng cụ"],
    preparation: commonPreparation,
    catalogHref: "/san-pham?specialty=tieu-hoa",
    matches: (product) => product.specialtySlugs.includes("tieu-hoa"),
  };

  return {
    label: "Giải pháp theo mô hình cơ sở",
    overview: "Thiên Lộc bắt đầu từ phạm vi chuyên môn, quy mô vận hành và ngân sách thực tế để xây dựng danh mục thiết bị phù hợp, có thể triển khai theo từng giai đoạn.",
    priorities: ["Danh mục thiết bị chính và phụ trợ theo luồng sử dụng", "Điều kiện mặt bằng, lắp đặt và hướng dẫn vận hành", "Kế hoạch đầu tư ban đầu và khả năng mở rộng về sau"],
    preparation: commonPreparation,
    catalogHref: "/y-te",
    matches: (product) => product.group === "medical",
  };
};
