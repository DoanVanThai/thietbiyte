export const searchSuggestions = [
  "SonoPort 8",
  "BS-240E",
  "Mindray",
  "Máy siêu âm",
  "Máy xét nghiệm",
];

export const trustItems = [
  ["seal-check", "Thiết bị chính hãng"],
  ["file-text", "Hồ sơ rõ ràng"],
  ["sliders-horizontal", "Tư vấn cấu hình"],
  ["wrench", "Lắp đặt tận nơi"],
  ["headset", "Bảo hành & kỹ thuật"],
] as const;

export const categories = [
  {
    name: "Máy siêu âm",
    description: "Hệ thống chẩn đoán từ tổng quát đến chuyên sâu.",
    image: "/images/hero-ultrasound-lab.webp",
    imagePosition: "43% center",
    className: "category-featured",
    query: "may-sieu-am",
  },
  {
    name: "Hệ thống X-quang",
    description: "Giải pháp X-quang số cho phòng khám và bệnh viện.",
    image: "/images/category-xray.webp",
    imagePosition: "center",
    className: "category-wide",
    query: "x-quang",
  },
  {
    name: "Thiết bị xét nghiệm",
    description: "Thiết bị huyết học, sinh hóa và miễn dịch.",
    image: "/images/category-laboratory.webp",
    imagePosition: "center",
    className: "category-wide",
    query: "xet-nghiem",
  },
  {
    name: "Hệ thống nội soi",
    description: "Nội soi chẩn đoán và can thiệp.",
    image: "/images/category-endoscopy-surgery.webp",
    imagePosition: "left center",
    className: "category-small",
    query: "noi-soi",
  },
  {
    name: "Thiết bị phẫu thuật",
    description: "Thiết bị cho phòng mổ và thủ thuật.",
    image: "/images/category-endoscopy-surgery.webp",
    imagePosition: "right center",
    className: "category-small",
    query: "phau-thuat",
  },
  {
    name: "Thiết bị Thú y",
    description: "Chẩn đoán và điều trị cho cơ sở thú y.",
    image: "/images/veterinary-diagnostic-room.webp",
    imagePosition: "70% center",
    className: "category-small",
    query: "thu-y",
  },
] as const;

export const featuredProducts = [
  {
    category: "Chẩn đoán hình ảnh",
    name: "Hệ thống siêu âm màu",
    specs: ["Màn hình độ phân giải cao", "Đầu dò theo cấu hình", "DICOM tùy chọn"],
    image: "/images/hero-ultrasound-lab.webp",
    imagePosition: "35% center",
  },
  {
    category: "Xét nghiệm",
    name: "Máy phân tích sinh hóa",
    specs: ["Hệ thống để bàn", "Quản lý mẫu trực quan", "Kết nối LIS tùy chọn"],
    image: "/images/category-laboratory.webp",
    imagePosition: "center",
  },
  {
    category: "X-quang",
    name: "Hệ thống X-quang kỹ thuật số",
    specs: ["Bàn chụp đa tư thế", "Detector phẳng", "Trạm xử lý hình ảnh"],
    image: "/images/category-xray.webp",
    imagePosition: "center",
  },
  {
    category: "Theo dõi bệnh nhân",
    name: "Monitor theo dõi đa thông số",
    specs: ["Hiển thị đa thông số", "Cấu hình theo khoa", "Hỗ trợ kết nối mạng"],
    image: "/images/veterinary-diagnostic-room.webp",
    imagePosition: "43% 38%",
  },
] as const;

export const medicalGroups = [
  "Chẩn đoán hình ảnh",
  "Xét nghiệm",
  "Nội soi",
  "Sản phụ khoa",
  "Tim mạch",
  "Hồi sức",
  "Phẫu thuật",
  "Tai Mũi Họng",
  "Nha khoa",
  "Phục hồi chức năng",
];

export const veterinaryGroups = [
  "Siêu âm thú y",
  "X-quang thú y",
  "Xét nghiệm thú y",
  "Gây mê",
  "Monitor",
  "Phẫu thuật",
  "ICU",
  "Nội soi",
];

export const specialties = [
  "Sản phụ khoa",
  "Tim mạch",
  "Chẩn đoán hình ảnh",
  "Xét nghiệm",
  "Tai Mũi Họng",
  "Tiêu hóa",
  "Phẫu thuật",
  "Nha khoa",
  "Phục hồi chức năng",
  "Thú y",
];

export const solutions = [
  ["Phòng khám đa khoa", "Danh mục thiết bị theo quy mô và phạm vi khám.", "/images/hero-ultrasound-lab.webp"],
  ["Phòng khám sản phụ khoa", "Siêu âm, theo dõi và thiết bị khám chuyên khoa.", "/images/project-handover-placeholder.webp"],
  ["Phòng xét nghiệm", "Thiết bị, cấu hình và kết nối theo công suất mẫu.", "/images/category-laboratory.webp"],
  ["Phòng khám Tai Mũi Họng", "Nội soi và thiết bị khám được tổ chức theo luồng sử dụng.", "/images/category-endoscopy-surgery.webp"],
  ["Phòng khám tiêu hóa", "Giải pháp nội soi, xử lý hình ảnh và phụ trợ.", "/images/category-endoscopy-surgery.webp"],
  ["Phòng khám thú y", "Chẩn đoán, gây mê và theo dõi trong một hệ thống đồng bộ.", "/images/veterinary-diagnostic-room.webp"],
  ["Bệnh viện thú y", "Cấu hình cho xét nghiệm, phẫu thuật và chăm sóc tích cực.", "/images/veterinary-diagnostic-room.webp"],
] as const;

export const brands = ["CHISON", "Mindray", "SonoScape", "Boule Medical", "Wondfo", "Contec", "Zerone", "Volition"];

export const reasons = [
  ["Tư vấn đúng nhu cầu", "Hỗ trợ lựa chọn cấu hình phù hợp với chuyên khoa và quy mô cơ sở."],
  ["Hồ sơ thiết bị rõ ràng", "Thông tin hãng, xuất xứ và tài liệu được trình bày rõ theo sản phẩm."],
  ["Lắp đặt & hướng dẫn", "Hỗ trợ vận chuyển, lắp đặt và hướng dẫn vận hành."],
  ["Bảo hành", "Chính sách hiển thị rõ theo từng thiết bị."],
  ["Hỗ trợ kỹ thuật", "Đồng hành trong quá trình sử dụng thiết bị."],
] as const;

export const projects = [
  {
    title: "Cấu hình phòng siêu âm",
    location: "Phòng khám chuyên khoa",
    equipment: "Hệ thống siêu âm và monitor",
    time: "Theo kế hoạch triển khai",
    image: "/images/project-handover-placeholder.webp",
  },
  {
    title: "Cấu hình phòng xét nghiệm",
    location: "Phòng xét nghiệm để bàn",
    equipment: "Thiết bị xét nghiệm để bàn",
    time: "Theo kế hoạch triển khai",
    image: "/images/category-laboratory.webp",
  },
] as const;

export const articles = [
  ["Hướng dẫn lựa chọn", "Các tiêu chí cần xem khi lựa chọn máy siêu âm cho phòng khám", "Tóm tắt các yếu tố về chuyên khoa, đầu dò, phần mềm và dịch vụ kỹ thuật."],
  ["Vận hành thiết bị", "Cách tổ chức hồ sơ và lịch bảo trì thiết bị y tế", "Một cấu trúc tham khảo giúp đội ngũ theo dõi tài liệu và các mốc kỹ thuật."],
  ["Phòng xét nghiệm", "Những câu hỏi cần đặt ra trước khi chọn thiết bị xét nghiệm", "Xem xét công suất, loại mẫu, hóa chất, kết nối và không gian vận hành."],
  ["Thiết bị Thú y", "Xây dựng danh mục thiết bị cho phòng khám thú y", "Gợi ý nhóm thiết bị theo luồng chẩn đoán, gây mê, theo dõi và phẫu thuật."],
] as const;
