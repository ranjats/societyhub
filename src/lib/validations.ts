import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(20, "Reset link is invalid or expired"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const flatSchema = z.object({
  flatNumber: z.string().min(1, "Flat number is required"),
  floor: z.number().min(0, "Floor must be a positive number"),
  area: z.number().optional(),
  bedrooms: z.number().optional(),
  monthlyDues: z.number().min(0, "Monthly dues must be positive"),
});

export type FlatInput = z.infer<typeof flatSchema>;

export const residentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  ownershipType: z.enum(["OWNER", "TENANT"]).default("OWNER"),
  flatId: z.string().min(1, "Flat is required"),
});

export type ResidentInput = z.infer<typeof residentSchema>;

export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  vendor: z.string().optional(),
  invoiceNumber: z.string().optional(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  location: z.string().optional(),
  maxAttendees: z.number().optional(),
});

export type EventInput = z.infer<typeof eventSchema>;

/** Resident event participation — headcount by gender/age group. */
export const eventParticipationSchema = z.object({
  maleCount: z.number().int().min(0, "Must be 0 or more").default(0),
  femaleCount: z.number().int().min(0, "Must be 0 or more").default(0),
  childrenCount: z.number().int().min(0, "Must be 0 or more").default(0),
  notes: z.string().optional(),
});

export type EventParticipationInput = z.infer<typeof eventParticipationSchema>;

export const noticeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  expiresAt: z.coerce.date().optional(),
});

export type NoticeInput = z.infer<typeof noticeSchema>;

export const vehicleSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required"),
  type: z.enum(["CAR", "BIKE", "BICYCLE", "OTHER"]).default("CAR"),
  brand: z.string().optional(),
  model: z.string().optional(),
  color: z.string().optional(),
  parkingSlot: z.string().optional(),
  residentId: z.string().min(1, "Resident is required"),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;

export const collectionSchema = z.object({
  amount: z.number().min(0.01, "Amount must be positive"),
  dueDate: z.coerce.date(),
  paidDate: z.coerce.date().optional(),
  status: z
    .enum(["PAID", "PENDING", "SUBMITTED", "OVERDUE", "PARTIAL"])
    .default("PENDING"),
  month: z.number().min(1, "Month is required").max(12, "Month must be 1-12"),
  year: z.number().min(2020, "Year must be valid"),
  flatId: z.string().min(1, "Flat is required"),
  notes: z.string().optional(),
  paymentMethod: z.string().optional(),
  receiptNumber: z.string().optional(),
});

export type CollectionInput = z.infer<typeof collectionSchema>;

/** Resident payment submission — flat is derived from the logged-in resident. */
export const paymentSubmissionSchema = z.object({
  month: z.number().min(1, "Month is required").max(12, "Month must be 1-12"),
  year: z.number().min(2020, "Year must be valid"),
  amount: z.number().min(0.01, "Amount must be positive"),
  notes: z.string().optional(),
  paymentMethod: z.string().optional(),
});

export type PaymentSubmissionInput = z.infer<typeof paymentSubmissionSchema>;

export const assetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  totalQuantity: z.number().min(1, "Quantity must be at least 1").default(1),
  location: z.string().optional(),
  condition: z.string().optional(),
});

export type AssetInput = z.infer<typeof assetSchema>;

export const assetBookingSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  quantity: z.number().min(1, "Quantity must be at least 1").default(1),
  notes: z.string().optional(),
  pickupDate: z.coerce.date().optional(),
  expectedReturnDate: z.coerce.date().optional(),
});

export type AssetBookingInput = z.infer<typeof assetBookingSchema>;

/** Resident asset request — pickup & return dates are required. */
export const assetRequestSchema = assetBookingSchema
  .extend({
    pickupDate: z.coerce.date({ message: "Pickup date is required" }),
    expectedReturnDate: z.coerce.date({ message: "Return date is required" }),
  })
  .refine((d) => d.expectedReturnDate >= d.pickupDate, {
    message: "Return date must be on or after the pickup date",
    path: ["expectedReturnDate"],
  });

export type AssetRequestInput = z.infer<typeof assetRequestSchema>;

export const userCreateSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  role: z.enum(["COMMITTEE_MEMBER", "RESIDENT"]).default("RESIDENT"),
  isActive: z.boolean().default(true),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  email: z.string().email("Invalid email").optional(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  phone: z.string().optional(),
  role: z.enum(["COMMITTEE_MEMBER", "RESIDENT"]).optional(),
  isActive: z.boolean().optional(),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export const calendarEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  allDay: z.boolean().default(false),
  color: z.string().optional(),
  recurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
});

export type CalendarEventInput = z.infer<typeof calendarEventSchema>;

export const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  flatNumber: z.string().min(1, "Flat/House number is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
