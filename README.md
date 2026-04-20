<img src="https://inex.osekai.net/frontend/dist/c96c4f47b13977873b00.png" width="400">

# Welcome to <strong>[Osekai Inex!](https://inex.osekai.net)</strong>
This is the new home of Osekai!
-------------------------
We're working on rewriting the entire site from the ground up! 
So far, this is the status of the rewrites to Inex:
- ### 🟢 Medals
   - Medals has been fully rolled out to all users!
- ### 🟢 Rankings
   - Rankings has been completed, rolling out soon!
- ### 🔴 Profiles
    - Relies on Rankings
- ### 🟢 Badges
    - Badges have been completed, rolling out soon!
- ### 🔴 Snapshots
    - Big undertaking, not there yet!

<br>

---

# Setup

## Initial Requirements;
- PHP 8.1+ (preferably 8.3)
- MariaDB 10.6+ (preferably 12.x.x)
- Node.js 18+ & NPM
- Composer
- Linux (or WSL) - MacOS will probably work, Windows will NOT work.


##### PHP requirements:
Composer should warn you about any missing ones, remember to run `composer install` after installing composer!

##### Optional Requirements:
- Memcached (and `memcached` php extension)
        <br>Running without memcached is supported, but each page will take 1-2 seconds to load as they will need to do an osu! api fetch each time - to run smoothly I'd highly recommend you install memcached!
---

## Config setup
Before getting started, copy the `config.example.php` file to `config.php`.

##### Oauth Setup
- Set the URL to something reasonable (i'd recommend `http://127.0.0.1:8000`)
- Go to https://osu.ppy.sh/home/account/edit, scroll to the bottom, and click "New OAuth Application" - set the application name to anything, and then in the application callback URLs, put in `http://127.0.0.1:8000/oauth`, then click "Create"
- it'll give you a Client ID and Client Secret, paste these into the fields in the config.php (do not touch the REDIRECT_URI!)

#####  Database Setup
- Using any database management tool, create a new database - this can be called anything but remember it!
- You can create a new user with full permissions on the database, or you can use the root user
- Paste the database details into the config.php, keep the `hostname` to localhost unless you know what you're doing!
- When finished, run `php vendor/bin/phinx migrate` to create the tables - remember to run this whenever there are new schema changes!

Note: the `ETI_` prefixed database credentials are used for legacy Eclipse database support to transfer data, you can leave these blank.


##### Other values
**Webhooks**: Webhooks are not required to run INEX, but if you want to test/develop moderation features, you'll have to hook these up - just create a webhook inside a discord channel anywhere and paste the URL into the config.
**S3**: S3 is currently not used anywhere in INEX, so feel free to leave the fields blank - we're leaving it in case we need it one day!
**Memcached**: If you're not using memcached, make sure to set `USE_MEMCACHE` to `false`!
**Github API**: The Github API key is used for fetching the latest release of INEX for production releases - you should leave this blank.

---

## Starting up INEX

#### Running INEX backend
- Open a terminal inside the root folder of the project
- Run `composer install` to install all requirements
- Run `php vendor/bin/phinx migrate` to ensure the database is up to date
- Run `php vendor/bin/phinx seed:run` to seed the database (countries, etc)
- Run `php -S 127.0.0.1:8000` to start the server!

#### Webpack (frontend JS/CSS)
- `cd` into the `frontend` folder
- Run `npm install` to install all requirements
- Run `npx webpack --watch` to start watching for changes!

If you run into any problems at all, feel free to ask in the #dev channel in the [Osekai Server!](https://discord.gg/m4mEGdnc) - Not many people beyond me have really ran the project in it's entirety so I'm unsure how it'll work on other machines.

---

## Getting test data
By default, there's no data included with dev builds (no medals, solutions, beatmaps, anything) - to get these, you can download a database dump from [here](https://tanza.me/int/auto-up/hTwprjEm/inex-2026-04-20.sql.gz) (dated 2026-04-20, ~60mb) and import it into your database.

If you want more up-to-date data for Rankings, Badges, etc. you can run download a release build of [scripts-rust](https://github.com/osekai/scripts-rust), these are compiled for Windows and Linux. - A full run of this will take about 16 hours. **I do not recommend running this unless you need to! It will do LOTS of api requests to osu!**, I'd recommend using the dumps instead.



# Contributing

When it comes to new features, we'd really recommend you let us know what you're planning to contribute before you do it! It'd be best to know what everyone's doing so there's no overlap.
## Please join our [Osekai Server!](https://discord.gg/m4mEGdnc) to talk!

With small bug fixes, feel free to submit a pull request any time.

We're always looking for more help making Osekai as great as it can be!


> [!IMPORTANT]
> Osekai Inex is technically a fork of [Anthera](https://anthera.art) and so contains a lot of code which either goes unused or mentions things which otherwise don't exist.
> 
> I'm leaving in these things for now as I'm certain they'll have a use in the future, whether for admin backends or just for end users, so please excuse the weird out of place code :)