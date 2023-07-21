import axios from "axios";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL; // Your Supabase URL
const supabaseKey = process.env.SERVICE_ROLE_KEY; // Your Supabase anon key

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function insertAcctJSON(player, acctJSON) {
  let { data, error } = await supabase.from("progressquest_acct").insert({
    json: acctJSON,
    player: player,
  });

  if (error) console.error("Error: ", error);
}

export async function insertCharJSON(player, charJSON) {
  let { data, error } = await supabase.from("progressquest_char").insert({
    json: charJSON,
    player: player,
    character: charJSON.character,
    secondsPlayed: charJSON.secondsPlayed,
    lastLogin: charJSON.lastLogin,
    worldTier: charJSON.worldTier,
    createdAt: charJSON.createdAt,
    monstersKilled: charJSON.monstersKilled,
    elitesKilled: charJSON.elitesKilled,
    goldCollected: charJSON.goldCollected,
    power: charJSON.power,
    lastUpdate: charJSON.lastUpdate,
    accountLastUpdate: charJSON.accountLastUpdate,
  });

  if (error) console.error("Error: ", error);
}

function timeDifference(time) {
  const givenTime = new Date(time);
  const currentTime = new Date();

  const differenceInMilliseconds = currentTime - givenTime;
  const differenceInSeconds = differenceInMilliseconds / 1000;
  const differenceInMinutes = differenceInSeconds / 60;
  const differenceInHours = differenceInMinutes / 60;
  const differenceInDays = differenceInHours / 24;

  return {
    milliseconds: differenceInMilliseconds,
    seconds: differenceInSeconds,
    minutes: differenceInMinutes,
    hours: differenceInHours,
    days: differenceInDays,
  };
}

async function fetchJsonData(url) {
  const { data } = await axios.get(url);
  return data;
}

async function main() {
  const watched = await JSON.parse(fs.readFileSync("config/watched.json"));

  for (const name in watched) {
    const scrapeUrl = watched[name];
    const { data: acctData, error } = await axios.get(scrapeUrl);
    if (error) console.error("Error: ", error);
    else {
      await insertAcctJSON(name, acctData);
      for (const char of acctData.characters) {
        console.log("time difference: ", timeDifference(char.lastUpdate).hours);
        console.log(char);
        const charURL = scrapeUrl + "/" + char.id;
        const { data: charData, error } = await axios.get(charURL);
        if (error) console.error("Error: ", error);
        else {
          console.log("posting char data:" + charData.character);
          await insertCharJSON(name, charData);
        }
      }
    }
  }
}

const second = 1000;
const minute = 60 * 1000;
const hour = 60 * minute;

main().catch(console.error);
setInterval(() => main().catch(console.error), 12 * hour);
