import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("branches", (table) => {
    table.increments("id")
    table.string("city").notNullable()
    table.string("address").notNullable()
    table.string("hours").notNullable()
    table.boolean("open").defaultTo(true)
    table.timestamps(true, true)
  })

  await knex("branches").insert([
    { city: "Tegal", address: "Jl. Jenderal Sudirman No. 17, Tegal", hours: "Setiap hari · 10.00 – 22.00", open: true },
    { city: "Slawi", address: "Jl. Raya Slawi No. 9, Slawi", hours: "Setiap hari · 10.00 – 22.00", open: true },
    { city: "Semarang", address: "Jl. Pandanaran No. 24, Semarang", hours: "Setiap hari · 11.00 – 23.00", open: false },
    { city: "Jakarta", address: "Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan", hours: "Setiap hari · 11.00 – 23.00", open: true },
  ])
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("branches")
}
