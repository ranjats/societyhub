import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signupSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = signupSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, password, flatNumber } = validated.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.isActive) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Get the default society
    const society = await prisma.society.findFirst({
      where: { deletedAt: null },
    });

    if (!society) {
      return NextResponse.json(
        { error: "No society found. Please contact administration." },
        { status: 404 }
      );
    }

    // Find the flat
    const flat = await prisma.flat.findFirst({
      where: {
        societyId: society.id,
        flatNumber: flatNumber.trim(),
        deletedAt: null,
      },
    });

    if (!flat) {
      return NextResponse.json(
        { error: "Flat not found. Please check your flat number or contact the society committee." },
        { status: 404 }
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    // If user exists but is inactive (was rejected before), update existing records
    if (existingUser && !existingUser.isActive) {
      // Find or create the resident record
      let residentId = existingUser.residentId;

      if (!residentId) {
        // No linked resident — find old inactive resident by email or create new
        const existingResident = await prisma.resident.findFirst({
          where: { email: email.trim(), deletedAt: null, isActive: false },
        });

        if (existingResident) {
          // Update existing inactive resident
          await prisma.resident.update({
            where: { id: existingResident.id },
            data: {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              phone: phone.trim(),
              flatId: flat.id,
              isActive: false,
              deletedAt: null,
            },
          });
          residentId = existingResident.id;
        } else {
          // Truly new registration — create resident
          const newResident = await prisma.resident.create({
            data: {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email: email.trim(),
              phone: phone.trim(),
              ownershipType: "OWNER",
              flatId: flat.id,
              societyId: society.id,
              isActive: false,
            },
          });
          residentId = newResident.id;
        }
      } else {
        // Has linked resident — update it
        await prisma.resident.update({
          where: { id: residentId },
          data: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            flatId: flat.id,
            isActive: false,
            deletedAt: null,
          },
        });
      }

      // Update the user record
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          passwordHash,
          residentId: residentId || existingUser.residentId,
          isActive: false,
          deletedAt: null,
        },
      });

      return NextResponse.json(
        {
          message: "Registration updated! Your account is pending approval from the society committee.",
          userId: existingUser.id,
        },
        { status: 200 }
      );
    }

    // Create new resident record (inactive until approved)
    const resident = await prisma.resident.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        ownershipType: "OWNER",
        flatId: flat.id,
        societyId: society.id,
        isActive: false,
      },
    });

    // Create new user account linked to the resident
    const user = await prisma.user.create({
      data: {
        email: email.trim(),
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        role: "RESIDENT",
        societyId: society.id,
        residentId: resident.id,
        isActive: false,
      },
    });

    return NextResponse.json(
      {
        message: "Registration successful! Your account is pending approval from the society committee.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
