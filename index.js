const convert = require('color-convert');
const Clarifai = require('clarifai');
const express = require('express')
const app = express();
const http = require('http');
const PORT = process.env.PORT || 3000;
const fs = require('fs');
const readline = require('readline');
const {
  google
} = require('googleapis');

// initialize with your api key. This will also work in your browser via http://browserify.org/
const clarifai = new Clarifai.App({
  apiKey: 'f9c1cddb0c1a4da19019a3320c81d193'
});

// let picture_url = 'https://scontent.ftlv2-1.fna.fbcdn.net/v/t1.0-9/52816616_2213877525595597_2390284711952908288_o.png?_nc_cat=108&_nc_ht=scontent.ftlv2-1.fna&oh=a9cd6873170193520e7a3ac6f78eeca9&oe=5D5C3AC9'
// let picture_url = 'https://images.pexels.com/photos/248797/pexels-photo-248797.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500'
// let picture_url = 'https://scontent.ftlv2-1.fna.fbcdn.net/v/t45.5328-0/p180x540/23905031_1480230435386809_4095124082624823296_n.jpg?_nc_cat=104&_nc_ht=scontent.ftlv2-1.fna&oh=b73e0ab965f8b4bc4dae64d0fff7455b&oe=5D8E6EF1'
global.jsonPath;
global.picture_url;
global.hexArray = [];
global.productType = "";
// global.percentageArray = [];

async function updateProduct() {
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), readSheet);
  });
}

setInterval(updateProduct, 5000);

/**
 * Clarifai API
 */
function predictColors(res) {
  clarifai.models.predict(Clarifai.COLOR_MODEL, picture_url).then(
    function (response) {
      jsonPath = response.outputs[0].data.colors;

      jsonPath.sort(function (a, b) {
        return a.value < b.value;
      });
      jsonPath.sort();
      console.log("----------------------------" + '\n' + "Raw JSON Response:" + '\n');
      console.log(jsonPath);

      /**
       * Format Printing of Image Colors
       */
      for (let color in response.outputs[0].data.colors) {
        console.log("The Raw Description of a Color:");
        console.log(jsonPath[color].raw_hex + "\n");
        hexArray.push(jsonPath[color].raw_hex);
        hexArray.push(jsonPath[color].value)
        // percentageArray.push(jsonPath[color].value)
        // console.log("A W3C Decription of a color:");
        // console.log(jsonPath[color].w3c.hex);
        // console.log(jsonPath[color].w3c.name);
        jsonPath[color].value = Math.round(jsonPath[color].value * 100 * 100) / 100 + "%"
        console.log("The percentage of the color in the image:");
        console.log(jsonPath[color].value + "%");
        console.log("\n---------------------------------\n")
        delete jsonPath[color].w3c;
      }

      console.log(hexArray);
      // console.log(percentageArray);
      res.status(200).send(jsonPath);

      // Load client secrets from a local file.
      fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Sheets API.
        authorize(JSON.parse(content), updateSheets);
      });

    },
    function (err) {
      console.log(err)
    }
  );
}

app.get('/new/*', (req, res) => {
  picture_url = req.params[0];
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), readSheet);

  });

  console.log("The picture URL is:" + picture_url)
  setTimeout(() => {
    console.log('timeout beyond time');
    predictColors(res);
  }, 3000);
});


function isEmptyObject(obj) {
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}

app.get('/', (req, res) => {
  res.send(200, "Please use https://kitepride.herokuapp.com/new/{imageurl} for your request!");
});
app.listen(PORT);


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {
    client_secret,
    client_id,
    redirect_uris
  } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function updateSheets(auth) {
  const sheets = google.sheets({
    version: 'v4',
    auth
  });
  let values = [
    hexArray
  ];
  let resource = {
    values,
  };
  sheets.spreadsheets.values.append({
    spreadsheetId: '1nAxVgApnsDnSWie_BEyKMzWCTU8TS91XRzL19EtPdzY',
    range: 'Color Tagging!A:I',
    valueInputOption: "USER_ENTERED",
    resource,
  }, (err, res) => {
    if (err) {
      // Handle error.
      console.log(err);
      hexArray = [];
      
    } else {
      console.log(`${result.updates.updatedCells} cells appended.`);
      hexArray = [];
    }
  });
  hexArray = [];
  hexArray.push(productType);
}

function readSheet(auth) {
  const sheets = google.sheets({
    version: 'v4',
    auth
  });
  sheets.spreadsheets.values.get({
    spreadsheetId: '1nAxVgApnsDnSWie_BEyKMzWCTU8TS91XRzL19EtPdzY',
    range: 'Product Type!A2'
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    rows.map((row) => {
      productType = rows[0][0];
      hexArray[0] = productType;
      // console.log(rows[0][0]);
    });
  });
}