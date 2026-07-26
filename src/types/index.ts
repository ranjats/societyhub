export type UserRole = "COMMITTEE_MEMBER" | "RESIDENT";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  societyId: string;
  residentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Society {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactEmail?: string;
  contactPhone?: string;
  totalFlats: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Flat {
  id: string;
  flatNumber: string;
  floor: number;
  area?: number;
  bedrooms?: number;
  status: "OCCUPIED" | "VACANT" | "UNDER_MAINTENANCE";
  monthlyDues: number;
  societyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: Date;
  ownershipType: "OWNER" | "TENANT";
  moveInDate?: Date;
  isActive: boolean;
  flatId: string;
  societyId: string;
  flat?: Flat;
  vehicles?: Vehicle[];
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: "CAR" | "BIKE" | "BICYCLE" | "OTHER";
  brand?: string;
  model?: string;
  color?: string;
  parkingSlot?: string;
  isActive: boolean;
  residentId: string;
  societyId: string;
}

export interface Collection {
  id: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: "PAID" | "PENDING" | "OVERDUE" | "PARTIAL";
  month: number;
  year: number;
  notes?: string;
  receiptNumber?: string;
  flatId: string;
  societyId: string;
  flat?: Flat;
}

export interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  vendor?: string;
  invoiceNumber?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  societyId: string;
  createdBy: string;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
  isPublic: boolean;
  maxAttendees?: number;
  societyId: string;
  createdBy: string;
  createdAt: Date;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  isPublished: boolean;
  publishedAt?: Date;
  expiresAt?: Date;
  societyId: string;
  createdBy: string;
  createdAt: Date;
}

export interface Asset {
  id: string;
  name: string;
  description?: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  location?: string;
  condition?: string;
  isActive: boolean;
  societyId: string;
  createdAt: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  color?: string;
  recurring: boolean;
  societyId: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "COLLECTION" | "EVENT" | "NOTICE" | "EXPENSE" | "GENERAL";
  isRead: boolean;
  link?: string;
  userId: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalFlats: number;
  totalResidents: number;
  monthlyCollection: number;
  pendingCollection: number;
  totalExpenses: number;
  upcomingEvents: number;
  activeNotices: number;
  totalAssets: number;
}

export interface ResidentDashboardStats {
  myPaymentStatus: string;
  upcomingEvents: number;
  latestNotices: number;
  upcomingCalendarEvents: number;
  myVehicles: number;
}
