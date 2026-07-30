import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("orders", (table) => {
    table.increments("id")
    table.integer("branch_id").references("id").inTable("branches").notNullable()
    table.integer("customer_id").references("id").inTable("customers").nullable()
    table.integer("table_number").notNullable()
    table.enum("status", ["pending", "confirmed", "cooking", "done", "served", "paid"]).defaultTo("pending")
    table.string("type").defaultTo("dine-in")
    table.text("notes").nullable()
    table.timestamps(true, true)
  })

  await knex.schema.createTable("order_items", (table) => {
    table.increments("id")
    table.integer("order_id").references("id").inTable("orders").notNullable()
    table.integer("dish_id").references("id").inTable("dishes").notNullable()
    table.integer("quantity").notNullable().defaultTo(1)
    table.integer("sambal_id").references("id").inTable("sambals").nullable()
    table.boolean("sambal_extra").defaultTo(false)
    table.text("notes").nullable()
    table.enum("status", ["pending", "cooking", "done", "served"]).defaultTo("pending")
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("order_items")
  await knex.schema.dropTableIfExists("orders")
}
