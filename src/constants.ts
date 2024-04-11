import {ITemplate} from "./types"
import {pv, pvAttr} from "./promptVariable"

const ROLES: Array<string> = [
    "Ekspert i regnskaber",
    "Dygtig softwareudvikler",
    "Erfaren underviser",
    "Erfaren sælger",
    "Kompetent projektleder",
    "Velbevandret ingeniør",
    "Erfaren arkitekt",
    "Kompetent marketingchef",
    "Indsigtsfuld finansanalytiker",
    "Kreativ grafisk designer",
    "Erfaren HR-chef",
    "Betroet konsulent",
    "Dygtig læge",
    "Autoriseret psykolog",
    "Dedikeret forsker",
    "Analytisk statistiker",
    "Skarp økonom",
    "Dybdeborende journalist",
    "Professionel farmaceut",
    "Empatisk socialrådgiver",
    "Kompetent IT-specialist",
    "Indsigtsfuld forretningsanalytiker",
    "Erfaren driftschef",
    "Strategisk eventplanlægger",
    "Kompetent ejendomsmægler",
    "Investeringsguru",
    "Dygtig webudvikler",
    "Veluddannet fitness-træner",
    "Professionel executive coach",
    "Agil Scrum Master",
    "Cybersikkerhedsanalytiker",
    "User Experience (UX) specialist",
    "Artificial Intelligence (AI) udvikler",
    "Miljørådgiver",
    "Databeskyttelsesrådgiver (DPO)"
];

const TASKS: Array<string> = [
    "Adaptér",
    "Analysér",
    "Automatisér",
    "Beregn",
    "Klassificér",
    "Samarbejd",
    "Konverter",
    "Tilpas",
    "Fejlfind",
    "Design",
    "Opdag",
    "Diagnosticér",
    "Opdag",
    "Forbedr",
    "Facilitér",
    "Filtrér",
    "Generér",
    "Identificér",
    "Forbedr",
    "Optimér",
    "Personalisér",
    "Forudsig",
    "Rangér",
    "Genkend",
    "Anbefal",
    "Simulér",
    "Strømlin",
    "Opsummer",
    "Spor",
    "Oversæt",
    "Valider"
];

const FORMATS: Array<string> = [
    "ren tekst",
    "velstruktureret format",
    "JSON",
    "CSV",
    "HTML",
    "XML",
    "Markdown kode",
    "PDF"
];

export const PROMPT_TEMPLATE: ITemplate = {
    name: "Primær skabelon",
    id: crypto.randomUUID(),
    promptVariableAttributes: {
        role: pvAttr(null, "Vælg en rolle:", "[Specificer en rolle]",  ROLES, null),
        needs: pvAttr(null, "Hvad har du brug for?", "[Hvad har du brug for?]", null, null),
        task: pvAttr(null, "Hvad er opgaven?", "[Indtast en opgave]", TASKS,  null),
        details: pvAttr(null, "Detaljer:", "[Indtast detaljer]", null, null),
        exclusion: pvAttr(null, "Exclusions:", "[Enter exclusion]", null, null),
        format: pvAttr(null, "Vælg format:", "[Vælg et format]", FORMATS, null),
        example: pvAttr(null, "Eksempel:", "[Indtast et eksempel]", null, null)
    },
    sourceTemplate: "[Act like a $ROLE, <br>][I need a $NEEDS, <br>][you will $TASK, <br>][in the process, you should $DETAILS, <br>][please $EXCLUSION, <br>][input the final result in a $FORMAT, <br>][here is an example: $EXAMPLE]",
    template: [
        ["Act like a ", pv("role"), ",", "<br/>"],
        ["I need a ", pv("needs"), ", ", "<br/>"],
        ["you will ", pv("task"), ", ", "<br/>"],
        [" in the process, you should ", pv("details"), ", ", "<br/>"],
        ["please ", pv("exclusion"), ", ", "<br/>"],
        ["input the final result in a ", pv("format"), ", ", "<br/>"],
        ["here is an example: ", pv("example")]
    ],
    examples: [
        {
            name: "Full Example",
            id: crypto.randomUUID(),
            values: {
                role: "SEO Professional Writer",
                needs: "optimized blog post",
                task: "research keywords and incorporate them naturally into the content",
                details: "focus on readability, relevance and proper keyword placement",
                exclusion: "avoid keyword stuffing or over-optimisation",
                format: "well structured format",
                example: "title \"Top 10 Tips for Effective SEO Writing: Boost Your Content's Visibility\""
            }
        },
        {
            name: "Short Example",
            id: crypto.randomUUID(),
            values: {
                role: "SEO Professional Writer",
                task: "research keywords and incorporate them naturally into the content",
                details: "focus on readability, relevance and proper keyword placement",
                format: "well structured format"
            }
        }
    ]
};
