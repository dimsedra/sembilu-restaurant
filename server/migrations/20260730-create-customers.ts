import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("customers", (table) => {
    table.increments("id")
    table.string("name").notNullable()
    table.string("phone").notNullable().unique()
    table.string("email").nullable()
    table.integer("visit_count").notNullable().defaultTo(1)
    table.text("notes").nullable()
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("customers")
}
