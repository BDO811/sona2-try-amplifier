/**
 * Internationalization (i18n) for the Amplifier Wellness Check demo
 * Supports: English, French, German, Hindi (Devanagari)
 */

export type Language = "en" | "fr" | "de" | "hi";

export const LANGUAGE_OPTIONS: { id: Language; label: string; nativeLabel: string }[] = [
  { id: "en", label: "English", nativeLabel: "English" },
  { id: "fr", label: "French", nativeLabel: "Français" },
  { id: "de", label: "German", nativeLabel: "Deutsch" },
  { id: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
];

type TranslationKey = keyof typeof translations;

const translations = {
  // Language selector
  selectLanguage: {
    en: "Select Your Language",
    fr: "Choisissez votre langue",
    de: "Wählen Sie Ihre Sprache",
    hi: "अपनी भाषा चुनें",
  },
  continueBtn: {
    en: "Continue",
    fr: "Continuer",
    de: "Weiter",
    hi: "जारी रखें",
  },

  // Chrome headers
  amplifierHealth: {
    en: "AMPLIFIER HEALTH",
    fr: "AMPLIFIER HEALTH",
    de: "AMPLIFIER HEALTH",
    hi: "AMPLIFIER HEALTH",
  },
  sonaVersion: {
    en: "SONA-2 // 2026",
    fr: "SONA-2 // 2026",
    de: "SONA-2 // 2026",
    hi: "SONA-2 // 2026",
  },

  // Triage - Step 1
  personalizeScreening: {
    en: "Let's personalize your screening.",
    fr: "Personnalisons votre bilan.",
    de: "Personalisieren wir Ihre Untersuchung.",
    hi: "आइए आपकी जांच को व्यक्तिगत बनाएं।",
  },
  male: {
    en: "Male",
    fr: "Homme",
    de: "Männlich",
    hi: "पुरुष",
  },
  female: {
    en: "Female",
    fr: "Femme",
    de: "Weiblich",
    hi: "महिला",
  },

  // Triage - Step 2
  selectAgeBracket: {
    en: "Select your age bracket.",
    fr: "Sélectionnez votre tranche d'âge.",
    de: "Wählen Sie Ihre Altersgruppe.",
    hi: "अपनी आयु वर्ग चुनें।",
  },

  // Triage - Step 3 (Health Focus)
  primaryHealthFocus: {
    en: "What is your primary health focus today?",
    fr: "Quelle est votre priorité santé aujourd'hui ?",
    de: "Was ist heute Ihr wichtigstes Gesundheitsthema?",
    hi: "आज आपका मुख्य स्वास्थ्य फोकस क्या है?",
  },

  // Triage - Step 4 (Contact)
  secureSession: {
    en: "Secure Your Session",
    fr: "Sécurisez votre session",
    de: "Sichern Sie Ihre Sitzung",
    hi: "अपना सत्र सुरक्षित करें",
  },
  consentDescription: {
    en: "To analyze your acoustic markers and generate your personalized screening results, we need to collect your consent.",
    fr: "Pour analyser vos marqueurs acoustiques et générer vos résultats personnalisés, nous avons besoin de votre consentement.",
    de: "Um Ihre akustischen Marker zu analysieren und Ihre persönlichen Ergebnisse zu erstellen, benötigen wir Ihre Zustimmung.",
    hi: "आपके ध्वनि मार्करों का विश्लेषण करने और आपके व्यक्तिगत जांच परिणाम उत्पन्न करने के लिए, हमें आपकी सहमति की आवश्यकता है।",
  },
  fullName: {
    en: "Full Name",
    fr: "Nom complet",
    de: "Vollständiger Name",
    hi: "पूरा नाम",
  },
  enterFullName: {
    en: "Enter your full name",
    fr: "Entrez votre nom complet",
    de: "Geben Sie Ihren vollständigen Namen ein",
    hi: "अपना पूरा नाम दर्ज करें",
  },
  emailAddress: {
    en: "Email Address",
    fr: "Adresse e-mail",
    de: "E-Mail-Adresse",
    hi: "ईमेल पता",
  },
  enterEmail: {
    en: "Enter your email address",
    fr: "Entrez votre adresse e-mail",
    de: "Geben Sie Ihre E-Mail-Adresse ein",
    hi: "अपना ईमेल पता दर्ज करें",
  },
  phoneNumber: {
    en: "Phone Number",
    fr: "Numéro de téléphone",
    de: "Telefonnummer",
    hi: "फ़ोन नंबर",
  },
  enterPhone: {
    en: "Enter your mobile number",
    fr: "Entrez votre numéro de mobile",
    de: "Geben Sie Ihre Mobilnummer ein",
    hi: "अपना मोबाइल नंबर दर्ज करें",
  },
  consentText: {
    en: "I consent to the recording and processing of my voice data for clinical screening and agree to the",
    fr: "Je consens à l'enregistrement et au traitement de mes données vocales à des fins de bilan clinique et j'accepte les",
    de: "Ich stimme der Aufzeichnung und Verarbeitung meiner Sprachdaten für die klinische Untersuchung zu und akzeptiere die",
    hi: "मैं नैदानिक जांच के लिए अपने आवाज डेटा की रिकॉर्डिंग और प्रसंस्करण के लिए सहमति देता/देती हूं और",
  },
  termsOfService: {
    en: "Terms of Service",
    fr: "Conditions d'utilisation",
    de: "Nutzungsbedingungen",
    hi: "सेवा की शर्तों",
  },
  and: {
    en: "and",
    fr: "et",
    de: "und",
    hi: "और",
  },
  privacyPolicy: {
    en: "Privacy Policy",
    fr: "Politique de confidentialité",
    de: "Datenschutzrichtlinie",
    hi: "गोपनीयता नीति",
  },
  beginScreening: {
    en: "BEGIN SCREENING",
    fr: "COMMENCER LE BILAN",
    de: "UNTERSUCHUNG STARTEN",
    hi: "जांच शुरू करें",
  },
  preparingSession: {
    en: "Preparing Session...",
    fr: "Préparation de la session...",
    de: "Sitzung wird vorbereitet...",
    hi: "सत्र तैयार हो रहा है...",
  },
  encryptionNote: {
    en: "Your data is fully encrypted using AES-256 healthcare-standard security.",
    fr: "Vos données sont entièrement chiffrées selon la norme de sécurité AES-256 pour le secteur de la santé.",
    de: "Ihre Daten sind vollständig mit dem AES-256-Gesundheitsstandard verschlüsselt.",
    hi: "आपका डेटा AES-256 स्वास्थ्य-मानक सुरक्षा का उपयोग करके पूरी तरह एन्क्रिप्ट किया गया है।",
  },

  // Validation errors
  nameRequired: {
    en: "Full name is required",
    fr: "Le nom complet est requis",
    de: "Der vollständige Name ist erforderlich",
    hi: "पूरा नाम आवश्यक है",
  },
  emailRequired: {
    en: "Please enter a valid email address.",
    fr: "Veuillez entrer une adresse e-mail valide.",
    de: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    hi: "कृपया एक मान्य ईमेल पता दर्ज करें।",
  },
  phoneRequired: {
    en: "Please enter a valid 10-digit phone number.",
    fr: "Veuillez entrer un numéro de téléphone valide à 10 chiffres.",
    de: "Bitte geben Sie eine gültige 10-stellige Telefonnummer ein.",
    hi: "कृपया एक मान्य 10-अंकीय फ़ोन नंबर दर्ज करें।",
  },

  // Attract / Orb
  wellnessCheck: {
    en: "Audio Wellness Check",
    fr: "Bilan de bien-être audio",
    de: "Audio-Wellness-Check",
    hi: "ऑडियो वेलनेस जांच",
  },
  tapToBegin: {
    en: "Tap Anywhere to Begin",
    fr: "Touchez n'importe où pour commencer",
    de: "Tippen Sie irgendwo, um zu beginnen",
    hi: "शुरू करने के लिए कहीं भी टैप करें",
  },

  // Recording / Capture — a pool of open, easy-to-talk-about prompts; getQuestions()
  // randomly samples 3 of these per session, each meant to draw out ~15-20s of natural speech.
  question1: {
    en: "Tell me about your favorite vacation — where you went, what you did, and why it stood out.",
    fr: "Parlez-moi de vos vacances préférées : où vous êtes allé, ce que vous avez fait, et pourquoi cela vous a marqué.",
    de: "Erzählen Sie mir von Ihrem Lieblingsurlaub: wohin Sie gereist sind, was Sie unternommen haben, und warum er Ihnen in Erinnerung geblieben ist.",
    hi: "अपनी पसंदीदा छुट्टी के बारे में बताएं: आप कहाँ गए, क्या किया, और वह खास क्यों थी।",
  },
  question2: {
    en: "Describe your favorite meal — what it is, what it tastes like, and why you love it.",
    fr: "Décrivez votre plat préféré : ce que c'est, son goût, et pourquoi vous l'aimez.",
    de: "Beschreiben Sie Ihr Lieblingsgericht: was es ist, wie es schmeckt, und warum Sie es lieben.",
    hi: "अपने पसंदीदा खाने के बारे में बताएं: वह क्या है, उसका स्वाद कैसा है, और आपको वह क्यों पसंद है।",
  },
  question3: {
    en: "Walk me through what you did today, from when you woke up until now.",
    fr: "Racontez-moi ce que vous avez fait aujourd'hui, depuis votre réveil jusqu'à maintenant.",
    de: "Erzählen Sie mir, was Sie heute gemacht haben, vom Aufwachen bis jetzt.",
    hi: "बताएं कि आपने आज क्या किया, सुबह उठने से लेकर अभी तक।",
  },
  question4: {
    en: "Tell me about members of your family: who they are, what they do, and what makes them unique.",
    fr: "Parlez-moi des membres de votre famille : qui ils sont, ce qu'ils font, et ce qui les rend uniques.",
    de: "Erzählen Sie mir von Ihren Familienmitgliedern: wer sie sind, was sie tun und was sie einzigartig macht.",
    hi: "अपने परिवार के सदस्यों के बारे में बताएं: वे कौन हैं, क्या करते हैं, और उनमें क्या खास बात है?",
  },
  question5: {
    en: "Describe a hobby or activity you genuinely enjoy and why it relaxes you.",
    fr: "Décrivez un loisir ou une activité que vous aimez vraiment et pourquoi cela vous détend.",
    de: "Beschreiben Sie ein Hobby oder eine Aktivität, die Ihnen wirklich Freude macht und warum sie Sie entspannt.",
    hi: "किसी ऐसे शौक या गतिविधि के बारे में बताएं जो आपको सच में पसंद है और वह आपको सुकून क्यों देती है।",
  },
  question6: {
    en: "Tell me about the most memorable trip you've ever taken.",
    fr: "Parlez-moi du voyage le plus mémorable que vous ayez jamais fait.",
    de: "Erzählen Sie mir von der denkwürdigsten Reise, die Sie je unternommen haben.",
    hi: "अपनी अब तक की सबसे यादगार यात्रा के बारे में बताएं।",
  },
  question7: {
    en: "Describe your ideal weekend, from morning to night.",
    fr: "Décrivez votre week-end idéal, du matin jusqu'au soir.",
    de: "Beschreiben Sie Ihr ideales Wochenende, vom Morgen bis zum Abend.",
    hi: "अपने आदर्श सप्ताहांत के बारे में बताएं, सुबह से रात तक।",
  },
  question8: {
    en: "Tell me about a movie or show you recently watched and what you thought of it.",
    fr: "Parlez-moi d'un film ou d'une série que vous avez regardé récemment et ce que vous en avez pensé.",
    de: "Erzählen Sie mir von einem Film oder einer Serie, die Sie kürzlich gesehen haben, und was Sie davon hielten.",
    hi: "किसी ऐसी फिल्म या शो के बारे में बताएं जो आपने हाल ही में देखा, और आपको कैसा लगा।",
  },
  question9: {
    en: "Describe your morning routine, step by step.",
    fr: "Décrivez votre routine matinale, étape par étape.",
    de: "Beschreiben Sie Ihre Morgenroutine, Schritt für Schritt.",
    hi: "अपनी सुबह की दिनचर्या के बारे में, चरण दर चरण बताएं।",
  },
  question10: {
    en: "Tell me about your pet, or an animal you love, and what makes them special.",
    fr: "Parlez-moi de votre animal de compagnie, ou d'un animal que vous aimez, et de ce qui le rend spécial.",
    de: "Erzählen Sie mir von Ihrem Haustier oder einem Tier, das Sie lieben, und was es besonders macht.",
    hi: "अपने पालतू जानवर या किसी ऐसे जानवर के बारे में बताएं जिसे आप पसंद करते हैं, और उसमें क्या खास बात है।",
  },
  question11: {
    en: "Describe your favorite season and what you like to do during it.",
    fr: "Décrivez votre saison préférée et ce que vous aimez y faire.",
    de: "Beschreiben Sie Ihre Lieblingsjahreszeit und was Sie in dieser Zeit gerne tun.",
    hi: "अपने पसंदीदा मौसम के बारे में बताएं और उस दौरान आपको क्या करना अच्छा लगता है।",
  },
  question12: {
    en: "Talk about a book you've read that stuck with you, and why.",
    fr: "Parlez d'un livre que vous avez lu qui vous a marqué, et pourquoi.",
    de: "Erzählen Sie von einem Buch, das Sie gelesen haben und das Ihnen im Gedächtnis geblieben ist, und warum.",
    hi: "किसी ऐसी किताब के बारे में बताएं जो आपने पढ़ी और जो आपके दिमाग में रह गई, और क्यों।",
  },
  question13: {
    en: "Describe your typical commute or how you get around day to day.",
    fr: "Décrivez votre trajet habituel ou comment vous vous déplacez au quotidien.",
    de: "Beschreiben Sie Ihren üblichen Arbeitsweg oder wie Sie sich im Alltag fortbewegen.",
    hi: "अपने रोज़ के आने-जाने के तरीके के बारे में बताएं।",
  },
  question14: {
    en: "Tell me about a skill you'd like to learn and why it interests you.",
    fr: "Parlez-moi d'une compétence que vous aimeriez apprendre et pourquoi elle vous intéresse.",
    de: "Erzählen Sie mir von einer Fähigkeit, die Sie gerne lernen würden, und warum sie Sie interessiert.",
    hi: "किसी ऐसे हुनर के बारे में बताएं जो आप सीखना चाहते हैं और वह आपको क्यों दिलचस्प लगता है।",
  },
  question15: {
    en: "Talk about your favorite type of music and how you discovered it.",
    fr: "Parlez de votre type de musique préféré et de la façon dont vous l'avez découvert.",
    de: "Erzählen Sie von Ihrer Lieblingsmusikrichtung und wie Sie sie entdeckt haben.",
    hi: "अपनी पसंदीदा तरह के संगीत के बारे में बताएं और आपने उसे कैसे खोजा।",
  },
  question16: {
    en: "Describe the neighborhood or city you grew up in.",
    fr: "Décrivez le quartier ou la ville où vous avez grandi.",
    de: "Beschreiben Sie die Gegend oder Stadt, in der Sie aufgewachsen sind.",
    hi: "उस मोहल्ले या शहर के बारे में बताएं जहाँ आप बड़े हुए।",
  },
  question17: {
    en: "Tell me about a teacher or mentor who influenced you.",
    fr: "Parlez-moi d'un professeur ou d'un mentor qui vous a influencé.",
    de: "Erzählen Sie mir von einem Lehrer oder Mentor, der Sie beeinflusst hat.",
    hi: "किसी ऐसे शिक्षक या गुरु के बारे में बताएं जिसका आप पर असर पड़ा।",
  },
  question18: {
    en: "Talk about your favorite holiday and how you usually celebrate it.",
    fr: "Parlez de votre fête préférée et de la façon dont vous la célébrez habituellement.",
    de: "Erzählen Sie von Ihrem Lieblingsfeiertag und wie Sie ihn normalerweise feiern.",
    hi: "अपने पसंदीदा त्योहार के बारे में बताएं और आप उसे आमतौर पर कैसे मनाते हैं।",
  },
  question19: {
    en: "Describe a time you tried something new and how it went.",
    fr: "Décrivez une fois où vous avez essayé quelque chose de nouveau et comment cela s'est passé.",
    de: "Beschreiben Sie eine Situation, in der Sie etwas Neues ausprobiert haben, und wie es gelaufen ist.",
    hi: "किसी ऐसे समय के बारे में बताएं जब आपने कुछ नया आज़माया और वह कैसा रहा।",
  },
  question20: {
    en: "Tell me about your favorite way to spend a rainy day.",
    fr: "Parlez-moi de votre façon préférée de passer un jour de pluie.",
    de: "Erzählen Sie mir, wie Sie am liebsten einen Regentag verbringen.",
    hi: "बारिश के दिन बिताने का आपका पसंदीदा तरीका क्या है, बताएं।",
  },
  question21: {
    en: "Talk about a goal you're currently working toward.",
    fr: "Parlez d'un objectif sur lequel vous travaillez actuellement.",
    de: "Erzählen Sie von einem Ziel, auf das Sie derzeit hinarbeiten.",
    hi: "किसी ऐसे लक्ष्य के बारे में बताएं जिस पर आप अभी काम कर रहे हैं।",
  },
  question22: {
    en: "Describe your dream home, inside and out.",
    fr: "Décrivez la maison de vos rêves, à l'intérieur comme à l'extérieur.",
    de: "Beschreiben Sie Ihr Traumhaus, innen und außen.",
    hi: "अपने सपनों के घर के बारे में बताएं, अंदर और बाहर दोनों से।",
  },
  question23: {
    en: "Tell me about a friend you've known for a long time and how you met.",
    fr: "Parlez-moi d'un ami que vous connaissez depuis longtemps et de la façon dont vous vous êtes rencontrés.",
    de: "Erzählen Sie mir von einem Freund, den Sie schon lange kennen, und wie Sie sich kennengelernt haben.",
    hi: "किसी पुराने दोस्त के बारे में बताएं और आप दोनों कैसे मिले थे।",
  },
  question24: {
    en: "Talk about the last time you laughed really hard.",
    fr: "Parlez de la dernière fois où vous avez vraiment beaucoup ri.",
    de: "Erzählen Sie vom letzten Mal, als Sie richtig herzhaft gelacht haben.",
    hi: "आखिरी बार जब आप खूब हँसे थे, उस बारे में बताएं।",
  },
  question25: {
    en: "Describe your favorite restaurant and what you usually order.",
    fr: "Décrivez votre restaurant préféré et ce que vous commandez habituellement.",
    de: "Beschreiben Sie Ihr Lieblingsrestaurant und was Sie dort normalerweise bestellen.",
    hi: "अपने पसंदीदा रेस्टोरेंट के बारे में बताएं और आप वहाँ आमतौर पर क्या मंगाते हैं।",
  },
  question26: {
    en: "Tell me about a place you've always wanted to visit.",
    fr: "Parlez-moi d'un endroit que vous avez toujours voulu visiter.",
    de: "Erzählen Sie mir von einem Ort, den Sie schon immer besuchen wollten.",
    hi: "किसी ऐसी जगह के बारे में बताएं जहाँ आप हमेशा से जाना चाहते थे।",
  },
  question27: {
    en: "Talk about a tradition your family has that you enjoy.",
    fr: "Parlez d'une tradition familiale que vous appréciez.",
    de: "Erzählen Sie von einer Familientradition, die Ihnen gefällt.",
    hi: "अपने परिवार की किसी ऐसी परंपरा के बारे में बताएं जो आपको अच्छी लगती है।",
  },
  question28: {
    en: "Describe how you like to unwind after a long day.",
    fr: "Décrivez comment vous aimez vous détendre après une longue journée.",
    de: "Beschreiben Sie, wie Sie sich nach einem langen Tag gerne entspannen.",
    hi: "लंबे दिन के बाद आप आराम कैसे करते हैं, बताएं।",
  },
  question29: {
    en: "Tell me about a sport or physical activity you enjoy.",
    fr: "Parlez-moi d'un sport ou d'une activité physique que vous aimez.",
    de: "Erzählen Sie mir von einer Sportart oder körperlichen Aktivität, die Ihnen Spaß macht.",
    hi: "किसी ऐसे खेल या शारीरिक गतिविधि के बारे में बताएं जो आपको पसंद है।",
  },
  question30: {
    en: "Talk about the best gift you've ever received.",
    fr: "Parlez du meilleur cadeau que vous ayez jamais reçu.",
    de: "Erzählen Sie von dem besten Geschenk, das Sie je erhalten haben.",
    hi: "अब तक मिले सबसे अच्छे तोहफे के बारे में बताएं।",
  },
  question31: {
    en: "Describe your ideal way to spend a Sunday morning.",
    fr: "Décrivez votre façon idéale de passer un dimanche matin.",
    de: "Beschreiben Sie, wie Sie einen Sonntagmorgen am liebsten verbringen.",
    hi: "रविवार की सुबह बिताने का आपका पसंदीदा तरीका क्या है, बताएं।",
  },
  question32: {
    en: "Tell me about a time you helped someone and how it felt.",
    fr: "Parlez-moi d'une fois où vous avez aidé quelqu'un et de ce que vous avez ressenti.",
    de: "Erzählen Sie mir von einer Situation, in der Sie jemandem geholfen haben, und wie es sich angefühlt hat.",
    hi: "किसी ऐसे समय के बारे में बताएं जब आपने किसी की मदद की और आपको कैसा लगा।",
  },
  question33: {
    en: "Talk about a technology or gadget you couldn't live without.",
    fr: "Parlez d'une technologie ou d'un gadget dont vous ne pourriez pas vous passer.",
    de: "Erzählen Sie von einer Technologie oder einem Gadget, auf das Sie nicht verzichten könnten.",
    hi: "किसी ऐसी तकनीक या डिवाइस के बारे में बताएं जिसके बिना आप नहीं रह सकते।",
  },
  question34: {
    en: "Describe the view from your favorite window or spot at home.",
    fr: "Décrivez la vue depuis votre fenêtre ou votre coin préféré à la maison.",
    de: "Beschreiben Sie die Aussicht von Ihrem Lieblingsfenster oder -platz zu Hause.",
    hi: "अपने घर की पसंदीदा खिड़की या जगह से दिखने वाले नज़ारे के बारे में बताएं।",
  },
  question35: {
    en: "Tell me about a concert, show, or event you went to that you loved.",
    fr: "Parlez-moi d'un concert, d'un spectacle ou d'un événement que vous avez adoré.",
    de: "Erzählen Sie mir von einem Konzert, einer Show oder einem Event, das Ihnen sehr gefallen hat.",
    hi: "किसी ऐसे कॉन्सर्ट, शो या इवेंट के बारे में बताएं जो आपको बहुत पसंद आया।",
  },
  question36: {
    en: "Talk about something you're grateful for today.",
    fr: "Parlez de quelque chose pour lequel vous êtes reconnaissant aujourd'hui.",
    de: "Erzählen Sie von etwas, wofür Sie heute dankbar sind.",
    hi: "आज किसी ऐसी चीज़ के बारे में बताएं जिसके लिए आप आभारी हैं।",
  },
  question37: {
    en: "Describe your favorite childhood game or toy.",
    fr: "Décrivez votre jeu ou jouet préféré d'enfance.",
    de: "Beschreiben Sie Ihr Lieblingsspiel oder -spielzeug aus der Kindheit.",
    hi: "अपने बचपन के पसंदीदा खेल या खिलौने के बारे में बताएं।",
  },
  question38: {
    en: "Tell me about a recipe you make often, step by step.",
    fr: "Parlez-moi d'une recette que vous préparez souvent, étape par étape.",
    de: "Erzählen Sie mir Schritt für Schritt von einem Rezept, das Sie oft zubereiten.",
    hi: "किसी ऐसी रेसिपी के बारे में बताएं जो आप अक्सर बनाते हैं, चरण दर चरण।",
  },
  question39: {
    en: "Talk about a place that feels like home to you, even if it's not where you live.",
    fr: "Parlez d'un endroit qui vous semble être chez vous, même si ce n'est pas là où vous habitez.",
    de: "Erzählen Sie von einem Ort, der sich für Sie wie zu Hause anfühlt, auch wenn Sie nicht dort wohnen.",
    hi: "किसी ऐसी जगह के बारे में बताएं जो आपको घर जैसी लगती है, भले ही आप वहाँ न रहते हों।",
  },
  question40: {
    en: "Describe what a perfect day off looks like for you.",
    fr: "Décrivez à quoi ressemble une journée de congé parfaite pour vous.",
    de: "Beschreiben Sie, wie ein perfekter freier Tag für Sie aussieht.",
    hi: "आपके लिए एक आदर्श छुट्टी का दिन कैसा होता है, बताएं।",
  },
  question41: {
    en: "Tell me about someone who makes you laugh.",
    fr: "Parlez-moi de quelqu'un qui vous fait rire.",
    de: "Erzählen Sie mir von jemandem, der Sie zum Lachen bringt.",
    hi: "किसी ऐसे व्यक्ति के बारे में बताएं जो आपको हँसाता है।",
  },
  question42: {
    en: "Talk about a habit you're trying to build or break.",
    fr: "Parlez d'une habitude que vous essayez de créer ou d'arrêter.",
    de: "Erzählen Sie von einer Gewohnheit, die Sie sich aneignen oder abgewöhnen möchten.",
    hi: "किसी ऐसी आदत के बारे में बताएं जिसे आप बनाने या छोड़ने की कोशिश कर रहे हैं।",
  },
  question43: {
    en: "Describe your favorite way to exercise or stay active.",
    fr: "Décrivez votre façon préférée de faire de l'exercice ou de rester actif.",
    de: "Beschreiben Sie, wie Sie am liebsten Sport treiben oder aktiv bleiben.",
    hi: "व्यायाम करने या सक्रिय रहने का आपका पसंदीदा तरीका क्या है, बताएं।",
  },
  question44: {
    en: "Tell me about a time you faced a challenge and worked through it.",
    fr: "Parlez-moi d'une fois où vous avez fait face à un défi et l'avez surmonté.",
    de: "Erzählen Sie mir von einer Herausforderung, der Sie sich gestellt und die Sie gemeistert haben.",
    hi: "किसी ऐसी चुनौती के बारे में बताएं जिसका आपने सामना किया और उसे हल किया।",
  },
  question45: {
    en: "Talk about your favorite coffee shop, cafe, or place to relax.",
    fr: "Parlez de votre café préféré ou de votre endroit préféré pour vous détendre.",
    de: "Erzählen Sie von Ihrem Lieblingscafé oder Ihrem liebsten Ort zum Entspannen.",
    hi: "अपने पसंदीदा कैफ़े या आराम करने की जगह के बारे में बताएं।",
  },
  question46: {
    en: "Describe a smell or sound that brings back a strong memory.",
    fr: "Décrivez une odeur ou un son qui vous rappelle un souvenir fort.",
    de: "Beschreiben Sie einen Geruch oder Klang, der eine starke Erinnerung in Ihnen weckt.",
    hi: "किसी ऐसी खुशबू या आवाज़ के बारे में बताएं जो आपको कोई गहरी याद दिला देती है।",
  },
  question47: {
    en: "Tell me about the last trip you took, even a short one.",
    fr: "Parlez-moi du dernier voyage que vous avez fait, même court.",
    de: "Erzählen Sie mir von Ihrer letzten Reise, auch wenn sie kurz war.",
    hi: "अपनी आखिरी यात्रा के बारे में बताएं, भले ही वह छोटी रही हो।",
  },
  question48: {
    en: "Talk about something you're looking forward to this year.",
    fr: "Parlez de quelque chose que vous attendez avec impatience cette année.",
    de: "Erzählen Sie von etwas, auf das Sie sich dieses Jahr freuen.",
    hi: "इस साल किसी ऐसी चीज़ के बारे में बताएं जिसका आपको इंतज़ार है।",
  },
  question49: {
    en: "Describe your favorite piece of clothing and why you like it.",
    fr: "Décrivez votre vêtement préféré et pourquoi vous l'aimez.",
    de: "Beschreiben Sie Ihr Lieblingskleidungsstück und warum Sie es mögen.",
    hi: "अपने पसंदीदा कपड़े के बारे में बताएं और आपको वह क्यों पसंद है।",
  },
  question50: {
    en: "Tell me about a game you enjoy playing, with friends or alone.",
    fr: "Parlez-moi d'un jeu auquel vous aimez jouer, entre amis ou seul.",
    de: "Erzählen Sie mir von einem Spiel, das Sie gerne spielen, mit Freunden oder allein.",
    hi: "किसी ऐसे खेल के बारे में बताएं जो आप दोस्तों के साथ या अकेले खेलना पसंद करते हैं।",
  },
  question51: {
    en: "Talk about a city you'd love to live in someday.",
    fr: "Parlez d'une ville où vous aimeriez vivre un jour.",
    de: "Erzählen Sie von einer Stadt, in der Sie eines Tages gerne leben würden.",
    hi: "किसी ऐसे शहर के बारे में बताएं जहाँ आप कभी बसना चाहेंगे।",
  },
  question52: {
    en: "Describe your morning coffee or tea ritual.",
    fr: "Décrivez votre rituel du café ou du thé le matin.",
    de: "Beschreiben Sie Ihr Morgenritual mit Kaffee oder Tee.",
    hi: "सुबह की चाय या कॉफ़ी की अपनी आदत के बारे में बताएं।",
  },
  question53: {
    en: "Tell me about a lesson you learned the hard way.",
    fr: "Parlez-moi d'une leçon que vous avez apprise à vos dépens.",
    de: "Erzählen Sie mir von einer Lektion, die Sie auf die harte Tour gelernt haben.",
    hi: "किसी ऐसे सबक के बारे में बताएं जो आपने मुश्किल तरीके से सीखा।",
  },
  question54: {
    en: "Talk about your favorite way to spend time outdoors.",
    fr: "Parlez de votre façon préférée de passer du temps à l'extérieur.",
    de: "Erzählen Sie, wie Sie am liebsten Zeit im Freien verbringen.",
    hi: "बाहर समय बिताने का आपका पसंदीदा तरीका क्या है, बताएं।",
  },
  question55: {
    en: "Describe a meal you cooked that turned out really well.",
    fr: "Décrivez un repas que vous avez cuisiné et qui a très bien réussi.",
    de: "Beschreiben Sie ein Gericht, das Sie gekocht haben und das richtig gut gelungen ist.",
    hi: "किसी ऐसे खाने के बारे में बताएं जो आपने बनाया और वह बहुत अच्छा बना।",
  },
  question56: {
    en: "Tell me about a podcast or show you've been listening to lately.",
    fr: "Parlez-moi d'un podcast ou d'une émission que vous écoutez en ce moment.",
    de: "Erzählen Sie mir von einem Podcast oder einer Sendung, die Sie zuletzt gehört haben.",
    hi: "किसी ऐसे पॉडकास्ट या शो के बारे में बताएं जो आप आजकल सुन रहे हैं।",
  },
  question57: {
    en: "Talk about a childhood memory that still makes you smile.",
    fr: "Parlez d'un souvenir d'enfance qui vous fait encore sourire.",
    de: "Erzählen Sie von einer Kindheitserinnerung, die Sie noch heute zum Lächeln bringt.",
    hi: "अपने बचपन की किसी ऐसी याद के बारे में बताएं जो आज भी आपको मुस्कुरा देती है।",
  },
  question58: {
    en: "Describe your ideal vacation destination and what you'd do there.",
    fr: "Décrivez votre destination de vacances idéale et ce que vous y feriez.",
    de: "Beschreiben Sie Ihr ideales Urlaubsziel und was Sie dort tun würden.",
    hi: "अपनी आदर्श छुट्टी की जगह के बारे में बताएं और वहाँ आप क्या करेंगे।",
  },
  question59: {
    en: "Tell me about a project you're proud of, at work or at home.",
    fr: "Parlez-moi d'un projet dont vous êtes fier, au travail ou à la maison.",
    de: "Erzählen Sie mir von einem Projekt, auf das Sie stolz sind, beruflich oder privat.",
    hi: "किसी ऐसे काम या प्रोजेक्ट के बारे में बताएं जिस पर आपको गर्व है।",
  },
  question60: {
    en: "Talk about how you met your best friend.",
    fr: "Parlez de la façon dont vous avez rencontré votre meilleur ami.",
    de: "Erzählen Sie, wie Sie Ihren besten Freund kennengelernt haben.",
    hi: "आप अपने सबसे अच्छे दोस्त से कैसे मिले, उस बारे में बताएं।",
  },
  question61: {
    en: "Describe a plant, garden, or outdoor space you enjoy.",
    fr: "Décrivez une plante, un jardin ou un espace extérieur que vous appréciez.",
    de: "Beschreiben Sie eine Pflanze, einen Garten oder einen Außenbereich, den Sie mögen.",
    hi: "किसी ऐसे पौधे, बगीचे या बाहरी जगह के बारे में बताएं जो आपको पसंद है।",
  },
  question62: {
    en: "Tell me about your favorite time of day and why.",
    fr: "Parlez-moi de votre moment préféré de la journée et pourquoi.",
    de: "Erzählen Sie mir von Ihrer Lieblingstageszeit und warum.",
    hi: "दिन के अपने पसंदीदा समय के बारे में बताएं और वह क्यों खास है।",
  },
  question63: {
    en: "Talk about a craft or creative hobby you enjoy.",
    fr: "Parlez d'un artisanat ou d'un loisir créatif que vous aimez.",
    de: "Erzählen Sie von einem Handwerk oder kreativen Hobby, das Ihnen Spaß macht.",
    hi: "किसी ऐसे शिल्प या रचनात्मक शौक के बारे में बताएं जो आपको पसंद है।",
  },
  question64: {
    en: "Describe the last celebration or party you attended.",
    fr: "Décrivez la dernière fête ou célébration à laquelle vous avez assisté.",
    de: "Beschreiben Sie die letzte Feier oder Party, auf der Sie waren.",
    hi: "आखिरी बार जिस जश्न या पार्टी में आप गए, उस बारे में बताएं।",
  },
  question65: {
    en: "Tell me about a piece of advice that's stuck with you.",
    fr: "Parlez-moi d'un conseil qui vous est resté en mémoire.",
    de: "Erzählen Sie mir von einem Ratschlag, der Ihnen im Gedächtnis geblieben ist.",
    hi: "किसी ऐसी सलाह के बारे में बताएं जो आपके ज़हन में रह गई।",
  },
  question66: {
    en: "Talk about your favorite way to travel, by car, train, or plane.",
    fr: "Parlez de votre façon préférée de voyager, en voiture, en train ou en avion.",
    de: "Erzählen Sie von Ihrer liebsten Art zu reisen, mit dem Auto, dem Zug oder dem Flugzeug.",
    hi: "यात्रा करने का आपका पसंदीदा तरीका क्या है, कार, ट्रेन या हवाई जहाज़ से।",
  },
  question67: {
    en: "Describe a comfort food you turn to when you need cheering up.",
    fr: "Décrivez un plat réconfortant vers lequel vous vous tournez quand vous avez besoin d'être réconforté.",
    de: "Beschreiben Sie ein Trostessen, zu dem Sie greifen, wenn Sie aufgemuntert werden müssen.",
    hi: "किसी ऐसे खाने के बारे में बताएं जो मन खराब होने पर आपको अच्छा महसूस कराता है।",
  },
  question68: {
    en: "Tell me about a hobby from your childhood you still think about.",
    fr: "Parlez-moi d'un loisir de votre enfance auquel vous pensez encore.",
    de: "Erzählen Sie mir von einem Hobby aus Ihrer Kindheit, an das Sie noch oft denken.",
    hi: "बचपन के किसी ऐसे शौक के बारे में बताएं जिसके बारे में आप अब भी सोचते हैं।",
  },
  question69: {
    en: "Talk about a place you go to think or clear your head.",
    fr: "Parlez d'un endroit où vous allez pour réfléchir ou vous changer les idées.",
    de: "Erzählen Sie von einem Ort, an den Sie gehen, um nachzudenken oder den Kopf freizubekommen.",
    hi: "किसी ऐसी जगह के बारे में बताएं जहाँ आप सोचने या दिमाग शांत करने जाते हैं।",
  },
  question70: {
    en: "Describe your relationship with your siblings or closest relatives.",
    fr: "Décrivez votre relation avec vos frères et sœurs ou vos proches.",
    de: "Beschreiben Sie Ihre Beziehung zu Ihren Geschwistern oder engsten Verwandten.",
    hi: "अपने भाई-बहनों या करीबी रिश्तेदारों के साथ अपने रिश्ते के बारे में बताएं।",
  },
  question71: {
    en: "Tell me about the weather where you live and how it changes through the year.",
    fr: "Parlez-moi du climat de votre région et de la façon dont il change au fil de l'année.",
    de: "Erzählen Sie mir vom Wetter dort, wo Sie leben, und wie es sich über das Jahr verändert.",
    hi: "आप जहाँ रहते हैं वहाँ के मौसम के बारे में बताएं और साल भर में वह कैसे बदलता है।",
  },
  question72: {
    en: "Talk about a show or series you binge-watched recently.",
    fr: "Parlez d'une série que vous avez récemment regardée d'une traite.",
    de: "Erzählen Sie von einer Serie, die Sie kürzlich am Stück durchgeschaut haben.",
    hi: "किसी ऐसे शो या सीरीज़ के बारे में बताएं जिसे आपने हाल ही में लगातार देखा।",
  },
  question73: {
    en: "Describe your favorite way to celebrate a birthday.",
    fr: "Décrivez votre façon préférée de fêter un anniversaire.",
    de: "Beschreiben Sie, wie Sie am liebsten Geburtstag feiern.",
    hi: "जन्मदिन मनाने का आपका पसंदीदा तरीका क्या है, बताएं।",
  },
  question74: {
    en: "Tell me about a new habit that's made your days better.",
    fr: "Parlez-moi d'une nouvelle habitude qui a amélioré vos journées.",
    de: "Erzählen Sie mir von einer neuen Gewohnheit, die Ihre Tage besser gemacht hat.",
    hi: "किसी ऐसी नई आदत के बारे में बताएं जिसने आपके दिनों को बेहतर बनाया।",
  },
  question75: {
    en: "Talk about a time you reconnected with an old friend.",
    fr: "Parlez d'une fois où vous avez renoué avec un vieil ami.",
    de: "Erzählen Sie von einer Situation, in der Sie wieder Kontakt zu einem alten Freund aufgenommen haben.",
    hi: "किसी ऐसे समय के बारे में बताएं जब आप किसी पुराने दोस्त से दोबारा जुड़े।",
  },
  question76: {
    en: "Describe your go-to order at a coffee shop or restaurant.",
    fr: "Décrivez votre commande habituelle dans un café ou un restaurant.",
    de: "Beschreiben Sie Ihre übliche Bestellung in einem Café oder Restaurant.",
    hi: "कैफ़े या रेस्टोरेंट में आप आमतौर पर क्या मंगाते हैं, बताएं।",
  },
  question77: {
    en: "Tell me about something you collect or used to collect.",
    fr: "Parlez-moi de quelque chose que vous collectionnez ou collectionniez.",
    de: "Erzählen Sie mir von etwas, das Sie sammeln oder früher gesammelt haben.",
    hi: "किसी ऐसी चीज़ के बारे में बताएं जो आप इकट्ठा करते हैं या करते थे।",
  },
  question78: {
    en: "Talk about your favorite season of the year and what makes it special.",
    fr: "Parlez de votre saison préférée de l'année et de ce qui la rend spéciale.",
    de: "Erzählen Sie von Ihrer Lieblingsjahreszeit und was sie besonders macht.",
    hi: "साल के अपने पसंदीदा मौसम के बारे में बताएं और उसमें क्या खास है।",
  },
  question79: {
    en: "Describe a walk or hike you've taken that you remember well.",
    fr: "Décrivez une promenade ou une randonnée dont vous vous souvenez bien.",
    de: "Beschreiben Sie einen Spaziergang oder eine Wanderung, an die Sie sich gut erinnern.",
    hi: "किसी ऐसी सैर या ट्रेक के बारे में बताएं जो आपको अच्छी तरह याद है।",
  },
  question80: {
    en: "Tell me about a family recipe that's been passed down.",
    fr: "Parlez-moi d'une recette familiale transmise de génération en génération.",
    de: "Erzählen Sie mir von einem Familienrezept, das weitergegeben wurde.",
    hi: "परिवार की किसी ऐसी रेसिपी के बारे में बताएं जो पीढ़ी दर पीढ़ी चली आ रही है।",
  },
  question81: {
    en: "Talk about something new you tried this year.",
    fr: "Parlez de quelque chose de nouveau que vous avez essayé cette année.",
    de: "Erzählen Sie von etwas Neuem, das Sie dieses Jahr ausprobiert haben.",
    hi: "इस साल आपने जो कुछ नया आज़माया, उसके बारे में बताएं।",
  },
  question82: {
    en: "Describe your favorite spot in your home.",
    fr: "Décrivez votre endroit préféré dans votre maison.",
    de: "Beschreiben Sie Ihren Lieblingsplatz in Ihrem Zuhause.",
    hi: "अपने घर की पसंदीदा जगह के बारे में बताएं।",
  },
  question83: {
    en: "Tell me about a trip you're planning or hoping to take.",
    fr: "Parlez-moi d'un voyage que vous prévoyez ou espérez faire.",
    de: "Erzählen Sie mir von einer Reise, die Sie planen oder gerne machen würden.",
    hi: "किसी ऐसी यात्रा के बारे में बताएं जिसकी आप योजना बना रहे हैं या जाना चाहते हैं।",
  },
  question84: {
    en: "Talk about a song that always puts you in a good mood.",
    fr: "Parlez d'une chanson qui vous met toujours de bonne humeur.",
    de: "Erzählen Sie von einem Lied, das Sie immer gut gelaunt macht.",
    hi: "किसी ऐसे गाने के बारे में बताएं जो आपका मूड हमेशा अच्छा कर देता है।",
  },
  question85: {
    en: "Describe a typical Saturday for you.",
    fr: "Décrivez un samedi typique pour vous.",
    de: "Beschreiben Sie einen typischen Samstag für Sie.",
    hi: "अपने एक सामान्य शनिवार के बारे में बताएं।",
  },
  question86: {
    en: "Tell me about someone in your life who inspires you.",
    fr: "Parlez-moi de quelqu'un dans votre vie qui vous inspire.",
    de: "Erzählen Sie mir von jemandem in Ihrem Leben, der Sie inspiriert.",
    hi: "अपनी ज़िंदगी में किसी ऐसे व्यक्ति के बारे में बताएं जो आपको प्रेरित करता है।",
  },
  question87: {
    en: "Talk about a hobby you picked up as an adult.",
    fr: "Parlez d'un loisir que vous avez adopté à l'âge adulte.",
    de: "Erzählen Sie von einem Hobby, das Sie als Erwachsener angefangen haben.",
    hi: "किसी ऐसे शौक के बारे में बताएं जो आपने बड़े होने के बाद शुरू किया।",
  },
  question88: {
    en: "Describe your favorite way to spend time with family.",
    fr: "Décrivez votre façon préférée de passer du temps en famille.",
    de: "Beschreiben Sie, wie Sie am liebsten Zeit mit der Familie verbringen.",
    hi: "परिवार के साथ समय बिताने का आपका पसंदीदा तरीका क्या है, बताएं।",
  },
  question89: {
    en: "Tell me about the last time you tried a new restaurant.",
    fr: "Parlez-moi de la dernière fois que vous avez essayé un nouveau restaurant.",
    de: "Erzählen Sie mir vom letzten Mal, als Sie ein neues Restaurant ausprobiert haben.",
    hi: "आखिरी बार जब आपने किसी नए रेस्टोरेंट में खाना खाया, उस बारे में बताएं।",
  },
  question90: {
    en: "Talk about a place from your childhood you'd like to visit again.",
    fr: "Parlez d'un lieu de votre enfance que vous aimeriez revisiter.",
    de: "Erzählen Sie von einem Ort aus Ihrer Kindheit, den Sie gerne wieder besuchen würden.",
    hi: "बचपन की किसी ऐसी जगह के बारे में बताएं जहाँ आप दोबारा जाना चाहेंगे।",
  },
  question91: {
    en: "Describe how you usually spend your lunch break.",
    fr: "Décrivez comment vous passez habituellement votre pause déjeuner.",
    de: "Beschreiben Sie, wie Sie Ihre Mittagspause normalerweise verbringen.",
    hi: "आप आमतौर पर अपना लंच ब्रेक कैसे बिताते हैं, बताएं।",
  },
  question92: {
    en: "Tell me about a skill or talent you're proud of.",
    fr: "Parlez-moi d'une compétence ou d'un talent dont vous êtes fier.",
    de: "Erzählen Sie mir von einer Fähigkeit oder einem Talent, auf das Sie stolz sind.",
    hi: "किसी ऐसे हुनर या प्रतिभा के बारे में बताएं जिस पर आपको गर्व है।",
  },
  question93: {
    en: "Talk about your favorite thing to do on vacation.",
    fr: "Parlez de votre activité préférée en vacances.",
    de: "Erzählen Sie von Ihrer Lieblingsbeschäftigung im Urlaub.",
    hi: "छुट्टियों में करने की आपकी पसंदीदा चीज़ के बारे में बताएं।",
  },
  question94: {
    en: "Describe the last book, article, or story that made you think.",
    fr: "Décrivez le dernier livre, article ou histoire qui vous a fait réfléchir.",
    de: "Beschreiben Sie das letzte Buch, den letzten Artikel oder die letzte Geschichte, die Sie zum Nachdenken gebracht hat.",
    hi: "आखिरी किताब, लेख या कहानी के बारे में बताएं जिसने आपको सोचने पर मजबूर किया।",
  },
  question95: {
    en: "Tell me about a routine you have that keeps you grounded.",
    fr: "Parlez-moi d'une routine qui vous aide à rester ancré.",
    de: "Erzählen Sie mir von einer Routine, die Ihnen Halt gibt.",
    hi: "किसी ऐसी दिनचर्या के बारे में बताएं जो आपको संतुलित रखती है।",
  },
  question96: {
    en: "Talk about a moment this week that made you happy.",
    fr: "Parlez d'un moment cette semaine qui vous a rendu heureux.",
    de: "Erzählen Sie von einem Moment diese Woche, der Sie glücklich gemacht hat.",
    hi: "इस हफ्ते के किसी ऐसे पल के बारे में बताएं जिसने आपको खुश किया।",
  },
  question97: {
    en: "Describe a place you feel most relaxed.",
    fr: "Décrivez un endroit où vous vous sentez le plus détendu.",
    de: "Beschreiben Sie einen Ort, an dem Sie sich am meisten entspannen.",
    hi: "किसी ऐसी जगह के बारे में बताएं जहाँ आप सबसे ज़्यादा सहज महसूस करते हैं।",
  },
  question98: {
    en: "Tell me about your favorite way to spend an evening at home.",
    fr: "Parlez-moi de votre façon préférée de passer une soirée à la maison.",
    de: "Erzählen Sie mir, wie Sie am liebsten einen Abend zu Hause verbringen.",
    hi: "घर पर शाम बिताने का आपका पसंदीदा तरीका क्या है, बताएं।",
  },
  question99: {
    en: "Talk about something you're curious about and would like to learn more.",
    fr: "Parlez de quelque chose qui vous intrigue et que vous aimeriez approfondir.",
    de: "Erzählen Sie von etwas, das Sie neugierig macht und worüber Sie gerne mehr erfahren würden.",
    hi: "किसी ऐसी चीज़ के बारे में बताएं जिसके बारे में आप जिज्ञासु हैं और और जानना चाहते हैं।",
  },
  question100: {
    en: "Describe a recent conversation that stuck with you.",
    fr: "Décrivez une conversation récente qui vous est restée en mémoire.",
    de: "Beschreiben Sie ein kürzliches Gespräch, das Ihnen im Gedächtnis geblieben ist.",
    hi: "हाल की किसी ऐसी बातचीत के बारे में बताएं जो आपके ज़हन में रह गई।",
  },
  pressAndHold: {
    en: "Press and hold to record your answer",
    fr: "Appuyez et maintenez pour enregistrer votre réponse",
    de: "Halten Sie gedrückt, um Ihre Antwort aufzunehmen",
    hi: "अपना जवाब रिकॉर्ड करने के लिए दबाकर रखें",
  },
  clickToStart: {
    en: "Click here to start",
    fr: "Cliquez ici pour commencer",
    de: "Klicken Sie hier, um zu beginnen",
    hi: "शुरू करने के लिए यहां क्लिक करें",
  },
  recording: {
    en: "Recording...",
    fr: "Enregistrement...",
    de: "Aufnahme läuft...",
    hi: "रिकॉर्डिंग...",
  },
  releaseWhenDone: {
    en: "Release when done",
    fr: "Relâchez une fois terminé",
    de: "Loslassen, wenn fertig",
    hi: "पूरा होने पर छोड़ें",
  },
  clickWhenDone: {
    en: "Click when done",
    fr: "Cliquez une fois terminé",
    de: "Klicken Sie, wenn fertig",
    hi: "पूरा होने पर क्लिक करें",
  },
  nextQuestionIn: {
    en: "Next question in",
    fr: "Prochaine question dans",
    de: "Nächste Frage in",
    hi: "अगला प्रश्न",
  },
  completingIn: {
    en: "Completing in",
    fr: "Finalisation dans",
    de: "Abschluss in",
    hi: "पूर्ण हो रहा है",
  },
  pressRecordToAddMore: {
    en: "Press record to add more",
    fr: "Appuyez sur enregistrer pour ajouter plus",
    de: "Drücken Sie auf Aufnahme, um mehr hinzuzufügen",
    hi: "और जोड़ने के लिए रिकॉर्ड दबाएं",
  },
  processingResponses: {
    en: "Processing your responses...",
    fr: "Traitement de vos réponses...",
    de: "Ihre Antworten werden verarbeitet...",
    hi: "आपके जवाबों को संसाधित किया जा रहा है...",
  },
  questionOf: {
    en: "Question",
    fr: "Question",
    de: "Frage",
    hi: "प्रश्न",
  },
  of: {
    en: "of",
    fr: "sur",
    de: "von",
    hi: "का",
  },

  // Analysis
  analysisTitle: {
    en: "Running Voice Analysis",
    fr: "Analyse vocale en cours",
    de: "Sprachanalyse läuft",
    hi: "वॉइस विश्लेषण चल रहा है",
  },

  // Results - Negative (Cyan)
  negativeHeadline: {
    en: "NEGATIVE",
    fr: "NÉGATIF",
    de: "NEGATIV",
    hi: "नकारात्मक",
  },
  negativeResult: {
    en: "No clinical indicators detected.",
    fr: "Aucun indicateur clinique détecté.",
    de: "Keine klinischen Indikatoren festgestellt.",
    hi: "कोई नैदानिक संकेतक नहीं पाए गए।",
  },

  // Results - Positive (Amber)
  positiveHeadline: {
    en: "POSITIVE",
    fr: "POSITIF",
    de: "POSITIV",
    hi: "सकारात्मक",
  },
  positiveResult: {
    en: "Acoustic biomarkers suggest a need for follow-up. Please consult a healthcare provider.",
    fr: "Les biomarqueurs acoustiques suggèrent un suivi nécessaire. Veuillez consulter un professionnel de santé.",
    de: "Akustische Biomarker deuten auf eine Nachuntersuchung hin. Bitte wenden Sie sich an eine medizinische Fachkraft.",
    hi: "ध्वनि बायोमार्कर अनुवर्ती जांच का सुझाव देते हैं। कृपया किसी स्वास्थ्य सेवा प्रदाता से परामर्श करें।",
  },

  // Result page
  screeningResult: {
    en: "Wellness Check",
    fr: "Bilan de bien-être",
    de: "Wellness-Check",
    hi: "वेलनेस जांच",
  },
  basedOnVocalAnalysis: {
    en: "Based on vocal biomarker analysis",
    fr: "Basé sur l'analyse des biomarqueurs vocaux",
    de: "Basierend auf der Analyse vokaler Biomarker",
    hi: "आवाज बायोमार्कर विश्लेषण के आधार पर",
  },
  biometricResults: {
    en: "Biometric Results",
    fr: "Résultats biométriques",
    de: "Biometrische Ergebnisse",
    hi: "बायोमेट्रिक परिणाम",
  },
  biomarkerNote: {
    en: "Note: We analyze over 1,000 voice biomarkers. The markers shown here are a small subset that are easiest to interpret and most influential in your result.",
    fr: "Remarque : Nous analysons plus de 1 000 biomarqueurs vocaux. Les marqueurs présentés ici sont un petit sous-ensemble, les plus faciles à interpréter et les plus influents dans votre résultat.",
    de: "Hinweis: Wir analysieren über 1.000 stimmliche Biomarker. Die hier gezeigten Marker sind eine kleine Teilmenge, die am einfachsten zu interpretieren und für Ihr Ergebnis am einflussreichsten ist.",
    hi: "नोट: हम 1,000 से अधिक आवाज बायोमार्करों का विश्लेषण करते हैं। यहां दिखाए गए मार्कर एक छोटा उपसमूह हैं जो सबसे आसानी से समझे जा सकते हैं।",
  },
  standardMonitoring: {
    en: "Standard Monitoring",
    fr: "Surveillance standard",
    de: "Standardüberwachung",
    hi: "मानक निगरानी",
  },
  biomarkersOptimal: {
    en: "Your biomarkers are within optimal range",
    fr: "Vos biomarqueurs sont dans la plage optimale",
    de: "Ihre Biomarker liegen im optimalen Bereich",
    hi: "आपके बायोमार्कर इष्टतम सीमा में हैं",
  },
  setReminder: {
    en: "Set Reminder",
    fr: "Définir un rappel",
    de: "Erinnerung festlegen",
    hi: "रिमाइंडर सेट करें",
  },
  viewDetailedAnalysis: {
    en: "View Detailed Analysis →",
    fr: "Voir l'analyse détaillée →",
    de: "Detaillierte Analyse ansehen →",
    hi: "विस्तृत विश्लेषण देखें →",
  },
  startNewScreening: {
    en: "← Start New Screening",
    fr: "← Commencer un nouveau bilan",
    de: "← Neue Untersuchung starten",
    hi: "← नई जांच शुरू करें",
  },
  connectWithCare: {
    en: "Connect with Care",
    fr: "Se connecter avec un soignant",
    de: "Mit medizinischer Betreuung verbinden",
    hi: "स्वास्थ्य सेवा से जुड़ें",
  },
  requestSent: {
    en: "Request Sent",
    fr: "Demande envoyée",
    de: "Anfrage gesendet",
    hi: "अनुरोध भेजा गया",
  },
  clinicalReviewRecommended: {
    en: "CLINICAL REVIEW RECOMMENDED",
    fr: "EXAMEN CLINIQUE RECOMMANDÉ",
    de: "KLINISCHE ÜBERPRÜFUNG EMPFOHLEN",
    hi: "नैदानिक समीक्षा की सिफारिश",
  },
  requestConfirmed: {
    en: "REQUEST CONFIRMED",
    fr: "DEMANDE CONFIRMÉE",
    de: "ANFRAGE BESTÄTIGT",
    hi: "अनुरोध की पुष्टि",
  },
  careCoordinatorContact: {
    en: "A Care Coordinator from Harmonic Health will contact you within 24 hours.",
    fr: "Un coordinateur de soins de Harmonic Health vous contactera sous 24 heures.",
    de: "Ein Care Coordinator von Harmonic Health wird Sie innerhalb von 24 Stunden kontaktieren.",
    hi: "Harmonic Health से एक केयर कोऑर्डिनेटर 24 घंटे के भीतर आपसे संपर्क करेगा।",
  },
  audioQualityInsufficient: {
    en: "AUDIO QUALITY INSUFFICIENT",
    fr: "QUALITÉ AUDIO INSUFFISANTE",
    de: "AUDIOQUALITÄT UNZUREICHEND",
    hi: "ऑडियो गुणवत्ता अपर्याप्त",
  },
  recaptureAudioSample: {
    en: "Recapture Audio Sample",
    fr: "Reprendre l'échantillon audio",
    de: "Audioprobe erneut aufnehmen",
    hi: "ऑडियो नमूना फिर से लें",
  },

  // Step labels
  stepOf: {
    en: "Step",
    fr: "Étape",
    de: "Schritt",
    hi: "चरण",
  },

  // Navigation
  back: {
    en: "BACK",
    fr: "RETOUR",
    de: "ZURÜCK",
    hi: "पीछे",
  },

  // Analysis failed
  analysisFailed: {
    en: "Analysis could not be completed. Please try again.",
    fr: "L'analyse n'a pas pu être terminée. Veuillez réessayer.",
    de: "Die Analyse konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.",
    hi: "विश्लेषण पूरा नहीं हो सका। कृपया पुनः प्रयास करें।",
  },
  tryAgain: {
    en: "Try Again",
    fr: "Réessayer",
    de: "Erneut versuchen",
    hi: "पुनः प्रयास करें",
  },
} as const;

/**
 * Get translated string for the given key and language
 */
export function t(key: TranslationKey, lang: Language): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry.en;
}

const QUESTION_POOL_KEYS: TranslationKey[] = Array.from(
  { length: 100 },
  (_, i) => `question${i + 1}` as TranslationKey
);

function shuffledQuestionKeys(): TranslationKey[] {
  const shuffled = [...QUESTION_POOL_KEYS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get a randomized set of 3 questions (no repeats) from the question pool, in the
 * given language. Each call reshuffles, so different sessions get different prompts.
 */
export function getQuestions(lang: Language): string[] {
  return shuffledQuestionKeys().slice(0, 3).map((key) => t(key, lang));
}

/**
 * Get the entire question pool, shuffled, translated. Used so a capture flow can
 * draw a fresh replacement question (one not already in use) if a recording didn't
 * capture enough speech and needs to be re-asked.
 */
export function getQuestionPool(lang: Language): string[] {
  return shuffledQuestionKeys().map((key) => t(key, lang));
}
