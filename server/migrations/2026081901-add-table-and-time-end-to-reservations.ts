import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("reservations", (table) => {
    table.integer("table_number").nullable()
    table.time("time_end").nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("reservations", (table) => {
    table.dropColumn("time_end")
    table.dropColumn("table_number")
  })
}
