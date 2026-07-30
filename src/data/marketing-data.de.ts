/** German marketing copy for locale === "de" */

export const heroStatsDe = [
  { value: "500k+", label: "Emissionsfaktor-Einträge" },
  { value: "12.450", label: "tCO₂e diesen Monat verarbeitet" },
  { value: "97%", label: "Reduktion der Berichtszeit" },
  { value: "16", label: "Unterstützte EU-Rahmenwerke" },
];

export const howItWorksStepsDe = [
  {
    step: "01",
    title: "Datenquellen verbinden",
    description:
      "Schließen Sie SAP, Oracle, CSV-Exporte, PDF-Rechnungen und Bank-APIs an. Qlimwelt normalisiert alles automatisch in ein Emissionsledger.",
    items: ["SAP / Oracle ERP", "CSV- & Excel-Uploads", "PDF-Rechnungsextraktion", "Bank-Transaktions-APIs"],
  },
  {
    step: "02",
    title: "KI berechnet jede Emission",
    description:
      "Unsere Engine matched Aktivitätsdaten mit über 500.000 Emissionsfaktoren und kategorisiert Scope 1, 2 und 3 mit Audit-Trail und Konfidenzwerten.",
    scopes: [
      { name: "Scope 1", progress: 100 },
      { name: "Scope 2", progress: 100 },
      { name: "Scope 3", progress: 87 },
    ],
  },
  {
    step: "03",
    title: "CSRD-Bericht erstellen",
    description:
      "Ein-Klick-Erzeugung von ESRS-E1-Klimaangaben, S1-Kennzahlen und EU-Taxonomie-Checkliste — audit-bereit in Stunden.",
    items: ["ESRS E1 Klimawandel", "ESRS S1 Eigene Belegschaft", "EU-Taxonomie-Checkliste", "Bereit für Drittprüfungen"],
  },
];

export const platformFeaturesDe = [
  {
    num: "01",
    title: "Automatisierte CO₂-Buchhaltung",
    description:
      "Rechnungen, ERP-Exporte und Energieabrechnungen einlesen. KI klassifiziert und berechnet Emissionen ohne manuelle Erfassung.",
  },
  {
    num: "02",
    title: "CSRD- & GRI-Berichte in Stunden",
    description:
      "Audit-bereite ESRS-Angaben, GRI-Standards und EU-Taxonomie-Dokumente mit einem Klick erzeugen.",
  },
  {
    num: "03",
    title: "Konversationelle Klima-Intelligenz",
    description:
      "Fragen Sie Ihre Emissionsdaten in Alltagssprache. Qlim AI versteht Scope-3-Treiber, Compliance-Lücken und Reduktionsszenarien.",
  },
  {
    num: "04",
    title: "Lieferanten-Emissionen tracken",
    description:
      "Primärdaten von Lieferanten anfordern, erfassen und bewerten. Hochrisiko-Lieferanten erkennen, bevor sie Ihre CSRD-Angabe belasten.",
  },
  {
    num: "05",
    title: "Regulatorische Fristen überwachen",
    description:
      "Verpassen Sie keine CSRD-, CBAM- oder EU-Taxonomie-Frist. Autonome Agenten tracken Änderungen und alarmieren Ihr Team.",
  },
  {
    num: "06",
    title: "Reduktions-Szenarien modellieren",
    description:
      "Flottenelektrifizierung, erneuerbare PPAs und Lieferantenprogramme mit ROI und tCO₂e-Wirkung modellieren.",
  },
];

export const pricingPlansDe = [
  {
    name: "STARTER",
    price: "€299",
    period: "/Mon.",
    description: "Für KMU am Beginn der Nachhaltigkeitsreise",
    features: ["Bis zu 3 Nutzer", "Scope 1 & 2 Tracking", "Basis-CSRD-Vorlagen", "E-Mail-Support"],
    cta: "Jetzt starten",
    highlighted: false,
  },
  {
    name: "GROWTH",
    price: "€799",
    period: "/Mon.",
    description: "Für Mid-Market-Teams mit CSRD-Pflichten",
    features: [
      "Bis zu 15 Nutzer",
      "Scope 1, 2 & 3 Tracking",
      "Vollständige ESRS-CSRD-Berichte",
      "Qlim-AI-Zugang",
      "Lieferantendaten-Anfragen",
      "Priority-Support",
    ],
    cta: "Kostenlos testen",
    highlighted: true,
    badge: "BELIEBTESTE WAHL",
  },
  {
    name: "ENTERPRISE",
    price: "Individuell",
    period: "",
    description: "Für komplexe Organisationen und Konzernstrukturen",
    features: [
      "Unbegrenzte Nutzer",
      "Vollständiger API-Zugang",
      "SSO / SAML",
      "Individuelle Datenkonnektoren",
      "Dedizierter CSM",
      "SLA-Garantie",
    ],
    cta: "Vertrieb kontaktieren",
    highlighted: false,
  },
];

export const storyCardsDe = [
  {
    stat: "80%",
    label: "DAS PROBLEM",
    text: "Nachhaltigkeitsteams verbringen 80 % der Zeit mit Datensammeln und -bereinigen — nur 20 % bleiben für Analyse und Strategie.",
  },
  {
    stat: "→KI",
    label: "UNSER ANSATZ",
    text: "Wir automatisieren die 80 % mit LLMs und strukturierter Extraktion. Rechnungen, PDFs und ERP-Exporte werden automatisch zu sauberen Emissionsdaten.",
  },
  {
    stat: "100%",
    label: "DAS ERGEBNIS",
    text: "Audit-bereite Genauigkeit mit vollständiger Datenherkunft. Prüfer können jede Tonne CO₂ bis zum Quelldokument zurückverfolgen.",
  },
];

export const carbonFootprintTopicsDe = [
  {
    id: "scope-1",
    tag: "SCOPE 1 // DIREKT",
    title: "Direkte Emissionen unter Ihrer Kontrolle",
    description:
      "Verbrennung in Kesseln, Firmenfahrzeugen, Kältemittellecks und industriellen Prozessen vor Ort — aus Quellen, die Ihr Unternehmen besitzt oder betreibt.",
    share: "9%",
    shareLabel: "Typischer Mid-Market-Anteil",
    accent: "#334155",
    examples: ["Fuhrpark Diesel & Benzin", "Erdgasheizung", "F-Gas-Kältemittel", "Prozess- & diffuse Emissionen"],
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Industrieanlage mit Emissionsüberwachung",
  },
  {
    id: "scope-2",
    tag: "SCOPE 2 // ENERGIE",
    title: "Bezogener Strom & Wärme",
    description:
      "Indirekte Emissionen aus Strom, Dampf, Heizung und Kühlung für Ihren Betrieb. Standort- und marktbezogene Methoden sind für CSRD relevant.",
    share: "16%",
    shareLabel: "Typischer Mid-Market-Anteil",
    accent: "#22c55e",
    examples: ["Netzstrom", "Fernwärme", "Erneuerbare PPAs", "Prozessdampf"],
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Solarpaneele für erneuerbaren Strom",
  },
  {
    id: "scope-3",
    tag: "SCOPE 3 // WERTSCHÖPFUNGSKETTE",
    title: "Alles vor- und nachgelagert",
    description:
      "Die gesamte Wertschöpfungskette — eingekaufte Güter, Fracht, Geschäftsreisen, Pendeln, Produktnutzung und Entsorgung. Oft 60–90 % des Fußabdrucks.",
    share: "75%",
    shareLabel: "Typischer Mid-Market-Anteil",
    accent: "#059669",
    examples: ["Eingekaufte Materialien", "Vorgelagerte Logistik", "Geschäftsreisen", "Produktlebenszyklus"],
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Globale Logistik und Frachtcontainer",
  },
];

export const footprintFactsDe = [
  { value: "50+", label: "GHG-Protocol-Kategorien", sub: "Scope 3 Kat. 1–15" },
  { value: "500k+", label: "Emissionsfaktoren in der Bibliothek", sub: "DEFRA · EPA · ecoinvent" },
  { value: "1.5°C", label: "SBTi-konforme Pfade", sub: "Science-based Targets" },
  { value: "ESRS E1", label: "CSRD-Klimaangabe", sub: "Audit-bereite Narrative" },
];

export const insightArticlesDe = [
  {
    slug: "csrd-2026-mid-market",
    category: "REGULIERUNG",
    date: "28. Jul 2026",
    title: "CSRD 2026: Was Mid-Market-Hersteller jetzt vorbereiten müssen",
    excerpt:
      "Wave-2-Unternehmen stehen 2026 vor der ESRS-E1-Angabe. Ein praktischer 90-Tage-Plan — von doppelter Wesentlichkeit bis zu Scope-3-Datenlücken.",
    readTime: "7 Min. Lesezeit",
    featured: true,
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Nachhaltigkeitsteam prüft CSRD-Compliance-Dokumente",
    externalUrl:
      "https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en",
  },
  {
    slug: "scope-3-primary-data",
    category: "METHODIK",
    date: "21. Jul 2026",
    title: "Von ausgabenbasierten Schätzungen zu Primärdaten der Lieferanten",
    excerpt:
      "Ausgabenbasierte Schätzungen sind ein Einstieg — Prüfer und Investoren erwarten aktivitätsbasierte Faktoren. Ein Migrationsleitfaden für Kategorie 1.",
    readTime: "5 Min. Lesezeit",
    featured: false,
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Lieferketten-Container für Scope-3-Emissionen",
    externalUrl: "https://ghgprotocol.org/standards/scope-3-standard",
  },
  {
    slug: "cbam-eu-manufacturers",
    category: "POLITIK",
    date: "14. Jul 2026",
    title: "CBAM und CO₂-Preise: Auswirkungen auf EU-Importeure",
    excerpt:
      "Der CO₂-Grenzausgleich verändert Kostenstrukturen für Stahl, Aluminium und Zement. So modellieren Sie Exposition in Ihrem Fußabdruck.",
    readTime: "6 Min. Lesezeit",
    featured: false,
    image: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Industrieanlage bei Dämmerung",
    externalUrl: "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en",
  },
  {
    slug: "renewable-ppa-roi",
    category: "REDUKTION",
    date: "7. Jul 2026",
    title: "Erneuerbare PPAs: der Scope-2-Hebel mit höchstem ROI 2026",
    excerpt:
      "Analyse von 140 europäischen Mid-Market-Standorten zeigt im Schnitt 2,4 Jahre Amortisation — mit sofortigen CSRD-Vorteilen.",
    readTime: "4 Min. Lesezeit",
    featured: false,
    image: "https://images.unsplash.com/photo-1532601224470-5fc387274683?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Windräder bei Sonnenuntergang",
    externalUrl: "https://sciencebasedtargets.org/",
  },
];

export const industryNewsDe = [
  {
    source: "EU-KOMMISSION",
    date: "Jul 2026",
    headline: "ESRS Set 1 tritt für große Unternehmen in die Pflichtphase ein",
    summary: "Erste Nachhaltigkeitsberichte nach CSRD müssen ESRS-E1-Klimakennzahlen mit limited assurance enthalten.",
    image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Europäisches Parlament als Symbol für EU-Regulierung",
    externalUrl: "https://www.efrag.org/en/sustainability-reporting/esrs",
  },
  {
    source: "SBTi",
    date: "Jun 2026",
    headline: "Near-term Target-Validierung für KMU auf 8 Wochen verkürzt",
    summary: "Vereinfachter Pfad für Unternehmen unter 500 Mitarbeitenden mit 1,5°C-konformen Zielen.",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Sonnenlicht durch Waldkronen",
    externalUrl: "https://sciencebasedtargets.org/companies-taking-action",
  },
  {
    source: "GHG PROTOCOL",
    date: "Mai 2026",
    headline: "Scope-3-Guidance-Update: bessere Kategorie-11-Nutzungsphasenberechnung",
    summary: "Neue Faktoren für Energieverbrauch über die Produktlebensdauer — relevant für Gerätehersteller.",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Analytics-Dashboard für Emissions-Tracking",
    externalUrl: "https://ghgprotocol.org/standards/scope-3-standard",
  },
  {
    source: "TÜV SÜD",
    date: "Apr 2026",
    headline: "Erwartungen an Limited Assurance für erste CSRD-Berichte FY2025 veröffentlicht",
    summary: "Prüfer skizzieren Mindestanforderungen an Emissionsfaktorwahl und Datenherkunft.",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Prüfung von Compliance-Dokumenten",
    externalUrl: "https://www.tuvsud.com/en/topics/sustainability",
  },
];
