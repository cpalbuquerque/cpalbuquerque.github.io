// src/lib/content.js
// Reads Caetano's files in content/ at build time.
//   content/people.txt           name | group | years | one line
//   content/photos/captions.txt  file | what it shows | consent
//   content/logos/logos.txt      file | organization name | home page link
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'content');

// Images are imported through Vite so astro:assets can resize them and strip metadata.
const photoFiles = import.meta.glob('/content/photos/*.{jpg,jpeg,png,webp}', { eager: true });
const logoFiles = import.meta.glob('/content/logos/*.{png,svg,jpg,jpeg,webp}', { eager: true });

function readLines(rel) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) return null;
  return fs
    .readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('|').map((f) => f.trim()));
}

export const GROUPS = ['current', 'visiting', 'masters', 'alumni-csumb', 'alumni-calstatela', 'alumni-ucdavis'];

export function loadPeople() {
  const rows = readLines('people.txt');
  if (!rows) {
    throw new Error('content/people.txt is missing. Names come only from that file.');
  }
  const people = [];
  const skipped = [];
  for (const [name = '', group = '', years = '', line = ''] of rows) {
    const raw = [name, group, years, line].join(' | ');
    if (raw.includes('CONFIRM')) {
      skipped.push(raw);
      continue;
    }
    if (!GROUPS.includes(group)) {
      skipped.push(raw);
      continue;
    }
    people.push({ name, group, years, line });
  }
  return { people, skipped };
}

function asset(files, dir, file) {
  const mod = files[`/content/${dir}/${file}`];
  return mod ? mod.default : null;
}

export function loadPhotos() {
  const rows = readLines('photos/captions.txt') || [];
  return rows
    .map(([file, caption = '', consent = '']) => ({ file, caption, consent, image: asset(photoFiles, 'photos', file) }))
    .filter((p) => p.image);
}

export function findPhotos(pattern) {
  return loadPhotos().filter((p) => pattern.test(p.file));
}

export function findPhoto(pattern) {
  return loadPhotos().find((p) => pattern.test(p.file)) || null;
}

export function loadLogos() {
  const rows = readLines('logos/logos.txt') || [];
  return rows
    .map(([file, org = '', url = '']) => ({ file, org, url, image: asset(logoFiles, 'logos', file) }))
    .filter((l) => l.image);
}
