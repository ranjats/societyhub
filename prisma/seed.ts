import { PrismaClient, UserRole, FlatStatus, CollectionStatus, EventStatus, NoticePriority, ExpenseStatus, VehicleType } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("🌱 Seeding database...");

  console.log("🗑️  Cleaning existing data...");
  await prisma.assetBooking.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.event.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.resident.deleteMany();
  await prisma.flat.deleteMany();
  await prisma.society.deleteMany();

  const society = await prisma.society.create({
    data: {
      name: "Green Valley Society",
      address: "123 MG Road, Sector 15",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
      contactEmail: "admin@greenvalley.com",
      contactPhone: "+91 98765 43210",
      totalFlats: 50,
    },
  });
  console.log("✅ Society created:", society.name);

  const passwordHash = await hashPassword("password123");

  const committeeAdmin = await prisma.user.create({
    data: {
      email: "admin@societyhub.com",
      passwordHash,
      firstName: "Rajesh",
      lastName: "Kumar",
      phone: "+91 98765 43211",
      role: UserRole.COMMITTEE_MEMBER,
      isActive: true,
      societyId: society.id,
    },
  });
  console.log("✅ Committee Admin created:", committeeAdmin.email);

  const committeeMember = await prisma.user.create({
    data: {
      email: "committee@societyhub.com",
      passwordHash,
      firstName: "Priya",
      lastName: "Sharma",
      phone: "+91 98765 43212",
      role: UserRole.COMMITTEE_MEMBER,
      isActive: true,
      societyId: society.id,
    },
  });
  console.log("✅ Committee Member created:", committeeMember.email);

  const flatData = [];
  for (let floor = 1; floor <= 5; floor++) {
    for (let unit = 1; unit <= 10; unit++) {
      flatData.push({
        flatNumber: `${floor}0${unit}`,
        floor,
        bedrooms: unit <= 5 ? 3 : 2,
        area: unit <= 5 ? 1500 : 1200,
        status: FlatStatus.OCCUPIED,
        monthlyDues: unit <= 5 ? 5000 : 3500,
        societyId: society.id,
      });
    }
  }
  const flats = await Promise.all(
    flatData.map((flat) => prisma.flat.create({ data: flat }))
  );
  console.log(`✅ ${flats.length} Flats created`);

  const residentData = [
    { firstName: "Amit", lastName: "Patel", phone: "+91 98765 43220", ownershipType: "OWNER" as const, flatIndex: 0 },
    { firstName: "Sneha", lastName: "Reddy", phone: "+91 98765 43221", ownershipType: "OWNER" as const, flatIndex: 1 },
    { firstName: "Vikram", lastName: "Singh", phone: "+91 98765 43222", ownershipType: "TENANT" as const, flatIndex: 2 },
    { firstName: "Ananya", lastName: "Gupta", phone: "+91 98765 43223", ownershipType: "OWNER" as const, flatIndex: 3 },
    { firstName: "Ravi", lastName: "Verma", phone: "+91 98765 43224", ownershipType: "OWNER" as const, flatIndex: 4 },
    { firstName: "Meera", lastName: "Nair", phone: "+91 98765 43225", ownershipType: "TENANT" as const, flatIndex: 5 },
    { firstName: "Karthik", lastName: "Iyer", phone: "+91 98765 43226", ownershipType: "OWNER" as const, flatIndex: 6 },
    { firstName: "Deepa", lastName: "Menon", phone: "+91 98765 43227", ownershipType: "OWNER" as const, flatIndex: 7 },
    { firstName: "Suresh", lastName: "Pillai", phone: "+91 98765 43228", ownershipType: "TENANT" as const, flatIndex: 8 },
    { firstName: "Lakshmi", lastName: "Rao", phone: "+91 98765 43229", ownershipType: "OWNER" as const, flatIndex: 9 },
  ];

  const residents = [];
  for (const rd of residentData) {
    const resident = await prisma.resident.create({
      data: {
        firstName: rd.firstName,
        lastName: rd.lastName,
        email: `${rd.firstName.toLowerCase()}@email.com`,
        phone: rd.phone,
        ownershipType: rd.ownershipType,
        moveInDate: new Date(2023, Math.floor(Math.random() * 12), 1),
        isActive: true,
        flatId: flats[rd.flatIndex].id,
        societyId: society.id,
      },
    });
    residents.push(resident);
  }
  console.log(`✅ ${residents.length} Residents created`);

  const residentUser = await prisma.user.create({
    data: {
      email: "resident@societyhub.com",
      passwordHash,
      firstName: "Amit",
      lastName: "Patel",
      phone: "+91 98765 43220",
      role: UserRole.RESIDENT,
      isActive: true,
      societyId: society.id,
      residentId: residents[0].id,
    },
  });
  console.log("✅ Resident User created:", residentUser.email);

  const vehicleData = [
    { registrationNumber: "KA-01-AB-1234", type: VehicleType.CAR, brand: "Maruti", model: "Swift", color: "White", residentIndex: 0 },
    { registrationNumber: "KA-01-CD-5678", type: VehicleType.CAR, brand: "Hyundai", model: "Creta", color: "Black", residentIndex: 1 },
    { registrationNumber: "KA-01-EF-9012", type: VehicleType.BIKE, brand: "Honda", model: "CB Shine", color: "Red", residentIndex: 2 },
    { registrationNumber: "KA-01-GH-3456", type: VehicleType.CAR, brand: "Tata", model: "Nexon", color: "Blue", residentIndex: 3 },
    { registrationNumber: "KA-01-IJ-7890", type: VehicleType.BIKE, brand: "Bajaj", model: "Pulsar", color: "Black", residentIndex: 4 },
  ];

  for (const vd of vehicleData) {
    await prisma.vehicle.create({
      data: {
        registrationNumber: vd.registrationNumber,
        type: vd.type,
        brand: vd.brand,
        model: vd.model,
        color: vd.color,
        parkingSlot: `P${vd.residentIndex + 1}`,
        isActive: true,
        residentId: residents[vd.residentIndex].id,
        societyId: society.id,
      },
    });
  }
  console.log("✅ Vehicles created");

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  for (let i = 0; i < 10; i++) {
    const flat = flats[i];
    const amount = Number(flat.monthlyDues);

    await prisma.collection.create({
      data: {
        amount,
        dueDate: new Date(currentYear, currentMonth - 2, 10),
        paidDate: new Date(currentYear, currentMonth - 2, 8),
        status: CollectionStatus.PAID,
        month: currentMonth - 1,
        year: currentYear,
        flatId: flat.id,
        societyId: society.id,
        collectedBy: committeeAdmin.id,
        receiptNumber: `REC-${currentMonth - 1}-${currentYear}-${i + 1}`,
      },
    });

    await prisma.collection.create({
      data: {
        amount,
        dueDate: new Date(currentYear, currentMonth - 1, 10),
        status: i < 6 ? CollectionStatus.PAID : CollectionStatus.PENDING,
        paidDate: i < 6 ? new Date(currentYear, currentMonth - 1, 5 + i) : null,
        month: currentMonth,
        year: currentYear,
        flatId: flat.id,
        societyId: society.id,
        collectedBy: i < 6 ? committeeAdmin.id : null,
        receiptNumber: i < 6 ? `REC-${currentMonth}-${currentYear}-${i + 1}` : null,
      },
    });
  }
  console.log("✅ Collections created");

  const expenseData = [
    { title: "Electricity Bill - Common Areas", amount: 45000, category: "Utilities", vendor: "BESCOM", status: ExpenseStatus.PAID },
    { title: "Security Guard Salary", amount: 30000, category: "Staff Salary", vendor: "Security Agency", status: ExpenseStatus.PAID },
    { title: "Garden Maintenance", amount: 15000, category: "Maintenance", vendor: "Green Gardens", status: ExpenseStatus.APPROVED },
    { title: "Lift Maintenance Contract", amount: 25000, category: "Maintenance", vendor: "Otis Elevators", status: ExpenseStatus.PENDING },
    { title: "Water Tank Cleaning", amount: 8000, category: "Maintenance", vendor: "CleanPro", status: ExpenseStatus.PAID },
    { title: "Common Area Painting", amount: 120000, category: "Renovation", vendor: "Painters Inc", status: ExpenseStatus.PENDING },
    { title: "Fire Safety Equipment", amount: 35000, category: "Safety", vendor: "SafeFirst", status: ExpenseStatus.APPROVED },
    { title: "CCTV Maintenance", amount: 12000, category: "Security", vendor: "SecureView", status: ExpenseStatus.PAID },
  ];

  for (const ed of expenseData) {
    await prisma.expense.create({
      data: {
        title: ed.title,
        amount: ed.amount,
        category: ed.category,
        vendor: ed.vendor,
        status: ed.status,
        societyId: society.id,
        createdBy: committeeAdmin.id,
      },
    });
  }
  console.log("✅ Expenses created");

  const eventData = [
    { title: "Annual General Meeting", description: "Discuss society budget and upcoming projects", daysFromNow: 7, status: EventStatus.UPCOMING },
    { title: "Children's Day Celebration", description: "Fun activities for kids in the common area", daysFromNow: 14, status: EventStatus.UPCOMING },
    { title: "Diwali Celebration", description: "Community Diwali celebration with cultural programs", daysFromNow: 30, status: EventStatus.UPCOMING },
    { title: "Yoga Session", description: "Morning yoga session for all residents", daysFromNow: 3, status: EventStatus.UPCOMING },
    { title: "Tree Plantation Drive", description: "Plant trees in the society garden", daysFromNow: -5, status: EventStatus.COMPLETED },
  ];

  for (const ed of eventData) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + ed.daysFromNow);
    startDate.setHours(10, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(17, 0, 0, 0);

    await prisma.event.create({
      data: {
        title: ed.title,
        description: ed.description,
        startDate,
        endDate,
        location: "Society Common Area",
        status: ed.status,
        isPublic: true,
        societyId: society.id,
        createdBy: committeeAdmin.id,
      },
    });
  }
  console.log("✅ Events created");

  const noticeData = [
    { title: "Water Supply Schedule Change", content: "Due to maintenance work, water supply will be intermittent on Saturday from 10 AM to 4 PM. Please store water accordingly.", priority: NoticePriority.HIGH },
    { title: "Monthly Maintenance Reminder", content: "Monthly maintenance dues of ₹5,000 are due by the 10th of each month. Please pay on time to avoid late fees.", priority: NoticePriority.MEDIUM },
    { title: "New Parking Rules", content: "Starting next month, visitor parking will be restricted to 2 hours. Please inform your guests accordingly.", priority: NoticePriority.HIGH },
    { title: "Security Update", content: "New CCTV cameras have been installed in the parking area and common corridors for enhanced security.", priority: NoticePriority.LOW },
    { title: "Festival Decoration Guidelines", content: "Please follow the society guidelines for festival decorations. No permanent fixtures allowed on common areas.", priority: NoticePriority.MEDIUM },
  ];

  for (const nd of noticeData) {
    await prisma.notice.create({
      data: {
        title: nd.title,
        content: nd.content,
        priority: nd.priority,
        isPublished: true,
        publishedAt: new Date(),
        societyId: society.id,
        createdBy: committeeAdmin.id,
      },
    });
  }
  console.log("✅ Notices created");

  // Create Assets with quantity-based inventory
  const assetData = [
    { name: "Plastic Chairs", category: "Furniture", totalQuantity: 50, availableQuantity: 45, condition: "Good", location: "Common Hall" },
    { name: "Folding Tables", category: "Furniture", totalQuantity: 20, availableQuantity: 18, condition: "Good", location: "Common Hall" },
    { name: "Fans (Portable)", category: "Electrical", totalQuantity: 10, availableQuantity: 8, condition: "Good", location: "Store Room" },
    { name: "Water Cooler", category: "Electrical", totalQuantity: 3, availableQuantity: 3, condition: "Excellent", location: "Ground Floor" },
    { name: "Ladder (Aluminum)", category: "Tools", totalQuantity: 5, availableQuantity: 4, condition: "Good", location: "Store Room" },
    { name: "Garden Hose Pipes", category: "Garden", totalQuantity: 8, availableQuantity: 6, condition: "Fair", location: "Garden Shed" },
    { name: "First Aid Kits", category: "Safety", totalQuantity: 10, availableQuantity: 10, condition: "Excellent", location: "Security Office" },
    { name: "Fire Extinguishers", category: "Safety", totalQuantity: 15, availableQuantity: 15, condition: "Good", location: "Each Floor" },
  ];

  for (const ad of assetData) {
    await prisma.asset.create({
      data: {
        name: ad.name,
        category: ad.category,
        totalQuantity: ad.totalQuantity,
        availableQuantity: ad.availableQuantity,
        location: ad.location,
        condition: ad.condition,
        isActive: true,
        societyId: society.id,
      },
    });
  }
  console.log("✅ Assets created with quantity tracking");

  // Create some asset bookings
  const assets = await prisma.asset.findMany({ where: { societyId: society.id } });
  const plasticChairs = assets.find((a) => a.name === "Plastic Chairs");
  const foldingTables = assets.find((a) => a.name === "Folding Tables");

  if (plasticChairs && residents[1]) {
    await prisma.assetBooking.create({
      data: {
        assetId: plasticChairs.id,
        residentId: residents[1].id,
        quantity: 5,
        notes: "For birthday party",
        societyId: society.id,
        status: "ACTIVE",
      },
    });
  }

  if (foldingTables && residents[2]) {
    await prisma.assetBooking.create({
      data: {
        assetId: foldingTables.id,
        residentId: residents[2].id,
        quantity: 2,
        notes: "For family function",
        societyId: society.id,
        status: "ACTIVE",
      },
    });
  }
  console.log("✅ Asset bookings created");

  const calendarData = [
    { title: "Monthly Maintenance Due", description: "Pay monthly maintenance by 10th", daysFromNow: 5, color: "#ef4444", recurring: true },
    { title: "Society Meeting", description: "Monthly committee meeting", daysFromNow: 12, color: "#3b82f6", recurring: true },
    { title: "Garbage Collection Drive", description: "Special waste collection", daysFromNow: 8, color: "#22c55e", recurring: false },
  ];

  for (const cd of calendarData) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + cd.daysFromNow);
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);

    await prisma.calendarEvent.create({
      data: {
        title: cd.title,
        description: cd.description,
        startDate,
        endDate,
        allDay: true,
        color: cd.color,
        recurring: cd.recurring,
        societyId: society.id,
      },
    });
  }
  console.log("✅ Calendar Events created");

  const notificationData = [
    { title: "Payment Received", message: "Your maintenance payment of ₹5,000 has been received.", type: "COLLECTION", userId: residentUser.id },
    { title: "Event Reminder", message: "Annual General Meeting is scheduled for next week.", type: "EVENT", userId: residentUser.id },
    { title: "New Notice", message: "Water supply schedule change - Please read the notice.", type: "NOTICE", userId: residentUser.id },
  ];

  for (const nd of notificationData) {
    await prisma.notification.create({
      data: {
        title: nd.title,
        message: nd.message,
        type: nd.type as any,
        isRead: false,
        userId: nd.userId,
      },
    });
  }
  console.log("✅ Notifications created");

  console.log("\n🎉 Seeding completed successfully!");
  console.log("\n📋 Demo Credentials:");
  console.log("   Committee:    admin@societyhub.com / password123");
  console.log("   Committee:    committee@societyhub.com / password123");
  console.log("   Resident:     resident@societyhub.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
