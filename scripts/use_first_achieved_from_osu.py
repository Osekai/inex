# will be fully honest here, i used ai for this
# i'm tired.

import re
import mysql.connector
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta


def parse_markdown_tables(url):
    response = requests.get(url)
    response.raise_for_status()

    # Initialize an empty list to store medal data
    medal_data = []
    
    # Loop through each line in the response text
    for line in response.text.split('\n'):
        
        # Check if the line starts with | ![](
        if line.startswith('| ![]('):
            # Split the line by pipe | and check if it has exactly 5 sections
            columns = [col.strip() for col in line.split('|')[1:-1]]  # Remove empty first and last

            if len(columns) == 4:
                # Extract image URL
                img_match = re.search(r'!\[.*?\]\((.*?)\)', columns[0])
                img_path = img_match.group(1) if img_match else None

                # Extract medal name
                medal_name = columns[1]

                # Extract user ID and flag
                user_match = re.search(
                    r'::\{\s*flag\s*=\s*([A-Z]{2})\s*\}::\s*\[(.*?)\]\(https://osu\.ppy\.sh/users/(\d+)\)',
                    columns[2]
                )

                if user_match:
                    user_id = int(user_match.group(3))
                    username = user_match.group(2)
                    country = user_match.group(1)

                    # Extract date
                    date_match = re.search(
                        r'(\d{1,2}\s[A-Za-z]{3}\s\d{4})\s*\((\d{2}:\d{2}:\d{2})\)',
                        columns[3]
                    )

                    if date_match:
                        date_str = f"{date_match.group(1)} {date_match.group(2)}"
                        achieved_date = datetime.strptime(date_str, '%d %b %Y %H:%M:%S')

                        # Append the parsed medal data to the list
                        medal_data.append({
                            'name': medal_name,
                            'image_path': img_path,
                            'user_id': user_id,
                            'username': username,
                            'country': country,
                            'achieved_date': achieved_date
                        })

    return medal_data


from datetime import datetime, timedelta
import mysql.connector

def update_database(medal_data):
    # Connect to MySQL database
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='password',
        database='inex'
    )
    cursor = conn.cursor(dictionary=True)
    
    for medal in medal_data:
        cursor.execute("""
            SELECT mc.Medal_ID, mc.First_Achieved_Date, mc.First_Achieved_User_ID, mc.Date_Released, md.Name 
            FROM Medals_Configuration mc
            LEFT JOIN Medals_Data md ON md.Medal_ID = mc.Medal_ID
            WHERE md.Name = %s
        """, (medal['name'],))
        db_medal = cursor.fetchone()
        
        if not db_medal:
            print(f"Medal not found in database: {medal['name']}")
            continue

        updates = []
        params = []

        # Convert achieved_date to datetime if it's a string
        achieved_date = medal['achieved_date']
        if isinstance(achieved_date, str):
            achieved_date = datetime.fromisoformat(achieved_date)


        if isinstance(db_medal['First_Achieved_Date'], str):
            db_date = datetime.fromisoformat(db_medal['First_Achieved_Date'])
        else:
            db_date = db_medal['First_Achieved_Date']

        print(f"DB date: {db_medal['First_Achieved_Date']} (type: {type(db_medal['First_Achieved_Date'])})")
        print(f"New date: {achieved_date} (type: {type(achieved_date)})")


        if db_date is None or achieved_date < db_date:
            print(f">> Updating First_Achieved_Date from {db_date} to {achieved_date}")
            updates.append("First_Achieved_Date = %s")
            params.append(achieved_date)
            print(f">> Updating First_Achieved_User_ID to {medal['user_id']}")
            updates.append("First_Achieved_User_ID = %s")
            params.append(medal['user_id'])

        # Date Released update only if more than 24 hours earlier
        date_released = db_medal['Date_Released']

        if date_released is None or abs(achieved_date - date_released) > timedelta(hours=24):
            print(f">>>>>> Updating Date_Released from {date_released} to {achieved_date}")
            updates.append("Date_Released = %s")
            params.append(achieved_date)

        print(f"{date_released} - {achieved_date}")

        # If there are updates, proceed with the database update
        if updates:
            params.append(db_medal['Medal_ID'])
            query = f"""
                UPDATE Medals_Configuration 
                SET {', '.join(updates)}
                WHERE Medal_ID = %s
            """
            print(f"Executing query: {query}")
            print(f"With params: {params}")
            cursor.execute(query, params)

    conn.commit()
    cursor.close()
    conn.close()


def main():
    url = "https://raw.githubusercontent.com/ppy/osu-wiki/refs/heads/master/wiki/Medals/First_medal_unlocks/en.md"
    medal_data = parse_markdown_tables(url)
    update_database(medal_data)
    print("ok?")

if __name__ == "__main__":
    main()
