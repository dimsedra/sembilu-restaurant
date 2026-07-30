// Aksara Jawa for SEMBILU: ꦱꦼꦩ꧀ꦧꦶꦭꦸ
export const AKSARA = "ꦱꦼꦩ꧀ꦧꦶꦭꦸ";

export const nav = [
  { label: "Kisah", href: "#kisah" },
  { label: "Sajian", href: "#sajian" },
  { label: "Menu", href: "/menu" },
  { label: "Sambal", href: "#sambal" },
  { label: "Lokasi", href: "#lokasi" },
];

export type Dish = {
  no: string;
  name: string;
  desc: string;
  price: string;
  tag?: string;
};

export const signatureDishes: Dish[] = [
  {
    no: "꧑",
    name: "Ikan Bakar Pantura",
    desc: "Kakap merah dibakar di atas bara arang, dilumuri bumbu kecap kuning khas Tegal.",
    price: "89",
    tag: "Unggulan",
  },
  {
    no: "꧒",
    name: "Ayam Kampung Lengkuas",
    desc: "Ayam kampung dimasak perlahan dalam santan, serai, dan laos segar.",
    price: "68",
  },
  {
    no: "꧓",
    name: "Gurame Asam Manis",
    desc: "Filet gurame renyah, saus asam manis dengan cambah dan biji wijen.",
    price: "95",
  },
  {
    no: "꧔",
    name: "Soto Tegal Kuah Bening",
    desc: "Kaldu sapi lima jam, tauge segar, dan perasan jeruk nipis. Sederhana, sempurna.",
    price: "42",
  },
  {
    no: "꧕",
    name: "Nasi Tutug Oncom",
    desc: "Nasi pulen ditutug dengan oncom bakar dan kelapa sangrai.",
    price: "38",
  },
  {
    no: "꧖",
    name: "Emping Melinjo",
    desc: "Emping digoreng tipis dan renyah, taburan garam laut dan cabai.",
    price: "25",
  },
  {
    no: "꧗",
    name: "Es Gembira Tegal",
    desc: "Santan, susu, tapai singkong, dan kelapa muda. Penutup yang menyejukkan.",
    price: "32",
  },
];

export type Sambal = {
  no: string;
  name: string;
  heat: 1 | 2 | 3;
  note: string;
};

export const sambals: Sambal[] = [
  { no: "꧑", name: "Sambal Terasi", heat: 3, note: "Terasi bakar, tomat, rawit. Fondasi SEMBILU." },
  { no: "꧒", name: "Sambal Bajak", heat: 2, note: "Cabai dan rempah ditumis hingga pekat." },
  { no: "꧓", name: "Sambal Ijo", heat: 2, note: "Cabai hijau segar dan tomat hijau." },
  { no: "꧔", name: "Sambal Tomat", heat: 1, note: "Manis-pedas, lembut, disukai semua." },
  { no: "꧕", name: "Sambal Mangga", heat: 2, note: "Mangga muda, asam dan menyengat." },
  { no: "꧖", name: "Sambal Kemangi", heat: 2, note: "Daun kemangi harum dan terang." },
  { no: "꧗", name: "Sambal Matah", heat: 2, note: "Bawang, cabai, dan serai mentah." },
  { no: "꧘", name: "Sambal Bawang", heat: 3, note: "Bawang putih mentah, tajam dan bersih." },
  { no: "꧙", name: "Sambal Ikan Asin", heat: 3, note: "Ikan asin dan cabai, gurih dan renyah." },
];

export type Place = {
  no: string;
  city: string;
  flag: string;
  address: string;
  hours: string;
  open: boolean;
};

export const locations: Place[] = [
  {
    no: "꧑",
    city: "Tegal",
    flag: "Bendera",
    address: "Jl. Jenderal Sudirman No. 17, Tegal",
    hours: "Setiap hari · 10.00 – 22.00",
    open: true,
  },
  {
    no: "꧒",
    city: "Slawi",
    flag: "Rumah",
    address: "Jl. Raya Slawi No. 9, Slawi",
    hours: "Setiap hari · 10.00 – 22.00",
    open: true,
  },
  {
    no: "꧓",
    city: "Semarang",
    flag: "Kota",
    address: "Jl. Pandanaran No. 24, Semarang",
    hours: "Setiap hari · 11.00 – 23.00",
    open: false,
  },
  {
    no: "꧔",
    city: "Jakarta",
    flag: "Ibu kota",
    address: "Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan",
    hours: "Setiap hari · 11.00 – 23.00",
    open: true,
  },
];

export const stats = [
  { value: "1987", label: "Berdiri di Tegal" },
  { value: "9", label: "Sambal andalan" },
  { value: "4", label: "Cabang di Jawa" },
  { value: "100%", label: "Resep keluarga" },
];
