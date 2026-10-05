/* Pictures and colour for ideas.
   MV.MEDIA[id] = [emoji, image URL, source page, fit]. fit 1 means "show the whole image" (maps, logos, charts).
   Images load from Wikimedia and each picture links to its source page.
   With no connection, the emoji and colour show instead. */
(function () {
  const { h } = MV.UI;
  MV.MEDIA = {
    "roman-roads": ["🛣️","https://thumb.wikimedia.org/wikipedia/commons/thumb/7/72/Roads_in_the_Roman_Empire.jpg/960px-Roads_in_the_Roman_Empire.jpg","https://en.wikipedia.org/wiki/Roman_roads",0],
    "pantheon-dome": ["🏛️","https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Pantheon_%28Rome%29_-_Right_side_and_front.jpg/960px-Pantheon_%28Rome%29_-_Right_side_and_front.jpg","https://en.wikipedia.org/wiki/Pantheon%2C_Rome",0],
    "sarajevo-1914": ["🚗","https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/DC-1914-27-d-Sarajevo-cropped.jpg/960px-DC-1914-27-d-Sarajevo-cropped.jpg","https://en.wikipedia.org/wiki/Assassination_of_Archduke_Franz_Ferdinand",0],
    "wwii-origins": ["📜","https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b8/Treaty_of_Versailles%2C_English_version.jpg/960px-Treaty_of_Versailles%2C_English_version.jpg","https://en.wikipedia.org/wiki/Treaty_of_Versailles",1],
    "weimar-hyperinflation": ["💸","https://upload.wikimedia.org/wikipedia/commons/8/89/Bundesarchiv_Bild_183-R1215-506%2C_Berlin%2C_Reichsbank%2C_Geldauflieferungsstelle.jpg","https://en.wikipedia.org/wiki/Hyperinflation_in_the_Weimar_Republic",0],
    "cold-war-mad": ["☢️","https://upload.wikimedia.org/wikipedia/commons/e/ed/Infobox_collage_for_Cold_War.png","https://en.wikipedia.org/wiki/Mutually_assured_destruction",0],
    "nato-article5": ["🛡️","https://thumb.wikimedia.org/wikipedia/commons/thumb/5/55/NATO_OTAN_landscape_logo.svg/960px-NATO_OTAN_landscape_logo.svg.png","https://en.wikipedia.org/wiki/NATO",1],
    "cuban-submarine": ["🚢","https://upload.wikimedia.org/wikipedia/commons/5/53/Vasili_Arkhipov_%28cropped%29.jpg","https://en.wikipedia.org/wiki/Vasily_Arkhipov",0],
    "east-india-company": ["⚓","https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/Flag_of_the_British_East_India_Company_%281801%29.svg/1280px-Flag_of_the_British_East_India_Company_%281801%29.svg.png","https://en.wikipedia.org/wiki/East_India_Company",0],
    "thermopylae": ["⚔️","https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/L%C3%A9onidas_aux_Thermopyles_-_Jacques-Louis_David_-_Mus%C3%A9e_du_Louvre_Peintures_INV_3690_%3B_L_3711.jpg/960px-L%C3%A9onidas_aux_Thermopyles_-_Jacques-Louis_David_-_Mus%C3%A9e_du_Louvre_Peintures_INV_3690_%3B_L_3711.jpg","https://en.wikipedia.org/wiki/Battle_of_Thermopylae",0],
    "sun-tzu": ["📖","https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Bamboo_book_-_unfolded_-_UCR.jpg/960px-Bamboo_book_-_unfolded_-_UCR.jpg","https://en.wikipedia.org/wiki/The_Art_of_War",0],
    "ooda-loop": ["🔁","https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/OODA.Boyd.svg/960px-OODA.Boyd.svg.png","https://en.wikipedia.org/wiki/OODA_loop",1],
    "russia-ports": ["🧊","https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/1356_%D0%9F%D0%B0%D0%BC%D1%8F%D1%82%D0%BD%D0%B8%D0%BA_%D0%B7%D0%B0%D1%82%D0%BE%D0%BF%D0%BB%D0%B5%D0%BD%D0%BD%D1%8B%D0%BC_%D0%BA%D0%BE%D1%80%D0%B0%D0%B1%D0%BB%D1%8F%D0%BC.jpg/960px-1356_%D0%9F%D0%B0%D0%BC%D1%8F%D1%82%D0%BD%D0%B8%D0%BA_%D0%B7%D0%B0%D1%82%D0%BE%D0%BF%D0%BB%D0%B5%D0%BD%D0%BD%D1%8B%D0%BC_%D0%BA%D0%BE%D1%80%D0%B0%D0%B1%D0%BB%D1%8F%D0%BC.jpg","https://en.wikipedia.org/wiki/Sevastopol",0],
    "hormuz": ["🛢️","https://thumb.wikimedia.org/wikipedia/commons/thumb/1/16/Strait_of_Hormuz_and_Musandam_Peninsula_%28MODIS_2018-12-10%29.jpg/960px-Strait_of_Hormuz_and_Musandam_Peninsula_%28MODIS_2018-12-10%29.jpg","https://en.wikipedia.org/wiki/Strait_of_Hormuz",0],
    "container-shipping": ["📦","https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Line3174_-_Shipping_Containers_at_the_terminal_at_Port_Elizabeth%2C_New_Jersey_-_NOAA.jpg/960px-Line3174_-_Shipping_Containers_at_the_terminal_at_Port_Elizabeth%2C_New_Jersey_-_NOAA.jpg","https://en.wikipedia.org/wiki/Containerization",0],
    "amazon-flywheel": ["🌀","https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bc/Amazon_Tower_I_topped_out%2C_June_2015.jpg/960px-Amazon_Tower_I_topped_out%2C_June_2015.jpg","https://en.wikipedia.org/wiki/Amazon_(company)",0],
    "comparative-advantage": ["⚖️","https://upload.wikimedia.org/wikipedia/commons/d/dc/Portrait_of_David_Ricardo_by_Thomas_Phillips.jpg","https://en.wikipedia.org/wiki/David_Ricardo",0],
    "hanoi-rats": ["🐀","https://upload.wikimedia.org/wikipedia/commons/b/b9/1_cent_-_French_Indo-China_1902_Art-Hanoi_%28Indo-Chine_Fran%C3%A7aise_side%29.png","https://en.wikipedia.org/wiki/Great_Hanoi_Rat_Massacre",1],
    "buffett-compounding": ["📈","https://upload.wikimedia.org/wikipedia/commons/d/d4/Warren_Buffett_at_the_2015_SelectUSA_Investment_Summit_%28cropped%29.jpg","https://en.wikipedia.org/wiki/Warren_Buffett",0],
    "margin-of-safety": ["🌉","https://upload.wikimedia.org/wikipedia/commons/2/2a/Benjamin_Graham_%281894-1976%29_portrait_on_23_March_1950.jpg","https://en.wikipedia.org/wiki/Benjamin_Graham",0],
    "wald-bombers": ["✈️","https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Survivorship-bias.svg/960px-Survivorship-bias.svg.png","https://en.wikipedia.org/wiki/Survivorship_bias",1],
    "wason-246": ["🔢"],
    "anchoring": ["🎯"],
    "loss-aversion": ["😖","https://thumb.wikimedia.org/wikipedia/commons/thumb/8/85/Loss_Aversion.png/960px-Loss_Aversion.png","https://en.wikipedia.org/wiki/Loss_aversion",1],
    "semmelweis": ["🧼","https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Borsos_%26_Doctor_Semmelweis_Ign%C3%A1c_cropped.jpg/960px-Borsos_%26_Doctor_Semmelweis_Ign%C3%A1c_cropped.jpg","https://en.wikipedia.org/wiki/Ignaz_Semmelweis",0],
    "red-queen": ["👑"],
    "dunbar": ["👥"],
    "stoic-control": ["🧘","https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/Epicteti_Enchiridion_Latinis_versibus_adumbratum_%28Oxford_1715%29_frontispiece_%28cropped%29.jpg/960px-Epicteti_Enchiridion_Latinis_versibus_adumbratum_%28Oxford_1715%29_frontispiece_%28cropped%29.jpg","https://en.wikipedia.org/wiki/Epictetus",1],
    "map-territory": ["🗺️","https://upload.wikimedia.org/wikipedia/commons/0/0e/Tissot_world_from_space.png","https://en.wikipedia.org/wiki/Map%E2%80%93territory_relation",1],
    "veil-ignorance": ["⚖️","https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/John_Rawls_%281971_photo_portrait%29.jpg/960px-John_Rawls_%281971_photo_portrait%29.jpg","https://en.wikipedia.org/wiki/John_Rawls",0],
    "flying-buttress": ["⛪","https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/L%C3%BCbeck_Marienkirche_Strebeb%C3%B6gen.jpg/960px-L%C3%BCbeck_Marienkirche_Strebeb%C3%B6gen.jpg","https://en.wikipedia.org/wiki/Flying_buttress",0],
    "v-perspicacious": ["🔍"],
    "v-sanguine": ["🌤️"],
    "v-obsequious": ["🙇"],
    "v-equanimity": ["🪷"],
    "v-laconic": ["🗡️"],
    "v-ephemeral": ["🦋","https://thumb.wikimedia.org/wikipedia/commons/thumb/4/49/Rhithrogena_germanica_subimago_on_Equisetum_hyemale.jpg/960px-Rhithrogena_germanica_subimago_on_Equisetum_hyemale.jpg","https://en.wikipedia.org/wiki/Mayfly",0],
    "mumbai-seven-islands": ["🏝️","https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8a/Islands_of_Bombay_and_Colaba.jpg/960px-Islands_of_Bombay_and_Colaba.jpg","https://en.wikipedia.org/wiki/Seven_Islands_of_Bombay",1],
    "bombay-dowry": ["💍","https://thumb.wikimedia.org/wikipedia/commons/thumb/8/83/Sir_Peter_Lely_%281618-80%29_-_Catherine_of_Braganza_%281638-1705%29_-_RCIN_401214_-_Royal_Collection.jpg/960px-Sir_Peter_Lely_%281618-80%29_-_Catherine_of_Braganza_%281638-1705%29_-_RCIN_401214_-_Royal_Collection.jpg","https://en.wikipedia.org/wiki/Catherine_of_Braganza",0],
    "dabbawalas": ["🍱","https://upload.wikimedia.org/wikipedia/commons/f/fe/Dabbawalasmumbai.jpg","https://en.wikipedia.org/wiki/Dabbawala",0],
    "mumbai-locals": ["🚆","https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b4/Western-Railway-Medha-EMU.jpg/960px-Western-Railway-Medha-EMU.jpg","https://en.wikipedia.org/wiki/Mumbai_Suburban_Railway",0],
    "cotton-boom": ["🧵","https://thumb.wikimedia.org/wikipedia/commons/thumb/5/50/Rajabai_Clock_Tower%2C_Mumbai_%2831_August_2008%29.jpg/960px-Rajabai_Clock_Tower%2C_Mumbai_%2831_August_2008%29.jpg","https://en.wikipedia.org/wiki/Rajabai_Clock_Tower",0],
    "bse-banyan": ["🌳","https://thumb.wikimedia.org/wikipedia/commons/thumb/5/50/BSE_logo.svg/330px-BSE_logo.svg.png","https://en.wikipedia.org/wiki/Bombay_Stock_Exchange",1],
    "dharavi": ["🏘️","https://thumb.wikimedia.org/wikipedia/commons/thumb/4/44/Dharavi_India.jpg/960px-Dharavi_India.jpg","https://en.wikipedia.org/wiki/Dharavi",0],
    "mumbai-2005-flood": ["🌧️"],
    "mumbai-art-deco": ["🏢","https://thumb.wikimedia.org/wikipedia/commons/thumb/7/74/Mumbai_03-2016_27_skyline_at_Marine_Drive.jpg/960px-Mumbai_03-2016_27_skyline_at_Marine_Drive.jpg","https://en.wikipedia.org/wiki/Marine_Drive%2C_Mumbai",0],
    "raja-harishchandra": ["🎬","https://upload.wikimedia.org/wikipedia/commons/6/6a/Publicity_poster_for_film%2C_Raja_Harishchandra_%281913%29.jpg","https://en.wikipedia.org/wiki/Raja_Harishchandra",1],
    "mumbai-name": ["🎣","https://upload.wikimedia.org/wikipedia/commons/2/27/Mumbadevi_temple.jpg","https://en.wikipedia.org/wiki/Mumba_Devi_Temple",0],
    "gateway-of-india": ["🚪","https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Mumbai_03-2016_30_Gateway_of_India.jpg/960px-Mumbai_03-2016_30_Gateway_of_India.jpg","https://en.wikipedia.org/wiki/Gateway_of_India",0],
    "vada-pav": ["🍔","https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Vada_Pav-Indian_street_food.JPG/960px-Vada_Pav-Indian_street_food.JPG","https://en.wikipedia.org/wiki/Vada_pav",0],
    "shivaji-forts": ["🏰","https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Nagarkhana%2C_Raigad_Fort%2C_India.jpg/960px-Nagarkhana%2C_Raigad_Fort%2C_India.jpg","https://en.wikipedia.org/wiki/Raigad_Fort",0],
    "shivaji-agra": ["🧺","https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/Shivaji_British_Museum.jpg/960px-Shivaji_British_Museum.jpg","https://en.wikipedia.org/wiki/Shivaji",0],
    "shivaji-navy": ["⛵","https://upload.wikimedia.org/wikipedia/commons/3/3a/Sindhudurg_fort.JPG","https://en.wikipedia.org/wiki/Sindhudurg_Fort",0],
    "panipat-1761": ["⚔️","https://thumb.wikimedia.org/wikipedia/commons/thumb/3/37/The_Third_battle_of_Panipat_13_January_1761.jpg/960px-The_Third_battle_of_Panipat_13_January_1761.jpg","https://en.wikipedia.org/wiki/Third_Battle_of_Panipat",0],
    "ajanta": ["🎨","https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Ajanta_%2863%29.jpg/960px-Ajanta_%2863%29.jpg","https://en.wikipedia.org/wiki/Ajanta_Caves",0],
    "kailasa-temple": ["🛕","https://upload.wikimedia.org/wikipedia/en/f/fc/Kailash_temple_%28Ellora_cave_no_15%29_at_Verul.png","https://en.wikipedia.org/wiki/Kailasa_Temple%2C_Ellora",0],
    "lonar-crater": ["☄️","https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/Lonar_Crater%2C_Panorama.jpg/960px-Lonar_Crater%2C_Panorama.jpg","https://en.wikipedia.org/wiki/Lonar_Lake",0],
    "deccan-traps": ["🌋","https://upload.wikimedia.org/wikipedia/commons/0/0a/India_Geology_Zones.jpg","https://en.wikipedia.org/wiki/Deccan_Traps",1],
    "western-ghats-rain": ["⛰️","https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/AnaimudiPeak_DSC_4834.jpg/960px-AnaimudiPeak_DSC_4834.jpg","https://en.wikipedia.org/wiki/Western_Ghats",0],
    "savitribai-phule": ["👩‍🏫","https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b8/Savitribai_Phule_statue%2C_Maharashtra_sadan%2C_New_Delhi.jpg/960px-Savitribai_Phule_statue%2C_Maharashtra_sadan%2C_New_Delhi.jpg","https://en.wikipedia.org/wiki/Savitribai_Phule",0],
    "mahad-satyagraha": ["💧","https://upload.wikimedia.org/wikipedia/commons/6/6e/Ambedkar_1991_stamp_of_India.jpg","https://en.wikipedia.org/wiki/Mahad_Satyagraha",0],
    "zero-brahmagupta": ["0️⃣"],
    "indus-valley": ["🧱","https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/Mohenjodaro_-_view_of_the_stupa_mound.JPG/960px-Mohenjodaro_-_view_of_the_stupa_mound.JPG","https://en.wikipedia.org/wiki/Mohenjo-daro",0],
    "ashoka-kalinga": ["🦁","https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Sarnath_capital.jpg/960px-Sarnath_capital.jpg","https://en.wikipedia.org/wiki/Lion_Capital_of_Ashoka",0],
    "salt-march": ["🧂","https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/Marche_sel.jpg/960px-Marche_sel.jpg","https://en.wikipedia.org/wiki/Salt_March",0],
    "monsoon-economy": ["🌦️","https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2d/Monsoon_clouds_near_Nagercoil.jpg/960px-Monsoon_clouds_near_Nagercoil.jpg","https://en.wikipedia.org/wiki/Monsoon",0],
    "reforms-1991": ["🪙"],
    "green-revolution": ["🌾","https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/Punjab_Monsoon.jpg/960px-Punjab_Monsoon.jpg","https://en.wikipedia.org/wiki/Green_Revolution_in_India",0],
    "amul-white-revolution": ["🥛","https://thumb.wikimedia.org/wikipedia/commons/thumb/4/41/Amul_official_logo.svg/500px-Amul_official_logo.svg.png","https://en.wikipedia.org/wiki/Amul",1],
    "upi": ["📱","https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6f/UPI_logo.svg/500px-UPI_logo.svg.png","https://en.wikipedia.org/wiki/Unified_Payments_Interface",1],
    "isro-frugal": ["🚀","https://thumb.wikimedia.org/wikipedia/commons/thumb/a/aa/Chandrayaan-3_%E2%80%93_Image_of_Vikram_lander_on_lunar_surface_taken_by_Pragyan_rover_navcam_at_1104_IST%2C_30_August_2023_from_15_meters_away_%28with_text%29.webp/960px-Chandrayaan-3_%E2%80%93_Image_of_Vikram_lander_on_lunar_surface_taken_by_Pragyan_rover_navcam_at_1104_IST%2C_30_August_2023_from_15_meters_away_%28with_text%29.webp","https://en.wikipedia.org/wiki/Chandrayaan-3",0],
    "india-plate": ["🏔️","https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c8/Himalayas_and_allied_ranges_NASA_Landsat_showing_the_eight_thousanders%2C_annotated_with_major_rivers.jpg/960px-Himalayas_and_allied_ranges_NASA_Landsat_showing_the_eight_thousanders%2C_annotated_with_major_rivers.jpg","https://en.wikipedia.org/wiki/Himalayas",0],
    "india-languages": ["🗣️","https://upload.wikimedia.org/wikipedia/commons/8/8e/Language_Map_of_India.jpg","https://en.wikipedia.org/wiki/Languages_of_India",1],
    "india-election": ["🗳️"],
    "bombay-time": ["🕰️","https://upload.wikimedia.org/wikipedia/commons/d/db/IST-CIA-TZ.png","https://en.wikipedia.org/wiki/Indian_Standard_Time",1]
  };
  const emoji = id => (MV.MEDIA[id] || ["💡"])[0];
  function hero(id, cls) {
    const a = MV.E.asset(id), m = MV.MEDIA[id] || ["💡"];
    const el = h("div", { class: "hero" + (cls ? " " + cls : "") }, h("span", { class: "emo", "aria-hidden": "true" }, m[0]));
    el.style.setProperty("--dc", MV.DOMAIN_COLORS[a.domain]);
    if (m[1]) {
      const img = h("img", { alt: a.title, decoding: "async" });
      img.onload = () => el.classList.add("has-img"); img.onerror = () => img.remove();
      if (m[3]) el.classList.add("contain");
      el.append(img, h("a", { class: "credit", href: m[2], target: "_blank", rel: "noopener" }, "Photo: Wikipedia"));
      img.src = m[1];
    }
    return el;
  }
  const banner = e => h("div", { class: "hero banner" }, h("span", { class: "emo", "aria-hidden": "true" }, e));
  MV.Media = { emoji, hero, banner };
})();
