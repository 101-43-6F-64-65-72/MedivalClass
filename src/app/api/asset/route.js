import fs from 'fs';

export async function GET() {
  const targetPath = 'z:\\AJARPELATIHAN\\multiplayer-game\\public\\pixel_assets.png';
  const buffer = fs.readFileSync(targetPath);
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  
  fs.writeFileSync('z:\\AJARPELATIHAN\\multiplayer-game\\dimensions.txt', `WIDTH=${width}\nHEIGHT=${height}\n`);

  return new Response(`OK ${width}x${height}`);
}
