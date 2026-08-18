const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const bcrypt = require('bcryptjs')

const CATEGORIES = [
  {id:"fragrance", name:"Perfumes & Fragrances", emoji:"🌸"},
  {id:"dates", name:"Dates & Dried Fruit", emoji:"🌴"},
  {id:"nuts", name:"Nuts, Seeds & Trail Mixes", emoji:"🥜"},
  {id:"choco", name:"Chocolates & Sweets", emoji:"🍫"},
  {id:"honey", name:"Honey, Sauces & Spreads", emoji:"🍯"},
  {id:"pantry", name:"Pantry, Cheese & Snacks", emoji:"🧀"},
  {id:"care", name:"Personal Care", emoji:"🧼"},
  {id:"gift", name:"Gift Hampers", emoji:"🎁"},
];

const PRODUCTS = [
// ---------------- FRAGRANCE ----------------
{n:"Antonio Banderas Her Secret 80ml", p:1900, c:"fragrance", img:"antonio-banderas-her-secret-80ml"},
{n:"JAGUAR Classic Black 100ml (Men)", p:2350, c:"fragrance", img:"jaguar-classic-black-100ml"},
{n:"Whisky Silver Men's Perfume 100ml", p:850, c:"fragrance", img:"whisky-silver-100ml"},
{n:"HAWAS Black 100ml", p:2950, c:"fragrance", img:"hawas-black-100ml"},
{n:"MURANO Crystal 100ml", p:1950, c:"fragrance", img:"murano-crystal-100ml"},
{n:"Stag White Estiara 100ml", p:1100, c:"fragrance", img:"stag-white-estiara-100ml"},
{n:"Lomani Homme EDT", p:950, c:"fragrance", img:"lomani-homme"},
{n:"Nike Man 75ml", p:750, c:"fragrance", img:"nike-man-75ml"},
{n:"BRUT 100ml", p:675, c:"fragrance", img:"brut-100ml"},
{n:"Armaf Itgasi 100ml", p:1900, c:"fragrance", img:"armaf-itgasi-100ml"},
{n:"Ferrari Men's Perfume 125ml", p:2475, c:"fragrance", img:"ferrari-perfume-125ml"},
{n:"Stag Estiara 100ml", p:1095, c:"fragrance", img:"stag-100ml"},
{n:"Colors 100ml", p:1200, c:"fragrance", img:"colors-100ml"},
{n:"MIDORI 100ml (Unisex)", p:1950, c:"fragrance", img:"midori-100ml"},
{n:"Rasasi 100ml", p:1450, c:"fragrance", img:"rasasi-100ml"},
{n:"Royal Mirage Brown 120ml", p:1195, c:"fragrance", img:"royal-mirage-brown-120ml"},
{n:"INVENTURE 100ml (Men)", p:1950, c:"fragrance", img:"inventure-100ml"},
{n:"One Man Show Perfume 100ml", p:1575, c:"fragrance", img:"one-man-show-100ml"},
{n:"Senorita 100ml (Women)", p:1550, c:"fragrance", img:"senorita-100ml"},
{n:"Extreme Red by Lomani 100ml (Women)", p:650, c:"fragrance", img:"extreme-red-lomani-100ml"},
{n:"Colors Man Black 100ml", p:1900, c:"fragrance", img:"colors-man-black-100ml"},
{n:"UCB Sisterland Red Rose 80ml (Women)", p:1450, c:"fragrance", img:"ucb-sisterland-red-rose-80ml"},
{n:"UDV Paris 100ml", p:900, c:"fragrance", img:"udv-paris-100ml"},
{n:"MOMENTO 100ml", p:1950, c:"fragrance", img:"momento-100ml"},
{n:"Mystic Waters Estiara 100ml", p:1200, c:"fragrance", img:"mystic-waters-100ml"},
{n:"KHAMRAH Lattafa 100ml", p:2995, c:"fragrance", img:"khamrah-lattafa-100ml"},
{n:"Nautica Blue for Men 100ml", p:1750, c:"fragrance", img:"nautica-blue-100ml"},
{n:"So Flenri Paris 100ml (Women)", p:1350, c:"fragrance", img:"so-flenri-paris-100ml"},
{n:"Jaguar Classic Motion", p:2550, c:"fragrance", img:"jaguar-classic-motion"},
{n:"INCIDENCE 100ml (Women)", p:1400, c:"fragrance", img:"incidence-100ml"},
{n:"Solara 100ml", p:1270, c:"fragrance", img:"solara-100ml"},
{n:"UDY Ladies Perfume 75ml", p:1250, c:"fragrance", img:"udy-ladies-perfume-75ml"},
{n:"INVICTO Men 100ml", p:1950, c:"fragrance", img:"invicto-men-100ml"},
{n:"Sultan 100ml", p:2350, c:"fragrance", img:"sultan-100ml"},
{n:"ARMAF Deo 200ml", p:295, c:"fragrance", img:"armaf-deo-200ml"},
{n:"DAVIDOFF Cool Water for Men 125ml", p:3250, c:"fragrance", img:"davidoff-cool-water-125ml"},
{n:"Stag Life Estuary for Men 100ml", p:1200, c:"fragrance", img:"stag-life-estuary-100ml"},
{n:"Diamonte Celestial Femme 100ml", p:1550, c:"fragrance", img:"diamonte-celestial-femme-100ml"},
{n:"Beverly Hills Polo Club 100ml", p:2600, c:"fragrance", img:"beverly-hills-polo-club-100ml"},

// ---------------- DATES & DRIED FRUIT ----------------
{n:"Medjool Dates Large 500g", p:720, c:"dates", img:"medjool-dates-large-500g"},
{n:"Amber Dates 500g", p:600, c:"dates", img:"amber-dates-500g"},
{n:"Seedless Black Dates 500g", p:180, c:"dates", img:"seedless-black-dates-500g"},
{n:"Ajwa Dates 500g Box", p:545, c:"dates", img:"ajwa-dates-500g"},
{n:"Medjool Dates Mini 500g", p:590, c:"dates", img:"medjool-dates-mini-500g"},
{n:"Medjool Dates Jumbo 500g", p:890, c:"dates", img:"medjool-dates-jumbo-500g"},
{n:"Pitted Prunes 200g", p:225, c:"dates", img:"pitted-prunes-200g"},
{n:"Jumbo Figs (Anjeer) 250g", p:495, c:"dates", img:"jumbo-figs-250g"},
{n:"Turkish Anjeer (Dried Fig) 250g", p:425, c:"dates", img:"turkish-anjeer-250g"},
{n:"Anjeer (Figs) 250g", p:375, c:"dates", img:"anjeer-figs-250g"},
{n:"Figs (Anjeer) Medium 250g", p:400, c:"dates", img:"figs-anjeer-medium-250g"},
{n:"Afghan Green Raisins (Kismis) 250g", p:180, c:"dates", img:"afghan-green-raisins-250g"},
{n:"Afghan Black Raisins with Seed 250g", p:200, c:"dates", img:"afghan-black-raisins-250g"},
{n:"Black Seedless Raisins 250g", p:220, c:"dates", img:"black-seedless-raisins-250g"},
{n:"Yellow Raisins 250g", p:160, c:"dates", img:"yellow-raisins-250g"},
{n:"Yellow Kharek (Dried Dates) 250g", p:130, c:"dates", img:"yellow-kharek-250g"},
{n:"Imported Kiwi Slices 250g", p:160, c:"dates", img:"imported-kiwi-slices-250g"},
{n:"Thai Dried Mango Slice 250g", p:200, c:"dates", img:"thai-dried-mango-250g"},
{n:"Dried Blueberries 150g", p:270, c:"dates", img:"dried-blueberries-150g"},
{n:"Cranberries Slice 250g", p:200, c:"dates", img:"cranberries-slice-250g"},
{n:"Natural Whole Cranberry 250g", p:230, c:"dates", img:"natural-whole-cranberry-250g"},
{n:"Dry Pineapple 200g", p:140, c:"dates", img:"dry-pineapple-200g"},
{n:"Jardalu (Dried Apricots) 250g", p:240, c:"dates", img:"jardalu-dried-apricots-250g"},
{n:"Turkish Apricot 200g", p:420, c:"dates", img:"turkish-apricot-200g"},
{n:"Saudi Kalmi Dates 500g", p:395, c:"dates", img:"saudi-kalmi-dates-500g"},
{n:"Kimia Wet Dates 500g", p:250, c:"dates", img:"kimia-wet-dates-500g"},
{n:"Thai Dehydrate Mix Fruits 100g", p:80, c:"dates", img:"thai-dehydrate-mix-fruits-100g"},
{n:"Dry Amla Candy 200g", p:90, c:"dates", img:"dry-amla-candy-200g"},
{n:"Amla Whole 200g", p:90, c:"dates", img:"amla-whole-200g"},

// ---------------- NUTS, SEEDS & TRAIL MIXES ----------------
{n:"Charoli 100g", p:225, c:"nuts", img:"charoli-100g"},
{n:"Salted Roasted Almond 250g", p:325, c:"nuts", img:"salted-roasted-almond-250g"},
{n:"Seven Seeds Mix Roasted Salted 100g", p:80, c:"nuts", img:"seven-seeds-mix-100g"},
{n:"4 Item Mix (Badam, Walnut, Cashew, Salted Pista) 250g", p:350, c:"nuts", img:"4item-mix-250g"},
{n:"Macadamia Nuts 250g", p:850, c:"nuts", img:"macadamia-nuts-250g"},
{n:"Vietnamese Macadamia Nuts with Shell 250g", p:350, c:"nuts", img:"vietnamese-macadamia-250g"},
{n:"Cashew W240 250g", p:300, c:"nuts", img:"cashew-w240-250g"},
{n:"American Almonds 500g", p:590, c:"nuts", img:"american-almonds-500g"},
{n:"Cashew Tukda 250g", p:240, c:"nuts", img:"cashew-tukda-250g"},
{n:"Brazil Nuts 250g", p:950, c:"nuts", img:"brazil-nuts-250g"},
{n:"Chilie Walnuts without Shell 250g Super", p:550, c:"nuts", img:"chilie-walnuts-250g"},
{n:"Salted Cashew 250g", p:360, c:"nuts", img:"salted-cashew-250g"},
{n:"American Almonds Super Gold (Badam) 250g", p:295, c:"nuts", img:"american-almonds-super-gold-250g"},
{n:"Salted Pista with Shell 250g", p:450, c:"nuts", img:"salted-pista-shell-250g"},
{n:"Salted 3 Mix (Cashew/Almond/Pista with Shell) 250g", p:350, c:"nuts", img:"salted-3mix-250g"},
{n:"Sunflower Seeds 250g", p:100, c:"nuts", img:"sunflower-seeds-250g"},
{n:"Flax Seeds (Alsi) 250g", p:60, c:"nuts", img:"flax-seeds-250g"},
{n:"Pumpkin Seeds 250g", p:185, c:"nuts", img:"pumpkin-seeds-250g"},
{n:"Elaichi (Cardamom) 50g", p:180, c:"nuts", img:"elaichi-50g"},
{n:"Makhana 250g", p:360, c:"nuts", img:"makhana-250g"},
{n:"Breakfast Mix 500g (High Protein Trail Mix)", p:590, c:"nuts", img:"breakfast-mix-500g"},
{n:"Mamra Badam 250g", p:895, c:"nuts", img:"mamra-badam-250g"},
{n:"Pecan Nuts 250g", p:675, c:"nuts", img:"pecan-nuts-250g"},
{n:"Pista without Shell Sada 250g", p:795, c:"nuts", img:"pista-without-shell-250g"},
{n:"Almonds (Badam) Jumbo 250g", p:330, c:"nuts", img:"almonds-badam-jumbo-250g"},
{n:"Walnuts Tukda 250g", p:375, c:"nuts", img:"walnuts-tukda-250g"},
{n:"Chia Seeds 250g", p:100, c:"nuts", img:"chia-seeds-250g"},
{n:"Hazelnuts 200g", p:560, c:"nuts", img:"hazelnuts-200g"},
{n:"Cashew with Skin, Regular Size (Natural) 250g", p:325, c:"nuts", img:"cashew-with-skin-250g"},

// ---------------- CHOCOLATES & SWEETS ----------------
{n:"Toblerone Fruit and Nuts 100g", p:225, c:"choco", img:"toblerone-fruit-nuts-100g"},
{n:"Kitkat Orange Imported (2 Finger)", p:50, c:"choco", img:"kitkat-orange-2finger"},
{n:"Kitkat Dark Imported", p:50, c:"choco", img:"kitkat-dark-imported"},
{n:"Alfredo 100g", p:195, c:"choco", img:"alfredo-100g"},
{n:"Lindt Swiss Premium Chocolate 33pcs 250g", p:1895, c:"choco", img:"lindt-swiss-premium-250g"},
{n:"MINIS Mix 500g", p:990, c:"choco", img:"minis-mix-500g"},
{n:"Hershey's Kisses 150g", p:395, c:"choco", img:"hersheys-kisses-150g"},
{n:"Rafaelo", p:70, c:"choco", img:"rafaelo"},
{n:"Toblerone Crunchy Almond Bar 100g", p:225, c:"choco", img:"toblerone-crunchy-almond-100g"},
{n:"GODIVA Dark / White Chocolate", p:120, c:"choco", img:"godiva-chocolate"},
{n:"Daim Chocolate", p:650, c:"choco", img:"daim-chocolate"},
{n:"Haribo Goldbears / Happy Cola / Starmix 160g", p:200, c:"choco", img:"haribo-goldbears-160g"},
{n:"Fruittella Chewy Candy Orange 36g", p:60, c:"choco", img:"fruittella-orange-36g"},
{n:"Bounty Imported 57g", p:75, c:"choco", img:"bounty-imported-57g"},
{n:"Hanuta Mini 4pcs", p:100, c:"choco", img:"hanuta-mini-4pcs"},
{n:"Fox's Crystal Clear Flavoured Candy 180g", p:200, c:"choco", img:"foxs-crystal-candy-180g"},
{n:"Fox's Fruity Mints Oval Candy 125g", p:80, c:"choco", img:"foxs-fruity-mints-125g"},
{n:"Snickers Imported 50g", p:75, c:"choco", img:"snickers-imported-50g"},
{n:"Lotus Biscoff 125g", p:200, c:"choco", img:"lotus-biscoff-125g"},
{n:"Marshmallows Pkt", p:100, c:"choco", img:"marshmallows-pkt"},
{n:"Assorted Fruits Flavour Sugar-Free 100g", p:150, c:"choco", img:"assorted-fruits-sugarfree-100g"},
{n:"Impact Mints", p:140, c:"choco", img:"impact-mints"},
{n:"Cocon Jelly (Lychee) 10pcs", p:40, c:"choco", img:"cocon-jelly-lichy-10pcs"},
{n:"Bonomi Forno Savoiardi Ladyfingers 200g", p:295, c:"choco", img:"bonomi-savoiardi-200g"},
{n:"Nani Cereals", p:20, c:"choco", img:"nani-cereals"},
{n:"Popo Jelly 25pcs Pkt", p:75, c:"choco", img:"popo-jelly-25pcs"},
{n:"Ferrero Rocher 3pcs Pkt Imported", p:140, c:"choco", img:"ferrero-rocher-3pcs"},
{n:"Lindt Lindor Assorted 200g", p:850, c:"choco", img:"lindt-lindor-200g"},
{n:"Nutella B-ready Bar 22g", p:70, c:"choco", img:"nutella-bready-22g"},
{n:"Lindt 85% & 78% Cocoa Dark 100g", p:450, c:"choco", img:"lindt-cocoa-dark-100g"},
{n:"Nutella Biscuit Pkt", p:625, c:"choco", img:"nutella-biscuit-pkt"},
{n:"Soft Candy Pkt 400g", p:390, c:"choco", img:"soft-candy-400g"},
{n:"Thai Candy 100g", p:70, c:"choco", img:"thai-candy-100g"},
{n:"Snickers Mini", p:660, c:"choco", img:"snickers-mini"},
{n:"Mars Miniatures", p:660, c:"choco", img:"mars-miniatures"},
{n:"Toblerone Milk, Honey & Almonds 100g", p:225, c:"choco", img:"toblerone-milk-honey-almonds-100g"},
{n:"Mars Imported 50g", p:75, c:"choco", img:"mars-imported-50g"},
{n:"Hershey's Special Dark 50% / Almond Milk Chocolate", p:350, c:"choco", img:"hersheys-special-dark"},
{n:"Twix Pack 5x2", p:500, c:"choco", img:"twix-pack"},
{n:"Token Dubai Crunch", p:50, c:"choco", img:"token-dubai-crunch"},

// ---------------- HONEY, SAUCES & SPREADS ----------------
{n:"Creamy Pistachio Spread", p:495, c:"honey", img:"creamy-pistachio-spread"},
{n:"Capilano Pure Honey (Australian) 500g", p:950, c:"honey", img:"capilano-honey-500g"},
{n:"American Green Bee Honey 400g", p:595, c:"honey", img:"american-green-bee-honey-400g"},
{n:"AG Original BBQ Sauce 510g", p:320, c:"honey", img:"ag-bbq-sauce-510g"},
{n:"Bragg Organic Raw Apple Cider Vinegar 473ml", p:545, c:"honey", img:"bragg-acv-473ml"},
{n:"Figaro Pitted Black Olives", p:290, c:"honey", img:"figaro-pitted-black-olives"},
{n:"Figaro Pitted Green Olives", p:330, c:"honey", img:"figaro-pitted-green-olives"},
{n:"Kashmiri Pure Saffron 1g", p:320, c:"honey", img:"kashmiri-saffron-1g"},
{n:"Nutella Chocolate Hazelnut Spread 350g", p:375, c:"honey", img:"nutella-spread-350g"},
{n:"Al Shifa Natural Honey 1kg", p:1495, c:"honey", img:"al-shifa-honey-1kg"},
{n:"ALSHIFA Imported Honey 250g", p:495, c:"honey", img:"alshifa-honey-250g"},
{n:"Solasz Spanish Extra Virgin Olive Oil (1 Litre)", p:795, c:"honey", img:"solasz-olive-oil-1l"},
{n:"Lotus Biscoff Biscuit Spread 400g", p:595, c:"honey", img:"lotus-biscoff-spread-400g"},

// ---------------- PANTRY, CHEESE & SNACKS ----------------
{n:"Maggi Chicken Stock (Full Box)", p:620, c:"pantry", img:"maggi-chicken-stock"},
{n:"Almarai Cheese Slices 200g", p:475, c:"pantry", img:"almarai-cheese-slices-200g"},
{n:"KRAFT Cheddar Cheese 190g", p:425, c:"pantry", img:"kraft-cheddar-cheese-190g"},
{n:"DCL Imported Dry Yeast 11g", p:75, c:"pantry", img:"dcl-dry-yeast-11g"},
{n:"Davidoff Instant Coffee Jar 100g", p:750, c:"pantry", img:"davidoff-coffee-jar-100g"},
{n:"Ricola", p:150, c:"pantry", img:"ricola"},
{n:"Party Snack 180g", p:140, c:"pantry", img:"party-snack-180g"},
{n:"Dried Vegetable Chips 250g", p:250, c:"pantry", img:"dried-vegetable-chips-250g"},
{n:"Bruschette Chips (Pizza / Fine Cheese) 70g", p:95, c:"pantry", img:"bruschette-chips-70g"},
{n:"Swisstella Go", p:90, c:"pantry", img:"swisstella-go"},
{n:"Highlands Coffee 3in1 (3pkt)", p:100, c:"pantry", img:"highlands-coffee-3pkt"},
{n:"Trung Nguyen Legend Classic 3-in-1 Instant Coffee", p:1695, c:"pantry", img:"trung-nguyen-coffee"},
{n:"PRIME 500ml", p:195, c:"pantry", img:"prime-500ml"},
{n:"Imported Tang — Mango / Orange / Lemon / Pineapple 375g", p:275, c:"pantry", img:"imported-tang-375g"},
{n:"Hot Chicken / Jiajang / Carbonara Noodles", p:150, c:"pantry", img:"hot-chicken-noodles"},

// ---------------- PERSONAL CARE ----------------
{n:"Magic Soap (Body Tan Reducing)", p:150, c:"care", img:"magic-soap"},
{n:"Head & Shoulder Shampoo 300ml", p:550, c:"care", img:"head-shoulder-shampoo-300ml"},
{n:"Cleopatra Soap", p:160, c:"care", img:"cleopatra-soap"},
{n:"Imported NIVEA Men Deo Roll-On 50ml", p:225, c:"care", img:"nivea-men-deo-50ml"},
{n:"Imported DOVE Original & Soothing Care", p:180, c:"care", img:"dove-original"},
{n:"Tiger Balm Red / White 10g", p:250, c:"care", img:"tiger-balm-10g"},
{n:"Irish Spring Soap", p:140, c:"care", img:"irish-spring-soap"},
{n:"Hongthai Herb Inhaler", p:160, c:"care", img:"hongthai-herb-inhaler"},

// ---------------- GIFT HAMPERS ----------------
{n:"Gift Basket – Dryfruits & Chocolate", p:3900, c:"gift", img:"gift-basket-dryfruits-chocolate"},
{n:"Gift Basket for Kids – Special", p:1999, c:"gift", img:"gift-basket-kids"},
];

PRODUCTS.forEach((p,i)=>p.id="p"+i);

async function main() {
  console.log('Seeding categories...')
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: {
        id: cat.id,
        name: cat.name,
        emoji: cat.emoji
      }
    })
  }

  console.log('Seeding products...')
  for (const prod of PRODUCTS) {
    await prisma.product.upsert({
      where: { id: prod.id },
      update: {},
      create: {
        id: prod.id,
        name: prod.n,
        price: prod.p,
        categoryId: prod.c,
        imageId: prod.img,
        stock: 100 // default stock
      }
    })
  }

  console.log('Seeding admin user...')
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@maharaja.com' },
    update: {},
    create: {
      email: 'admin@maharaja.com',
      password: adminPassword,
      name: 'Admin'
    }
  })

  console.log('Seed completed.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
