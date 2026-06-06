export type AmbienceSound = 'lofi' | 'rain' | 'brown';

let context: AudioContext | null = null;
let master: GainNode | null = null;

function createNoiseBuffer(ctx: AudioContext, brown = false) {
  const length = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;

  for (let index = 0; index < length; index += 1) {
    const white = Math.random() * 2 - 1;
    last = brown ? (last + 0.02 * white) / 1.02 : white;
    data[index] = brown ? last * 3.5 : white;
  }

  return buffer;
}

function addNoise(ctx: AudioContext, destination: AudioNode, type: AmbienceSound) {
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  source.buffer = createNoiseBuffer(ctx, type !== 'rain');
  source.loop = true;
  filter.type = type === 'rain' ? 'highpass' : 'lowpass';
  filter.frequency.value = type === 'rain' ? 1800 : 550;
  gain.gain.value = type === 'rain' ? 0.2 : 0.09;
  source.connect(filter).connect(gain).connect(destination);
  source.start();
}

function addLofiChord(ctx: AudioContext, destination: AudioNode) {
  const chord = [130.81, 164.81, 196, 246.94];
  const chordGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const wobble = ctx.createOscillator();
  const wobbleGain = ctx.createGain();

  chordGain.gain.value = 0.065;
  filter.type = 'lowpass';
  filter.frequency.value = 1100;
  wobble.frequency.value = 0.18;
  wobbleGain.gain.value = 0.012;
  wobble.connect(wobbleGain).connect(chordGain.gain);
  wobble.start();

  for (const frequency of chord) {
    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    oscillator.detune.value = (Math.random() - 0.5) * 8;
    oscillator.connect(chordGain);
    oscillator.start();
  }

  chordGain.connect(filter).connect(destination);
  addNoise(ctx, destination, 'brown');
}

export async function playAmbience(sound: AmbienceSound, volume: number) {
  stopAmbience();
  context = new AudioContext();
  master = context.createGain();
  master.gain.value = volume;
  master.connect(context.destination);

  if (sound === 'lofi') addLofiChord(context, master);
  else addNoise(context, master, sound);

  await context.resume();
}

export function setAmbienceVolume(volume: number) {
  if (master && context) master.gain.setTargetAtTime(volume, context.currentTime, 0.03);
}

export function stopAmbience() {
  void context?.close();
  context = null;
  master = null;
}
