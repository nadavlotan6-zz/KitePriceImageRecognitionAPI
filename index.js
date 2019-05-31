const convert = require('color-convert');
const Clarifai = require('clarifai');
const express = require('express')
const app = express();
const http = require('http');
const PORT = process.env.PORT || 3000;

// initialize with your api key. This will also work in your browser via http://browserify.org/
const clarifai = new Clarifai.App({
  apiKey: 'f9c1cddb0c1a4da19019a3320c81d193'
});

// let picture_url = 'https://scontent.ftlv2-1.fna.fbcdn.net/v/t1.0-9/52816616_2213877525595597_2390284711952908288_o.png?_nc_cat=108&_nc_ht=scontent.ftlv2-1.fna&oh=a9cd6873170193520e7a3ac6f78eeca9&oe=5D5C3AC9'
// let picture_url = 'https://images.pexels.com/photos/248797/pexels-photo-248797.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500'
// let picture_url = 'https://scontent.ftlv2-1.fna.fbcdn.net/v/t45.5328-0/p180x540/23905031_1480230435386809_4095124082624823296_n.jpg?_nc_cat=104&_nc_ht=scontent.ftlv2-1.fna&oh=b73e0ab965f8b4bc4dae64d0fff7455b&oe=5D8E6EF1'
global.jsonPath;
global.picture_url;

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
        // console.log("A W3C Decription of a color:");
        // console.log(jsonPath[color].w3c.hex);
        // console.log(jsonPath[color].w3c.name);
        console.log("The percentage of the color in the image:");
        console.log(jsonPath[color].value*100 + "%");
        console.log("\n---------------------------------\n")
        delete jsonPath[color].w3c;
      }

      res.status(200).send(jsonPath);

    },
    function (err) {
      console.log(err)
    }
  );
}

app.get('/new/*', (req, res) => {
  picture_url = req.params[0];

  console.log("The picture URL is:" + picture_url)
  predictColors(res);

  // while(isEmptyObject(jsonPath)) {
  // while(typeof jsonPath === "undefined") {
  //   // res.send(200);
  // }
  // res.status(200).send(jsonPath);  
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