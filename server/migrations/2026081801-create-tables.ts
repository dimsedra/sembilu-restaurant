import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("tables", (table) => {
    table.increments("id")
    table
      .integer("branch_id")
      .references("id")
      .inTable("branches")
      .notNullable()
      .onDelete("CASCADE")
    table.integer("table_number").notNullable()
    table.integer("capacity").notNullable().defaultTo(4)
    table.string("status").notNullable().defaultTo("free")
    table.boolean("is_walk_in").notNullable().defaultTo(true)
    table.unique(["branch_id", "table_number"])
    table.timestamps(true, true)
  })

  const branches = [1, 2, 4]
  const rows: Array<{
    branch_id: number
    table_number: number
    capacity: number
    status: string
    is_walk_in: boolean
  }> = []

  for (const branch_id of branches) {
    for (let num = 1; num <= 12; num++) {
      let capacity = 4
      if (num <= 4) {
        capacity = 2
      } else if (num <= 8) {
        capacity = 4
      } else if (num <= 10) {
        capacity = 6
      } else {
        capacity = 8
      }

      const is_walk_in = num <= 9

      rows.push({
        branch_id,
        table_number: num,
        capacity,
        status: "free",
        is_walk_in,
      })
    }
  }

  await knex("tables").insert(rows)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("tables")
}
