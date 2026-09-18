import type { PrismaClient } from "../../generated/prisma/client.js";

const output = (value: any) => ({ id: value.id, bloodType: value.bloodType, rhFactor: value.rhFactor === "POSITIVE" ? "+" : "-", hospital: value.hospital, city: value.city, priority: String(value.priority).toLowerCase(), contactPhone: value.contactPhone, contactEmail: value.contactEmail, description: value.description, status: String(value.status).toLowerCase(), createdAt: value.createdAt, updatedAt: value.updatedAt, resolvedAt: value.resolvedAt });
const dbRh = (value: string) => value === "+" ? "POSITIVE" : "NEGATIVE";

export class BloodRequestStore {
  constructor(private readonly db: PrismaClient) {}
  async create(ownerId: string, input: any) { const value = await this.db.bloodRequest.create({ data: { ownerId, bloodType: input.bloodType, rhFactor: dbRh(input.rhFactor), hospital: input.hospital, city: input.city, priority: input.priority.toUpperCase(), contactPhone: input.contactPhone, contactEmail: input.contactEmail, description: input.description }, }); return output(value); }
  async list(filters: { bloodType?: string; city?: string; status?: string }) { const rows = await this.db.bloodRequest.findMany({ where: { bloodType: filters.bloodType, city: filters.city, status: filters.status?.toUpperCase() }, orderBy: { createdAt: "desc" }, take: 100 }); return rows.map(output); }
  async findById(id: string) { const value = await this.db.bloodRequest.findUnique({ where: { id } }); return value ? output(value) : null; }
  async mine(ownerId: string) { return (await this.db.bloodRequest.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" }, take: 100 })).map(output); }
  async update(id: string, input: any) { const value = await this.db.bloodRequest.update({ where: { id }, data: { bloodType: input.bloodType, rhFactor: dbRh(input.rhFactor), hospital: input.hospital, city: input.city, priority: input.priority.toUpperCase(), contactPhone: input.contactPhone, contactEmail: input.contactEmail, description: input.description } }); return output(value); }
  async resolve(id: string) { const value = await this.db.bloodRequest.update({ where: { id }, data: { status: "RESOLVED", resolvedAt: new Date() } }); return output(value); }
  async ownerId(id: string) { return (await this.db.bloodRequest.findUnique({ where: { id }, select: { ownerId: true } }))?.ownerId ?? null; }
}
