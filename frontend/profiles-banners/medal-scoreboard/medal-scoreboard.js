import './medal-scoreboard.css';
import {Clubs2} from "../../src/js/utils/Clubs2";
export * from '../profiles-banners.js';

let club = Clubs2.Get(data.User.Statistics.Medals.Percentage);
document.getElementById('banner').classList.add(club.cssClass);
document.getElementById("clubname").innerText = club.name;
