import './basic-panel.css';
import {Clubs2} from "../../src/js/utils/Clubs2";
import {DoRequest} from "../../src/js/utils/requests";
export * from '../profiles-banners.js';

let club = Clubs2.Get(data.User.Statistics.Medals.Percentage);
console.log(club);
document.getElementById('banner').classList.add(club.cssClass);
console.log("ok");
