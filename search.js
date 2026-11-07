/* ============================================================
   Lawsuit Center — search index + results renderer
   Edit the INDEX array below to add/remove searchable pages.
   ============================================================ */

(function () {
  var INDEX = [
    // ----- Free tools -----
    { url: "pfas-exposure-checker",   title: "PFAS Exposure Checker", tag: "Free Tool", category: "Free Tools",
      desc: "Check location, water source, AFFF or industrial exposure, and timeline against active PFAS case categories.",
      keywords: "pfas forever chemicals water afff foam military airport exposure checker tool firefighting" },

    { url: "cancer-exposure-checker", title: "Cancer Exposure Checker", tag: "Free Tool", category: "Free Tools",
      desc: "Four short questions mapping a cancer diagnosis and exposure history to active case categories.",
      keywords: "cancer mesothelioma talc hair relaxer roundup camp lejeune pfas benzene afff exposure checker tool" },

    { url: "processed-food-claim-checker", title: "Processed Food Claim Checker", tag: "Free Tool", category: "Free Tools",
      desc: "Five quick questions mapping a Type 2 diabetes or NAFLD diagnosis, age, and consumption history to the ultra-processed food cases now being filed.",
      keywords: "processed food ultra-processed upf claim checker tool type 2 diabetes nafld fatty liver childhood diagnosis kraft heinz coca cola eligibility qualify do i qualify" },

    // ----- Case Review -----
    { url: "cancer-case-review", title: "Cancer Case Review", tag: "Case Review", category: "Cancer",
      desc: "Cancer diagnoses possibly tied to consumer products, workplace exposure, or contaminated water.",
      keywords: "cancer mesothelioma kidney ovarian lung lymphoma leukemia bladder uterine talc roundup zantac asbestos benzene afff camp lejeune lawsuit lawsuits claim claims case review free case review sue" },

    { url: "asbestos-case-review", title: "Asbestos Case Review", tag: "Case Review", category: "Asbestos",
      desc: "Mesothelioma, asbestos-related lung cancer, asbestosis, military or shipyard exposure, or secondhand exposure.",
      keywords: "asbestos mesothelioma lung cancer asbestosis shipyard navy military secondhand lawsuit lawsuits claim claims case review free case review sue" },

    { url: "peritoneal-mesothelioma-case-review", title: "Peritoneal Mesothelioma Case Review", tag: "Case Review", category: "Asbestos",
      desc: "Peritoneal mesothelioma from work, military, household, or talc powder exposure, including claims after a death.",
      keywords: "peritoneal mesothelioma abdominal abdomen asbestos talc talcum baby powder wrongful death lawsuit lawsuits claim claims case review free case review sue" },

    { url: "lung-cancer-asbestos-review", title: "Lung Cancer Asbestos Review", tag: "Case Review", category: "Asbestos",
      desc: "Submit basic information about asbestos exposure history and a lung cancer diagnosis for case review.",
      keywords: "lung cancer asbestos exposure occupational lawsuit lawsuits claim claims case review free case review sue" },

    { url: "ozempic-vision-loss-case-review", title: "Ozempic Vision Loss Case Review", tag: "Case Review", category: "Drugs & Medical Devices",
      desc: "Sudden vision loss in one eye (NAION) after Ozempic, Wegovy, Trulicity or another GLP-1 drug.",
      keywords: "ozempic wegovy trulicity mounjaro zepbound rybelsus saxenda semaglutide glp-1 naion vision loss blindness blind eye stroke optic nerve lawsuit lawsuits claim claims case review free case review sue" },

    { url: "social-media-case-review", title: "Social Media Case Review", tag: "Case Review", category: "Digital Platforms",
      desc: "Children or teens with mental health harm tied to Instagram, TikTok, Snapchat, Facebook, YouTube.",
      keywords: "social media instagram tiktok snapchat facebook youtube meta minors teen anxiety depression eating disorder self-harm MDL 3047 lawsuit lawsuits claim claims case review free case review sue" },

    { url: "video-game-case-review", title: "Video Game Case Review", tag: "Case Review", category: "Digital Platforms",
      desc: "Compulsive gaming, academic decline, mental health impact, or unauthorized in-game spending involving minors.",
      keywords: "video game gaming addiction minors fortnite in-game purchases lawsuit lawsuits claim claims case review free case review sue" },

    { url: "roblox-case-review", title: "Roblox Case Review", tag: "Case Review", category: "Digital Platforms",
      desc: "Predator contact through Roblox, contact that moved to Discord, compulsive use, or unauthorized Robux spending involving minors.",
      keywords: "roblox lawsuit robux discord predator grooming exploitation child safety minors addiction compulsive use MDL 3166 lawsuit lawsuits claim claims case review free case review sue" },

    { url: "video-game-lawsuit", title: "Video Game Lawsuit", tag: "Lawsuit", category: "Digital Platforms",
      desc: "Claims alleging games like Roblox and Fortnite were designed to encourage compulsive play in minors. Coordinated in California, no settlement yet.",
      keywords: "video game lawsuit video game addiction lawsuit claim file sign up do i qualify settlement gaming addiction roblox fortnite epic games loot boxes minors who qualifies" },

    { url: "video-game-lawyers", title: "Video Game Lawyers", tag: "Lawyers", category: "Digital Platforms",
      desc: "How video game attorneys evaluate compulsive gaming claims tied to Roblox, Fortnite, and other games, what records help, time limits, and how to compare firms.",
      keywords: "video game addiction lawyer video game lawsuit attorney gaming addiction lawyer roblox lawsuit lawyer fortnite lawsuit attorney video game addiction law firm" },

    { url: "openai-case-review", title: "OpenAI / ChatGPT Case Review", tag: "Case Review", category: "AI Chatbot Harm",
      desc: "Wrongful death, self-harm, fatal drug interaction, or harm involving sustained ChatGPT use.",
      keywords: "ai artificial intelligence openai chatgpt ai chatbot wrongful death suicide overdose violence school shooting product liability lawsuit lawsuits claim claims case review free case review sue" },

    { url: "deepfake-case-review", title: "Deepfake Case Review", tag: "Case Review", category: "AI Chatbot Harm",
      desc: "Non-consensual AI-generated intimate images of an adult or minor, distribution and removal failures, threats, and resulting harm.",
      keywords: "deepfake nonconsensual intimate images ai generated nudify grok xai take it down act removal 48 hours sextortion extortion likeness privacy minor lawsuit lawsuits claim claims case review free case review sue" },

    { url: "ai-case-review", title: "AI Case Review", tag: "Case Review", category: "AI Chatbot Harm",
      desc: "Harm involving an AI chatbot, AI-generated deepfake images, or another AI product — chatbot harm, deepfakes, or professional impersonation.",
      keywords: "ai artificial intelligence chatbot lawsuit deepfake nonconsensual images grok xai character ai openai chatgpt wrongful death self-harm medical impersonation take it down act lawsuits claim claims case review free case review sue" },

    { url: "pfas-case-review", title: "PFAS Case Review", tag: "Case Review", category: "Water & Environment",
      desc: "PFAS contamination, AFFF firefighting foam, military base or airport exposure, kidney/testicular cancer, thyroid disease, or ulcerative colitis.",
      keywords: "pfas pfoa pfos forever chemicals afff firefighting foam military base airport kidney testicular cancer thyroid ulcerative colitis lawsuit lawsuits claim claims case review free case review sue" },

    { url: "afff-case-review", title: "AFFF Firefighting Foam Case Review", tag: "Case Review", category: "Water & Environment",
      desc: "Occupational, military, or community water exposure to AFFF firefighting foam. Submit exposure history for case review.",
      keywords: "afff aqueous film forming foam firefighting foam fire fighting firefighter military base navy air force airport training site pfas pfoa pfos forever chemicals kidney testicular cancer thyroid water contamination mdl 2873 lawsuit lawsuits claim claims case review free case review sue" },

    { url: "chemical-exposure-case-review", title: "Chemical Exposure Case Review", tag: "Case Review", category: "Water & Environment",
      desc: "Contaminated water, pesticides, PFAS, or workplace chemical exposure with a related diagnosis.",
      keywords: "chemical exposure toxic chemicals workplace occupational industrial solvent benzene pesticide herbicide pfas contaminated water fumes inhalation spill release lawsuit lawsuits claim claims case review free case review sue" },

    { url: "toxic-water-case-review", title: "Toxic Water Case Review", tag: "Case Review", category: "Water & Environment",
      desc: "Contaminated drinking water, well water contamination, or industrial chemical releases.",
      keywords: "toxic water drinking well contamination industrial release lawsuit lawsuits claim claims case review free case review sue" },

    { url: "camp-lejeune-case-review", title: "Camp Lejeune Case Review", tag: "Case Review", category: "Water & Environment",
      desc: "For people whose Camp Lejeune claim reached the Navy by August 10, 2024 and who are waiting, were denied, or hold an Elective Option offer.",
      keywords: "camp lejeune marine corps base north carolina contaminated water justice act clja navy administrative claim denied elective option offer settlement waiting no response deficiency records muster rolls kidney cancer bladder leukemia non-hodgkin lymphoma parkinsons veteran marine family lawsuit lawsuits claim claims case review free case review sue" },

    { url: "environmental-contamination-case-review", title: "Environmental Contamination Review", tag: "Case Review", category: "Water & Environment",
      desc: "Exposure through soil, groundwater, industrial sites, landfills, or community conditions.",
      keywords: "environmental contamination soil groundwater landfill industrial superfund lawsuit lawsuits claim claims case review free case review sue" },

    { url: "air-pollution-case-review", title: "Air Pollution Case Review", tag: "Case Review", category: "Water & Environment",
      desc: "Long-term air pollution, industrial emissions, refinery or plant proximity, and respiratory conditions.",
      keywords: "air pollution emissions refinery plant respiratory asthma lawsuit lawsuits claim claims case review free case review sue" },

    { url: "pesticide-case-review", title: "Pesticide Case Review", tag: "Case Review", category: "Chemicals & Pesticides",
      desc: "Glyphosate (Roundup), paraquat, chlorpyrifos, and other pesticide or herbicide exposure.",
      keywords: "pesticide herbicide roundup glyphosate paraquat chlorpyrifos non-hodgkin lymphoma parkinson farmer applicator lawsuit lawsuits claim claims case review free case review sue" },

    { url: "neurological-case-review", title: "Neurological Case Review", tag: "Case Review", category: "Chemicals & Pesticides",
      desc: "Parkinson's, neuropathy, cognitive decline, or movement disorders with exposure history.",
      keywords: "neurological parkinson neuropathy cognitive decline movement disorder pesticide heavy metals lawsuit lawsuits claim claims case review free case review sue" },

    { url: "consumer-product-case-review", title: "Consumer Product Case Review", tag: "Case Review", category: "Products & Food",
      desc: "Allegedly defective, mislabeled, contaminated, or unsafe consumer products and recalls.",
      keywords: "consumer product defective recall mislabeled unsafe lawsuit lawsuits claim claims case review free case review sue" },

    { url: "processed-food-case-review", title: "Processed Food Case Review", tag: "Case Review", category: "Products & Food",
      desc: "Childhood-onset Type 2 diabetes, NAFLD, or metabolic conditions from ultra-processed food.",
      keywords: "processed food ultra-processed type 2 diabetes nafld fatty liver childhood obesity sugar lawsuit lawsuits claim claims case review free case review sue" },

    { url: "processed-food-lawsuit", title: "Processed Food Lawsuit", tag: "Lawsuit", category: "Products & Food",
      desc: "Claims alleging ultra processed foods were engineered for overconsumption, tied to childhood Type 2 diabetes and NAFLD. Early-stage litigation, test case dismissed, no settlement.",
      keywords: "processed food lawsuit ultra processed food lawsuit claim file do i qualify settlement upf kraft heinz coca cola type 2 diabetes nafld fatty liver martinez who qualifies" },

    { url: "processed-food-lawyers", title: "Processed Food Lawyers", tag: "Lawyers", category: "Products & Food",
      desc: "How processed food attorneys evaluate childhood diabetes and NAFLD claims tied to ultra processed foods, what records help, time limits, and how to compare firms.",
      keywords: "processed food lawsuit lawyer ultra processed food lawsuit attorney ultra processed food law firm nafld lawsuit attorney childhood diabetes lawsuit lawyer upf" },

    { url: "reproductive-case-review", title: "Reproductive Injury Case Review", tag: "Case Review", category: "Products & Food",
      desc: "Uterine or ovarian cancer, fertility complications, or reproductive harm tied to long-term product use.",
      keywords: "reproductive uterine ovarian cancer fertility hair relaxer talc talcum prenatal lawsuit lawsuits claim claims case review free case review sue" },

    { url: "hair-relaxer-case-review", title: "Hair Relaxer Case Review", tag: "Case Review", category: "Products & Food",
      desc: "Uterine cancer, ovarian cancer, or fibroids after long-term chemical hair relaxer or straightener use.",
      keywords: "hair relaxer straightener perm chemical uterine cancer endometrial ovarian cancer fibroids just for me dark and lovely optimum olive oil mdl 3060 lawsuit lawsuits claim claims case review free case review sue" },

    { url: "talcum-powder-case-review", title: "Talcum Powder Case Review", tag: "Case Review", category: "Products & Food",
      desc: "Long-term talc or baby powder use (Johnson's Baby Powder, Shower to Shower) followed by an ovarian cancer diagnosis.",
      keywords: "talcum powder talc lawsuit ovarian cancer johnson and johnson j&j baby powder shower to shower gold bond attorney lawyer settlement payout who qualifies eligibility deadline mdl 2738 lawsuits claim claims case review free case review sue" },

    { url: "talcum-powder-lawsuits", title: "Talcum Powder Lawsuit", tag: "Overview", category: "Products & Food",
      desc: "Overview of the talcum powder ovarian cancer litigation (MDL 2738): what the lawsuit is about, who qualifies, settlements, and FAQs.",
      keywords: "talcum powder lawsuit litigation ovarian cancer johnson and johnson j&j talc settlement attorneys lawyers mdl 2738 shower to shower who qualifies average settlement payout deadline class action" },

    { url: "hernia-mesh-case-review", title: "Hernia Mesh Case Review", tag: "Case Review", category: "Drugs & Medical Devices",
      desc: "Hernia mesh repair surgery followed by revision surgery, chronic pain, infection, adhesion, or mesh failure.",
      keywords: "hernia mesh implant repair surgery revision removal explant chronic pain infection adhesion bowel obstruction migration bard covidien ethicon atrium mdl 2846 lawsuit lawsuits claim claims case review free case review sue" },

    { url: "depo-provera-case-review", title: "Depo-Provera Case Review", tag: "Case Review", category: "Drugs & Medical Devices",
      desc: "Long-term Depo-Provera use (or generic medroxyprogesterone acetate) followed by a meningioma brain tumor diagnosis.",
      keywords: "depo-provera depo provera medroxyprogesterone meningioma brain tumor birth control injection MDL 3140 lawsuit lawsuits claim claims case review free case review sue" },
    { url: "suboxone-case-review", title: "Suboxone Case Review", tag: "Case Review", category: "Drugs & Medical Devices",
      desc: "Suboxone film used to treat opioid use disorder, followed by tooth decay, broken teeth, or extractions.",
      keywords: "suboxone case review suboxone lawsuit tooth decay teeth rot cavities broken teeth extraction dentures crowns implants buprenorphine naloxone film sublingual indivior aquestive mdl 3092 claim free case review qualify sue" },
    { url: "suboxone-lawsuit", title: "Suboxone Dental Injury Lawsuits", tag: "Overview", category: "Drugs & Medical Devices",
      desc: "Suboxone film and reported tooth decay, broken teeth, and tooth loss.",
      keywords: "suboxone lawsuit suboxone teeth tooth decay dental injury buprenorphine naloxone film indivior aquestive mdl 3092 who qualifies" },

    { url: "case-review", title: "General Case Review", tag: "Case Review", category: "General",
      desc: "Not sure where you fit? Describe the situation and we'll review which category may apply.",
      keywords: "general case review intake start lawsuit lawsuits claim claims free case review sue" },

    // ----- Case filings -----
    { url: "rushlow-v-altman-lawsuit", title: "Rushlow v. Altman", tag: "Case Filing", category: "AI Chatbot Harm",
      desc: "A grade 7 teacher who survived the Tumbler Ridge school shooting is suing OpenAI and Sam Altman, saying the company was told the attacker was dangerous eight months earlier and chose not to call police. Complaint posted in full.",
      keywords: "rushlow v altman rushlow lawsuit tumbler ridge school shooting british columbia canada teacher survivor openai sam altman chatgpt rcmp referral complaint pdf court filing 3:26-cv-09344 northern district california" },

    { url: "case-filings/grant-v-openai-complaint.pdf", title: "Grant v. OpenAI \u2014 Complaint", tag: "Case Filing", category: "AI Chatbot Harm",
      desc: "An FSU student shot three times in the April 2025 campus attack is suing OpenAI and Sam Altman in Florida state court. The full 34-page complaint, straight from the court file.",
      keywords: "grant v openai alianna grant lawsuit fsu florida state university shooting survivor shot three times leon county circuit court tallahassee openai sam altman chatgpt complaint pdf court filing 2026 ca 001352 aiding abetting product liability" },

    { url: "morales-v-openai-lawsuit", title: "Morales v. OpenAI", tag: "Case Filing", category: "AI Chatbot Harm",
      desc: "The widow of a Florida State University dining administrator killed in the April 2025 campus shooting is suing OpenAI and, for the first time in an FSU case, Sam Altman personally. Complaint posted in full.",
      keywords: "morales v openai morales lawsuit fsu florida state university shooting roberto morales betty morales wrongful death openai sam altman chatgpt complaint pdf court filing 4:26-cv-00425 northern district florida tallahassee" },

    { url: "jean-doe-v-openai-lawsuit", title: "Jean Doe v. OpenAI", tag: "Case Filing", category: "AI Chatbot Harm",
      desc: "An adult user who survived a suicide attempt says a year of ChatGPT conversations built a surveillance delusion and coached her on hiding it from her therapists. The first case in the docket to name Microsoft.",
      keywords: "jean doe v openai jean doe lawsuit chatgpt delusion surveillance paranoia suicide attempt survivor pseudonym microsoft openai complaint pdf court filing san francisco cgc-26-639036 jccp 5431" },

    { url: "nadia-n-v-openai-lawsuit", title: "Nadia N. v. OpenAI", tag: "Case Filing", category: "AI Chatbot Harm",
      desc: "A widow who never used ChatGPT says the product turned her husband against his family and wrote the messages he used to isolate her and their teenage son. Brought for herself, her son, and his estate.",
      keywords: "nadia n v openai nadia lawsuit chatgpt domestic abuse coercive control never used the product widow husband openai complaint pdf court filing san francisco cgc-26-639466 pennsylvania" },

    { url: "winters-v-openai-lawsuit", title: "Winters v. OpenAI", tag: "Case Filing", category: "AI Chatbot Harm",
      desc: "A pastor relied on ChatGPT for medical guidance for a year and suffered blood clots in both lungs. The first ChatGPT case brought by a plaintiff who survived, with the complaint posted in full.",
      keywords: "winters v openai winters lawsuit chatgpt medical advice pulmonary embolism blood clots dvt ai artificial intelligence chatbot complaint pdf court filing san francisco cgc-26-639579 survived plaintiff" },

    { url: "gourley-v-openai-lawsuit", title: "Gourley v. OpenAI", tag: "Case Filing", category: "AI Chatbot Harm",
      desc: "A student shot at Florida State University is suing OpenAI over the shooter's year of ChatGPT conversations. The first AI case brought by someone injured who never used the product, with the complaint posted in full.",
      keywords: "gourley v openai gourley lawsuit reese gourley fsu florida state shooting chatgpt ai artificial intelligence aiding and abetting negligent entrustment negligent undertaking sycophancy complaint pdf court filing tallahassee northern district florida 4:26-cv-00416 bystander non-user" },

    // ----- Personal injury overviews -----

    // ----- Financial -----

    // ----- Resources -----
    { url: "lawsuits", title: "Browse Lawsuits", tag: "Directory", category: "General",
      desc: "Every litigation category tracked on Lawsuit Center, with case review options for each.",
      keywords: "browse lawsuits all lawsuits categories directory list index find case type" },

    { url: "resources", title: "Legal Resources", tag: "Directory", category: "General",
      desc: "Legal resources on lawsuit research, case review, funding, claim categories, and practical next steps.",
      keywords: "legal resources research guides help next steps directory" },

    { url: "educational-review", title: "Legal Fee Agreement Review", tag: "Free Tool", category: "Free Tools",
      desc: "Request an educational review of an attorney retainer or fee agreement to identify terms you may want to ask about before signing.",
      keywords: "fee agreement retainer contingency contract review attorney fees costs lien what to ask before signing educational" },

    // ----- Overviews -----
    { url: "asbestos-lawsuits", title: "Asbestos Lawsuits", tag: "Overview", category: "Asbestos",
      desc: "Main asbestos hub: exposure history, illnesses tied to asbestos, and how case review works.",
      keywords: "asbestos lawsuits overview mesothelioma exposure" },

    { url: "lung-cancer-from-asbestos-exposure", title: "Lung Cancer From Asbestos Exposure", tag: "Overview", category: "Asbestos",
      desc: "Background on lung cancer claims involving asbestos exposure history.",
      keywords: "lung cancer asbestos" },

    { url: "social-media-addiction-lawsuit", title: "Social Media Addiction Lawsuit", tag: "Overview", category: "Digital Platforms",
      desc: "Background on allegations that platforms used addictive design features harming youth mental health.",
      keywords: "social media addiction lawsuit design features youth teens" },

    { url: "social-media-lawyers", title: "Social Media Lawyers", tag: "Lawyers", category: "Digital Platforms",
      desc: "How social media harm attorneys evaluate youth mental health and addiction claims, what records help, MDL 3047, time limits, and how to compare firms.",
      keywords: "social media lawyer social media attorney social media harm lawyer social media mental health lawyer sue social media addiction lawyer to sue instagram mdl 3047 youth teens" },

    { url: "instagram-lawsuit", title: "Instagram Lawsuit", tag: "Overview", category: "Digital Platforms",
      desc: "What the Instagram lawsuits are about, who may be affected, MDL 3047, what to gather, and time limits.",
      keywords: "instagram lawsuit meta instagram class action instagram lawyer to sue instagram teen mental health addiction mdl 3047 youth harm social media social media lawsuit social media addiction" },

    { url: "tiktok-lawsuit", title: "TikTok Lawsuit", tag: "Overview", category: "Digital Platforms",
      desc: "What the TikTok lawsuits are about, who may be affected, MDL 3047, what to gather, and time limits.",
      keywords: "tiktok lawsuit bytedance tiktok addiction teen mental health youth harm mdl 3047 recommendation algorithm social media social media lawsuit social media addiction" },

    { url: "https://lawsuitinformer.com/ai-lawsuits?utm_source=lawsuitcenter&utm_medium=referral&utm_campaign=cross_property&utm_content=search", title: "AI Lawsuits Overview", tag: "Overview", category: "AI Chatbot Harm",
      desc: "The top-level guide to AI litigation: who is being sued, the legal theories involved, and how the OpenAI, Grok, and Character.AI cases differ.",
      keywords: "ai lawsuits artificial intelligence litigation overview hub openai grok character ai deepfake chatbot product liability" },

    { url: "https://lawsuitinformer.com/take-it-down-act?utm_source=lawsuitcenter&utm_medium=referral&utm_campaign=cross_property&utm_content=search", title: "The TAKE IT DOWN Act Explained", tag: "Overview", category: "AI Chatbot Harm",
      desc: "The federal law on nonconsensual intimate images and AI deepfakes — what it covers, the 48-hour platform removal duty, and victims' rights.",
      keywords: "take it down act nonconsensual intimate images ncii deepfake law platform removal 48 hours ftc victim rights deepfake laws" },

    { url: "https://lawsuitinformer.com/grok-lawsuits?utm_source=lawsuitcenter&utm_medium=referral&utm_campaign=cross_property&utm_content=search", title: "Grok and xAI Lawsuits", tag: "Overview", category: "AI Chatbot Harm",
      desc: "The deepfake-image litigation against xAI — nonconsensual AI-generated images, the class actions, and the city and state actions.",
      keywords: "grok lawsuit xai deepfake nonconsensual ai generated images class action st clair baltimore privacy likeness" },

    { url: "https://lawsuitinformer.com/character-ai-lawsuit?utm_source=lawsuitcenter&utm_medium=referral&utm_campaign=cross_property&utm_content=search", title: "Character.AI Lawsuits", tag: "Overview", category: "AI Chatbot Harm",
      desc: "Teen-safety and wrongful death cases, the January 2026 settlements, and the state action alleging a chatbot posed as a licensed doctor.",
      keywords: "character ai lawsuit companion chatbot teen safety wrongful death settlement google medical impersonation doctor psychiatrist kentucky pennsylvania" },

    { url: "https://lawsuitinformer.com/openai-lawsuits?utm_source=lawsuitcenter&utm_medium=referral&utm_campaign=cross_property&utm_content=search", title: "OpenAI Lawsuits", tag: "Overview", category: "AI Chatbot Harm",
      desc: "The central hub for OpenAI litigation coverage — ChatGPT wrongful death, self-harm, mass shooting claims, and the product-versus-content framing question.",
      keywords: "ai artificial intelligence openai chatgpt lawsuits wrongful death self harm overdose school shooting product liability section 230" },

    { url: "https://lawsuitinformer.com/openai-school-shooting-lawsuits-ai-product-liability?utm_source=lawsuitcenter&utm_medium=referral&utm_campaign=cross_property&utm_content=search", title: "OpenAI School Shooting Lawsuits", tag: "Overview", category: "AI Chatbot Harm",
      desc: "Federal lawsuits against OpenAI tied to mass shootings and the product-vs-content framing question.",
      keywords: "ai artificial intelligence openai chatgpt school shooting product liability section 230" },

    { url: "https://lawsuitinformer.com/chatgpt-fsu-shooting-lawsuit?utm_source=lawsuitcenter&utm_medium=referral&utm_campaign=cross_property&utm_content=search", title: "FSU Shooting Lawsuit", tag: "Overview", category: "AI Chatbot Harm",
      desc: "The Chabba complaint: an eight-count federal lawsuit with a novel negligent entrustment theory for AI access.",
      keywords: "ai artificial intelligence fsu florida state shooting chatgpt openai negligent entrustment chabba" },

    { url: "https://lawsuitinformer.com/chatgpt-overdose-lawsuit-scott?utm_source=lawsuitcenter&utm_medium=referral&utm_campaign=cross_property&utm_content=search", title: "Scott Overdose Lawsuit", tag: "Overview", category: "AI Chatbot Harm",
      desc: "First major AI-as-unauthorized-medical-advisor wrongful death case (kratom + Xanax interaction).",
      keywords: "ai artificial intelligence scott chatgpt overdose kratom xanax wrongful death drug interaction" },

    { url: "https://lawsuitinformer.com/cancers-linked-to-lawsuits?utm_source=lawsuitcenter&utm_medium=referral&utm_campaign=cross_property&utm_content=search", title: "Cancers Linked to Lawsuits", tag: "Overview", category: "Cancer",
      desc: "Guide on cancers most often involved in toxic exposure, product liability, and environmental claims.",
      keywords: "cancer lawsuits toxic exposure product liability environmental" },

    { url: "water-contamination-lawsuits", title: "Water Contamination Lawsuits", tag: "Overview", category: "Water & Environment",
      desc: "Background on contaminated drinking water and long-term community water exposure claims.",
      keywords: "water contamination drinking groundwater community" },

    { url: "pfas-lawsuit", title: "PFAS Lawsuits", tag: "Overview", category: "Water & Environment",
      desc: "Overview of PFAS forever chemicals litigation, including water contamination, AFFF firefighting foam, related illnesses, lawyer guides, and case review.",
      keywords: "pfas lawsuit lawsuits forever chemicals afff firefighting foam water contamination kidney testicular cancer thyroid claim settlement case review" },
    { url: "environmental-contamination-lawsuits", title: "Environmental Contamination Lawsuits", tag: "Overview", category: "Water & Environment",
      desc: "Background on exposure through air, soil, groundwater, or community conditions.",
      keywords: "environmental contamination air soil groundwater community" },

    { url: "chemical-exposure-lawsuits", title: "Chemical Exposure Lawsuits", tag: "Overview", category: "Chemicals & Pesticides",
      desc: "Toxic substances, repeated exposure, contaminated property, and workplace exposure.",
      keywords: "chemical exposure toxic workplace occupational" },

    { url: "paraquat-lawsuit", title: "Paraquat Parkinson's Lawsuit", tag: "Overview", category: "Chemicals & Pesticides",
      desc: "Long-term paraquat or Gramoxone exposure linked to Parkinson's disease, consolidated in MDL 3004 — who may qualify and how case review works.",
      keywords: "paraquat parkinson gramoxone herbicide exposure lawsuit mdl 3004 syngenta chevron farmer applicator settlement attorney lawyer dichloride" },

    { url: "roundup-lawsuit", title: "Roundup Lawsuit", tag: "Overview", category: "Chemicals & Pesticides",
      desc: "Glyphosate-based herbicides and alleged links to non-Hodgkin lymphoma.",
      keywords: "roundup glyphosate monsanto bayer non-hodgkin lymphoma cancer" },

    { url: "hair-relaxer-lawsuit", title: "Hair Relaxer Lawsuit", tag: "Overview", category: "Chemicals & Pesticides",
      desc: "Chemical hair relaxer products and alleged long-term reproductive health risks.",
      keywords: "hair relaxer chemical reproductive uterine ovarian cancer fibroid" },

    { url: "product-liability-lawsuits", title: "Product Liability Lawsuits", tag: "Overview", category: "Products & Food",
      desc: "Background on allegedly defective, unsafe, mislabeled, or harmful consumer products and devices.",
      keywords: "product liability defective recall consumer device" },

    { url: "depo-provera", title: "Depo-Provera Meningioma Lawsuit", tag: "Overview", category: "Drugs & Medical Devices",
      desc: "Background on the Depo-Provera meningioma litigation (MDL 3140), who qualifies, and FAQs.",
      keywords: "depo provera depo-provera meningioma brain tumor mdl 3140 birth control" },

    { url: "depo-provera-lawyers", title: "Depo-Provera Lawyers", tag: "Lawyers", category: "Drugs & Medical Devices",
      desc: "How Depo-Provera attorneys evaluate meningioma claims, what records help, MDL 3140, time limits, and how to compare firms.",
      keywords: "depo provera lawyer depo provera lawyers depo provera attorney depo provera lawsuit lawyers medroxyprogesterone meningioma brain tumor mdl 3140 drug injury" },

    { url: "hernia-mesh-lawyers", title: "Hernia Mesh Lawyers", tag: "Lawyers", category: "Drugs & Medical Devices",
      desc: "How hernia mesh attorneys evaluate complication and revision surgery claims, identifying your mesh product, the major MDLs, time limits, and how to compare firms.",
      keywords: "hernia mesh lawyer hernia mesh lawyers hernia mesh attorney hernia mesh attorneys near me surgical mesh lawsuit bard davol ethicon physiomesh atrium c-qur covidien revision surgery mesh failure mdl 2846 medical device" },

    { url: "drug-injury-lawsuits", title: "Drug Injury Lawsuits", tag: "Overview", category: "Drugs & Medical Devices",
      desc: "Prescription medications, side effects, warning issues, and medication-related injuries.",
      keywords: "drug injury prescription medication side effect warning" },

    { url: "medical-device-lawsuits", title: "Medical Device Lawsuits", tag: "Overview", category: "Drugs & Medical Devices",
      desc: "Implants, surgical mesh, joint replacements, complications, recalls, and alleged defects.",
      keywords: "medical device implant surgical mesh joint replacement hip knee recall" },

    { url: "ozempic-lawsuit", title: "Ozempic / GLP-1 Lawsuits", tag: "Overview", category: "Drugs & Medical Devices",
      desc: "GLP-1 medications and reported gastrointestinal complications.",
      keywords: "ozempic glp-1 wegovy mounjaro semaglutide gastroparesis stomach paralysis" },

    { url: "consumer-lawsuits", title: "Consumer Lawsuits", tag: "Overview", category: "Consumer & Financial",
      desc: "False advertising, billing disputes, defective products, scams, and consumer protection.",
      keywords: "consumer protection false advertising billing scam" },

    { url: "class-action-lawsuits", title: "Class Action Lawsuits", tag: "Overview", category: "Business & Employment",
      desc: "Large group claims involving consumers, employees, investors, or defective products.",
      keywords: "class action group claim mass" },

    { url: "asbestos-lawyers", title: "Asbestos Lawyers", tag: "Lawyers", category: "State Lawyer Pages",
      desc: "Find an asbestos lawyer by state — what asbestos attorneys do, time limits, and how to compare firms.",
      keywords: "asbestos lawyer attorney mesothelioma law firm by state national find" },

    { url: "mesothelioma-lawyers", title: "Mesothelioma Lawyers", tag: "Lawyers", category: "State Lawyer Pages",
      desc: "How mesothelioma lawyers evaluate pleural, peritoneal, and wrongful death claims — fees, time limits, and how to find a mesothelioma attorney near you.",
      keywords: "mesothelioma lawyer attorney near me law firm best pleural peritoneal wrongful death contingency fee asbestos by state" },

    { url: "pfas-lawyers", title: "PFAS Lawyers", tag: "Lawyers", category: "State Lawyer Pages",
      desc: "Find a PFAS lawyer for forever chemicals claims, including water contamination and AFFF firefighting foam, plus what records help and how to compare firms.",
      keywords: "pfas lawyer attorney forever chemicals afff firefighting foam water contamination kidney testicular cancer thyroid law firm find national" },

    { url: "roundup-lawyers", title: "Roundup Lawyers", tag: "Lawyers", category: "State Lawyer Pages",
      desc: "Find a Roundup lawyer for glyphosate exposure and non-Hodgkin lymphoma claims, plus how settlements and deadlines work and how to compare firms.",
      keywords: "roundup lawyer attorney glyphosate cancer lawyer non-hodgkin lymphoma best attorney for roundup lawsuit monsanto bayer settlement law firm find pesticide herbicide" },

    { url: "hair-relaxer-lawyers", title: "Hair Relaxer Lawyers", tag: "Lawyers", category: "State Lawyer Pages",
      desc: "Find a hair relaxer lawyer for uterine, endometrial, or ovarian cancer claims tied to chemical straighteners, plus how MDL 3060 settlements and deadlines work and how to compare firms.",
      keywords: "hair relaxer lawyer attorney chemical straightener uterine cancer endometrial ovarian cancer mdl 3060 settlement payout class action morgan and morgan ben crump loreal revlon law firm find fibroids" },

    { url: "tylenol-autism-lawsuit", title: "Tylenol Autism Lawsuit", tag: "Lawsuit", category: "Consumer Products",
      desc: "Claims alleging failure to warn about a possible association between prenatal acetaminophen exposure and autism or ADHD. Litigation active but unsettled, federal appeal pending.",
      keywords: "tylenol autism lawsuit tylenol lawsuit acetaminophen autism adhd class action sign up age limit settlement update pregnancy johnson and johnson kenvue mdl daubert appeal who qualifies" },
    { url: "tylenol-case-review", title: "Tylenol Case Review", tag: "Case Review", category: "Consumer Products",
      desc: "Tylenol or acetaminophen used during pregnancy, followed by a child's autism or ADHD diagnosis.",
      keywords: "tylenol case review acetaminophen pregnancy prenatal autism adhd child diagnosis lawsuit claim free case review kenvue johnson and johnson store brand walmart cvs walgreens sign up qualify mdl 3043" },

    { url: "baby-food-lawsuit", title: "Baby Food Lawsuit", tag: "Lawsuit", category: "Consumer Products",
      desc: "Claims alleging heavy metals in baby foods from Gerber, Beech-Nut, and others, linked in litigation to autism and ADHD diagnoses. MDL 3101, no settlement yet.",
      keywords: "baby food lawsuit toxic baby food gerber gerbers beech nut heavy metals lead arsenic autism adhd claim file sign up do i qualify settlement mdl 3101 who qualifies" },

    { url: "baby-food-lawyers", title: "Baby Food Lawyers", tag: "Lawyers", category: "Consumer Products",
      desc: "How baby food attorneys evaluate autism and ADHD claims tied to alleged heavy metals, what records help, MDL 3101, time limits, and how to compare firms.",
      keywords: "baby food lawyer baby food lawyers baby food autism lawsuit lawyer baby food autism attorney toxic baby food law firm gerber lawyer beech nut attorney heavy metals" },

    { url: "california-asbestos-lawyers", title: "California Asbestos Lawyers", tag: "State Page", category: "State Lawyer Pages",
      desc: "Asbestos lawyer information for California-related exposure or illness.",
      keywords: "california asbestos lawyer mesothelioma" },

    { url: "florida-asbestos-lawyers", title: "Florida Asbestos Lawyers", tag: "State Page", category: "State Lawyer Pages",
      desc: "Asbestos lawyer information for Florida-related exposure or illness.",
      keywords: "florida asbestos lawyer mesothelioma" },

    { url: "illinois-asbestos-lawyers", title: "Illinois Asbestos Lawyers", tag: "State Page", category: "State Lawyer Pages",
      desc: "Asbestos lawyer information for Illinois-related exposure or illness.",
      keywords: "illinois asbestos lawyer mesothelioma chicago steel railroad" },

    { url: "pennsylvania-asbestos-lawyers", title: "Pennsylvania Asbestos Lawyers", tag: "State Page", category: "State Lawyer Pages",
      desc: "Asbestos lawyer information for Pennsylvania-related exposure or illness.",
      keywords: "pennsylvania asbestos lawyer mesothelioma pittsburgh steel philadelphia shipyard" },

    { url: "texas-asbestos-lawyers", title: "Texas Asbestos Lawyers", tag: "State Page", category: "State Lawyer Pages",
      desc: "Asbestos and mesothelioma lawyer information for Texas-related exposure or illness — Gulf Coast refineries, the Houston Ship Channel, and shipyards.",
      keywords: "texas asbestos lawyer mesothelioma houston dallas beaumont port arthur refinery petrochemical gulf coast shipyard ship channel" },

    { url: "new-york-asbestos-lawyers", title: "New York Asbestos Lawyers", tag: "State Page", category: "State Lawyer Pages",
      desc: "Asbestos and mesothelioma lawyer information for New York-related exposure or illness — Brooklyn Navy Yard, NYC construction, Con Edison plants, and the World Trade Center.",
      keywords: "new york asbestos lawyer mesothelioma nyc brooklyn navy yard con edison construction world trade center 9/11 buffalo bethlehem steel nycal" },

    { url: "michigan-asbestos-lawyers", title: "Michigan Asbestos Lawyers", tag: "State Page", category: "State Lawyer Pages",
      desc: "Asbestos lawyer information for Michigan-related exposure or illness.",
      keywords: "michigan asbestos lawyer mesothelioma detroit auto foundry" },

    { url: "louisiana-asbestos-lawyers", title: "Louisiana Asbestos Lawyers", tag: "State Page", category: "State Lawyer Pages",
      desc: "Asbestos lawyer information for Louisiana-related exposure or illness.",
      keywords: "louisiana asbestos lawyer mesothelioma refinery petrochemical avondale shipyard" }
  ];

  // ---------- search logic ----------
  /* Short terms match on a word boundary, longer ones on substring. Without this,
     every field test below is a bare indexOf, so "ai" pulls in Air Pollution, Hair
     Relaxer and Claim Checker, and "tor" pulls in attorney, history and victim.
     The tradeoff is that a bounded "ai" no longer reaches inside "openai", so the
     AI entries carry "ai artificial intelligence" in their keywords explicitly. */
  function has(hay, q) {
    if (q.length > 3) {
      if (hay.indexOf(q) !== -1) return true;
      /* "lawsuits" should still find an entry that only says "lawsuit".
         indexOf is one-directional: the singular matches inside the plural,
         but not the other way round. */
      if (q.length > 4 && q.charAt(q.length - 1) === "s") {
        return hay.indexOf(q.slice(0, -1)) !== -1;
      }
      return false;
    }
    var esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp("\\b" + esc + "\\b").test(hay);
  }

  /* The title-prefix bonus needs the same guard. A bare indexOf(q) === 0 scores
     "Air Pollution Case Review" 80 for the query "ai", which outranks every real
     AI page. For a short term the prefix only counts if it ends on a boundary. */
  function startsWord(hay, q) {
    if (hay.indexOf(q) !== 0) return false;
    if (q.length > 3) return true;
    return hay.length === q.length || !/[a-z0-9]/.test(hay.charAt(q.length));
  }

  function score(item, q) {
    var t = item.title.toLowerCase();
    var c = (item.category || "").toLowerCase();
    var k = (item.keywords || "").toLowerCase();
    var d = (item.desc || "").toLowerCase();
    if (t === q) return 100;
    if (startsWord(t, q)) return 80;
    if (has(t, q)) return 60;
    if (has(k, q)) return 45;
    if (has(c, q)) return 35;
    if (has(d, q)) return 20;
    return 0;
  }

  var TAG_ORDER = ["Case Review", "Free Tool", "Overview", "Lawsuit", "Guide", "Case Filing", "Lawyers", "State Page", "Directory"];
  function tagRank(tag) {
    var i = TAG_ORDER.indexOf(tag || "");
    return i === -1 ? TAG_ORDER.length : i;
  }

  function search(query) {
    var q = query.trim().toLowerCase();
    if (!q) return [];
    var terms = q.split(/\s+/).filter(Boolean);
    return INDEX
      .map(function (item) {
        var s = 0;
        for (var i = 0; i < terms.length; i++) {
          var ts = score(item, terms[i]);
          if (ts === 0) return { item: item, score: 0 };
          s += ts;
        }
        return { item: item, score: s };
      })
      .filter(function (r) { return r.score > 0; })
      /* Group before ranking. Lawsuit Center is the intake property, so a
         matching case review comes before background, and background before
         individual filings. Relevance still decides the order inside a group. */
      .sort(function (a, b) {
        var ga = tagRank(a.item.tag), gb = tagRank(b.item.tag);
        if (ga !== gb) return ga - gb;
        return b.score - a.score;
      })
      .map(function (r) { return r.item; });
  }

  // ---------- render ----------
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  function render(results, query) {
    var list = document.getElementById("search-results");
    var meta = document.getElementById("search-page-meta");
    var empty = document.getElementById("search-empty");
    var idle = document.getElementById("search-idle");
    var chips = document.getElementById("search-page-chips");

    if (!query) {
      list.innerHTML = "";
      meta.textContent = "";
      empty.hidden = true;
      idle.hidden = false;
      chips.hidden = false;
      return;
    }

    idle.hidden = true;

    if (results.length === 0) {
      list.innerHTML = "";
      meta.textContent = "";
      empty.hidden = false;
      chips.hidden = true;
      return;
    }

    empty.hidden = true;
    chips.hidden = true;
    meta.textContent = results.length + (results.length === 1 ? " result" : " results") + ' for "' + query + '"';
    list.innerHTML = results.map(function (r) {
      return (
        '<li class="search-result">' +
          '<a href="' + escapeHtml(r.url) + '">' +
            '<div class="search-result__top">' +
              '<span class="search-result__tag">' + escapeHtml(r.tag) + '</span>' +
              '<span class="search-result__category">' + escapeHtml(r.category) + '</span>' +
              (/^https?:\/\//.test(r.url) ? '<span class="search-result__offsite">Lawsuit Informer</span>' : '') +
            '</div>' +
            '<h3 class="search-result__title">' + escapeHtml(r.title) + '</h3>' +
            '<p class="search-result__desc">' + escapeHtml(r.desc) + '</p>' +
          '</a>' +
        '</li>'
      );
    }).join("");
  }

  // ---------- wire up ----------
  document.addEventListener("DOMContentLoaded", function () {
    var input = document.getElementById("search-page-input");
    var clearBtn = document.getElementById("search-page-clear");
    if (!input) return;

    function run(q) {
      render(search(q || ""), (q || "").trim());
      if (clearBtn) clearBtn.hidden = !q;
    }

    // initial query from URL
    var initial = (new URLSearchParams(location.search).get("q") || "").trim();
    if (initial) {
      input.value = initial;
      run(initial);
    } else {
      run("");
    }

    // live typing — update results AND URL (no reload)
    var t;
    input.addEventListener("input", function (e) {
      clearTimeout(t);
      var v = e.target.value;
      t = setTimeout(function () {
        run(v);
        var newUrl = v ? location.pathname + "?q=" + encodeURIComponent(v) : location.pathname;
        history.replaceState(null, "", newUrl);
      }, 100);
    });

    // clear
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        input.value = "";
        run("");
        history.replaceState(null, "", location.pathname);
        input.focus();
      });
    }

    // chip clicks — handle without full reload
    var chipsEl = document.getElementById("search-page-chips");
    if (chipsEl) {
      chipsEl.addEventListener("click", function (e) {
        var a = e.target.closest("a");
        if (!a) return;
        e.preventDefault();
        var q = new URLSearchParams(a.search).get("q") || "";
        input.value = q;
        run(q);
        history.replaceState(null, "", location.pathname + (q ? "?q=" + encodeURIComponent(q) : ""));
        input.focus();
      });
    }
  });
})();
