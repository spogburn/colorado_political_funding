'use strict';
/*
  data (optional) - a JSON string to send with the request
*/


function ajax(method, url, handler, data) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(){
    if (this.readyState === 4) {
      if (this.status === 200) {
        handler(null, JSON.parse(this.responseText));
      } else {
        handler(this.statuscode, null);
      }
    }
  };

  xhr.open(method, url);
  if (method === 'POST') {
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.setRequestHeader("Content-length", data.length);
    xhr.setRequestHeader("Connection", "close");
    xhr.send(data);
  } else {
    xhr.send();
  }
}

//VARIABLE DECLARATIONS//

var polData; // object to hold data returned from year AJAX
var fundingDataArr = []; // array to hold data returned from funding AJAX
var sectorObj = {}; // object to hold chart data
var selectPol = document.querySelector('.pol-name'); // gets select element with politician name
var selectYear = document.querySelector('.year'); // gets select element with year
var fundingHeaders = ['Contributor', 'State', 'Broad_Sector', 'Specific_Business', 'Total_$']; // header names from FollowTheMoney
var fundingGoodNames = ['Donor', 'State', 'Sector', 'Category', 'Dollars Contributed']; // header names I want to use instead
var fundingHeadersObj = {}; // object to hold both header names
for (var i = 0; i < fundingHeaders.length; i++){ // loop that makes object with both header names
  fundingHeadersObj[fundingHeaders[i]] = fundingGoodNames[i];
}
var resultsDiv = document.getElementById('results');
// var canvasElement = document.querySelector('#chart_canvas')
var canvasContainer= document.querySelector('.canvas_container'); // gets canvas_container div
var donationsDiv = document.querySelector('.donations');
var button = document.querySelector('button'); // gets button
var loadingImage = document.createElement('img'); // creates element for loading image
loadingImage.setAttribute('src', '../images/loading.gif'); // gives source to loading image
loadingImage.style.marginTop = '50px';
loadingImage.style.marginLeft = '35%';

button.addEventListener('click', function(ev){ // adds event listener to politician select
    ev.preventDefault();
    fundingDataArr = [];
    button.disabled = true;
    selectPol.disabled = true;
    selectYear.disabled = true;
    donationsDiv.innerHTML = '';
    canvasContainer.innerHTML = '';
    resultsDiv.innerHTML = '';
    canvasContainer.appendChild(loadingImage);
    for (var i = 0; i < polData.records.length; i++){
      if (selectPol.value === polData.records[i].Candidate.Candidate){
        // console.log('in loop')
        var id = polData.records[i].Candidate.id;
        ajax('GET', 'http://api.followthemoney.org/?f-core=1&f-fc=1&c-t-id=' + id + '&p=0&gro=d-eid,d-ccg,d-ccb,d-ad-st&APIKey=afab15a9307986c9452f83dea887244b&mode=json', function(pageerror, pagedata){
          for (var l = 0; l < pagedata.records.length; l++){ //pushes data from first page into array
            fundingDataArr.push(pagedata.records[l]);
          }
        var pagesWanted = 5;
        var count = 1;
        for (var j = 1; j < pagesWanted; j++){
          ajax('GET', 'http://api.followthemoney.org/?f-core=1&f-fc=1&c-t-id=' + id + '&p=' + j + '&gro=d-eid,d-ccg,d-ccb,d-ad-st&APIKey=afab15a9307986c9452f83dea887244b&mode=json', function(err, data){
            // console.log(data);
            for (var k = 0; k < data.records.length; k++){
              fundingDataArr.push(data.records[k]);
            }
            count++; // this is to check where we are in the number of requests returning
            if (count === pagesWanted){
              canvasContainer.removeChild(loadingImage);
              button.disabled = false;
              selectPol.disabled = false;
              selectYear.disabled = false;
                insertDonations();
                makeCanvas();
                makeSectorChart();
                makeTable();
            }
          });
        }

      });
      }
    }
  });

selectYear.addEventListener('change', function(event){ // adds event listener to year to do AJAX request
  selectPol.innerHTML = '';
  selectPol.disabled = true;
  button.disabled = true;
  var year = event.target.value;
  ajax('GET', 'http://api.followthemoney.org/?s=CO&y=' + year + '&f-core=1&f-fc=1&gro=c-t-id&APIKey=afab15a9307986c9452f83dea887244b&mode=json', function(err, data){
    polData = data;
    // console.log(polData);

    for (var i = 0; i < polData.records.length; i++){
          button.disabled = false;
          selectPol.disabled = false;
           if (polData.records[i].Election_Status.Election_Status === 'Won-General'){
               var option = document.createElement('option');
               option.id = option + [i];
               option.innerHTML = polData.records[i].Candidate.Candidate;
               selectPol.appendChild(option);
             }
           }
         });
});

  function makeTable(){ // makes a table
    var table = document.createElement('table'); // creates a table
    table.setAttribute('class', 'funding_table'); // gives the table a class
    table.appendChild(makeHeaders(fundingHeadersObj)); // calls makeHeaders function and appends results to table
    for (var i = 0; i < 10; i++){
      var tr = table.insertRow(-1); // creates 20 rows
      for (var j = 0; j < fundingHeaders.length; j++){
        var td = tr.insertCell(-1); // creates cells for each row
        td.setAttribute('class', 'table_cell'); // sets a class to the td
        td.innerHTML = fundingDataArr[i][fundingHeaders[j]][fundingHeaders[j]]; // puts the data into each table cell
        // console.log(fundingDataArr[i][fundingHeaders[j]]);
          if(fundingDataArr[i][fundingHeaders[j]].Total_$){
            td.innerHTML = "$" + td.innerHTML;
          }
      }
      table.appendChild(tr); //adds the row to the table
    }
var tableTitle = document.createElement('h2');
tableTitle.setAttribute('class', 'text-center');
tableTitle.innerHTML = 'Top 10 Contributors to ' + selectPol.value;
resultsDiv.appendChild(tableTitle);
resultsDiv.appendChild(table); // adds the table to the resultsDiv
}



function makeHeaders(obj){ // makes the table headers
  var tr = document.createElement('tr'); // creates header row
  for (var key in obj) { // populates header row
    var th = document.createElement('th');
    th.innerHTML = obj[key]; // sets th innerHTML to the value of the key
    tr.appendChild(th);
  }
  return tr; // returns so I can use in makeTable function
}


function makeSectorObj(){
  // console.log('fundingdataArr');
  // console.log(fundingDataArr);
  for (var i = 0; i < fundingDataArr.length; i++){ // loop through the returned object
    if (fundingDataArr[i] === 'No Records') {
      i += i;
      }

    else {
      if(sectorObj.hasOwnProperty(fundingDataArr[i].Broad_Sector.Broad_Sector)) { // if it has that property
      sectorObj[fundingDataArr[i].Broad_Sector.Broad_Sector]  +=  Number(fundingDataArr[i].Total_$.Total_$); // make that the key and make the value the total $
    } else {
      sectorObj[fundingDataArr[i].Broad_Sector.Broad_Sector] = Number(fundingDataArr[i].Total_$.Total_$); // otherwise make the key value pair
    }
    }
  }
  return sectorObj;
}

var colorArr = ['rgb(158, 178, 215)', 'rgb(121, 129, 142)', 'rgb(53, 60, 72)', 'rgb(26, 34, 49)', 'rgb(206, 189, 162)', 'rgb(211, 213, 179)', 'rgb(107, 108, 76)', 'rgb(72, 74, 35)', 'rgb(234, 231, 238)', 'rgb(143, 134, 155)', 'rgb(52, 45, 61)', 'rgb(41, 24, 64)', 'rgb(206, 200, 187)', 'rgb(202, 184, 150)', 'rgb(88, 77, 55)', 'rgb(70, 55, 28)']

var hoverColorArr =  ['rgba(158, 178, 215, .5)', 'rgba(121, 129, 142, .5)', 'rgba(53, 60, 72, .5)', 'rgba(26, 34, 49, .5)', 'rgba(206, 189, 162, .5)', 'rgba(211, 213, 179, .5)', 'rgba(107, 108, 76, .5)', 'rgba(72, 74, 35, .5)', 'rgba(234, 231, 238, .5)', 'rgba(143, 134, 155, .5)', 'rgba(52, 45, 61, .5)', 'rgba(41, 24, 64, .5)', 'rgba(206, 200, 187, .5)', 'rgba(202, 184, 150, .5)', 'rgba(88, 77, 55, .5)', 'rgba(70, 55, 28, .7)']

function makeSectorData(){ // makes the object with the sector data for the chart
  var data = {};
  var sectorLabels =[];
  var sectorTotalArr = [];
  var datasetsArr = [{
            'label': 'Dollars Donated',
            'borderWidth': 0,
            'backgroundColor': colorArr,
            'hoverBackgroundColor': hoverColorArr
            }];

        makeSectorObj();
        for (var key in sectorObj){ // pushes keys to array
          sectorLabels.push(key);
          sectorTotalArr.push(sectorObj[key].toFixed(2)); // pushes values to array limits decimals to two
        }
      // console.log(sectorLabels);
      // console.log(sectorTotalArr);
      data.labels = sectorLabels;
      datasetsArr[0].data = sectorTotalArr;
      data.datasets = datasetsArr;
      return data;
  }

  function makeSectorChart(){ // makes the by sector chart
    var chartCanvas = document.getElementById('ctx');
    var heading = document.createElement('h3');
    canvasContainer.insertBefore(heading, canvasContainer.children[0]);
    heading.setAttribute('class','text-center');
    heading.innerHTML = "Donations by Economic Sector to " + selectPol.value;
    new Chart(chartCanvas, {
      type: 'doughnut',
      data: makeSectorData(),
      options: {
        fullWidth: false,
        responsive: true,
        legend: {
          display: true
        },
        tooltips: {
          mode: 'label',
          bodyFontSize: 16,
          backgroundColor: 'rgba(0,0,0, .8)',
          bodyFontFamily: "'Roboto Slab', 'serif'",
          ypadding: 5,
          callbacks: {
            label: function(tooltipItem, data){
              // console.log(tooltipItem);
              // console.log(data);
              // console.log(data.labels[tooltipItem.index]);
              // console.log(data.datasets[0].data[tooltipItem.index]);
              return data.labels[tooltipItem.index] + ': $' + data.datasets[0].data[tooltipItem.index];
            }
          }
        }
    }
  });

  }



function makeCanvas(){
  canvasContainer.innerHTML = '';
  var canvasElement = document.createElement('canvas');
  canvasElement.width = '600';
  canvasElement.height = '600';
  canvasElement.id = 'ctx';
  canvasContainer.appendChild(canvasElement);
}

function topDonations(){ // adds up the top donations returned by the first five pages
  var total = 0;
  for (var i = 0; i < fundingDataArr.length; i++){
     total += Number(fundingDataArr[i].Total_$.Total_$);
  }
  return total;
}

function insertDonations(){ // puts donations in the DOM
  var donationHeader = document.createElement('h2');
  donationHeader.innerHTML = "The top " + fundingDataArr.length + " donations to " + selectPol.value + " in " + selectYear.value + " totalled: $" +  topDonations().toLocaleString();
  donationsDiv.appendChild(donationHeader);
}
