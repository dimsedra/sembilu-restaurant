import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("sambals", (table) => {
    table.increments("id")
    table.string("aksara_no").notNullable()
    table.string("name").notNullable()
    table.integer("heat").notNullable()
    table.text("note").notNullable()
    table.timestamps(true, true)
  })

  await knex("sambals").insert([
    { aksara_no: "꧑", name: "Sambal Terasi", heat: 3, note: "Terasi bakar, tomat, rawit. Fondasi SEMBILU." },
    { aksara_no: "꧒", name: "Sambal Bajak", heat: 2, note: "Cabai dan rempah ditumis hingga pekat." },
    { aksara_no: "꧓", name: "Sambal Ijo", heat: 2, note: "Cabai hijau segar dan tomat hijau." },
    { aksara_no: "꧔", name: "Sambal Tomat", heat: 1, note: "Manis-pedas, lembut, disukai semua." },
    { aksara_no: "꧕", name: "Sambal Mangga", heat: 2, note: "Mangga muda, asam dan menyengat." },
    { aksara_no: "꧖", name: "Sambal Kemangi", heat: 2, note: "Daun kemangi harum dan terang." },
    { aksara_no: "꧗", name: "Sambal Matah", heat: 2, note: "Bawang, cabai, dan serai mentah." },
    { aksara_no: "꧘", name: "Sambal Bawang", heat: 3, note: "Bawang putih mentah, tajam dan bersih." },
    { aksara_no: "꧙", name: "Sambal Ikan Asin", heat: 3, note: "Ikan asin dan cabai, gurih dan renyah." },
  ])
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("sambals")
}
