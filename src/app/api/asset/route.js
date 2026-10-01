import fs from 'fs';
import path from 'path';

export async function GET() {
  const check = (rel) => {
    const full = path.join(process.cwd(), 'public', rel);
    if (!fs.existsSync(full)) return `${rel}: NOT_FOUND`;
    const buf = fs.readFileSync(full);
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    return `${rel}: ${w}x${h}`;
  };

  const results = [
    check('assets/New folder/tilesets/D_Inside_House.png'),
    check('assets/New folder/tilesets/A5_Tiles.png'),
    check('assets/New folder/tilesets/A2_Ground.png'),
    check('assets/RPG Maker MZ (48x48)/characters/$Char_001.png'),
    check('assets/RPG Maker MZ (48x48)/characters/$Char_004.png'),
    check('assets/RPG Maker MZ (32x32)/characters/$Char_004.png'),
    check('assets/RPG Maker MZ (16x16)/characters/$Char_004.png'),
  ].join('\n');

  return new Response(results);
}
