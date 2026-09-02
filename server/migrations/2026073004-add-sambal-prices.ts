import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("sambals", (table) => {
    table.integer("price").notNullable().defaultTo(7)
  })

  await knex("sambals").where("name", "Sambal Terasi").update({ price: 7 })
  await knex("sambals").where("name", "Sambal Bajak").update({ price: 7 })
  await knex("sambals").where("name", "Sambal Ijo").update({ price: 6 })
  await knex("sambals").where("name", "Sambal Tomat").update({ price: 5 })
  await knex("sambals").where("name", "Sambal Mangga").update({ price: 6 })
  await knex("sambals").where("name", "Sambal Kemangi").update({ price: 6 })
  await knex("sambals").where("name", "Sambal Matah").update({ price: 7 })
  await knex("sambals").where("name", "Sambal Bawang").update({ price: 5 })
  await knex("sambals").where("name", "Sambal Ikan Asin").update({ price: 10 })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("sambals", (table) => {
    table.dropColumn("price")
  })
}
