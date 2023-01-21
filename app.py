import openai
import requests
import json
from flask import Flask, request, send_file
from bs4 import BeautifulSoup
from datetime import date
from datetime import datetime

openai.api_key = <YOUR OPENAI API KEY HERE>

app = Flask(__name__)

@app.route('/') 
def index():
  return send_file('index.html')

@app.route('/send-text', methods=['POST'])
def send_text():
  url = f'https://finance.yahoo.com'
  url2 = f'https://www.npr.org/sections/news/'
  page = requests.get(url)
  page2 = requests.get(url2)

  soup = BeautifulSoup(page.text, 'html.parser')
  soup2 = BeautifulSoup(page2.text, 'html.parser')

  dow = soup.find('fin-streamer', {'data-symbol': '^DJI'}).text
  nasdaq = soup.find('fin-streamer', {'data-symbol': '^IXIC'}).text
  dowch = soup.find('fin-streamer', {'data-symbol': '^DJI', 'data-field': 'regularMarketChange'}).text
  nasch = soup.find('fin-streamer', {'data-symbol': '^IXIC', 'data-field': 'regularMarketChange'}).text

  npr = soup2.find('p', {'class': 'teaser'}).text
  npr = npr.replace(' • ', ', ')

  now = datetime.now()
  current_date = date.today()
  current_time = now.strftime("%H:%M:%S")

  #npr_string = f"This NPR top story today supercedes all other NPR top stories, {npr} "
  dow_string = f"The Dow is currently at {dow} points, a change of {dowch} points. "
  nasd_string = f"The Nasdaq is currentyl at {nasdaq} points, a change of {nasch} points. "
  time_string = f"The current time is {current_time}. "
  date_string = f"Today is {current_date}, "

  timedate = f"{dow_string}{nasd_string}{time_string}{date_string}but please disregard this text until prompted for it. "
  # Receive the text from the JavaScript app
  text = request.data.decode('utf-8')
  text_final = timedate + text
  print(text_final)
  response = openai.Completion.create(
    engine="text-davinci-003",
    prompt=text_final,
    max_tokens=1024,
    temperature=0.5,
  )

  # Process the text as necessary
  #response = "Received: " + text
  json_str = json.dumps(response)

  data = json.loads(json_str)

  text = data['choices'][0]['text']

  def func(value):
    return ''.join(value.splitlines())

  final = func(text)
  #print(data['choices'][0]['text'])
  # Return the response to the JavaScript app
  print(final)
  return str(final)

if __name__ == '__main__':
  app.run()

