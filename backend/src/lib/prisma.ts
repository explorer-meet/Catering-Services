import { PrismaClient } from "@prisma/client";

// Single shared Prisma instance (avoids exhausting MySQL connections in dev hot-reload)
export const prisma = new PrismaClient();
