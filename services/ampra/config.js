import dotenv from "dotenv";
import {resolve} from "path";

dotenv.config({path: resolve('../../.env')});
const config = process.env;

export default {
    bot: {
        token: config.AMPRA_TOKEN,
        server: config.AMPRA_SERVER
    }
}
