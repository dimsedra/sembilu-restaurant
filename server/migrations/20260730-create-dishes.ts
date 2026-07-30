import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("dishes", (table) => {
    table.increments("id")
    table.string("name").notNullable()
    table.text("description").notNullable()
    table.integer("price").notNullable()
    table.string("tag").nullable()
    table.string("aksara_no").notNullable()
    table
      .integer("branch_id")
      .references("id")
      .inTable("branches")
      .notNullable()
    table.timestamps(true, true)
  })

  await knex("dishes").insert([
    { aksara_no: "꧑", name: "Ikan Bakar Pantura", description: "Kakap merah dibakar di atas bara arang, dilumuri bumbu kecap kuning khas Tegal.", price: 89, tag: "Unggulan", branch_id: 1 },
    { aksara_no: "꧒", name: "Ayam Kampung Lengkuas", description: "Ayam kampung dimasak perlahan dalam santan, serai, dan laos segar.", price: 68, branch_id: 1 },
    { aksara_no: "꧓", name: "Gurame Asam Manis", description: "Filet gurame renyah, saus asam manis dengan cambah dan biji wijen.", price: 95, branch_id: 1 },
    { aksara_no: "꧔", name: "Soto Tegal Kuah Bening", description: "Kaldu sapi lima jam, tauge segar, dan perasan jeruk nipis. Sederhana, sempurna.", price: 42, branch_id: 1 },
    { aksara_no: "꧕", name: "Nasi Tutug Oncom", description: "Nasi pulen ditutug dengan oncom bakar dan kelapa sangrai.", price: 38, branch_id: 1 },
    { aksara_no: "꧖", name: "Emping Melinjo", description: "Emping digoreng tipis dan renyah, taburan garam laut dan cabai.", price: 25, branch_id: 1 },
    { aksara_no: "꧗", name: "Es Gembira Tegal", description: "Santan, susu, tapai singkong, dan kelapa muda. Penutup yang menyejukkan.", price: 32, branch_id: 1 },
  ])
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("dishes")
}
