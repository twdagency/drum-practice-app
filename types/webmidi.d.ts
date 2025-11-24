/**
 * Web MIDI API type declarations
 */

declare global {
  interface MIDIInput extends MIDIPort {
    onmidimessage: ((this: MIDIInput, ev: MIDIMessageEvent) => void) | null;
  }
}

export {};

