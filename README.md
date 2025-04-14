<img src="https://inex.osekai.net/frontend/dist/c96c4f47b13977873b00.png">

# Welcome to <strong>[Osekai Inex!](https://inex.osekai.net)</strong>
This is the new home of Osekai!
-------------------------
We're working on rewriting the entire site from the ground up! 
So far, this is the status of the rewrites to Inex:
- ### 🟢 Medals
   - Medals has been fully rolled out to all users!
- ### 🟡 Rankings
   - All data required for rankings is being given to Inex from osekai-scripts, backend and frontend is unfinished.
- ### 🔴 Profiles
    - Relies on Rankings
- ### 🟡 Badges
    - Data is ready, needs backend and frontend.
- ### 🔴 Snapshots
    - Big undertaking, not there yet!



# Setup

### PHP (server / backend)
- Setup your config.php using the config.example.php
- Create your database:
    - `php vendor/bin/phinx migrate` and then
    - `php vendor/bin/phinx seed:run`
- Install packages with composer (`composer install`)
- Serve using `php -S 0.0.0.0:8000` or using your favourite PHP dev server! Any should work :)

### Webpack (frontend JS/CSS)
- `cd` into the `frontend` folder
- Run `npm install` to install all requirements
- Run `npx webpack --watch` to start watching for changes!



# Contributing

Before you contribute anything, we'd really recommend you let us know what you're planning to contribute! It'd be best to know what everyone's doing so there's no overlap.
## Please join our [Osekai Development Server!](https://discord.gg/m4mEGdnc) to talk!

We're always looking for more help making Osekai as great as it can be!