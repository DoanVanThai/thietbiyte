
export interface MedicalLink {
  label: string;
  href: string;
  description?: string;
}

export interface MedicalSpecialtyConfig {
  slug: string;
  title: string;
  description: string;
  image: string;
  imagePosition: string;
  subcategories: readonly string[];
  needs: readonly string[];
  solutionLabels: readonly string[];
  knowledgeIndexes: readonly number[];
}

export const medicalCategoryFeature = {
  title: "Chẩn đoán hình ảnh",
  description: "Tìm hệ thống siêu âm, X-quang và thiết bị hỗ trợ đọc hình ảnh theo nhu cầu khám.",
  href: "/chuyen-khoa/chan-doan-hinh-anh",
  image: "/images/category-xray.webp",
  imagePosition: "center",
} as const;

export const medicalCategoryGroups = [
  {
    title: "Chẩn đoán và xét nghiệm",
    items: [
      { label: "Xét nghiệm", href: "/chuyen-khoa/xet-nghiem", description: "Sinh hóa, huyết học và cấu hình phòng xét nghiệm" },
      { label: "Nội soi", href: "/danh-muc/noi-soi", description: "Hệ thống nội soi chẩn đoán và phụ trợ" },
    ],
  },
  {
    title: "Theo chuyên khoa",
    items: [
      { label: "Sản phụ khoa", href: "/chuyen-khoa/san-phu-khoa" },
      { label: "Tim mạch", href: "/chuyen-khoa/tim-mach" },
      { label: "Hồi sức và Cấp cứu", href: "/chuyen-khoa/hoi-suc" },
      { label: "Tai Mũi Họng", href: "/chuyen-khoa/tai-mui-hong" },
      { label: "Nha khoa", href: "/chuyen-khoa/nha-khoa" },
    ],
  },
  {
    title: "Điều trị và hỗ trợ",
    items: [
      { label: "Phẫu thuật", href: "/chuyen-khoa/phau-thuat" },
      { label: "Phục hồi chức năng", href: "/chuyen-khoa/phuc-hoi-chuc-nang" },
      { label: "Vật tư", href: "/san-pham?group=medical&q=Vật%20tư" },
    ],
  },
] as const;

export const medicalSpecialties: readonly MedicalSpecialtyConfig[] = [
  {
    slug: "san-phu-khoa",
    title: "Sản phụ khoa",
    description: "Thiết bị phục vụ khám, chẩn đoán hình ảnh và theo dõi trong sản phụ khoa.",
    image: "/images/hero-ultrasound-lab.webp",
    imagePosition: "34% center",
    subcategories: ["Siêu âm", "Monitor sản khoa", "Doppler tim thai", "Bàn khám"],
    needs: ["Khám thai", "Theo dõi sản khoa", "Chẩn đoán hình ảnh"],
    solutionLabels: ["Phòng khám sản phụ khoa", "Phòng khám đa khoa"],
    knowledgeIndexes: [0, 1],
  },
  {
    slug: "tim-mach",
    title: "Tim mạch",
    description: "Tìm thiết bị theo nhu cầu siêu âm tim, điện tim và theo dõi bệnh nhân.",
    image: "/images/project-handover-placeholder.webp",
    imagePosition: "center",
    subcategories: ["Siêu âm tim", "Điện tim", "Monitor", "Holter"],
    needs: ["Khám tim mạch", "Theo dõi", "Chẩn đoán chức năng"],
    solutionLabels: ["Phòng khám đa khoa"],
    knowledgeIndexes: [0, 1],
  },
  {
    slug: "chan-doan-hinh-anh",
    title: "Chẩn đoán hình ảnh",
    description: "Thiết bị tạo ảnh và hỗ trợ chẩn đoán cho phòng khám, khoa khám và bệnh viện.",
    image: "/images/category-xray.webp",
    imagePosition: "center",
    subcategories: ["Máy siêu âm", "Hệ thống X-quang", "Trạm xử lý ảnh", "Phụ kiện đầu dò"],
    needs: ["Khám tổng quát", "Chụp X-quang", "Quản lý hình ảnh"],
    solutionLabels: ["Phòng khám đa khoa"],
    knowledgeIndexes: [0, 1],
  },
  {
    slug: "xet-nghiem",
    title: "Xét nghiệm",
    description: "Thiết bị cho các nhu cầu sinh hóa, huyết học và tổ chức phòng xét nghiệm.",
    image: "/images/category-laboratory.webp",
    imagePosition: "center",
    subcategories: ["Sinh hóa", "Huyết học", "Miễn dịch", "Nước tiểu"],
    needs: ["Xét nghiệm thường quy", "Quản lý mẫu", "Kết nối LIS"],
    solutionLabels: ["Phòng xét nghiệm", "Phòng khám đa khoa"],
    knowledgeIndexes: [2, 1],
  },
  {
    slug: "hoi-suc",
    title: "Hồi sức và Cấp cứu",
    description: "Thiết bị theo dõi và hỗ trợ chăm sóc người bệnh trong hồi sức, cấp cứu.",
    image: "/images/project-handover-placeholder.webp",
    imagePosition: "center",
    subcategories: ["Monitor", "Máy thở", "Bơm tiêm truyền", "Máy sốc tim"],
    needs: ["Theo dõi liên tục", "Hỗ trợ hô hấp", "Cấp cứu"],
    solutionLabels: ["Phòng khám đa khoa"],
    knowledgeIndexes: [1, 0],
  },
  {
    slug: "tai-mui-hong",
    title: "Tai Mũi Họng",
    description: "Thiết bị khám, nội soi và chẩn đoán chức năng cho chuyên khoa Tai Mũi Họng.",
    image: "/images/category-endoscopy-surgery.webp",
    imagePosition: "left center",
    subcategories: ["Nội soi Tai Mũi Họng", "Bàn khám", "Đo thính lực", "Kính hiển vi"],
    needs: ["Khám chuyên khoa", "Nội soi", "Chẩn đoán thính học"],
    solutionLabels: ["Phòng khám Tai Mũi Họng", "Phòng khám đa khoa"],
    knowledgeIndexes: [0, 1],
  },
  {
    slug: "tieu-hoa",
    title: "Tiêu hóa",
    description: "Hệ thống nội soi và thiết bị phụ trợ cho khám, chẩn đoán chuyên khoa tiêu hóa.",
    image: "/images/category-endoscopy-surgery.webp",
    imagePosition: "left center",
    subcategories: ["Nội soi tiêu hóa", "Nguồn sáng", "Bộ xử lý ảnh", "Rửa và lưu trữ"],
    needs: ["Nội soi chẩn đoán", "Xử lý hình ảnh", "Quản lý dụng cụ"],
    solutionLabels: ["Phòng khám tiêu hóa", "Phòng khám đa khoa"],
    knowledgeIndexes: [0, 1],
  },
  {
    slug: "phau-thuat",
    title: "Phẫu thuật",
    description: "Thiết bị phòng mổ và thủ thuật được tổ chức theo nhóm chức năng sử dụng.",
    image: "/images/category-endoscopy-surgery.webp",
    imagePosition: "right center",
    subcategories: ["Dao điện", "Bàn mổ", "Đèn mổ", "Máy hút dịch"],
    needs: ["Phòng mổ", "Thủ thuật", "Kiểm soát vận hành"],
    solutionLabels: ["Phòng khám đa khoa"],
    knowledgeIndexes: [1, 0],
  },
  {
    slug: "nha-khoa",
    title: "Nha khoa",
    description: "Danh mục thiết bị hỗ trợ khám, điều trị và kiểm soát dụng cụ trong nha khoa.",
    image: "/images/project-handover-placeholder.webp",
    imagePosition: "center",
    subcategories: ["Ghế máy nha khoa", "X-quang nha khoa", "Nồi hấp", "Tay khoan"],
    needs: ["Khám và điều trị", "Chẩn đoán hình ảnh", "Tiệt khuẩn"],
    solutionLabels: ["Phòng khám đa khoa"],
    knowledgeIndexes: [0, 1],
  },
  {
    slug: "phuc-hoi-chuc-nang",
    title: "Phục hồi chức năng",
    description: "Thiết bị hỗ trợ vật lý trị liệu, vận động trị liệu và theo dõi tiến trình phục hồi.",
    image: "/images/project-handover-placeholder.webp",
    imagePosition: "center",
    subcategories: ["Điện trị liệu", "Siêu âm trị liệu", "Kéo giãn", "Thiết bị vận động"],
    needs: ["Giảm đau", "Vận động trị liệu", "Phục hồi sau điều trị"],
    solutionLabels: ["Phòng khám đa khoa"],
    knowledgeIndexes: [1, 0],
  },
] as const;

export const getMedicalSpecialty = (slug: string) => medicalSpecialties.find((specialty) => specialty.slug === slug);
