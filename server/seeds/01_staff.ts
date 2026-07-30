import type { Knex } from "knex"
import bcrypt from "bcryptjs"

export async function seed(knex: Knex): Promise<void> {
  // Clear existing staff records before seeding
  await knex("staff").del()

  const passwordHash = await bcrypt.hash("password123", 10)

  await knex("staff").insert([
    {
      name: "Wati (Waiter)",
      email: "wati@sembilu.com",
      password_hash: passwordHash,
      role: "waiter",
      branch_id: 1, // Tegal
    },
    {
      name: "Budi (Chef)",
      email: "budi@sembilu.com",
      password_hash: passwordHash,
      role: "chef",
      branch_id: 1, // Tegal
    },
    {
      name: "Teguh (Manager)",
      email: "teguh@sembilu.com",
      password_hash: passwordHash,
      role: "manager",
      branch_id: 1, // Tegal
    },
  ])
}
