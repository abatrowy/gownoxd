const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
const config = require('../../config/config.js');

const RIOT_API_KEY = config.RIOT_API;

const regionMap = {
  'BR': 'br1.api.riotgames.com',
  'EUNE': 'eun1.api.riotgames.com',
  'EUW': 'euw1.api.riotgames.com',
  'JP': 'jp1.api.riotgames.com',
  'KR': 'kr.api.riotgames.com',
  'LA1': 'la1.api.riotgames.com',
  'LA2': 'la2.api.riotgames.com',
  'NA': 'na1.api.riotgames.com',
  'OC': 'oc1.api.riotgames.com',
  'TR': 'tr1.api.riotgames.com',
  'RU': 'ru.api.riotgames.com',
  'PH': 'ph2.api.riotgames.com',
  'SG': 'sg2.api.riotgames.com',
  'TH': 'th2.api.riotgames.com',
  'TW': 'tw2.api.riotgames.com',
  'VN': 'vn2.api.riotgames.com'
};

function clearNameSpaces(nameWithSpaces) {
  let result = '';
  for (const n of nameWithSpaces) {
    result = result + ' ' + String(n);
  }
  return result.trim();
}

async function getProfile(regionId, summonerName) {
  const host = regionMap[regionId.toUpperCase()];
  if (!host) {
    throw new Error('Niepoprawny region');
  }

  try {
    const response = await axios.get(`https://${host}/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${RIOT_API_KEY}`);
    const summoner = response.data;
    const sEncryptedId = summoner.id;
    const sName = summoner.name;
    const sLevel = `Poziom - ${summoner.summonerLevel}`;
    const sIcon = `http://ddragon.leagueoflegends.com/cdn/13.13.1/img/profileicon/${summoner.profileIconId}.png`;
    return [sEncryptedId, sName, sLevel, sIcon];
  } catch (error) {
    console.error(error);
    throw new Error('Wystąpił błąd podczas pobierania profilu przywoływacza.');
  }
}

function mapQueueType(queueType) {
  switch (queueType) {
    case 'RANKED_SOLO_5x5':
      return 'Solo/Duo';
    case 'RANKED_FLEX_SR':
      return 'Flex 5v5';
    case 'RANKED_TFT':
      return 'Teamfight Tactics';
    default:
      return 'Nieznany';
  }
}

async function fetchRanks(regionId, sEncryptedId) {
  const host = regionMap[regionId.toUpperCase()];
  if (!host) {
    throw new Error('Niepoprawny region');
  }

  try {
    const response = await axios.get(`https://${host}/lol/league/v4/entries/by-summoner/${sEncryptedId}?api_key=${RIOT_API_KEY}`);
    const jsonDataSummoner = response.data;

    const ranks = [];

    for (let i = 0; i < jsonDataSummoner.length; i++) {
      const queueType = mapQueueType(jsonDataSummoner[i].queueType);
      ranks.push(queueType);
      ranks.push(jsonDataSummoner[i].tier);
      ranks.push(jsonDataSummoner[i].rank);
      ranks.push(jsonDataSummoner[i].leaguePoints);
      ranks.push(jsonDataSummoner[i].wins);
      ranks.push(jsonDataSummoner[i].losses);
    }

    return ranks;
  } catch (error) {
    console.error(error);
    throw new Error('Wystąpił błąd podczas pobierania danych rang przywoływacza.');
  }
}

async function fetchMasteries(regionId, sEncryptedId) {
  const host = regionMap[regionId.toUpperCase()];
  if (!host) {
    throw new Error('Niepoprawny region');
  }

  const limit = '3';
  const champions = [];
  const arrids = [];
  const arrlevels = [];
  const arrpoints = [];
  const arrname = [];
  const arrimgs = [];
  const championsURL = 'http://ddragon.leagueoflegends.com/cdn/13.13.1/data/pl_PL/champion.json';
  const iconURL = 'http://ddragon.leagueoflegends.com/cdn/13.13.1/img/champion/';

  try {
    const response = await axios.get(`https://${host}/lol/champion-mastery/v4/champion-masteries/by-summoner/${sEncryptedId}/top?count=${limit}&api_key=${RIOT_API_KEY}`);
    const playersChampions = response.data;

    for (const champion of playersChampions) {
      arrids.push(champion.championId);
      arrlevels.push(champion.championLevel);
      arrpoints.push(champion.championPoints);
    }

    const championsResponse = await axios.get(championsURL);
    const champions_db = championsResponse.data.data;

    for (const championId of arrids) {
      for (const name in champions_db) {
        if (champions_db[name].key === String(championId)) {
          arrname.push(name);
          arrimgs.push(iconURL + name + '.png');
          break;
        }
      }
    }

    return [arrname, arrpoints, arrlevels, arrimgs];
  } catch (error) {
    console.error(error);
    throw new Error('Wystąpił błąd podczas pobierania danych o mistrzostwach przywoływacza.');
  }
}

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith('!')) {
      const args = message.content.slice(1).split(' ');
      const command = args.shift().toLowerCase();
      const summonerName = args.join(' ');

      switch (command) {
        case 'br':
          await handleRegionCommand('BR', summonerName, message);
          break;
        case 'eune':
          await handleRegionCommand('EUNE', summonerName, message);
          break;
        case 'euw':
          await handleRegionCommand('EUW', summonerName, message);
          break;
        case 'jp':
          await handleRegionCommand('JP', summonerName, message);
          break;
        case 'kr':
          await handleRegionCommand('KR', summonerName, message);
          break;
        case 'la1':
          await handleRegionCommand('LA1', summonerName, message);
          break;
        case 'la2':
          await handleRegionCommand('LA2', summonerName, message);
          break;
        case 'na':
          await handleRegionCommand('NA', summonerName, message);
          break;
        case 'oc':
          await handleRegionCommand('OC', summonerName, message);
          break;
        case 'tr':
          await handleRegionCommand('TR', summonerName, message);
          break;
        case 'ru':
          await handleRegionCommand('RU', summonerName, message);
          break;
        case 'ph':
          await handleRegionCommand('PH', summonerName, message);
          break;
        case 'sg':
          await handleRegionCommand('SG', summonerName, message);
          break;
        case 'th':
          await handleRegionCommand('TH', summonerName, message);
          break;
        case 'tw':
          await handleRegionCommand('TW', summonerName, message);
          break;
        case 'vn':
          await handleRegionCommand('VN', summonerName, message);
          break;
        default:
          break;
      }
    }
  });
};

async function handleRegionCommand(regionId, summonerName, message) {
  try {
    const summoner = await getProfile(regionId, summonerName);
    const summonerRanking = await fetchRanks(regionId, summoner[0]);
    const championsMastery = await fetchMasteries(regionId, summoner[0]);
    const opggLink = `https://www.op.gg/summoners/${regionId}/${summoner[1].replace(/ /g, '%20')}`;

    const masteryEmojis = [':lvl1:', ':lvl2:', ':lvl3:', ':lvl4:', ':lvl5:', ':lvl6:', ':lvl7:'];

    const embed = new EmbedBuilder()
      .setTitle(summoner[1])
      .setDescription(summoner[2])
      .setColor('#FFD500')
      .setThumbnail(summoner[3])
      .addFields(
        { name: 'op.gg', value: opggLink, inline: false },
      );

    if (summonerRanking.length > 0) {
      
      for (let i = 0; i < summonerRanking.length; i += 6) {
        const queueType = summonerRanking[i];
        const tier = summonerRanking[i + 1];
        const rank = summonerRanking[i + 2];
        const leaguePoints = summonerRanking[i + 3];
        const wins = summonerRanking[i + 4];
        const losses = summonerRanking[i + 5];

        const championsData = [];
        for (let j = i; j < i + 3; j++) {
          const championName = championsMastery[0][j] || 'Nieznany';
          const championPoints = championsMastery[1][j] ? String(championsMastery[1][j]).slice(0, -3) + ' K' : '0 K';
          const masteryLevel = championsMastery[2][j] ? masteryEmojis[championsMastery[2][j] - 1] : '';

          championsData.push({
            name: `${championName} ${masteryLevel}`,
            value: `• Punkty: ${championPoints}\n• Maestria: ${championsMastery[2][j] || '0'}`,
            inline: true,
          });
        }

        const rankingData = `${tier} ${rank} • LP: ${leaguePoints} • Wygrane: ${wins} • Przegrane: ${losses}`;
        embed.addFields(
          { name: queueType, value: rankingData, inline: false },
          ...championsData,
        );
      }
    } else {
      embed.addFields({ name: 'Not found', value: "Player hasn't any ranked status.", inline: false });
    }

    message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    message.channel.send('Wystąpił błąd podczas pobierania danych przywoływacza.');
  }
}
