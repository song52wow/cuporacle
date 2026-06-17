// 批量获取所有世界杯队伍的球员信息
// 使用 RapidAPI: world-cup-2026

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = '60d3370d5cmshc8966841170620fp1395b1jsnb0571f2c9e88';
const API_HOST = 'world-cup-2026.p.rapidapi.com';
const BASE_URL = 'https://world-cup-2026.p.rapidapi.com/world-cup-2026/players';

// 所有队伍的 ID 和名称（从 world-cup-teams.json 提取）
const TEAMS = [
  { id: '624', name: 'Algeria', slug: 'alg' },
  { id: '202', name: 'Argentina', slug: 'arg' },
  { id: '628', name: 'Australia', slug: 'aus' },
  { id: '474', name: 'Austria', slug: 'aut' },
  { id: '459', name: 'Belgium', slug: 'bel' },
  { id: '452', name: 'Bosnia-Herzegovina', slug: 'bih' },
  { id: '205', name: 'Brazil', slug: 'bra' },
  { id: '206', name: 'Canada', slug: 'can' },
  { id: '2597', name: 'Cape Verde', slug: 'cpv' },
  { id: '208', name: 'Colombia', slug: 'col' },
  { id: '2850', name: 'Congo DR', slug: 'rdc' },
  { id: '477', name: 'Croatia', slug: 'cro' },
  { id: '11678', name: 'Curaçao', slug: 'fifa.curacao' },
  { id: '450', name: 'Czechia', slug: 'cze' },
  { id: '209', name: 'Ecuador', slug: 'ecu' },
  { id: '2620', name: 'Egypt', slug: 'egy' },
  { id: '448', name: 'England', slug: 'eng' },
  { id: '478', name: 'France', slug: 'fra' },
  { id: '481', name: 'Germany', slug: 'ger' },
  { id: '4469', name: 'Ghana', slug: 'gha' },
  { id: '2654', name: 'Haiti', slug: 'hai' },
  { id: '469', name: 'Iran', slug: 'irn' },
  { id: '4375', name: 'Iraq', slug: 'irq' },
  { id: '4789', name: 'Ivory Coast', slug: 'civ' },
  { id: '627', name: 'Japan', slug: 'jpn' },
  { id: '2917', name: 'Jordan', slug: 'jor' },
  { id: '203', name: 'Mexico', slug: 'mex' },
  { id: '2869', name: 'Morocco', slug: 'mar' },
  { id: '449', name: 'Netherlands', slug: 'ned' },
  { id: '2666', name: 'New Zealand', slug: 'nzl' },
  { id: '464', name: 'Norway', slug: 'nor' },
  { id: '2659', name: 'Panama', slug: 'pan' },
  { id: '210', name: 'Paraguay', slug: 'par' },
  { id: '482', name: 'Portugal', slug: 'por' },
  { id: '4398', name: 'Qatar', slug: 'qat' },
  { id: '655', name: 'Saudi Arabia', slug: 'ksa' },
  { id: '580', name: 'Scotland', slug: 'sco' },
  { id: '654', name: 'Senegal', slug: 'sen' },
  { id: '467', name: 'South Africa', slug: 'rsa' },
  { id: '451', name: 'South Korea', slug: 'kors' },
  { id: '164', name: 'Spain', slug: 'esp' },
  { id: '466', name: 'Sweden', slug: 'swe' },
  { id: '475', name: 'Switzerland', slug: 'sui' },
  { id: '659', name: 'Tunisia', slug: 'tun' },
  { id: '465', name: 'Türkiye', slug: 'tur' },
  { id: '660', name: 'United States', slug: 'usa' },
  { id: '212', name: 'Uruguay', slug: 'uru' },
  { id: '2570', name: 'Uzbekistan', slug: 'uzb' },
];

async function fetchPlayers(teamId) {
  const url = `${BASE_URL}?teamId=${teamId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': API_HOST,
        'x-rapidapi-key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching team ${teamId}:`, error.message);
    return null;
  }
}

async function fetchAllPlayers() {
  const allPlayers = {};
  let successCount = 0;
  let failCount = 0;

  console.log(`Starting to fetch players for ${TEAMS.length} teams...`);

  for (const team of TEAMS) {
    console.log(`Fetching ${team.name} (ID: ${team.id})...`);

    const data = await fetchPlayers(team.id);

    if (data && data.players && Array.isArray(data.players)) {
      allPlayers[team.slug] = {
        team: data.team,
        players: data.players,
        playersCount: data.players.length,
      };
      successCount++;
      console.log(`  ✓ Got ${data.players.length} players`);
    } else {
      failCount++;
      console.log(`  ✗ Failed to get players`);
    }

    // 避免请求过快被限流
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\nDone! Success: ${successCount}, Failed: ${failCount}`);

  return allPlayers;
}

async function main() {
  const allPlayers = await fetchAllPlayers();

  // 保存到 JSON 文件
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'world-cup-players.json');
  fs.writeFileSync(outputPath, JSON.stringify(allPlayers, null, 2), 'utf-8');

  console.log(`\nSaved to: ${outputPath}`);
  console.log(`Total teams: ${Object.keys(allPlayers).length}`);

  // 统计总球员数
  let totalPlayers = 0;
  for (const team of Object.values(allPlayers)) {
    totalPlayers += team.players.length;
  }
  console.log(`Total players: ${totalPlayers}`);
}

main().catch(console.error);
