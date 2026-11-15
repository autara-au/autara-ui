/**
 * AUTM-2199: what a chat share card draws, and how an older message's text
 * line reads back into it. In its own module, without 'use client', so a
 * server component can call `parseChatShare` (a function exported from a
 * client module is a client reference on the server and throws when called).
 *
 * The four lines are a cross-repo contract (knowledge/
 * reference_cross_repo_contracts_catalog.md): autara-contracts
 * `src/chat/attachment.ts` writes them (`attachmentLine`) and reads them
 * (`parseAttachmentLine`), and `parseChatShare` is that reader, byte for byte:
 * the same prefixes, CAR and BOOKING joined with " · ", HOME and SHOP with
 * ", ", the first part the title, the rest the detail, and the whole place as
 * the address. The native apps' parsers are its twins (ChatPieces.swift in
 * AutaraCustomer and AutaraMerchant). Change one, change them all.
 */

export type ChatShareKind = "CAR" | "HOME" | "BOOKING" | "SHOP";

/**
 * The GraphQL `MessageAttachment`, as both APIs return it. Nullable fields
 * take `null` too, so a codegen type passes straight in.
 */
export interface ChatShareAttachment {
  /** One of the four; any other kind draws the words only. */
  kind: ChatShareKind | (string & {});
  /** The first line: the car's name, the street, the service. */
  title: string;
  /** The second line: plate and colour, suburb and postcode, the day and time. */
  detail?: string | null;
  /** The car's photo (signed for this reader) or the service's photo. */
  imageUrl?: string | null;
  /** The whole address, for HOME and SHOP. */
  address?: string | null;
  /** Accepted and never used by the card: its map is a drawing (see ChatShareCard). */
  lat?: number | null;
  lng?: number | null;
}

/** The lead each kind writes before its words, in the sender's voice. */
export const CHAT_SHARE_PREFIXES: Readonly<Record<ChatShareKind, string>> = {
  CAR: "My car: ",
  HOME: "My address: ",
  BOOKING: "Your booking: ",
  SHOP: "Our address: ",
};

/** CAR and BOOKING join their parts with " · "; HOME and SHOP are an address, joined with ", ". */
const JOINS: Readonly<Record<ChatShareKind, string>> = {
  CAR: " · ",
  HOME: ", ",
  BOOKING: " · ",
  SHOP: ", ",
};

const KINDS: readonly ChatShareKind[] = ["CAR", "HOME", "BOOKING", "SHOP"];

/**
 * An older message that carries only its line, as the card it names, without
 * a picture or a point: "My car: Ferrari 12Cilindri · ABG12V · Red" is a CAR
 * titled "Ferrari 12Cilindri" with the detail "ABG12V · Red". Null for any
 * other text, and for a prefix with nothing after it.
 */
export function parseChatShare(text: string | null | undefined): ChatShareAttachment | null {
  if (!text) return null;
  for (const kind of KINDS) {
    const lead = CHAT_SHARE_PREFIXES[kind];
    if (!text.startsWith(lead)) continue;
    const rest = text.slice(lead.length);
    const parts = rest.split(JOINS[kind]);
    const title = parts[0]?.trim();
    if (!title) return null;
    const detail = parts.slice(1).join(JOINS[kind]).trim();
    const isPlace = kind === "HOME" || kind === "SHOP";
    return { kind, title, detail: detail || undefined, address: isPlace ? rest.trim() : undefined };
  }
  return null;
}

/** 4 to 8 upper-case letters and digits, at least one of each: "ABG12V", "GV72HVB". */
const PLATE = /^(?=[A-Z0-9]*[A-Z])(?=[A-Z0-9]*\d)[A-Z0-9]{4,8}$/;

/**
 * The rego in a car's detail, the first " · " part that reads as a plate, for
 * the plate on the 3D car. "2021" (no letter) and "Red" (no digit) are not
 * plates. Null when there is none.
 */
export function chatSharePlate(detail: string | null | undefined): string | null {
  if (!detail) return null;
  for (const part of detail.split(" · ")) {
    const p = part.trim();
    if (PLATE.test(p)) return p;
  }
  return null;
}
