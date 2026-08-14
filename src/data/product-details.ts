import { catalogProducts, type CatalogProduct } from "@/data/catalog";

export type ProductPriceMode = "SHOW_PRICE" | "CONTACT" | "REQUEST_QUOTE";
export type DocumentAccess = "public" | "login" | "restricted";

export interface ProductGalleryItem {
  type: "image" | "video";
  src: string;
  alt: string;
  poster?: string;
  position?: string;
  quoteEnabled?: boolean;
  quoteCaption?: string;
  quoteAfterText?: string;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ProductSpecificationGroup {
  title: string;
  items: readonly ProductSpecification[];
}

export interface ProductDetail {
  product: CatalogProduct;
  shortName: string;
  descriptor: string;
  manufacturingYear?: string;
  condition?: string;
  availability?: string;
  priceMode: ProductPriceMode;
  priceVnd?: number;
  gallery: readonly ProductGalleryItem[];
  overview: readonly string[];
  features: readonly { title: string; description: string }[];
  configurations: readonly {
    title: string;
    description?: string;
    items: readonly { name: string; detail?: string; quantity?: number; imageUrl?: string }[];
  }[];
  specificationGroups: readonly ProductSpecificationGroup[];
  applications: readonly string[];
  documents: readonly {
    title: string;
    format: string;
    size?: string;
    access: DocumentAccess;
    href?: string;
  }[];
  warranty?: {
    period?: string;
    coverage?: string;
    installation?: string;
    technicalSupport?: string;
  };
  quickInfo: readonly { label: string; value: string; icon: string }[];
  faq: readonly { question: string; answer: string }[];
  dataNotice?: string;
  seo?: { title?: string; description?: string; ogImage?: string };
}

const sonoPort = catalogProducts.find((product) => product.slug === "he-thong-sieu-am-mau-sonoport-8")!;

const sonoPortDetail: ProductDetail = {
  product: sonoPort,
  shortName: "SonoPort 8",
  descriptor: "Máy siêu âm cao cấp",
  availability: "Liên hệ xác nhận cấu hình và thời gian cung cấp",
  priceMode: "CONTACT",
  gallery: [
    {
      type: "image",
      src: "/images/hero-ultrasound-lab.webp",
      alt: "Ảnh minh họa hệ thống siêu âm SonoPort 8 trong phòng chẩn đoán",
      position: "33% center",
    },
    {
      type: "image",
      src: "/images/project-handover-placeholder.webp",
      alt: "Ảnh minh họa góc nhìn thiết bị siêu âm khi bàn giao",
      position: "center",
    },
    {
      type: "image",
      src: "/images/category-laboratory.webp",
      alt: "Ảnh minh họa môi trường vận hành thiết bị chẩn đoán",
      position: "center",
    },
  ],
  overview: [
    "SonoPort 8 được trình bày trong giao diện mẫu như một hệ thống siêu âm màu dành cho nhu cầu chẩn đoán tổng quát và chuyên khoa. Nội dung được tổ chức để người dùng có thể nhận diện nhanh phạm vi ứng dụng, cấu hình và các nhóm thông số cần đối chiếu.",
    "Thông tin kỹ thuật chính thức, phụ kiện đi kèm và phạm vi dịch vụ sẽ được đồng bộ từ Admin sau khi được Thiên Lộc Group xác nhận với tài liệu của nhà sản xuất.",
  ],
  features: [
    {
      title: "Quy trình thăm khám có cấu trúc",
      description: "Các preset, phép đo và gói phần mềm được trình bày theo từng nhu cầu lâm sàng để hỗ trợ lựa chọn cấu hình.",
    },
    {
      title: "Hệ thống đầu dò theo nhu cầu",
      description: "Danh sách đầu dò có thể thay đổi theo chuyên khoa, cấu hình mua sắm và phạm vi ứng dụng thực tế.",
    },
    {
      title: "Kết nối và quản lý dữ liệu",
      description: "Các tùy chọn lưu trữ, xuất dữ liệu và kết nối hệ thống cần được xác nhận trong cấu hình kỹ thuật chính thức.",
    },
    {
      title: "Thiết kế phục vụ vận hành",
      description: "Giao diện yêu cầu báo giá tách rõ máy chính, phụ kiện tiêu chuẩn và option để giảm nhầm lẫn khi đối chiếu.",
    },
  ],
  configurations: [
    {
      title: "Máy chính",
      description: "Thành phần nền tảng của cấu hình.",
      items: [
        { name: "Hệ thống siêu âm màu SonoPort 8", detail: "Số lượng và phiên bản chờ xác nhận" },
        { name: "Màn hình hiển thị", detail: "Thông số theo tài liệu kỹ thuật" },
        { name: "Bộ điều khiển và phần mềm hệ thống" },
      ],
    },
    {
      title: "Đầu dò",
      description: "Lựa chọn theo chuyên khoa sử dụng.",
      items: [
        { name: "Đầu dò convex", detail: "Option theo cấu hình" },
        { name: "Đầu dò linear", detail: "Option theo cấu hình" },
        { name: "Đầu dò chuyên khoa", detail: "Xác nhận theo ứng dụng" },
      ],
    },
    {
      title: "Phụ kiện",
      description: "Đối chiếu trong báo giá được duyệt.",
      items: [
        { name: "Phụ kiện vận hành tiêu chuẩn" },
        { name: "Tài liệu hướng dẫn sử dụng" },
        { name: "Vật tư ban đầu", detail: "Nếu có trong phạm vi báo giá" },
      ],
    },
    {
      title: "Option mua thêm",
      description: "Không mặc định thuộc cấu hình tiêu chuẩn.",
      items: [
        { name: "Gói phần mềm chuyên khoa" },
        { name: "Thiết bị in và lưu trữ" },
        { name: "Kết nối dữ liệu", detail: "Xác nhận khả năng tương thích trước khi đặt hàng" },
      ],
    },
  ],
  specificationGroups: [
    {
      title: "Tổng quan",
      items: [
        { label: "Loại thiết bị", value: "Hệ thống siêu âm màu" },
        { label: "Model", value: "SonoPort 8" },
        { label: "Hãng", value: "CHISON" },
        { label: "Xuất xứ", value: "Trung Quốc" },
        { label: "Cấu hình sử dụng", value: "Theo chuyên khoa và yêu cầu mua sắm được xác nhận" },
      ],
    },
    {
      title: "Hình ảnh",
      items: [
        { label: "Chế độ hiển thị", value: "Các chế độ hình ảnh cần đối chiếu theo phiên bản phần mềm và tài liệu kỹ thuật chính thức" },
        { label: "Xử lý hình ảnh", value: "Theo cấu hình hệ thống" },
        { label: "Lưu ảnh và cine", value: "Dung lượng và định dạng chờ dữ liệu Admin" },
        { label: "Gói đo", value: "Lựa chọn theo ứng dụng lâm sàng" },
      ],
    },
    {
      title: "Màn hình",
      items: [
        { label: "Màn hình chính", value: "Màn hình độ phân giải cao" },
        { label: "Kích thước", value: "Chờ tài liệu kỹ thuật chính thức" },
        { label: "Điều chỉnh tư thế", value: "Theo cấu hình phần cứng" },
      ],
    },
    {
      title: "Đầu dò",
      items: [
        { label: "Cổng kết nối đầu dò", value: "Số lượng chờ xác nhận theo cấu hình" },
        { label: "Đầu dò convex", value: "Option theo nhu cầu siêu âm tổng quát và sản phụ khoa" },
        { label: "Đầu dò linear", value: "Option theo nhu cầu mạch máu và phần nông" },
        { label: "Đầu dò chuyên khoa", value: "Xác nhận theo ứng dụng và khả năng tương thích" },
      ],
    },
    {
      title: "Kết nối",
      items: [
        { label: "DICOM", value: "Hỗ trợ theo cấu hình" },
        { label: "Kết nối mạng", value: "Phương thức kết nối chờ xác nhận" },
        { label: "Cổng ngoại vi", value: "Danh sách cổng theo tài liệu kỹ thuật" },
        { label: "Xuất dữ liệu", value: "Định dạng và quy trình xuất phụ thuộc cấu hình hệ thống" },
      ],
    },
    {
      title: "Nguồn điện",
      items: [
        { label: "Điện áp đầu vào", value: "Theo nhãn thiết bị và tài liệu kỹ thuật của cấu hình cung cấp" },
        { label: "Tần số", value: "Chờ dữ liệu Admin" },
        { label: "Công suất", value: "Chờ dữ liệu Admin" },
      ],
    },
    {
      title: "Kích thước",
      items: [
        { label: "Kích thước tổng thể", value: "Chờ bản vẽ kỹ thuật" },
        { label: "Khối lượng", value: "Chờ cấu hình thực tế" },
        { label: "Điều kiện bố trí", value: "Cần khảo sát vị trí lắp đặt trước khi xác nhận" },
      ],
    },
    {
      title: "Phụ kiện",
      items: [
        { label: "Phụ kiện tiêu chuẩn", value: "Theo danh mục trong báo giá được duyệt" },
        { label: "Phụ kiện tùy chọn", value: "Đầu dò, phần mềm và thiết bị ngoại vi theo nhu cầu" },
        { label: "Tài liệu bàn giao", value: "Theo hồ sơ được xác nhận trong phạm vi cung cấp" },
      ],
    },
  ],
  applications: ["Siêu âm tổng quát", "Sản phụ khoa", "Tim mạch", "Mạch máu", "Tiết niệu", "Nhi khoa"],
  documents: [
    {
      title: "Catalogue SonoPort 8",
      format: "PDF",
      size: "Chưa cập nhật dung lượng",
      access: "public",
    },
    {
      title: "Tài liệu cấu hình kỹ thuật",
      format: "PDF",
      access: "login",
    },
  ],
  warranty: {
    period: "24 tháng (dữ liệu minh họa)",
    coverage: "Phạm vi bảo hành chờ chính sách được Admin xác nhận",
    installation: "Phạm vi lắp đặt và hướng dẫn sử dụng theo báo giá được duyệt",
    technicalSupport: "Xác nhận kênh và thời gian hỗ trợ khi lập báo giá",
  },
  quickInfo: [
    { label: "Bảo hành", value: "24 tháng (minh họa)", icon: "ph-shield-check" },
    { label: "Lắp đặt", value: "Theo phạm vi báo giá", icon: "ph-wrench" },
    { label: "Hồ sơ", value: "Theo cấu hình bàn giao", icon: "ph-file-text" },
    { label: "Hỗ trợ kỹ thuật", value: "Liên hệ xác nhận", icon: "ph-headset" },
  ],
  faq: [
    {
      question: "Làm thế nào để nhận cấu hình và giá chính xác?",
      answer: "Gửi yêu cầu báo giá kèm chuyên khoa, nhu cầu sử dụng và danh sách đầu dò dự kiến. Đội ngũ tư vấn sẽ xác nhận lại cấu hình trước khi gửi báo giá.",
    },
    {
      question: "Có thể thay đổi đầu dò và option phần mềm không?",
      answer: "Khả năng lựa chọn phụ thuộc phiên bản thiết bị và phạm vi tương thích. Mỗi option cần được xác nhận trong cấu hình kỹ thuật chính thức.",
    },
    {
      question: "Tài liệu nào được cung cấp khi bàn giao?",
      answer: "Danh mục tài liệu sẽ được ghi trong báo giá hoặc biên bản bàn giao. Giao diện không tự mặc định hồ sơ khi Admin chưa xác nhận dữ liệu.",
    },
  ],
  dataNotice: "Thông tin và hình ảnh trên trang mang tính tham khảo. Thông số, phụ kiện và chính sách cần được xác nhận trước khi báo giá.",
};

const buildFallbackDetail = (product: CatalogProduct): ProductDetail => ({
  product,
  shortName: product.model,
  descriptor: product.category,
  availability: product.availability === "unavailable" ? "Tạm ngừng cung cấp" : "Liên hệ xác nhận tình trạng cung cấp",
  priceMode: product.availability === "unavailable" ? "REQUEST_QUOTE" : "CONTACT",
  gallery: [{
    type: "image",
    src: product.image,
    alt: `Ảnh minh họa ${product.name}`,
    position: product.imagePosition,
  }],
  overview: [
    `${product.name} thuộc nhóm ${product.category.toLocaleLowerCase("vi")}, được tổ chức trong catalog theo hãng, model, chuyên khoa và ứng dụng.`,
    "Thông tin chi tiết sẽ được hiển thị khi dữ liệu kỹ thuật chính thức được cập nhật từ Admin.",
  ],
  features: product.specs.map((spec) => ({
    title: spec,
    description: "Phạm vi và giá trị kỹ thuật cần được xác nhận theo cấu hình cung cấp.",
  })),
  configurations: [],
  specificationGroups: [
    {
      title: "Nhận diện sản phẩm",
      items: [
        { label: "Tên sản phẩm", value: product.name },
        { label: "Hãng", value: product.brand },
        { label: "Model", value: product.model },
        { label: "Danh mục", value: product.category },
        { label: "Xuất xứ", value: product.origin },
      ],
    },
    {
      title: "Thông tin catalog",
      items: product.specs.map((spec, index) => ({ label: `Thông tin ${index + 1}`, value: spec })),
    },
  ],
  applications: [...product.applications],
  documents: [],
  warranty: product.warranty ? { period: product.warranty } : undefined,
  quickInfo: product.warranty ? [{ label: "Bảo hành", value: product.warranty, icon: "ph-shield-check" }] : [],
  faq: [{
    question: "Làm thế nào để nhận thông số và cấu hình chính thức?",
    answer: "Hãy gửi nhu cầu sử dụng và thông tin cơ sở. Thiên Lộc Group sẽ xác nhận dữ liệu trước khi tư vấn cấu hình.",
  }],
  dataNotice: "Thông tin trên trang mang tính tham khảo và cần được xác nhận trước khi báo giá.",
});

export const getProductDetail = (product: CatalogProduct): ProductDetail =>
  product.slug === sonoPort.slug ? sonoPortDetail : buildFallbackDetail(product);

export const productDetailPaths = catalogProducts.map((product) => ({
  params: { slug: product.slug },
  props: { detail: getProductDetail(product) },
}));

export const formatVnd = (amount: number) => new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
}).format(amount);
