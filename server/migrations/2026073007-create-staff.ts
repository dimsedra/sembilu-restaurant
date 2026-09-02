import type { Knex } from "knex"

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
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("staff")
}
