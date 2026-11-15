import { describe, expect, it } from 'vitest'
import { CHAT_SHARE_PREFIXES, chatSharePlate, parseChatShare } from './chat-share'

/**
 * AUTM-2199: the four lines are a cross-repo contract. These cases are
 * autara-contracts' `parseAttachmentLine` outputs (src/chat/attachment.ts),
 * checked against it when this was written, so a drift on either side fails.
 */
describe('parseChatShare', () => {
    it('keeps the four prefixes, byte for byte', () => {
        expect(CHAT_SHARE_PREFIXES).toEqual({
            CAR: 'My car: ',
            HOME: 'My address: ',
            BOOKING: 'Your booking: ',
            SHOP: 'Our address: ',
        })
    })

    it.each([
        [
            'My car: Ferrari 12Cilindri · ABG12V · Red',
            { kind: 'CAR', title: 'Ferrari 12Cilindri', detail: 'ABG12V · Red', address: undefined },
        ],
        [
            'My address: 52 York Street, Sydney NSW 2000',
            { kind: 'HOME', title: '52 York Street', detail: 'Sydney NSW 2000', address: '52 York Street, Sydney NSW 2000' },
        ],
        [
            'Your booking: Interior · Today, 10:30 am · Mobile',
            { kind: 'BOOKING', title: 'Interior', detail: 'Today, 10:30 am · Mobile', address: undefined },
        ],
        [
            'Our address: Unit 4, 12 Bourke Rd, Alexandria NSW 2015',
            {
                kind: 'SHOP',
                title: 'Unit 4',
                detail: '12 Bourke Rd, Alexandria NSW 2015',
                address: 'Unit 4, 12 Bourke Rd, Alexandria NSW 2015',
            },
        ],
    ])('reads %j', (line, card) => {
        expect(parseChatShare(line)).toEqual(card)
    })

    it('reads a title alone, with no detail', () => {
        expect(parseChatShare('My car: Toyota HiLux')).toEqual({
            kind: 'CAR',
            title: 'Toyota HiLux',
            detail: undefined,
            address: undefined,
        })
    })

    it.each([
        ['plain words', 'See you Saturday at 9'],
        ['another case', 'my car: Toyota HiLux'],
        ['no space after the colon', 'My car:Toyota HiLux'],
        ['words before the prefix', 'Here it is. My car: Toyota HiLux'],
        ['a space before the prefix (as contracts: the line starts with it)', ' My car: Toyota HiLux'],
        ['the prefix alone', 'My car: '],
        ['an empty title', 'My car:  · GV72HVB'],
        ['empty', ''],
    ])('is null for %s', (_why, line) => {
        expect(parseChatShare(line)).toBeNull()
    })

    it('is null for null and undefined', () => {
        expect(parseChatShare(null)).toBeNull()
        expect(parseChatShare(undefined)).toBeNull()
    })

    it('trims extra spaces around the title and the detail, and keeps those inside', () => {
        expect(parseChatShare('My car:   Toyota HiLux   ·  GV72HVB  · White ')).toEqual({
            kind: 'CAR',
            title: 'Toyota HiLux',
            detail: 'GV72HVB  · White',
            address: undefined,
        })
        expect(parseChatShare('Our address:  Unit 4 ,  12 Bourke Rd ')).toEqual({
            kind: 'SHOP',
            title: 'Unit 4',
            detail: '12 Bourke Rd',
            address: 'Unit 4 ,  12 Bourke Rd',
        })
    })
})

describe('chatSharePlate', () => {
    it.each([
        ['ABG12V · Red', 'ABG12V'],
        ['GV72HVB · 2021 · White', 'GV72HVB'],
        ['Red · 1ABC234', '1ABC234'],
        ['GV72HVB  · White', 'GV72HVB'],
        ['AB12', 'AB12'],
        ['ABCD1234', 'ABCD1234'],
    ])('reads a plate in %j', (detail, plate) => {
        expect(chatSharePlate(detail)).toBe(plate)
    })

    it.each([
        ['a year, no letter', '2021 · White'],
        ['a colour, no digit', 'Red'],
        ['lower case', 'abg12v · Red'],
        ['too short', 'AB1'],
        ['too long', 'ABCDE12345'],
        ['a space inside', 'AB 12CD'],
        ['a dash inside', 'ABC-123'],
        ['nothing', ''],
    ])('is null for %s', (_why, detail) => {
        expect(chatSharePlate(detail)).toBeNull()
    })

    it('is null for null and undefined', () => {
        expect(chatSharePlate(null)).toBeNull()
        expect(chatSharePlate(undefined)).toBeNull()
    })
})
