import type { Knex } from "knex"
import bcrypt from "bcryptjs"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("staff", (table) => {
    table.increments("id").primary()
    table.string("name").notNullable()
    table.string("email").notNullable().unique()
    table.string("password_hash").notNullable()
    table.string("role").notNullable() // 'waiter' | 'chef' | 'manager'
    table.integer("branch_id").unsigned().notNullable().references("id").inTable("branches")
    table.timestamps(true, true)
  })

  // Seed initial test accounts for development & testing
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

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("staff")
}
