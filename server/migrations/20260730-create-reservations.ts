import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("reservations", (table) => {
    table.increments("id")
    table
      .integer("customer_id")
      .references("id")
      .inTable("customers")
      .notNullable()
    table
      .integer("branch_id")
      .references("id")
      .inTable("branches")
      .notNullable()
    table.date("date").notNullable()
    table.time("time").notNullable()
    table.integer("party_size").notNullable()
    table
      .enum("status", ["confirmed", "cancelled", "completed"])
      .defaultTo("confirmed")
    table.text("notes").nullable()
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("reservations")
}
