export type LeadStatus = "new" | "contacted" | "qualified" | "quote-sent" | "negotiating" | "won" | "lost";
export type QuoteStatus = "draft" | "review" | "sent" | "accepted" | "expired";
export type ActivityType = "call" | "email" | "zalo" | "meeting" | "quote" | "note" | "status";

export interface CrmActivity {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  actor: string;
  date: string;
  visibility: "internal" | "customer";
}

export interface CrmFollowUp {
  id: string;
  date: string;
  time: string;
  type: "Call" | "Email" | "Zalo" | "Meeting";
  note: string;
  assigned: string;
  state: "upcoming" | "today" | "overdue" | "done";
}

export interface CrmLead {
  id: string;
  name: string;
  organization: string;
  phone: string;
  email: string;
  customerType: string;
  productInterest: string;
  source: string;
  assignedSales: string;
  status: LeadStatus;
  lastContact: string;
  nextFollowUp: string;
  created: string;
  location: string;
  requirement: string;
  activities: CrmActivity[];
  followUps: CrmFollowUp[];
  notes: { id: string; content: string; author: string; date: string; visibility: "internal" | "customer" }[];
  documents: { name: string; meta: string; visibility: "internal" | "customer" }[];
}

export interface CrmQuote {
  id: string;
  leadId: string;
  customer: string;
  phone?: string;
  organization: string;
  products: { name: string; model: string; quantity: number; unitPrice?: number }[];
  value?: number;
  sales: string;
  status: QuoteStatus;
  created: string;
  updated: string;
  requirement: string;
  attachments: { name: string; meta: string; visibility: "internal" | "customer" }[];
  internalNotes: string[];
  history: CrmActivity[];
}

export const leadStatusLabels: Record<LeadStatus, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  qualified: "Đủ điều kiện",
  "quote-sent": "Đã gửi báo giá",
  negotiating: "Đang thương lượng",
  won: "Thành công",
  lost: "Không thành công",
};

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  draft: "Bản nháp",
  review: "Chờ duyệt nội bộ",
  sent: "Đã gửi khách hàng",
  accepted: "Đã chấp nhận",
  expired: "Hết hiệu lực",
};

const sharedActivities: CrmActivity[] = [
  { id: "act-01", type: "call", title: "Cuộc gọi trao đổi nhu cầu", detail: "Xác nhận quy mô phòng khám và nhóm đầu dò cần tư vấn.", actor: "Nguyễn Minh", date: "13/08/2026 · 09:20", visibility: "internal" },
  { id: "act-02", type: "email", title: "Đã gửi tài liệu tham khảo", detail: "Catalogue và danh sách thông tin cần bổ sung để lập cấu hình.", actor: "Nguyễn Minh", date: "12/08/2026 · 16:05", visibility: "customer" },
  { id: "act-03", type: "status", title: "Chuyển trạng thái sang Đủ điều kiện", detail: "Nhu cầu, thời gian dự kiến và người quyết định đã được xác nhận.", actor: "Hệ thống", date: "12/08/2026 · 15:40", visibility: "internal" },
];

const leadSeed = [
  ["LD-0268", "Nguyễn Thảo", "Phòng khám An Tâm", "0903 118 246", "thao@antam.example", "Phòng khám", "Hệ thống siêu âm SonoPort 8", "Website", "Nguyễn Minh", "qualified", "13/08/2026", "14/08/2026 · 09:30", "10/08/2026", "TP. Hồ Chí Minh"],
  ["LD-0267", "Trần Quốc Bảo", "Bệnh viện Minh Tân", "0918 220 381", "bao@minhtan.example", "Bệnh viện", "Hệ thống X-quang kỹ thuật số", "Giới thiệu", "Lê Hoàng", "negotiating", "12/08/2026", "13/08/2026 · 15:00", "09/08/2026", "Bình Dương"],
  ["LD-0266", "Lê Mỹ Dung", "Phòng xét nghiệm Việt Khang", "0982 713 550", "dung@vietkhang.example", "Phòng xét nghiệm", "Máy phân tích sinh hóa BS-240E", "Zalo", "Phạm Linh", "quote-sent", "12/08/2026", "15/08/2026 · 10:00", "08/08/2026", "Đồng Nai"],
  ["LD-0265", "Phạm Hữu Nam", "Bệnh viện Thú y Sài Gòn", "0908 422 119", "nam@vetcare.example", "Bệnh viện thú y", "Monitor thú y đa thông số", "Hotline", "Nguyễn Minh", "contacted", "11/08/2026", "13/08/2026 · 11:00", "07/08/2026", "TP. Hồ Chí Minh"],
  ["LD-0264", "Vũ Mai Anh", "Phòng khám Hòa Bình", "0973 602 844", "anh@hoabinh.example", "Phòng khám", "Máy siêu âm màu chuyên khoa", "Website", "Phạm Linh", "new", "Chưa liên hệ", "13/08/2026 · 16:30", "13/08/2026", "Long An"],
  ["LD-0263", "Đỗ Minh Tuấn", "Trung tâm Y khoa Đông Á", "0931 580 762", "tuan@donga.example", "Trung tâm y khoa", "Hệ thống nội soi chẩn đoán", "Sự kiện", "Lê Hoàng", "won", "08/08/2026", "Hoàn tất", "01/08/2026", "Cần Thơ"],
  ["LD-0262", "Hoàng Thanh Vy", "Phòng khám Thú y PetCare", "0907 155 830", "vy@petcare.example", "Phòng khám thú y", "Máy gây mê thú y", "Facebook", "Nguyễn Minh", "lost", "05/08/2026", "Không có", "30/07/2026", "TP. Hồ Chí Minh"],
  ["LD-0261", "Bùi Đức Long", "Đại lý Thiết bị Nam Việt", "0966 271 448", "long@namviet.example", "Đại lý", "Danh mục thiết bị xét nghiệm", "Giới thiệu", "Phạm Linh", "contacted", "10/08/2026", "16/08/2026 · 14:00", "28/07/2026", "Đà Nẵng"],
] as const;

export const crmLeads: CrmLead[] = leadSeed.map((item, index) => ({
  id: item[0], name: item[1], organization: item[2], phone: item[3], email: item[4], customerType: item[5], productInterest: item[6], source: item[7], assignedSales: item[8], status: item[9] as LeadStatus, lastContact: item[10], nextFollowUp: item[11], created: item[12], location: item[13],
  requirement: index === 0
    ? "Cần cấu hình siêu âm tổng quát và sản phụ khoa, dự kiến triển khai trong quý IV. Khách hàng muốn đối chiếu đầu dò, DICOM và phạm vi đào tạo."
    : `Nhu cầu minh họa cho ${item[6].toLocaleLowerCase("vi")}. Thông tin kỹ thuật và ngân sách cần được Sales xác nhận thêm.`,
  activities: index === 0 ? sharedActivities : [
    { id: `act-${index}-1`, type: index % 2 ? "zalo" : "call", title: index % 2 ? "Trao đổi qua Zalo" : "Cuộc gọi đầu tiên", detail: "Ghi nhận nhu cầu ban đầu và hẹn bước tiếp theo.", actor: item[8], date: item[10], visibility: "internal" },
  ],
  followUps: [{ id: `fu-${index + 1}`, date: item[11].split(" · ")[0], time: item[11].split(" · ")[1] || "09:00", type: index % 3 === 0 ? "Call" : index % 3 === 1 ? "Zalo" : "Email", note: "Xác nhận thông tin còn thiếu và thống nhất bước tiếp theo.", assigned: item[8], state: index === 1 || index === 3 ? "overdue" : index === 4 ? "today" : "upcoming" }],
  notes: [{ id: `note-${index + 1}`, content: "Ghi chú nội bộ minh họa. Cần kiểm tra lại dữ liệu trước khi dùng trong trao đổi với khách hàng.", author: item[8], date: item[10], visibility: "internal" }],
  documents: index % 2 === 0 ? [{ name: "Yêu cầu cấu hình.pdf", meta: "PDF · dữ liệu minh họa", visibility: "customer" }] : [],
}));

export const crmQuotes: CrmQuote[] = [
  {
    id: "BG-2026-0184", leadId: "LD-0268", customer: "Nguyễn Thảo", organization: "Phòng khám An Tâm",
    products: [{ name: "Hệ thống siêu âm màu SonoPort 8", model: "SonoPort 8", quantity: 1, unitPrice: 486000000 }, { name: "Đầu dò linear", model: "Theo cấu hình", quantity: 1 }],
    value: 486000000, sales: "Nguyễn Minh", status: "review", created: "12/08/2026", updated: "13/08/2026 · 10:15",
    requirement: "Cấu hình cho siêu âm tổng quát và sản phụ khoa; cần làm rõ đầu dò, kết nối DICOM, đào tạo và thời gian giao hàng.",
    attachments: [{ name: "Yeu-cau-cau-hinh.pdf", meta: "PDF · 1,2 MB", visibility: "customer" }, { name: "Bang-gia-noi-bo.xlsx", meta: "XLSX · nội bộ", visibility: "internal" }],
    internalNotes: ["Biên lợi nhuận và giá nhập chỉ dùng nội bộ.", "Chờ quản lý duyệt điều khoản thanh toán trước khi gửi."],
    history: [
      { id: "qh-01", type: "quote", title: "Tạo báo giá", detail: "Tạo từ lead LD-0268.", actor: "Nguyễn Minh", date: "12/08/2026 · 14:30", visibility: "internal" },
      { id: "qh-02", type: "note", title: "Cập nhật cấu hình", detail: "Bổ sung đầu dò linear theo nhu cầu khách hàng.", actor: "Nguyễn Minh", date: "13/08/2026 · 10:15", visibility: "internal" },
    ],
  },
  { id: "BG-2026-0183", leadId: "LD-0267", customer: "Trần Quốc Bảo", organization: "Bệnh viện Minh Tân", products: [{ name: "Hệ thống X-quang kỹ thuật số", model: "DR-03", quantity: 1 }], value: 1280000000, sales: "Lê Hoàng", status: "sent", created: "11/08/2026", updated: "12/08/2026 · 16:20", requirement: "Cấu hình phòng chụp tổng quát.", attachments: [], internalNotes: ["Theo dõi phản hồi điều khoản giao hàng."], history: [] },
  { id: "BG-2026-0182", leadId: "LD-0266", customer: "Lê Mỹ Dung", organization: "Phòng xét nghiệm Việt Khang", products: [{ name: "Máy phân tích sinh hóa tự động", model: "BS-240E", quantity: 1 }], value: 735000000, sales: "Phạm Linh", status: "sent", created: "10/08/2026", updated: "12/08/2026 · 09:10", requirement: "Kết nối LIS và đào tạo vận hành.", attachments: [], internalNotes: [], history: [] },
  { id: "BG-2026-0181", leadId: "LD-0263", customer: "Đỗ Minh Tuấn", organization: "Trung tâm Y khoa Đông Á", products: [{ name: "Hệ thống nội soi chẩn đoán", model: "END-06", quantity: 1 }], value: 920000000, sales: "Lê Hoàng", status: "accepted", created: "04/08/2026", updated: "08/08/2026 · 11:00", requirement: "Bộ xử lý hình ảnh và nguồn sáng.", attachments: [], internalNotes: [], history: [] },
  { id: "BG-2026-0180", leadId: "LD-0265", customer: "Phạm Hữu Nam", organization: "Bệnh viện Thú y Sài Gòn", products: [{ name: "Monitor thú y đa thông số", model: "VET-MON-12", quantity: 2 }], sales: "Nguyễn Minh", status: "draft", created: "09/08/2026", updated: "09/08/2026 · 17:40", requirement: "Hai monitor theo dõi ICU thú y.", attachments: [], internalNotes: ["Chờ cấu hình option pin dự phòng."], history: [] },
];

export const crmActivities = crmLeads.flatMap((lead) => lead.activities.map((activity) => ({ ...activity, leadId: lead.id, leadName: lead.name, organization: lead.organization })));
export const crmFollowUps = crmLeads.flatMap((lead) => lead.followUps.map((followUp) => ({ ...followUp, leadId: lead.id, leadName: lead.name, organization: lead.organization })));

export const crmCustomers = crmLeads.filter((lead) => ["won", "negotiating", "quote-sent", "qualified"].includes(lead.status)).map((lead, index) => ({
  id: `KH-${String(126 - index).padStart(4, "0")}`,
  leadId: lead.id,
  name: lead.name,
  organization: lead.organization,
  phone: lead.phone,
  email: lead.email,
  type: lead.customerType,
  salesOwner: lead.assignedSales,
  location: lead.location,
  products: [lead.productInterest],
  quoteIds: crmQuotes.filter((quote) => quote.leadId === lead.id).map((quote) => quote.id),
  activities: lead.activities,
  notes: lead.notes,
  documents: lead.documents,
}));

export const salesPeople = ["Nguyễn Minh", "Lê Hoàng", "Phạm Linh"];
export const leadSources = ["Website", "Hotline", "Zalo", "Giới thiệu", "Sự kiện", "Facebook"];
export const customerTypes = ["Phòng khám", "Bệnh viện", "Phòng xét nghiệm", "Trung tâm y khoa", "Đại lý", "Phòng khám thú y", "Bệnh viện thú y"];

export const formatCrmCurrency = (value?: number) => value
  ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)
  : "Chưa xác định";
