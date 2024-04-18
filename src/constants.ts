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
    "tilpasse",
    "analysere",
    "automatisere",
    "beregne",
    "klassificere",
    "samarbejde",
    "konvertere",
    "fejlfinde",
    "designe",
    "opdage",
    "diagnosticere",
    "forbedre",
    "facilitere",
    "filtrere",
    "generere",
    "identificere",
    "optimere",
    "personalisere",
    "forudsige",
    "rangere",
    "genkende",
    "anbefale",
    "simulere",
    "strømline",
    "opsummere",
    "spore",
    "oversætte",
    "validere"
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
        exclusion: pvAttr(null, "Eksluderinger:", "[Indtast emner der bør undgås]", null, null),
        format: pvAttr(null, "Vælg format:", "[Vælg et format]", FORMATS, null),
        example: pvAttr(null, "Eksempel:", "[Indtast et eksempel]", null, null)
    },
    sourceTemplate: "[Opfør dig som en $ROLE, <br>][Jeg har brug for $NEEDS, <br>][du vil $TASK, <br>][ undervejs bør du $DETAILS, <br>][venligst undgå $EXCLUSION, <br>][formater det endelige resultat som $FORMAT, <br>][her er et eksempel: $EXAMPLE]",
    template: [
        ["Opfør dig som en ", pv("role"), ",", "<br/>"],
        ["Jeg har brug for ", pv("needs"), ", ", "<br/>"],
        ["du vil ", pv("task"), ", ", "<br/>"],
        [" undervejs bør du ", pv("details"), ", ", "<br/>"],
        ["venligst undgå ", pv("exclusion"), ", ", "<br/>"],
        ["formater det endelige resultat som  ", pv("format"), ", ", "<br/>"],
        ["her er et eksempel: ", pv("example")]
    ],
    examples: [
        {
            name: "Langt eksempel",
            id: crypto.randomUUID(),
            values: {
                role: "Erfaren sælger",
                needs: "et udkast til et tilbud på en reklamekampagne",
                task: "generere et komplet udkast",
                details: "fokusere på at formulere dig både kreativt og præcist",
                exclusion: "undgå alt for mange buzz-words",
                format: "velstruktureret format",
                example: "overskrift \"Tilbud på reklamekampagne der kan løfte synligheden af Nielsens Vinduer A/S\""
            }
        },
        {
            name: "Kort eksempel",
            id: crypto.randomUUID(),
            values: {
                role: "Erfaren sælger",
                task: "analysere markedet for reklamekampagner",
                details: "fokuser på det danske marked og hold analysen kort",
                format: "velstruktureret format"
            }
        }
    ]
};
