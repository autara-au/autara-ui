/**
 * The Australian make, model and body catalog behind VehiclePicker (AUTM-1870).
 *
 * WHERE THE NAMES COME FROM. customer-api already holds the catalog that
 * decides `is_custom_make` / `is_custom_model` on every saved car:
 * `autara-customer-api/src/functions/vehicles/vehicleData.ts`, served one make
 * at a time by `listVehicleMakes` and `listVehicleModels(make)`. The make and
 * model names below are that file's, spelled the same (Toyota "HiLux", BMW
 * "3 Series"), so a car picked here is a catalog car to the server too. The
 * server compares case-insensitively, so a customer typing "Hilux" by hand
 * matches as well.
 *
 * WHY A COPY AND NOT THE API. The picker needs two things the API does not
 * give: every model at once (one search box that finds "Hilux" without first
 * choosing Toyota would take 35 calls) and a body type per model (the API's
 * models are names only). So this is the API's list plus a body per model and
 * an order for the popular tiles. When customer-api's list changes, change
 * this one in the same week: a model missing here is still saveable (the
 * customer types it as "not listed"), it just is not one tap.
 *
 * Bodies are the `VehicleType` enum customer-api declares (SEDAN ... OTHER),
 * one per model: the shape most of them are sold as in Australia. Where a
 * model comes in two (Corolla hatch and sedan), the commoner wins and the
 * customer can Change it.
 */

export const VEHICLE_BODIES = [
    { value: 'SEDAN', label: 'Sedan' },
    { value: 'HATCHBACK', label: 'Hatchback' },
    { value: 'SUV', label: 'SUV / Crossover' },
    { value: 'WAGON', label: 'Station wagon' },
    { value: 'COUPE', label: 'Coupe' },
    { value: 'CONVERTIBLE', label: 'Convertible' },
    { value: 'UTE', label: 'Ute / Pickup' },
    { value: 'VAN', label: 'Van / People mover' },
    { value: 'TRUCK', label: 'Truck' },
    { value: 'OTHER', label: 'Other' },
] as const

export type VehicleBody = (typeof VEHICLE_BODIES)[number]['value']

/** The label a body is shown and announced by ("Ute / Pickup"), never its enum. */
export function vehicleBodyLabel(body?: string | null): string | null {
    return VEHICLE_BODIES.find((b) => b.value === body)?.label ?? null
}

export function isVehicleBody(value: unknown): value is VehicleBody {
    return VEHICLE_BODIES.some((b) => b.value === value)
}

/**
 * A car's paint, the swatches the picker offers. These are DATA, the colour
 * of the customer's car, not interface colour: like a photo, they are the
 * same in both themes, so they are literal hex rather than tokens. `ink` is
 * the tick drawn on the swatch (3:1 or better against it); `edge` asks for a
 * hairline, because a white or silver car on white paper has no other edge.
 * The stored value is the label ("White"): `customer_vehicles.color` is free
 * text, and the booking repeats it to the pro as written.
 */
export interface VehiclePaint {
    value: string
    label: string
    color: string
    ink: string
    edge?: boolean
}

const INK = '#0e0a1a'
const WHITE = '#ffffff'

export const VEHICLE_PAINTS: VehiclePaint[] = [
    { value: 'white', label: 'White', color: '#f7f7f5', ink: INK, edge: true },
    { value: 'silver', label: 'Silver', color: '#c9ccd1', ink: INK, edge: true },
    { value: 'grey', label: 'Grey', color: '#666b73', ink: WHITE },
    { value: 'black', label: 'Black', color: '#1c1d21', ink: WHITE },
    { value: 'blue', label: 'Blue', color: '#1f4fa8', ink: WHITE },
    { value: 'red', label: 'Red', color: '#b3202a', ink: WHITE },
    { value: 'green', label: 'Green', color: '#2f5d3a', ink: WHITE },
    { value: 'brown', label: 'Brown', color: '#6e4b32', ink: WHITE },
    { value: 'yellow', label: 'Yellow', color: '#f2c230', ink: INK },
    { value: 'orange', label: 'Orange', color: '#e8692a', ink: INK },
]

const PAINT_ALIASES: Record<string, string> = {
    gray: 'grey',
    charcoal: 'grey',
    gunmetal: 'grey',
    graphite: 'grey',
    pearl: 'white',
    pearlwhite: 'white',
    navy: 'blue',
    maroon: 'red',
    burgundy: 'red',
    beige: 'brown',
    bronze: 'brown',
    gold: 'yellow',
}

/** The paint a saved colour names ("white", "Pearl White", "Gray"), or null. */
export function vehiclePaint(color?: string | null): VehiclePaint | null {
    if (!color) return null
    const key = normalise(color)
    if (!key) return null
    const direct = VEHICLE_PAINTS.find((p) => p.value === key || normalise(p.label) === key)
    if (direct) return direct
    const exact = PAINT_ALIASES[key]
    if (exact) return VEHICLE_PAINTS.find((p) => p.value === exact) ?? null
    // AUTM-1878 follow-up: a paint's own name inside a longer one wins over
    // a finish alias, so "Deep Black Pearl" is black, not "pearl" (white).
    const named = VEHICLE_PAINTS.find((p) => key.includes(p.value))
    if (named) return named
    const alias = Object.entries(PAINT_ALIASES).find(([a]) => key.includes(a))?.[1]
    return alias ? (VEHICLE_PAINTS.find((p) => p.value === alias) ?? null) : null
}

export interface VehicleCatalogModel {
    name: string
    body: VehicleBody
}

export interface VehicleCatalogMake {
    name: string
    /** Shown as a tile before the customer asks for More. */
    popular?: boolean
    /** Other words customers use for this make ("VW", "Merc"). */
    aliases?: string[]
    models: VehicleCatalogModel[]
}

export type VehicleCatalog = VehicleCatalogMake[]

/* The table below as written: one [model, body] pair per model, in the
   order the customer-api file lists them (roughly most sold first). */
type RawMake = Omit<VehicleCatalogMake, 'models'> & { models: Array<[string, VehicleBody]> }

/**
 * Popular first: twelve of the makes that sell the most new cars in
 * Australia, roughly in sales order (VFACTS 2024; re-check before relying on
 * the order). Then the rest by name. Twelve tiles fill a 3 x 4 grid on a
 * phone and a 4 x 3 one on a tablet.
 */
const RAW: RawMake[] = [
    {
        name: 'Toyota',
        popular: true,
        models: [
            ['Corolla', 'HATCHBACK'], ['Camry', 'SEDAN'], ['RAV4', 'SUV'], ['LandCruiser', 'SUV'], ['HiLux', 'UTE'],
            ['Kluger', 'SUV'], ['Yaris', 'HATCHBACK'], ['Yaris Cross', 'SUV'], ['C-HR', 'SUV'], ['Fortuner', 'SUV'],
            ['Prado', 'SUV'], ['Supra', 'COUPE'], ['GR86', 'COUPE'], ['bZ4X', 'SUV'], ['HiAce', 'VAN'],
        ],
    },
    {
        name: 'Ford',
        popular: true,
        models: [
            ['Ranger', 'UTE'], ['Everest', 'SUV'], ['Mustang', 'COUPE'], ['Puma', 'SUV'], ['Escape', 'SUV'],
            ['Endura', 'SUV'], ['Focus', 'HATCHBACK'], ['Fiesta', 'HATCHBACK'], ['Territory', 'SUV'], ['Bronco', 'SUV'],
        ],
    },
    {
        name: 'Mazda',
        popular: true,
        models: [
            ['Mazda2', 'HATCHBACK'], ['Mazda3', 'HATCHBACK'], ['Mazda6', 'SEDAN'], ['CX-3', 'SUV'], ['CX-5', 'SUV'],
            ['CX-8', 'SUV'], ['CX-9', 'SUV'], ['CX-30', 'SUV'], ['CX-60', 'SUV'], ['CX-80', 'SUV'],
            ['MX-5', 'CONVERTIBLE'], ['BT-50', 'UTE'],
        ],
    },
    {
        name: 'Kia',
        popular: true,
        models: [
            ['Cerato', 'HATCHBACK'], ['Seltos', 'SUV'], ['Sportage', 'SUV'], ['Sorento', 'SUV'], ['Carnival', 'VAN'],
            ['Stonic', 'SUV'], ['Picanto', 'HATCHBACK'], ['EV6', 'SUV'], ['EV9', 'SUV'], ['Niro', 'SUV'],
        ],
    },
    {
        name: 'Hyundai',
        popular: true,
        models: [
            ['i20', 'HATCHBACK'], ['i30', 'HATCHBACK'], ['Tucson', 'SUV'], ['Santa Fe', 'SUV'], ['Kona', 'SUV'],
            ['Venue', 'SUV'], ['Ioniq 5', 'SUV'], ['Ioniq 6', 'SEDAN'], ['Staria', 'VAN'], ['Palisade', 'SUV'],
            ['iLoad', 'VAN'],
        ],
    },
    {
        name: 'Mitsubishi',
        popular: true,
        models: [
            ['Triton', 'UTE'], ['Outlander', 'SUV'], ['ASX', 'SUV'], ['Eclipse Cross', 'SUV'], ['Pajero Sport', 'SUV'],
            ['Mirage', 'HATCHBACK'], ['Delica', 'VAN'],
        ],
    },
    {
        name: 'MG',
        popular: true,
        models: [['MG3', 'HATCHBACK'], ['MG4', 'HATCHBACK'], ['ZS', 'SUV'], ['ZST', 'SUV'], ['HS', 'SUV'], ['HS PHEV', 'SUV']],
    },
    {
        name: 'Tesla',
        popular: true,
        models: [['Model 3', 'SEDAN'], ['Model Y', 'SUV'], ['Model S', 'SEDAN'], ['Model X', 'SUV'], ['Cybertruck', 'UTE']],
    },
    {
        name: 'BYD',
        popular: true,
        models: [['Atto 3', 'SUV'], ['Dolphin', 'HATCHBACK'], ['Seal', 'SEDAN'], ['Shark 6', 'UTE'], ['Sealion 6', 'SUV']],
    },
    {
        name: 'Isuzu',
        popular: true,
        models: [['D-Max', 'UTE'], ['MU-X', 'SUV']],
    },
    {
        name: 'Nissan',
        popular: true,
        models: [
            ['X-Trail', 'SUV'], ['Qashqai', 'SUV'], ['Patrol', 'SUV'], ['Navara', 'UTE'], ['Juke', 'SUV'],
            ['Pathfinder', 'SUV'], ['Leaf', 'HATCHBACK'], ['Ariya', 'SUV'], ['370Z', 'COUPE'], ['GT-R', 'COUPE'],
        ],
    },
    {
        name: 'Subaru',
        popular: true,
        models: [
            ['Impreza', 'HATCHBACK'], ['XV', 'SUV'], ['Forester', 'SUV'], ['Outback', 'WAGON'], ['WRX', 'SEDAN'],
            ['BRZ', 'COUPE'], ['Crosstrek', 'SUV'], ['Solterra', 'SUV'], ['Liberty', 'SEDAN'],
        ],
    },
    {
        name: 'Alfa Romeo',
        aliases: ['Alfa'],
        models: [['Giulia', 'SEDAN'], ['Stelvio', 'SUV'], ['Tonale', 'SUV'], ['Giulietta', 'HATCHBACK']],
    },
    {
        name: 'Audi',
        models: [
            ['A1', 'HATCHBACK'], ['A3', 'HATCHBACK'], ['A4', 'SEDAN'], ['A5', 'COUPE'], ['A6', 'SEDAN'],
            ['A7', 'SEDAN'], ['A8', 'SEDAN'], ['Q2', 'SUV'], ['Q3', 'SUV'], ['Q5', 'SUV'], ['Q7', 'SUV'],
            ['Q8', 'SUV'], ['e-tron', 'SUV'], ['RS3', 'HATCHBACK'], ['RS5', 'COUPE'], ['RS6', 'WAGON'],
            ['RS Q8', 'SUV'], ['TT', 'COUPE'],
        ],
    },
    {
        name: 'BMW',
        models: [
            ['1 Series', 'HATCHBACK'], ['2 Series', 'COUPE'], ['3 Series', 'SEDAN'], ['4 Series', 'COUPE'],
            ['5 Series', 'SEDAN'], ['7 Series', 'SEDAN'], ['8 Series', 'COUPE'], ['X1', 'SUV'], ['X2', 'SUV'],
            ['X3', 'SUV'], ['X4', 'SUV'], ['X5', 'SUV'], ['X6', 'SUV'], ['X7', 'SUV'], ['Z4', 'CONVERTIBLE'],
            ['iX', 'SUV'], ['i4', 'SEDAN'], ['i5', 'SEDAN'], ['M2', 'COUPE'], ['M3', 'SEDAN'], ['M4', 'COUPE'],
        ],
    },
    {
        name: 'Chery',
        models: [['Omoda 5', 'SUV'], ['Tiggo 4 Pro', 'SUV'], ['Tiggo 7 Pro', 'SUV'], ['Tiggo 8 Pro', 'SUV']],
    },
    {
        name: 'Cupra',
        models: [['Ateca', 'SUV'], ['Born', 'HATCHBACK'], ['Formentor', 'SUV'], ['Leon', 'HATCHBACK']],
    },
    {
        name: 'Genesis',
        models: [['G70', 'SEDAN'], ['G80', 'SEDAN'], ['GV60', 'SUV'], ['GV70', 'SUV'], ['GV80', 'SUV']],
    },
    {
        name: 'GWM',
        aliases: ['Great Wall', 'Haval'],
        models: [
            ['Cannon', 'UTE'], ['Haval H6', 'SUV'], ['Haval Jolion', 'SUV'], ['Ora', 'HATCHBACK'],
            ['Tank 300', 'SUV'], ['Tank 500', 'SUV'],
        ],
    },
    {
        name: 'Holden',
        models: [
            ['Colorado', 'UTE'], ['Commodore', 'SEDAN'], ['Trailblazer', 'SUV'], ['Equinox', 'SUV'],
            ['Acadia', 'SUV'], ['Astra', 'HATCHBACK'],
        ],
    },
    {
        name: 'Honda',
        models: [
            ['Civic', 'HATCHBACK'], ['CR-V', 'SUV'], ['HR-V', 'SUV'], ['Jazz', 'HATCHBACK'], ['Accord', 'SEDAN'],
            ['City', 'SEDAN'], ['ZR-V', 'SUV'], ['e:Ny1', 'SUV'],
        ],
    },
    {
        name: 'Jaguar',
        models: [['E-Pace', 'SUV'], ['F-Pace', 'SUV'], ['F-Type', 'COUPE'], ['I-Pace', 'SUV'], ['XE', 'SEDAN'], ['XF', 'SEDAN']],
    },
    {
        name: 'Jeep',
        models: [
            ['Wrangler', 'SUV'], ['Grand Cherokee', 'SUV'], ['Cherokee', 'SUV'], ['Compass', 'SUV'],
            ['Renegade', 'SUV'], ['Gladiator', 'UTE'],
        ],
    },
    {
        name: 'Land Rover',
        aliases: ['Range Rover'],
        models: [
            ['Defender', 'SUV'], ['Discovery', 'SUV'], ['Discovery Sport', 'SUV'], ['Range Rover', 'SUV'],
            ['Range Rover Evoque', 'SUV'], ['Range Rover Sport', 'SUV'], ['Range Rover Velar', 'SUV'],
        ],
    },
    {
        name: 'Lexus',
        models: [
            ['IS', 'SEDAN'], ['ES', 'SEDAN'], ['LS', 'SEDAN'], ['UX', 'SUV'], ['NX', 'SUV'], ['RX', 'SUV'],
            ['LX', 'SUV'], ['LC', 'COUPE'], ['RC', 'COUPE'],
        ],
    },
    {
        name: 'Mercedes-Benz',
        aliases: ['Mercedes', 'Merc', 'Benz'],
        models: [
            ['A-Class', 'HATCHBACK'], ['B-Class', 'HATCHBACK'], ['C-Class', 'SEDAN'], ['E-Class', 'SEDAN'],
            ['S-Class', 'SEDAN'], ['CLA', 'SEDAN'], ['CLS', 'SEDAN'], ['GLA', 'SUV'], ['GLB', 'SUV'], ['GLC', 'SUV'],
            ['GLE', 'SUV'], ['GLS', 'SUV'], ['G-Class', 'SUV'], ['EQA', 'SUV'], ['EQB', 'SUV'], ['EQC', 'SUV'],
            ['EQE', 'SEDAN'], ['EQS', 'SEDAN'], ['AMG GT', 'COUPE'],
        ],
    },
    {
        name: 'MINI',
        models: [
            ['Cooper', 'HATCHBACK'], ['Countryman', 'SUV'], ['Clubman', 'WAGON'], ['Convertible', 'CONVERTIBLE'],
            ['Electric', 'HATCHBACK'],
        ],
    },
    {
        name: 'Peugeot',
        models: [
            ['208', 'HATCHBACK'], ['308', 'HATCHBACK'], ['408', 'SEDAN'], ['508', 'SEDAN'], ['2008', 'SUV'],
            ['3008', 'SUV'], ['5008', 'SUV'], ['e-208', 'HATCHBACK'], ['e-2008', 'SUV'],
        ],
    },
    {
        name: 'Porsche',
        models: [
            ['911', 'COUPE'], ['Cayenne', 'SUV'], ['Macan', 'SUV'], ['Panamera', 'SEDAN'], ['Taycan', 'SEDAN'],
            ['Boxster', 'CONVERTIBLE'], ['Cayman', 'COUPE'],
        ],
    },
    {
        name: 'RAM',
        models: [['1500', 'UTE'], ['2500', 'UTE'], ['3500', 'UTE']],
    },
    {
        name: 'Renault',
        models: [['Arkana', 'SUV'], ['Captur', 'SUV'], ['Koleos', 'SUV'], ['Megane E-Tech', 'SUV']],
    },
    {
        name: 'Skoda',
        models: [
            ['Fabia', 'HATCHBACK'], ['Octavia', 'WAGON'], ['Superb', 'SEDAN'], ['Kamiq', 'SUV'], ['Karoq', 'SUV'],
            ['Kodiaq', 'SUV'], ['Enyaq', 'SUV'],
        ],
    },
    {
        name: 'Suzuki',
        models: [
            ['Swift', 'HATCHBACK'], ['Vitara', 'SUV'], ['S-Cross', 'SUV'], ['Jimny', 'SUV'], ['Baleno', 'HATCHBACK'],
            ['Ignis', 'HATCHBACK'],
        ],
    },
    {
        name: 'Volkswagen',
        aliases: ['VW'],
        models: [
            ['Golf', 'HATCHBACK'], ['Polo', 'HATCHBACK'], ['Tiguan', 'SUV'], ['Touareg', 'SUV'], ['T-Roc', 'SUV'],
            ['T-Cross', 'SUV'], ['Amarok', 'UTE'], ['ID.4', 'SUV'], ['ID.5', 'SUV'], ['Arteon', 'SEDAN'],
            ['Passat', 'WAGON'], ['Multivan', 'VAN'],
        ],
    },
    {
        name: 'Volvo',
        models: [
            ['XC40', 'SUV'], ['XC60', 'SUV'], ['XC90', 'SUV'], ['S60', 'SEDAN'], ['S90', 'SEDAN'], ['V60', 'WAGON'],
            ['V90', 'WAGON'], ['C40', 'SUV'], ['EX30', 'SUV'], ['EX90', 'SUV'],
        ],
    },
]

export const AU_VEHICLE_CATALOG: VehicleCatalog = RAW.map((entry) => ({
    ...entry,
    models: entry.models.map(([name, body]) => ({ name, body })),
}))

/**
 * Lower case, accents off, and everything but letters and digits gone, so
 * "Land Cruiser", "landcruiser" and "LandCruiser" are one word, as are
 * "CX5" and "CX-5". Search and matching both go through this.
 */
export function normalise(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]/g, '')
}

/** The catalog's own spelling of a make, or null when it is not listed. */
export function findVehicleMake(make: string, catalog: VehicleCatalog = AU_VEHICLE_CATALOG): VehicleCatalogMake | null {
    const key = normalise(make)
    if (!key) return null
    return catalog.find((entry) => normalise(entry.name) === key) ?? null
}

/** The catalog's model under a make, or null when either is not listed. */
export function findVehicleModel(
    make: string,
    model: string,
    catalog: VehicleCatalog = AU_VEHICLE_CATALOG,
): VehicleCatalogModel | null {
    const entry = findVehicleMake(make, catalog)
    const key = normalise(model)
    if (!entry || !key) return null
    return entry.models.find((x) => normalise(x.name) === key) ?? null
}

/** The body a listed model is sold as ("HiLux" is a ute), or null. */
export function inferVehicleBody(make: string, model: string, catalog: VehicleCatalog = AU_VEHICLE_CATALOG): VehicleBody | null {
    return findVehicleModel(make, model, catalog)?.body ?? null
}

export type VehicleSearchResult =
    | { kind: 'model'; make: string; model: string; body: VehicleBody }
    | { kind: 'make'; make: string }

/**
 * One box for make OR model (Don, 2026-10-14): "Hilux" is Toyota HiLux,
 * "toy" is Toyota and its models, "toyota hil" narrows to the HiLux, "VW" is
 * Volkswagen. Models first (the customer who typed a model wants that car),
 * best match first: the whole model, then a model that starts with the
 * query, then make plus model, then a model with the query inside it. Makes
 * follow. Capped, because a phone shows about six rows above the keyboard.
 */
export function searchVehicleCatalog(
    query: string,
    catalog: VehicleCatalog = AU_VEHICLE_CATALOG,
    limit = { models: 8, makes: 4 },
): VehicleSearchResult[] {
    const q = normalise(query)
    if (!q) return []
    const scored: { score: number; order: number; result: VehicleSearchResult }[] = []
    let order = 0
    for (const entry of catalog) {
        const make = normalise(entry.name)
        const names = [make, ...(entry.aliases ?? []).map(normalise)]
        const makeHit = names.some((n) => n.startsWith(q))
        /* "toyota hilux": the query starts with the make (or an alias), and
           what is left is a model under it. */
        const prefix = names.find((n) => q.startsWith(n) && q.length > n.length)
        const rest = prefix ? q.slice(prefix.length) : null
        for (const model of entry.models) {
            const key = normalise(model.name)
            let score: number | null = null
            if (key === q) score = 0
            else if (key.startsWith(q)) score = 1
            else if (rest !== null && key.startsWith(rest)) score = rest === key ? 0 : 2
            else if (q.length >= 3 && key.includes(q)) score = 3
            /* A make match brings its models along, after the direct hits. */
            else if (makeHit && q.length >= 2) score = 4
            if (score !== null) {
                scored.push({
                    score,
                    order: order++,
                    result: { kind: 'model', make: entry.name, model: model.name, body: model.body },
                })
            }
        }
    }
    scored.sort((a, b) => a.score - b.score || a.order - b.order)
    const models = scored.slice(0, limit.models).map((s) => s.result)

    const makes: VehicleSearchResult[] = catalog
        .filter((entry) => [entry.name, ...(entry.aliases ?? [])].some((n) => normalise(n).startsWith(q)))
        .slice(0, limit.makes)
        .map((entry) => ({ kind: 'make', make: entry.name }))
    return [...models, ...makes]
}

/** The popular makes, in tile order. */
export function popularVehicleMakes(catalog: VehicleCatalog = AU_VEHICLE_CATALOG): VehicleCatalogMake[] {
    return catalog.filter((entry) => entry.popular)
}

/** Every other make, by name. */
export function otherVehicleMakes(catalog: VehicleCatalog = AU_VEHICLE_CATALOG): VehicleCatalogMake[] {
    return catalog
        .filter((entry) => !entry.popular)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
}

/** A make or model as a test id or element id part: "Mercedes-Benz" is "mercedes-benz". */
export function vehicleSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}
